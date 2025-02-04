# main.py

import argparse
import logging
import time
import os

import hackathon.src.datasets as datasets
import hackathon.src.search as search
import hackathon.src.surrogate as surrogate
from hackathon.src.utils import Setting, measure_time

import pandas as pd
# from src.surrogate.eval_surrogate_model import eval_surrogate_model


def main(args, scalers=None):
    # 로깅 설정
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(levelname)s - %(message)s')

    # 랜덤 시드 설정
    Setting.seed_everything(args.seed)

    model_name = args.model  # 사용할 서로게이트 모델 명

    if model_name == 'simpleNN':
        raise ValueError("simpleNN is not supported for now")

    # 데이터 로드 및 분할
    load_data_func = datasets.load_and_split_data_with_x_col_list
    X_train, X_test, y_train, y_test, x_col_list = load_data_func(
        args.data_path, args.target)

    if model_name == 'tabpfn':
        if X_train.shape[0] > 3000:
            X_train = X_train[:3000]
            y_train = y_train[:3000]
            print("X_train.shape: ", X_train.shape)
            print("X_test.shape: ", X_test.shape)
    # 모델별 데이터 로드
    # try:
    load_data_loader_func = getattr(datasets, f'{model_name}_load_data')
    # except AttributeError:
    #     logging.error(f"지원되지 않는 모델 '{model_name}' 입니다.")
    #     return

    # TODO sampling and catboost trial 조절
    train_loader, val_loader = load_data_loader_func(
        X_train, X_test, y_train, y_test)

    # 데이터셋 형태 출력
    logging.info(f"X_train.shape: {X_train.shape}")
    logging.info(f"X_test.shape: {X_test.shape}")
    logging.info(f"y_train.shape: {y_train.shape}")
    logging.info(f"y_test.shape: {y_test.shape}")

    # 모델 학습
    # try:
    if len(args.target) > 1:
        train_func = getattr(surrogate, f'{model_name}_multi_train')
    else:
        train_func = getattr(surrogate, f'{model_name}_train')
    # model = measure_time(train_func, train_loader, val_loader)
    model = train_func(train_loader, val_loader)
    # except AttributeError:
    #     logging.error(f"지원되지 않는 모델 '{model_name}'의 학습 함수입니다.")
    #     return

    if len(args.target) > 1:
        predict_func = getattr(surrogate, f'{model_name}_multi_predict')
    else:
        predict_func = getattr(surrogate, f'{model_name}_predict')
    y_pred = predict_func(model, X_test)

    print(y_pred.shape)
    print(y_test.shape)

    rmse, mae, r2 = surrogate.eval_surrogate_model(y_train, y_pred, y_test)

    df_eval = pd.DataFrame({'rmse': rmse, 'mae': mae, 'r2': r2, 'target': args.target})
    print(df_eval)

    if scalers:
        for i in range(len(args.target)):
            y_test[:,i] = scalers[args.target[i]].inverse_transform(y_test[:,i].reshape(-1,1))[:,0]
            y_pred[:,i] = scalers[args.target[i]].inverse_transform(y_pred[:,i].reshape(-1,1))[:,0]

    #TODO only for single target -> multi target ranking?
    # print(y_test.shape, y_pred.shape)
    # print(abs(y_test - y_pred).shape)

    for i in range(len(args.target)):
        df_rank = pd.DataFrame({'y_test': y_test[:,i].squeeze(), 'y_pred': y_pred[:,i].squeeze(),'diff': abs(y_test[:,i] - y_pred[:,i]).squeeze()}) # y_pred, y_test rank ! 
        df_rank['rank'] = df_rank['diff'].rank(method='min').astype(int)
    os.makedirs(f'./temp/surrogate_model', exist_ok=True)


    if model_name == 'catboost':
        df_importance = pd.DataFrame({'feature': x_col_list, 'importance': model.get_feature_importance(
        )/model.get_feature_importance().sum()})

    save_model_func = getattr(surrogate, f'{model_name}_save')
    model_path = save_model_func(model, f'./temp/surrogate_model/model')

    return df_rank, df_eval, df_importance, model_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='모델 학습 스크립트')
    arg = parser.add_argument
    # arg('--dataset', '--dset', '-dset', type=str, default='cement',
    #     choices=['cement', 'melb', 'car'], help='사용할 데이터셋을 지정합니다 추후 제거')
    arg('--target', '--target', '-target', type=list, default=['strength'],
        help='타겟 변수를 지정합니다')
    arg('--data_path', '--data_path', '-data_path', type=str, default='./data/concrete_processed.csv',
        help='데이터셋 CSV 파일 경로를 지정합니다')
    arg('--model', '--model', '-model', type=str, default='lightgbm',
        choices=['lightgbm', 'catboost', 'tabpfn'], help='사용할 모델을 지정합니다 (기본값: lightgbm)')
    arg('--flow_id', '--flow_id', '-flow_id', type=int, default=42,
        help='플로우 아이디를 지정합니다')
    arg('--seed', '--seed', '-seed', type=int, default=42,
        help='재현성을 위한 랜덤 시드 (기본값: 42)')
    args = parser.parse_args()

    # TODO: omegaconf 적용

    main(args)
