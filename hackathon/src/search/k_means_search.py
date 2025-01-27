from deap import base, creator, tools
import numpy as np
import random

import faiss
from deap import algorithms

from tqdm import tqdm
import contextlib
import os



def kmeans_clustering(population, k):
    n, d = population.shape
    kmeans = faiss.Kmeans(d, k, niter=20, verbose=False)
    population = population.astype('float32')
    kmeans.train(population)

    cluster_labels = kmeans.index.search(population, 1)[1].flatten()  
    centroids = kmeans.centroids
    
    return cluster_labels, centroids

def k_means_selection(population, k):
    flag = 0

    cluster_labels, centroids = kmeans_clustering(np.array(population),k=k)
    res = []
    for i in range(k):
        cluster_idx = np.where(cluster_labels == i)[0]
        cluster_population = [population[j] for j in cluster_idx]
        
        if len(cluster_population)%2 == 0:
            res.extend(tools.selTournament(cluster_population, k=len(cluster_population)//2,tournsize = 2))
        else:
            if flag == 0:
                res.extend(tools.selTournament(cluster_population, k=len(cluster_population)//2+1,tournsize = 2))
                flag = 1
            else:
                res.extend(tools.selTournament(cluster_population, k=len(cluster_population)//2,tournsize = 2))
                flag = 0
    return res

def k_means_search(model, pred_func, X_train, X_test, y_test):

    x_min,x_max = np.min(X_train, axis=0), np.max(X_train, axis=0)
    n_features = X_train.shape[1]
    creator.create('FitnessMax', base.Fitness, weights=(1.0,))
    creator.create('Individual', np.ndarray, fitness=creator.FitnessMax)

    def generate_individual():
        return np.random.uniform(x_min, x_max)

    toolbox = base.Toolbox()
    toolbox.register('attr_float', generate_individual)
    # min_max 차원이 8개이기에 n을 1로 설정 하면 8개의 변수를 가진 ind 생성!
    toolbox.register('individual', tools.initIterate, creator.Individual, toolbox.attr_float)
    toolbox.register('population', tools.initRepeat, list, toolbox.individual)

    res = []
    for idx, gt_y in tqdm(enumerate(y_test)):

        def fitness(population):

            population = np.array(population)
            # print('population shape : ', population.shape)
            y_pred = pred_func(model=model, X_test=population)

            fit_fun = -(y_pred - gt_y)**2
            return fit_fun

        toolbox.register('evaluate', fitness)
        ETA_CX = 5.0 # 초기에 작게(탐색), 점점 크게(exploitation)
        INDPB = 0.2 # 각 변수별 변이 확률
        cxpb = 0.5 # 교차 확률
        mutpb = 0.5 # 돌연변이 확률
        
        sigma_list = [(ub - lb)/10.0 for (lb,ub) in zip(x_min, x_max)]  # 변수 범위에 따른 sigma 값 
        toolbox.register('mate', tools.cxSimulatedBinary, eta=ETA_CX)
        toolbox.register('mutate', tools.mutGaussian, mu=[0.0]*(len(x_min)), sigma=sigma_list, indpb=INDPB)
        toolbox.register('select', tools.selTournament)

        population = toolbox.population(n=500)

        for gen in range(100):
            offspring = algorithms.varAnd(population, toolbox, cxpb, mutpb)
            population = offspring+population
            invalid_ind = [ind for ind in population if not ind.fitness.valid]
            fitness_scores = toolbox.evaluate(invalid_ind)
            for ind, fit in zip(invalid_ind, fitness_scores):
                ind.fitness.values = (fit,)
            population = k_means_selection(population, k=len(population)//10)
            # print(len(population))
        gt_x = X_test[idx]
        expanded_gt_x = np.tile(gt_x, (len(population), 1))
        differences = population - expanded_gt_x
        distances = np.linalg.norm(differences, axis=1)
        res_idx = np.argmin(distances)
        x_pred = population[res_idx]
        res.append(x_pred)

    print(np.stack(res).shape)
    return np.stack(res)