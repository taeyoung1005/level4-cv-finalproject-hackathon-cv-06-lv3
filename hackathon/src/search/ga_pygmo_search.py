import torch
import numpy as np
import pygmo as pg
from tqdm import tqdm

def ga_pygmo_search(model, pred_func, X_train, X_test, y_test):

    test = X_test
    gt_ys = y_test

    x_min = np.min(X_train, axis=0)
    x_max = np.max(X_train, axis=0)

    class SphereProblem:
        def __init__(self, model, gt_y, x_min, x_max):
            self.model = model
            self.gt_y = gt_y
            self.x_min = x_min
            self.x_max = x_max

        def fitness(self, x):
            x_tensor = torch.tensor(x, dtype=torch.float32).unsqueeze(0).to('cuda')  # 배치 차원 추가

            # print('x_tensor shape : ', x_tensor.shape)
            # print('x_tensor type : ', type(x_tensor))
            with torch.no_grad():
                y_pred = model(x_tensor)
                y_pred_tensor = torch.tensor(y_pred, dtype=torch.float32)
            # print('y pred shape : ', y_pred_tensor.shape)
            # print('y pred type : ', type(y_pred_tensor))
            fit_fun = -((y_pred_tensor.item() - self.gt_y) ** 2)
            return [fit_fun]
            

        def get_bounds(self):
            return (self.x_min.tolist(), self.x_max.tolist())
        
    def batch_evaluate_population(model, pop, gt_y, pred_func):
        
        x_tensors = torch.tensor(pop.get_x(), dtype=torch.float32).reshape(-1, 8).to('cuda')
        # print('batch x_tensors shape : ', x_tensors.shape)
        # print('batch x_tensors type : ', type(x_tensors))

        with torch.no_grad():
            y_preds = pred_func(model=model, X_test=x_tensors)
            y_pred_tensor = torch.tensor(y_preds, dtype=torch.float32)
        
        # print('batch y_pred_tensor shape : ', y_pred_tensor.shape)
        # print('batch y_pred_tensor type : ', type(y_pred_tensor))

        fitness_values = -((y_pred_tensor - gt_y) ** 2).cpu().numpy()
        
        # for idx, fit_val in enumerate(fitness_values):
        #     pop.set_f(idx, [fit_val])
        
        # return pop
        new_pop = pg.population(pop.problem)
        for i, fit_val in enumerate(fitness_values):
            # # 기존 개체를 그대로 추가하면서 fitness 값만 업데이트
            # individual = pop.get_x()[i].flatten() if len(pop.get_x()[i].shape) > 1 else pop.get_x()[i]
            # print(f"Shape of individual before push_back: {individual.shape}")
            individual = np.array(pop.get_x()[i]).flatten()
            fit_val = float(fit_val)
            new_pop.push_back(individual, [fit_val])
    
        return new_pop
    
    
    res = []

    for gt_y in tqdm(gt_ys):

        prob = pg.problem(SphereProblem(model, gt_y, x_min, x_max))

        algo = pg.algorithm(pg.sga(gen=100, cr=0.7, eta_c=1.0, m=0.2, param_m=1.0))

        pop = pg.population(prob, size=50)

        # 배치 평가 호출
        pop = batch_evaluate_population(model, pop, gt_y, pred_func)
        
        # pop = algo.evolve(pop)

        best_individual = pop.champion_x

        x_pred = np.array(best_individual)
        x_pred = x_pred.reshape(1,8)
        res.append(x_pred)
        break

    return np.concatenate(res, axis=0)

# def ga_pygmo_search(model, pred_func, X_train, val_data):

#     test = val_data.dataset.X
#     gt_ys = val_data.dataset.y

#     x_min = np.min(X_train, axis=0)
#     x_max = np.max(X_train, axis=0)

#     class SphereProblem:
#         def __init__(self, model, gt_y, x_min, x_max):
#             self.model = model
#             self.gt_y = gt_y
#             self.x_min = x_min
#             self.x_max = x_max

#         def fitness(self, x):
#             x_tensor = torch.tensor(x, dtype=torch.float32).unsqueeze(0).to('cuda')  # 배치 차원 추가
#             with torch.no_grad():
#                 y_pred = self.model(x_tensor)
        
#             fit_fun = -((y_pred.item() - self.gt_y) ** 2)
#             return [fit_fun]

#         def get_bounds(self):
#             return (self.x_min.tolist(), self.x_max.tolist()) 
    
#     res = []

#     for gt_y in tqdm(gt_ys):

#         prob = pg.problem(SphereProblem(model, gt_y, x_min, x_max))

#         algo = pg.algorithm(pg.sga(gen=100, cr=0.7, eta_c=1.0, m=0.2, param_m=1.0))

#         pop = pg.population(prob, size=50)
#         pop = algo.evolve(pop)

#         best_individual = pop.champion_x

#         x_pred = np.array(best_individual)
#         x_pred = x_pred.reshape(1,8)
#         res.append(x_pred)

#     return np.concatenate(res, axis=0)