import numpy as np
from catboost import CatBoostRegressor


def catboost_multi_train(
    train_data: tuple, val_data: tuple, params: dict = None
):
    """
    CatBoostRegressor를 사용하여 다중 출력 회귀 모델을 학습하는 함수.

    Args:
        train_data (tuple): 훈련 데이터 (X_train, y_train).
        val_data (tuple): 검증 데이터 (X_test, y_test).
        params (dict, optional): CatBoostRegressor의 하이퍼파라미터. 기본값은 None.

    Returns:
        CatBoostRegressor: 학습된 CatBoost 모델.
    """
    X_train, y_train = train_data
    X_test, y_test = val_data

    model = CatBoostRegressor(
        iterations=2000,  # 최대 반복 횟수 (트리 개수)
        depth=7,  # 트리 깊이
        learning_rate=0.05,  # 학습률
        loss_function="MultiRMSE",  # 다중 출력 회귀를 위한 손실 함수
        random_seed=42,  # 랜덤 시드 설정 (재현성 확보)
        verbose=200,  # 학습 진행 상황 출력 간격
    )
    model.fit(X_train, y_train)  # 모델 학습 수행

    return model


def catboost_multi_predict(model, X_test: np.ndarray) -> np.ndarray:
    """
    학습된 CatBoost 모델을 사용하여 예측을 수행하는 함수.

    Args:
        model (CatBoostRegressor): 학습된 CatBoost 모델.
        X_test (np.ndarray): 예측할 입력 데이터.

    Returns:
        np.ndarray: 예측된 다중 출력 회귀 결과.
    """
    return model.predict(X_test)  # 모델을 사용하여 예측 수행
