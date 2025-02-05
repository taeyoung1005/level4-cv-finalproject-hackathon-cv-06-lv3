# main.py

import argparse
import logging
import time

import src.datasets as datasets
import src.search as search
import src.surrogate as surrogate
from src.utils import Setting, measure_time
from src.datasets.data_loader import load_data

import numpy as np
import pandas as pd
# from src.surrogate.eval_surrogate_model import eval_surrogate_model

def find_top_k_similar_with_user_request(y_user_request, X_train, y_train, k=50):
    # euclidean distance
    distances = np.linalg.norm(y_train - y_user_request.reshape(1,-1), axis=1)
    top_k_indices = np.argsort(distances)[:k]
    return X_train[top_k_indices], y_train[top_k_indices]

def main(args, scalers=None):
    # 로깅 설정
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    # 랜덤 시드 설정
    Setting.seed_everything(args.seed)
    
    model_name = args.model # 사용할 서로게이트 모델 명
    search_model = args.search_model # 사용할 서치 모델 명명

    if model_name == 'simpleNN':
        raise ValueError("simpleNN is not supported for now")
    if search_model == 'backprob':
        raise ValueError("backprob is not supported for now")
    
    # 데이터 로드 및 분할
    # load_data_func = datasets.load_and_split_data_with_x_col_list

    # X_train, X_test, y_train, y_test, x_col_list = load_data_func(args.data_path, args.target)
    df = load_data(args.data_path)
    X = df.drop(columns=args.target)
    y = df[args.target]
    x_col_list = X.columns.tolist()

    X_train,y_train = X.to_numpy(),y.to_numpy()


    controll_range = {}
    
    if scalers:
        for key, value in args.controll_range.items():
            if type(scalers[key]).__name__ == 'LabelEncoder':
                # controll_range[key] = scalers[key].transform(np.array(value).reshape(-1,1))
                i = x_col_list.index(key)
                controll_range[key] = (X_train[:,i].min(),X_train[:,i].max())
            else:
                controll_range[key] = tuple(scalers[key].transform(np.array(value).reshape(-1,1)).flatten())

        y_user_request = []

        for i in range(len(args.target)):
            y_user_request.append(scalers[args.target[i]].transform(np.array(args.user_request_target[i]).reshape(-1,1))[0])
        y_user_request = np.array(y_user_request).reshape(-1,1)

    else:
        raise ValueError("scalers is not provided")
    
    # is_nominal = [False]*len(args.controll_name)
    # for i, key in enumerate(args.controll_name):
    #     if type(scalers[key]).__name__ == 'LabelEncoder':
    #         is_nominal[i] = True
    # print("is_nominal",is_nominal)
    X_test,y_test = find_top_k_similar_with_user_request(y_user_request, X_train, y_train, k=5)

    

    # def inverse_transform_x(x):
    #     for j in range(len(x)):

    #         x[j] = scalers[x_col_list[j]].inverse_transform(x[j].reshape(-1,1))[0]
    #     return list(x)
    def inverse_transform(df):#, col_names):
        """
        df : scaled col이 있는 df 
        """
        df_tmp = df.copy()
        df_scaled_cols = ['_'.join(i.split('_')[2:]) for i in df.columns]
        for i in range(len(df_scaled_cols)):
            col_reshaped = df_tmp[df.columns[i]].values.reshape(-1, 1)
            inversed = scalers[df_scaled_cols[i]].inverse_transform(col_reshaped)
            df_tmp[df.columns[i]] = inversed.flatten()
        return df_tmp

        # for j, col in enumerate(col_names):
        #     transformed_value = scalers[col].inverse_transform(np.array(x[j]).reshape(-1, 1))[0]
        #     transformed_x.append(transformed_value)
        # return transformed_x

    # def inverse_transform_y(y):
    #     # len_y = len(y) if isinstance(y, list) or isinstance(y, np.ndarray) else 1
    #     # for j in range(len_y):
    #     #     y[j] = scalers[args.target[j]].inverse_transform(y[j].reshape(-1,1))[0]
    #     # return list(y)
    #     y_arr = np.array(y, dtype=float)

    #     if y_arr.ndim == 0:
    #         return float(scalers[args.target[0]].inverse_transform(y_arr.reshape(-1, 1))[0, 0])
    #     elif y_arr.ndim == 1:
    #         return [float(scalers[args.target[j]].inverse_transform(np.array(val).reshape(-1, 1))[0, 0])
    #                 for j, val in enumerate(y_arr)]
    #     else:
    #         raise ValueError(f"Unsupported y shape: {y_arr.shape}")
    # 데이터셋 형태 출력
    logging.info(f"X_train.shape: {X_train.shape}")
    logging.info(f"X_test.shape: {X_test.shape}")
    logging.info(f"y_train.shape: {y_train.shape}")
    logging.info(f"y_test.shape: {y_test.shape}")
    
    model_load_func = getattr(surrogate, f'{model_name}_load')
    model = model_load_func(f'./prj/{args.prj_id}/surrogate_model/model')
    print(model)
    

    predict_func = getattr(surrogate, f'{model_name}_predict')
    # y_pred = predict_func(model, X_test)

    # 사용자 요청 

    
    # 최적화/검색 수행
    # try:
    search_func = getattr(search, f'{search_model}_search_deploy')
    start_time = time.time()
    opt_df = search_func(model, predict_func, X_train, X_test, y_test\
                         ,x_col_list, args.controll_name, args.optimize\
                            , args.importance, controll_range, scalers\
                                , y_user_request)
    end_time = time.time()
    print(f"search model 소요 시간: {end_time - start_time:.4f}초")

    # except AttributeError:
    #     logging.error(f"지원되지 않는 검색 모델 '{search_model}' 입니다.")
    #     return

    # # 최적화 결과 평가
    # try:
    #     rmse, mae, r2 = search.eval_search_model(X_train, x_opt, X_test)
    #     logging.info("R²: " + ", ".join([f"{x:.2f}" for x in r2]))
    # except Exception as e:
    #     logging.error(f"최적화 결과 평가 중 오류 발생: {e}")
    #     return
    pred_input = X_test.copy()
    control_index = [i for i, v in enumerate(x_col_list) if v in args.controll_name]
    for i in range(len(args.controll_name)):
        pred_input[:,control_index[i]] = opt_df[f'pred_x_{args.controll_name[i]}']
    pred_y = predict_func(model, pred_input)

    for i in range(len(args.target)):

        opt_df[f'pred_y_{args.target[i]}'] = pred_y[:,i]
        opt_df[f'pred_y_{args.target[i]}'] = inverse_transform(opt_df[[f'pred_y_{args.target[i]}']])
    
    for i in range(len(args.target)):
        opt_df[f'test_y_{args.target[i]}'] = y_test[:,i]
        opt_df[f'test_y_{args.target[i]}'] = inverse_transform(opt_df[[f'test_y_{args.target[i]}']])

    for i in range(len(args.controll_name)):

        opt_df[f'pred_x_{args.controll_name[i]}'] = inverse_transform(opt_df[[f'pred_x_{args.controll_name[i]}']])
    
    for i in range(len(x_col_list)):
        if type(scalers[x_col_list[i]]).__name__ == 'LabelEncoder':
            opt_df[f'test_x_{x_col_list[i]}'] = X_test[:,i].astype(int)
        else:
            opt_df[f'test_x_{x_col_list[i]}'] = X_test[:,i]
        opt_df[f'test_x_{x_col_list[i]}'] = inverse_transform(opt_df[[f'test_x_{x_col_list[i]}']])
    # opt_df['test_x_control'] = opt_df['test_x'].apply(lambda x : x[control_index])


    target_columns = [

    (f'pred_x_{col}',f'test_x_{col}')
    for col in args.controll_name
    ] + [
    (f'pred_y_{target}',f'test_y_{target}')
    for target in args.target
    ]

    df_transformed = []
    for test_col, pred_col in target_columns:
        df_transformed.append(
            {
                "column_name": test_col.split("_")[-1],
                "ground_truth": opt_df[test_col].tolist(),
                "predicted": opt_df[pred_col].tolist(),
            }
        )

    # 새로운 데이터프레임 생성
    df_result = pd.DataFrame(df_transformed)
    return df_result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='모델 학습 스크립트')
    arg = parser.add_argument
    # arg('--dataset', '--dset', '-dset', type=str, default='cement',
    #     choices=['cement', 'melb', 'car'], help='사용할 데이터셋을 지정합니다 추후 제거')
    arg('--model', '--model', '-model', type=str, default='catboost',
        choices=['catboost', 'tabpfn'], help='사용할 모델을 지정합니다 (기본값: catboost)')
    arg('--search_model', '--search_model', '-search_model', type=str, default='k_means',
        choices=['k_means'], help='사용할 검색/최적화 방법을 지정합니다 (기본값: k_means)')
    arg('--data_path', '--data_path', '-data_path', type=str, default='./data/concrete_processed.csv',
        help='데이터셋 CSV 파일 경로를 지정합니다')
    arg('--controll_name', '--controll_name', '-controll_name', type=list, default=['cement', 'slag', 'ash', 'water', 'superplastic', 'coarseagg', 'fineagg', 'age'],
        help='제어 변수 이름을 지정합니다')
    #TODO scaler 적용 필요
    arg('--controll_range', '--controll_range', '-controll_range', type=dict, default={'cement': (102.0, 540.0),
                'slag': (0.0, 359.4),
                'ash': (0.0, 200.1),
                'water': (121.8, 247.0),
                'superplastic': (0.0, 32.2),
                'coarseagg': (801.0, 1145.0),
                'fineagg': (594.0, 992.6),
                'age': (1.0, 365.0)},
        help='제어 변수 범위를 지정합니다')
    # args.env? 
    arg('--target', '--target', '-target', type=list, default=['strength'],
        help='타겟 변수를 지정합니다')
    arg('--importance', '--importance', '-importance', type=dict, default={'cement': 1,
                # 'slag': 3,
                # 'ash': 4,
                'water': 2,
                # 'superplastic': 5,
                # 'coarseagg': 6,
                # 'fineagg': 7,
                # 'age': 8
                },
        help='피쳐 별 중요도를 지정합니다')
    arg('--optimize', '--optimize', '-optimize', type=dict, default={'cement': 'maximize',
                # 'slag': 'minimize',
                # 'ash': 'maximize',
                'water': 'maximize',
                # 'superplastic': 'minimize',
                # 'coarseagg': 'minimize',
                # 'fineagg': 'minimize',
                # 'age': 'minimize'
                },
        help='피쳐 별 최적화 방향을 지정합니다')
    # arg('--model', '--model', '-model', type=str, default='lightgbm',
    #     choices=['lightgbm', 'simpleNN', 'tabpfn'], help='사용할 모델을 지정합니다 (기본값: lightgbm)')
    arg('--prj_id', '--prj_id', '-prj_id', type=int, default=42,
        help='프로젝트 아이디를 지정합니다')
    arg('--seed', '--seed', '-seed', type=int, default=42,
        help='재현성을 위한 랜덤 시드 (기본값: 42)')
    arg('--user_request_target', '--user_request_target', '-user_request_target', type=list, default=[0.0],
        help='사용자 요청 타겟 값을 지정합니다')
    args = parser.parse_args()

    main(args)
