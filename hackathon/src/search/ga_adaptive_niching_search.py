import random
import torch
from tqdm import tqdm
import numpy as np
import pandas as pd
from deap import base, creator, tools

def adaptive_niche_size(gen, max_gen, initial_sigma, min_sigma, decay_constant=5.0):
    """
    진화 단계에 따라 적응적으로 니치 크기를 조정하는 함수
    - gen: 현재 세대
    - max_gen: 최대 세대 수
    - initial_sigma: 초기 니치 크기
    - min_sigma: 최소 니치 크기
    - decay_constant: 감소율 상수
    """
    sigma = initial_sigma * np.exp(-decay_constant * gen / max_gen) # gen/max_gen : 현재 세대 비율(정규화한 값)
    return max(sigma, min_sigma)  # 최소 니치 크기 보장

def fitness_sharing(population, sigma, alpha):
    """
    적응적 니치 크기를 적용한 적합도 공유 함수
    목적 : 개체들이 특정 니치에 너무 몰리지 않도록 적합도를 조정
    - population: 현재 개체군
    - sigma: 니치 크기
    - alpha: 거리의 중요도 조정 파라미터
    """
    # 개체군을 numpy 배열로 변환
    population_array = np.concatenate(population, axis=0)

    # 개체 간 거리 계산 (모든 개체 쌍의 거리)
    distances = np.linalg.norm(
        population_array[:, np.newaxis, :] - population_array[np.newaxis, :, :], axis=2
    )

    # 공유 함수 값 계산 : dist < sigma일 때만 적합도를 공유하도록 설계
    sh_values = np.where(
        distances < sigma, 1 - (distances / sigma) ** alpha, 0
    )

    # 다른 개체들과 적합도를 나누는 정도를 나타냄
    sharing_factors = np.sum(sh_values, axis=1)  # 각 개체별 sharing factor 계산

    # 적합도 조정
    for ind, sharing_factor in zip(population, sharing_factors):
        if sharing_factor > 0.0:  # 근처에 다른 개체가 있는 경우
            adjusted_sharing_factor = max(sharing_factor, 1e-6)  # 최소값 설정
            ind.fitness.values = (ind.fitness.values[0] / adjusted_sharing_factor,)
        

def ga_adaptive_niching_search(model, pred_func, X_train, X_test, y_test, max_gen=100, initial_sigma=2.5, min_sigma=0.5, decay_constant=2.0):
    """
    - model: 예측에 사용되는 딥러닝 모델 또는 함수
    - pred_func: 입력(X_test)에 대해 model의 예측값을 반환하는 함수
    - X_train: 입력값의 학습 데이터
    - X_test: 최적화를 수행할 테스트 데이터
    - y_test: 테스트 데이터에 대한 ground truth
    - max_gen: GA의 최대 세대 수 (디폴트값: 100)
    - initial_sigma: 초기 니치 크기 (디폴트값: 2.0)
    - min_sigma: 최소 니치 크기 (디폴트값: 0.5)
    - decay_constant: 니치 크기 감소율 상수 (디폴트값: 5.0)
    """
    test = X_test
    gt_ys = y_test
    n_features = X_train.shape[1]

    x_min = np.min(X_train, axis=0)
    x_max = np.max(X_train, axis=0)

    res = []
<<<<<<< Updated upstream
=======
    for idx, gt_y in tqdm(enumerate(gt_ys), total=len(gt_ys)):
