import numpy as np
from catboost import CatBoostClassifier
import optuna
from sklearn.metrics import accuracy_score

def get_objective(X_train, y_train, X_test, y_test):
    def objective(trial):
        param = {
            "objective": trial.suggest_categorical("objective", ["MultiClass"]),
            "colsample_bylevel": trial.suggest_float("colsample_bylevel", 0.01, 0.1),
            "depth": trial.suggest_int("depth", 1, 12),
        }

        model = CatBoostClassifier(**param)

        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=1, early_stopping_rounds=50)

        preds = model.predict(X_test)
        accuracy = accuracy_score(y_test, preds)
        return 1 - accuracy  # Optuna는 기본적으로 최소화를 목표로 하므로 (1 - 정확도) 사용
    return objective


def catboost_classification_train(train_data: tuple, val_data: tuple, params: dict = None):
    """
    CatBoost 분류 모델을 학습하는 함수.

    Parameters:
        train_data (tuple): 훈련 데이터 (X_train, y_train)
        val_data (tuple): 검증 데이터 (X_test, y_test)
        params (dict, optional): CatBoost 하이퍼파라미터 딕셔너리. 기본값은 None.

    Returns:
        CatBoostClassifier: 학습된 CatBoost 분류 모델
    """
    X_train, y_train = train_data
    X_test, y_test = val_data

    objective = get_objective(X_train, y_train, X_test, y_test)
    study = optuna.create_study(direction="minimize")
    study.optimize(objective, n_trials=2)

    model = CatBoostClassifier(**study.best_params)
    
    # 모델 학습
    model.fit(X_train, y_train)
    
    return model


def catboost_classification_predict(model, X_test: np.ndarray) -> np.ndarray:
    """
    학습된 CatBoost 분류 모델을 사용하여 예측 수행.

    Parameters:
        model (CatBoostClassifier): 학습된 CatBoost 분류 모델
        X_test (np.ndarray): 예측을 수행할 입력 데이터

    Returns:
        np.ndarray: 예측된 클래스 레이블
    """
    y_pred = model.predict(X_test)

    # 예측 결과가 1차원 배열이면 2차원으로 변환
    if y_pred.ndim == 1:
        y_pred = y_pred.reshape(-1, 1)

    return y_pred
