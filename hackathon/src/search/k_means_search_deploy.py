from deap import base, creator, tools
import numpy as np
import random

import faiss
from deap import algorithms

from tqdm import tqdm
import contextlib
import os
import pandas as pd


def cx_simulated_binary_w_cx_uniform(ind1, ind2, eta, indpb, is_nominal):
    """
    eta : cx_simulated_binary 파라미터
    indpb : 변수별 변이 확률
    is_nominal : 변수가 범주형인지 여부
    """
    is_nominal = np.array(is_nominal, dtype=bool)

    rand_uniform = np.random.random(len(ind1))
    rand_pb = np.random.random(len(ind1))

    # nominal 값
    mask_nominal = (is_nominal & (rand_pb < indpb))
    ind1[mask_nominal], ind2[mask_nominal] = ind2[mask_nominal], ind1[mask_nominal]

    # 실수 값
    mask_real = ~is_nominal
    rand_real = rand_uniform[mask_real]
    
    beta = np.where(
        rand_real < 0.5,
        (2. * rand_real) ** (1. / (eta + 1.)),
        (1. / (2. * (1. - rand_real))) ** (1. / (eta + 1.))
    )
    
    
    ind1_real = ind1[mask_real]
    ind2_real = ind2[mask_real]
    ind1[mask_real] = 0.5 * ((1 + beta) * ind1_real + (1 - beta) * ind2_real)
    ind2[mask_real] = 0.5 * ((1 - beta) * ind1_real + (1 + beta) * ind2_real)

    return ind1, ind2



# def mutGaussian_mutUniformInt(ind, mu, sigma, indpb, is_nominal):


#     pass 
#     for i, xl, xu in zip(range(size), low, up):
#         if random.random() < indpb:
#             individual[i] = random.randint(xl, xu)

#     return individual,

def lexicographic_selection(population,k):
    """
    개체의 fitness를 내림차순 정렬한 후 상위 k개를 선택합니다.
    
    Args:
        population (list): 평가된 개체 리스트.
        k (int): 선택할 개체 수.
    
    Returns:
        population (list): 선택된 개체 리스트 
    """

    # population.sort(key=lambda ind: tuple(ind.fitness.values[0],)+tuple(ind.fitness.values[i] for i in importance.values()), reverse=True)
    # population.sort(
    #     key=lambda ind: tuple(ind.fitness.values[i] * ind.fitness.weights[i] for i in range(len(ind.fitness.values))),
    #     reverse=True
    # )
    population.sort(key=lambda ind: tuple(val * w for val, w in zip(ind.fitness.values, ind.fitness.weights)), 
                    reverse=True)

    return population[:k] 

def kmeans_clustering(population, k):
    n, d = population.shape
    kmeans = faiss.Kmeans(d, k, niter=20, verbose=False)
    population = population.astype('float32')
    kmeans.train(population)

    cluster_labels = kmeans.index.search(population, 1)[1].flatten()  
    # centroids = kmeans.centroids
    
    return cluster_labels, kmeans.centroids

def k_means_selection(population, k):
    """
    Args:
        population (list)
        k (int): K-means에서 나눌 클러스터 개수.

    Returns:
        list: 선택된 ind 리스트.
    """
    # print('population len : ',len(population))
    adjustment_flag = False  # 클러스터 크기가 홀수일 때 조절하는 플래그
    population_array = np.array(population)
    
    cluster_labels, _ = kmeans_clustering(population_array, k=k)
    
    selected = []
    
    for cluster_id in range(k):
        cluster_indices = np.where(cluster_labels == cluster_id)[0]
        cluster_population = [population[idx] for idx in cluster_indices]
        cluster_size = len(cluster_population)
        
        # 홀수일 떄 개체수 줄어듦 방지 
        selection_size = cluster_size // 2
        if cluster_size % 2 == 1 and not adjustment_flag:
            selection_size += 1
            adjustment_flag = True
        elif cluster_size % 2 == 1 and adjustment_flag:
            adjustment_flag = False
        
        selected.extend(
            lexicographic_selection(
                cluster_population, 
                k=selection_size
              )
        )
    # print(len(selected))
    return selected

