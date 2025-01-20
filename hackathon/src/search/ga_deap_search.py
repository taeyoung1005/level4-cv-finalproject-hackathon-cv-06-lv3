import random
import torch
from tqdm import tqdm
import numpy as np
from deap import base, creator, tools

def ga_deap_search(model, pred_func, X_train, val_data):

    test = val_data.dataset.X
    gt_ys = val_data.dataset.y

    x_min = np.min(X_train, axis=0)
    x_max = np.max(X_train, axis=0) 
    
    res = []

    for gt_y in tqdm(gt_ys):

        def fitness(individual):
            x_tensor = torch.tensor(individual, dtype=torch.float32).unsqueeze(0).to('cuda') # 배치차원추가
            with torch.no_grad():
                y_pred = model(x_tensor)
            fit_fun = -(y_pred - gt_y)**2
            return fit_fun

        creator.create('FitnessMax', base.Fitness, weights=(1.0,))
        creator.create('Individual', list, fitness=creator.FitnessMax)


        toolbox = base.Toolbox()
        toolbox.register('attr_float', random.uniform, x_min, x_max)
        toolbox.register('individual', tools.initRepeat, creator.Individual, toolbox.attr_float, n=1)
        toolbox.register('population', tools.initRepeat, list, toolbox.individual)

        toolbox.register('evaluate', fitness)
        # toolbox.register('select', tools.selTournament, tournsize=3)
        toolbox.register('select', tools.selBest, k=5) # Rank Selection
        toolbox.register('mate', tools.cxBlend, alpha=0.5)
        toolbox.register('mutate', tools.mutGaussian, mu=0, sigma=1, indpb=0.2)

        pop_size = 50
        population = toolbox.population(n=pop_size)

        for gen in range(100):

            fitness_scores = [toolbox.evaluate(ind)[0] for ind in population]
            for ind, fit in zip(population, fitness_scores):
                ind.fitness.values = (fit,)

            # offspring 생성
            if len(population) == 1:
                break
            parents = toolbox.select(population) # Rank Selection
            offspring = tools.selBest(parents, k=len(population))
            offspring = list(map(toolbox.clone, offspring))

            # crossover
            for i in range(1, len(offspring), 2):
                if random.random() < 0.7:
                    toolbox.mate(offspring[i-1], offspring[i])

            # mutation
            for child in offspring:
                if random.random() < 0.2:
                    toolbox.mutate(child)

            # 새로운 자식만 평가
            for ind in offspring:
                del ind.fitness.values

            # 다음 세대 개체로 갱신
            population[:] = offspring
        
        best_individual = tools.selBest(population, k=1)[0]
        best_individual = best_individual[0]
            
        x_pred = np.array(best_individual)

        x_pred = x_pred.reshape(1,8)
        res.append(x_pred)
    
    return np.concatenate(res, axis=0)