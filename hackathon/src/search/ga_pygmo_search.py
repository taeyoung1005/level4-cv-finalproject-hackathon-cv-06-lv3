import torch
import numpy as np
import pygmo as pg
from tqdm import tqdm

def ga_pygmo_search(model, pred_func, X_train, val_data):

    test = val_data.dataset.X
    gt_ys = val_data.dataset.y

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
            with torch.no_grad():
                y_pred = self.model(x_tensor)
        
            fit_fun = -((y_pred.item() - self.gt_y) ** 2)
            return [fit_fun]

        def get_bounds(self):
            return (self.x_min.tolist(), self.x_max.tolist()) 
    
    res = []

    for gt_y in tqdm(gt_ys):

        prob = pg.problem(SphereProblem(model, gt_y, x_min, x_max))

        algo = pg.algorithm(pg.sga(gen=100, cr=0.7, eta_c=1.0, m=0.2, param_m=1.0))

        pop = pg.population(prob, size=50)
        pop = algo.evolve(pop)

        best_individual = pop.champion_x

        x_pred = np.array(best_individual)
        x_pred = x_pred.reshape(1,8)
        res.append(x_pred)

    return np.concatenate(res, axis=0)