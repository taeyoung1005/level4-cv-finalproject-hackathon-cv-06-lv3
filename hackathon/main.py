import os
import sys
import argparse
import ast

from src.utils import Setting
import src.datasets as datasets
import src.surrogate as surrogate
import src.search as search
# from src.surrogate.eval_surrogate_model import eval_surrogate_model

def main(args):

    Setting.seed_everything(args.seed)
    
    datatype = args.dataset
    model_name = args.model
    search_model = args.search_model

    X_train, X_test, y_train, y_test = getattr(datasets, f'{datatype}_data')(args.data_path)

    train_data, val_data = getattr(datasets, f'{model_name}_load_data')(X_train, X_test, y_train, y_test)
    
    print("X_train.shape:", X_train.shape)
    print("X_test.shape:", X_test.shape)
    print("y_train.shape:", y_train.shape)
    print("y_test.shape:", y_test.shape)
    
    # if model_name == 'lightgbm': #  model 선언과 training 을 같이! 
    model = getattr(surrogate, f'{model_name}_train')(train_data, val_data)
    
    
    y_pred = getattr(surrogate, f'{model_name}_predict')(model, val_data)
      
    # y_pred shape : (n_samples,)
    # y_test shape : (n_samples,)! 
    rmse, mae, r2 = surrogate.eval_surrogate_model(y_train, y_pred, y_test)
    print(f"RMSE: {rmse:.4f}, MAE: {mae:.4f}, R²: {r2:.4f}")

    # if False:
    pred_func = getattr(surrogate, f'{model_name}_predict')

    x_opt = getattr(search, f'{search_model}_search')(model,pred_func,X_train,val_data)

    rmse, mae, r2 = search.eval_search_model(X_train, x_opt, X_test)
    # print(f"RMSE: {rmse}")
    # print(f"MAE: {mae}") 
    print("R²:", *[f"{x:.2f}" for x in r2])

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='parser')
    arg = parser.add_argument
    arg('--dataset', '--dset', '-dset', type=str, default='cement')
    arg('--data_path', '--data_path', '-data_path', type=str, default='./data/concrete.csv')
    arg('--model', '--model', '-model', type=str, default='lightgbm')
    arg('--search_model', '--search_model', '-search_model', type=str, default='backprob')
    arg('--seed', '--seed', '-seed', type=int, default=42)
    args = parser.parse_args()

    #TODO omegaconf 적용


    main(args)