def k_means_search_deploy(model, pred_func, X_train, X_test, y_test,all_var_names, control_var_names, optmize_dict, importance, bounds, scalers, user_request_target):
    """
    # all_var_names : target 변수 제외 모든 변수 이름 [numpy X와 같은 순서]
    # control_var_names : control 변수 이름 
    
    ## len(control_var_names) > len(optmize_dict) == len(importance) 
    # optmize_dict : minimize, maximize 
    # importance : 중요도 순서 (1 부터 중복 없이 ranking)

    # bounds 
    """

    # 제어 변수 인덱스 결정 및 중요도 순 정렬

    control_set = set(control_var_names)  
    control_index = [i for i, v in enumerate(all_var_names) if v in control_set] # var 중에 control
    print(control_index)
    control_index_to_pop_idx = {v: i+1 for i, v in enumerate(control_index)}

    # control중 importance 순서    
    sorted_control_index_by_importance = sorted([i for i in control_index if all_var_names[i] in importance.keys()], key=lambda x: importance[all_var_names[x]])
    # poppulation 열 index를 중요도 순서로 정렬 
    sorted_pop_idx_by_importance = [control_index_to_pop_idx[i] for i in sorted_control_index_by_importance] 

    # optimize를 vars 순서로 정렬 
    sorted_optimize_dict_by_vars_idx = {all_var_names[k]: optmize_dict[all_var_names[k]] for k in [i for i in control_index if all_var_names[i] in importance.keys()]}

    scale_factor_x = np.std(X_train, axis=0)
    rounding_digits_x = np.clip(np.ceil(-np.log10(scale_factor_x/100)), 2, 10).astype(int)[sorted_control_index_by_importance]
    
    scale_factor_y = np.std(y_test, axis=0)
    rounding_digits_y = np.clip(np.ceil(-np.log10(scale_factor_y/100)), 2, 10).astype(int)

    rounding_digits = np.concatenate([rounding_digits_y,rounding_digits_x], axis=0)

    vectorized_round = np.vectorize(round)

    #TODO bounds 적용 
    if bounds:
        x_min = np.array([value[0] for key, value in bounds.items()]).squeeze()
        x_max = np.array([value[1] for key, value in bounds.items()]).squeeze()
    else:
        x_min,x_max = np.min(X_train, axis=0)[control_index], np.max(X_train, axis=0)[control_index]

    print("x_min : ",x_min)
    print("x_max : ",x_max)
    n_features = X_train.shape[1]
    weights =  (1.0,) * y_test.shape[-1]
    weights += tuple(1.0 if opt == 'maximize' else -1.0 for opt in sorted_optimize_dict_by_vars_idx.values())
    creator.create('FitnessMax', base.Fitness, weights=weights) # model pred + control optim
    creator.create('Individual', np.ndarray, fitness=creator.FitnessMax)

    # def generate_individual():
    #     # return np.random.uniform(x_min, x_max)
    #     mean = (x_max + x_min) / 2
    #     std_dev = (x_max - x_min) / 6  # 99.7% 확률로 x_min과 x_max 사이에 생성 std 3! 
    #     return np.random.randn(n_features) * std_dev + mean

    # TODO min max optimize 고려 해서 초기값 생성 
    def generate_individual():
        # return np.random.uniform(x_min[control_index], x_max[control_index])
        return np.random.uniform(x_min, x_max)



    toolbox = base.Toolbox()
    toolbox.register('attr_float', generate_individual)
    # min_max 차원이 8개이기에 n을 1로 설정 하면 8개의 변수를 가진 ind 생성!
    toolbox.register('individual', tools.initIterate, creator.Individual, toolbox.attr_float)
    toolbox.register('population', tools.initRepeat, list, toolbox.individual)

    # res = {"pred_x":[]} # , "test_x":[], "test_y":[]}
    res = {}
    for control_var in control_var_names:
        res[f"pred_x_{control_var}"] = []
    for idx, (gt_x, gt_y) in tqdm(enumerate(zip(X_test, y_test))):

        def fitness(population):
            
            population = np.array(population)
            input_data = np.array(gt_x).reshape(1,-1).repeat(len(population), axis=0)
            input_data[:,control_index] = population
            y_pred = pred_func(model=model, X_test=input_data)

            fit_res = []
            # print(user_request_target)
            # fit_res.append(-(y_pred - gt_y)**2)
            # print(-(y_pred - user_request_target)**2)
            # print(y_pred)
            fit_res.append(-(y_pred - user_request_target.reshape(1,-1))**2)
            
            for i in sorted_pop_idx_by_importance:
                    fit_res.append(population[:,i-1:i])
            fit_res = np.concatenate(fit_res, axis=1)
            fit_res = vectorized_round(fit_res, rounding_digits)
            return fit_res

        toolbox.register('evaluate', fitness)
        
        INDPB = 0.2 # 변수별 변이 확률
        cxpb = 0.5 # 교차 확률
        mutpb = 0.5 # 돌연변이 확률
        

        toolbox.register('select', tools.selTournament)

        #TODO 생성시 minmax 고려 
        population = toolbox.population(n=1000)
        # print(population[0].shape)
        ETA_CX = 2.0
        sigma_list = [(ub - lb)/(6.0) for (lb,ub) in zip(x_min, x_max)]
        toolbox.register('mate', tools.cxSimulatedBinary, eta=ETA_CX)
        toolbox.register('mutate', tools.mutGaussian, mu=[0.0]*(len(x_min)), sigma=sigma_list, indpb=INDPB)

        for gen in range(1,3):    

            offspring = algorithms.varAnd(population, toolbox, cxpb, mutpb)

            offspring = [creator.Individual(np.clip(np.array(ind), x_min, x_max)) for ind in offspring]
            population = offspring+population

            invalid_ind = [ind for ind in population if not ind.fitness.valid]
            fitness_scores = toolbox.evaluate(invalid_ind)
            for ind, fit in zip(invalid_ind, fitness_scores):
                ind.fitness.values = tuple(fit)
            population = k_means_selection(population, k=len(population)//3)
            # print(len(population))
            # for ind in population:
            #     print(ind)
            #     print(ind.fitness.values)

        # population = [ind for ind in population if ind.fitness.values[0] > -0.01]
        # if idx == 0:
        #     df = pd.DataFrame(population)
        #     df['fitness'] = np.array([ind.fitness.values[0] for ind in population])
        #     df.to_csv(f'k_means_search_{idx}.csv')
        population = tools.selBest(population, k=1)
        # gt_x = X_test[idx]
        print(population[0])
        # expanded_gt_x = np.tile(gt_x, (len(population), 1))
        # differences = population - expanded_gt_x
        # distances = np.linalg.norm(differences, axis=1)
        # res_idx = np.argmin(distances)
        # x_pred = population[res_idx]
        for i in range(len(control_index)):
            res[f"pred_x_{control_var_names[i]}"].append(np.array(population[0][i], dtype=float))
        
        # res["pred_y"].append(population[0].fitness.values[0].reshape(-1))
        # res["test_x"].append(gt_x)
        # res["test_y"].append(gt_y.reshape(-1,1))


    
    
    return pd.DataFrame(res)