import numpy as np
from tabpfn import TabPFNRegressor
import warnings
import pickle

warnings.filterwarnings("ignore", category=FutureWarning)


def tabpfn_train(train_loader, val_loader):
    """
    TabPFNRegressor 모델을 학습하는 함수

    학습 데이터(train_loader)와 검증 데이터(val_loader)를 사용하여 TabPFNRegressor 모델을 학습합니다.

    Args:
        train_loader (tuple): 학습 데이터 튜플 (X_train, y_train)
        val_loader (tuple): 검증 데이터 튜플 (X_test, y_test). (현재 검증 데이터는 사용되지 않음)

    Returns:
        TabPFNRegressor: 학습된 TabPFNRegressor 모델
    """
    model = TabPFNRegressor(device="cuda")  # GPU 사용 설정

    X_train, y_train = train_loader
    X_test, y_test = val_loader

    model.fit(X_train, y_train)

    return model


def tabpfn_predict(model, X_test: np.ndarray) -> np.ndarray:
    """
    학습된 TabPFNRegressor 모델을 사용하여 예측을 수행하는 함수

    Args:
        model (TabPFNRegressor): 학습된 TabPFNRegressor 모델
        X_test (np.ndarray): 테스트 데이터의 특성 행렬 (샘플 수 x 특성 수)

    Returns:
        np.ndarray: 예측된 출력값 행렬 (샘플 수 x 1)
    """
    y_pred = model.predict(X_test)

    if y_pred.ndim == 1:
        y_pred = y_pred.reshape(-1, 1)

    return y_pred

def tabpfn_save(model, path):
    with open(path + '.pkl', 'wb') as f:
        pickle.dump(model, f)

def tabpfn_load(path):
    with open(path + '.pkl', 'rb') as f:
        return pickle.load(f)