from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from tabpfn import TabPFNRegressor
import numpy as np

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

def tabpfn_train(train_loader, val_loader):

    model = TabPFNRegressor(device='cuda')
    (X_train, y_train), (X_test, y_test) = train_loader, val_loader
    model.fit(X_train, y_train)

    return model

def tabpfn_predict(model, X_test: np.ndarray) -> np.ndarray:

    # print(f'X_test :{X_test.shape}')
    y_pred = model.predict(X_test)

    if y_pred.ndim == 1:
        y_pred = y_pred.reshape(-1, 1)
    # print(f'y pred : {y_pred.shape}')
    return y_pred