>>>>>>> Stashed changes
        
        # 적합도 함수 정의
        def fitness(population):
            population = np.concatenate(population, axis=0)
            y_pred = pred_func(model=model, X_test=population)
            fit_fun = -np.square(y_pred - gt_y)
            return fit_fun
        
        # GA 기본 설정
        # - 주의: DEAP에서 creator를 재정의할 때는 한 번만 해야 함.
        #   예시에서는 매 루프마다 호출하기 때문에, 아래처럼 try/except 처리하거나
        #   혹은 if "FitnessMax" not in creator.__dict__ 처럼 조건 걸어도 됨.
        try:
            del creator.FitnessMax
            del creator.Individual
        except:
            pass

        # GA 기본 설정
        creator.create('FitnessMax', base.Fitness, weights=(1.0,)) # 적합도 최대화 문제를 정의
        creator.create('Individual', list, fitness=creator.FitnessMax) # 개체 클래스 정의
        toolbox = base.Toolbox()
        
        def generate_individual():
            mean = (x_max + x_min) / 2
            std_dev = (x_max - x_min) / 6
            return np.random.randn(n_features) * std_dev + mean
    
        toolbox.register('attr_float', generate_individual)
        toolbox.register('individual', tools.initRepeat, creator.Individual, toolbox.attr_float, n=1) # 유전자를 모아 개체 생성
        toolbox.register('population', tools.initRepeat, list, toolbox.individual) # 개체를 모아 개체군을 생성

        # GA 연산 등록
        toolbox.register('evaluate', fitness) # 적합도 평가함수로 fitness 사용
        toolbox.register('select', tools.selTournament, tournsize=2)  
        toolbox.register('mate', tools.cxBlend, alpha=0.7) # crossover : 개체 간 교배(cxBlend)로 새로운 개체 생성
        toolbox.register('mutate', tools.mutGaussian, mu=0, sigma=0.3, indpb=0.6) # mutation : 개체의 일부 유전자를 가우시안 노이즈로 변형

        pop_size = 300
        population = toolbox.population(n=pop_size)

         # 초기 개체군 fitness 계산
        invalid_inds = [ind for ind in population if not ind.fitness.valid]
        fitness_scores = toolbox.evaluate(invalid_inds)
        for ind, fit in zip(invalid_inds, fitness_scores):
            ind.fitness.values = (fit,)

        # GA 루프
        for gen in range(max_gen):

            # fitness_scores = toolbox.evaluate(population)
            # # print('fitness_scores', fitness_scores)
            # for ind, fit in zip(population, fitness_scores):
            #     ind.fitness.values = (fit,)
            
            if len(population) == 1:
                break
            
            # 다음 세대 생성
            parents = toolbox.select(population, k=len(population))

            # offspring = tools.selBest(parents, k=len(population))
            # offspring = list(map(toolbox.clone, offspring))
            offspring = list(map(toolbox.clone, parents))

            # mate
            # for i in range(1, len(offspring), 2):
            #     if random.random() < 0.7:
            #         toolbox.mate(offspring[i - 1], offspring[i])
            
             # crossover
            for child1, child2 in zip(offspring[::2], offspring[1::2]):
                if random.random() < 0.3:
                    toolbox.mate(child1, child2)
                    del child1.fitness.values
                    del child2.fitness.values


            # mutation
            for child in offspring:
                if random.random() < 0.5:
                    toolbox.mutate(child)
                    del child.fitness.values

            # for ind in offspring:
            #     # del ind.fitness.values
            #     if not ind.fitness.valid:
            #         fitness_scores = toolbox.evaluate([ind])
            #         ind.fitness.values = (fitness_scores[0],)

            offspring = [creator.Individual(np.clip(np.array(ind), x_min, x_max)) for ind in offspring]

             # offspring 중 적합도 미평가 개체 평가
            invalid_offspring = [ind for ind in offspring if not ind.fitness.valid]
            fit_vals = toolbox.evaluate(invalid_offspring)
            for ind, fv in zip(invalid_offspring, fit_vals):
                ind.fitness.values = (fv,)

            # 부모 + 자식 합침
            combined = population + offspring

            # 다음 세대 선발: combined 중에서 pop_size만큼 select
            next_population = toolbox.select(combined, k=pop_size)

            # 니치 크기 조정
            sigma = adaptive_niche_size(gen, max_gen, initial_sigma, min_sigma, decay_constant)
<<<<<<< Updated upstream
            fitness_sharing(offspring, sigma, alpha=1.0)

            population[:] = offspring
=======
            # fitness_sharing(offspring, sigma, alpha=1.0)
            fitness_sharing(next_population, sigma, alpha=1.0)

            # population[:] = offspring
            population[:] = next_population
            
>>>>>>> Stashed changes

        # 최적 결과 반환
        best_individual = tools.selBest(population, k=1)[0]
        best_individual = best_individual[0]
<<<<<<< Updated upstream
=======
        x_pred = np.array(best_individual)
        x_pred = x_pred.reshape(1, 8)

        # pop_size개수만큼 최적 결과 반환
        # all_individual = tools.selBest(population, k=len(population))
        # all_individual = np.array(all_individual)
        # squeezed_all_individual = all_individual.squeeze(axis=1)  # axis=1은 1인 차원을 제거
        # gt_x = test[idx]
        # expanded_gt_x = np.tile(gt_x, (pop_size, 1))
        # differences = squeezed_all_individual - expanded_gt_x
        # distances = np.linalg.norm(differences, axis=1)
        # res_idx = np.argmin(distances)
        # x_pred = all_individual[res_idx]
>>>>>>> Stashed changes

        x_pred = np.array(best_individual)
        x_pred = x_pred.reshape(1, 8)
        res.append(x_pred)
    return np.concatenate(res, axis=0)