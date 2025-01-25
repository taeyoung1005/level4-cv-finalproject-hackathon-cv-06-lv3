import random
import torch
from tqdm import tqdm
import numpy as np
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
    population_array = np.array([np.array(ind).squeeze() for ind in population])
    # print(population_array.shape) # (50, 8)

    # 개체 간 거리 계산 (모든 개체 쌍의 거리)
    distances = np.linalg.norm(
        population_array[:, np.newaxis, :] - population_array[np.newaxis, :, :], axis=2
    )
    # print(distances.shape) # (50, 50)

    # 공유 함수 값 계산 : dist < sigma일 때만 적합도를 공유하도록 설계
    sh_values = np.where(
        distances < sigma, 1 - (distances / sigma) ** alpha, 0
    )
    # print(sh_values.shape) # (50, 50)

    # 다른 개체들과 적합도를 나누는 정도를 나타냄
    sharing_factors = np.sum(sh_values, axis=1)  # 각 개체별 sharing factor 계산
    # print(sharing_factors.shape) # (50,)

    # 적합도 조정
    for ind, sharing_factor in zip(population, sharing_factors):
        if sharing_factor > 0.0:  # 근처에 다른 개체가 있는 경우
            ind.fitness.values = (ind.fitness.values[0] / sharing_factor,)

    # for ind in population:
    #     # ind와 다른 모든 개체 사이의 거리 계산(자기 자신 포함)
    #     distances = [
    #         np.linalg.norm(np.array(ind) - np.array(other)) for other in population
    #     ]
    #     # print(len(distances)) # 50

    #     # 공유 함수 값 계산 : dist < sigma일 때만 적합도를 공유하도록 설계
    #     sh_values = [
    #         1 - (dist / sigma) ** alpha if dist < sigma else 0
    #         for dist in distances
    #     ] # distances를 기반으로 적합도 공유 비율을 나타내는 리스트

    #     # 다른 개체들과 적합도를 나누는 정도를 나타냄
    #     # sharing_factor가 크다 = 해당 개체와 가까운 개체가 많다
    #     sharing_factor = sum(sh_values)
    #     # print(sharing_factor) # 12.976303413814554
        
    #     # 적합도 조정
    #     if sharing_factor > 0: # 근처에 다른 개체가 있는 경우
    #         # print(ind.fitness.values)
    #         ind.fitness.values = (ind.fitness.values[0] / sharing_factor,)

def ga_adaptive_niching_search(model, pred_func, X_train, X_test, y_test, max_gen=10, initial_sigma=2.0, min_sigma=0.5, decay_constant=5.0):
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

    x_min = np.min(X_train, axis=0)
    x_max = np.max(X_train, axis=0)

    res = []
    for idx, gt_y in tqdm(enumerate(gt_ys)):
        
        # 적합도 함수 정의
        def fitness(population):
            population = np.concatenate(population, axis=0)
            y_pred = pred_func(model=model, X_test=population)
            y_pred_tensor = torch.tensor(y_pred, dtype=torch.float32)
            fit_fun = -(y_pred_tensor - gt_y) ** 2
            return fit_fun
        
        # GA 기본 설정
        creator.create('FitnessMax', base.Fitness, weights=(1.0,)) # 적합도 최대화 문제를 정의
        creator.create('Individual', list, fitness=creator.FitnessMax) # 개체 클래스 정의
        toolbox = base.Toolbox()
        toolbox.register('attr_float', random.uniform, x_min, x_max) # 각 유전자 값은 x_min과 x_max 사이의 실수로 초기화
        toolbox.register('individual', tools.initRepeat, creator.Individual, toolbox.attr_float, n=1) # 유전자를 모아 개체 생성
        toolbox.register('population', tools.initRepeat, list, toolbox.individual) # 개체를 모아 개체군을 생성

        # GA 연산 등록
        toolbox.register('evaluate', fitness) # 적합도 평가함수로 fitness 사용
        toolbox.register('select', tools.selBest, k=5)  # Best Selection : 상위 5개의 개체를 선택하는 selBest 방식
        toolbox.register('mate', tools.cxBlend, alpha=0.5) # crossover : 개체 간 교배(cxBlend)로 새로운 개체 생성
        toolbox.register('mutate', tools.mutGaussian, mu=0, sigma=1, indpb=0.2) # mutation : 개체의 일부 유전자를 가우시안 노이즈로 변형

        pop_size = 50
        population = toolbox.population(n=pop_size)

        # GA 루프
        for gen in range(max_gen):

            # 적합도 계산
            fitness_scores = toolbox.evaluate(population)
            for ind, fit in zip(population, fitness_scores):
                ind.fitness.values = (fit,)

            if len(population) == 1:
                break
            
            # 다음 세대 생성
            parents = toolbox.select(population, k=len(population))
            offspring = tools.selBest(parents, k=len(population))
            offspring = list(map(toolbox.clone, offspring))

            # mate
            for i in range(1, len(offspring), 2):
                if random.random() < 0.7:
                    toolbox.mate(offspring[i - 1], offspring[i])

            # mutation
            for child in offspring:
                if random.random() < 0.2:
                    toolbox.mutate(child)

            for ind in offspring:
                # del ind.fitness.values
                if not ind.fitness.valid:
                    fitness_scores = toolbox.evaluate([ind])
                    ind.fitness.values = (fitness_scores[0],)

            # 니치 크기 조정
            sigma = adaptive_niche_size(gen, max_gen, initial_sigma, min_sigma, decay_constant)
            fitness_sharing(offspring, sigma, alpha=1.0)

            population[:] = offspring

        # 최적 결과 반환 : R²: -27.95, -21.12, -14.68, -51.41, -22.52, -35.11, -33.38, -0.70
        # best_individual = tools.selBest(population, k=1)[0]
        # best_individual = best_individual[0]
        # x_pred = np.array(best_individual)
        # x_pred = x_pred.reshape(1, 8)

        # pop_size개수만큼 최적 결과 반환 : R²: -0.36, -0.58, 0.01, -1.90, -0.04, -0.74, -0.97, 0.94
        all_individual = tools.selBest(population, k=len(population))
        all_individual = np.array(all_individual)
        squeezed_all_individual = all_individual.squeeze(axis=1)  # axis=1은 1인 차원을 제거
        gt_x = test[idx]
        expanded_gt_x = np.tile(gt_x, (pop_size, 1))
        differences = squeezed_all_individual - expanded_gt_x
        distances = np.linalg.norm(differences, axis=1)
        res_idx = np.argmin(distances)
        x_pred = all_individual[res_idx]
        # print(x_pred.shape)

        res.append(x_pred)
        
    return np.concatenate(res, axis=0)