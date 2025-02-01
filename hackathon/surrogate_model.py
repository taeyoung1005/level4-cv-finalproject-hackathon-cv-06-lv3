# main.py

import argparse
import logging
import time
import os 

import src.datasets as datasets
import src.search as search
import src.surrogate as surrogate
from src.utils import Setting, measure_time

import pandas as pd
# from src.surrogate.eval_surrogate_model import eval_surrogate_model

def main(args):
    # 로깅 설정
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    # 랜덤 시드 설정
    Setting.seed_everything(args.seed)
    
    model_name = args.model # 사용할 서로게이트 모델 명

    if model_name == 'simpleNN':
        raise ValueError("simpleNN is not supported for now")
    
    # 데이터 로드 및 분할
    load_data_func = datasets.load_and_split_data
    X_train, X_test, y_train, y_test = load_data_func(args.data_path, args.target)

    # 모델별 데이터 로드
    # try:
    load_data_loader_func = getattr(datasets, f'{model_name}_load_data')
    # except AttributeError:
    #     logging.error(f"지원되지 않는 모델 '{model_name}' 입니다.")
    #     return

    train_loader, val_loader = load_data_loader_func(X_train, X_test, y_train, y_test)
    
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

    df_eval = pd.DataFrame({'rmse': rmse, 'mae': mae, 'r2': r2})
    print(df_eval)

    print(y_test.shape, y_pred.shape)
    print(abs(y_test - y_pred).shape)
    df_rank = pd.DataFrame({'y_test': y_test[:,0].squeeze(), 'y_pred': y_pred[:,0].squeeze(),'diff': abs(y_test[:,0] - y_pred[:,0]).squeeze()}) # y_pred, y_test rank ! 
    df_rank['rank'] = df_rank['diff'].rank(method='min').astype(int)


    os.makedirs(f'./prj/{args.prj_id}/surrogate_model', exist_ok=True)
    df_rank.to_csv(f'./prj/{args.prj_id}/surrogate_model/surrogate_model.csv', index=False)

    save_model_func = getattr(surrogate, f'{model_name}_save')
    save_model_func(model, f'./prj/{args.prj_id}/surrogate_model/model')
    df_eval.to_csv(f'./prj/{args.prj_id}/surrogate_model/eval.csv', index=False)

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
    arg('--prj_id', '--prj_id', '-prj_id', type=int, default=42,
        help='프로젝트 아이디를 지정합니다')
    arg('--seed', '--seed', '-seed', type=int, default=42,
        help='재현성을 위한 랜덤 시드 (기본값: 42)')
    args = parser.parse_args()

    # TODO: omegaconf 적용

    main(args)
