import numpy as np
from tabpfn import TabPFNClassifier
import warnings


warnings.filterwarnings("ignore", category=FutureWarning)


def tabpfn_classification_train(train_loader, val_loader):
    """
    TabPFNClassifier 모델을 학습하는 함수

    학습 데이터(train_loader)와 검증 데이터(val_loader)를 사용하여 TabPFNClassifier 모델을 학습합니다.

    Args:
        train_loader (tuple): 학습 데이터 튜플 (X_train, y_train)
        val_loader (tuple): 검증 데이터 튜플 (X_test, y_test). (현재 검증 데이터는 사용되지 않음)

    Returns:
        TabPFNClassifier: 학습된 TabPFNClassifier 모델
    """
    model = TabPFNClassifier(device="cuda")  # GPU 사용 설정

    X_train, y_train = train_loader
    X_test, y_test = val_loader

    model.fit(X_train, y_train)
    
    return model


def tabpfn_classification_predict(model, X_test: np.ndarray) -> np.ndarray:
    """
    학습된 TabPFNClassifier 모델을 사용하여 예측을 수행하는 함수

    Args:
        model (TabPFNClassifier): 학습된 TabPFNClassifier 모델
        X_test (np.ndarray): 테스트 데이터의 특성 행렬 (샘플 수 x 특성 수)

    Returns:
        np.ndarray: 예측된 범주형 출력값 배열 (샘플 수,)
    """
    y_pred = model.predict(X_test)
    return y_pred
