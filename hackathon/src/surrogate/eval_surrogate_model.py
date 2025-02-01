import numpy as np


def eval_surrogate_model(y_train,y_pred, y_test):
    rmse = np.sqrt(np.mean((y_test - y_pred) ** 2))
    mae = np.mean(np.abs(y_test - y_pred))
    SSE = np.sum(np.square(y_test - y_pred))    
    SST = np.sum(np.square(y_test - y_train.mean()))
    r2 = 1 - SSE/SST
    return rmse, mae, r2