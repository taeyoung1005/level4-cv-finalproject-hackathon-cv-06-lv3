from .data_preprocessing import (
    load_data,
    handle_missing_values,
    detect_and_handle_outliers,
    # scale_features,
    split_data
)

from sklearn.preprocessing import StandardScaler



def cement_data(file_path):
    # 데이터 불러오기
    df = load_data(file_path)

    # 결측치 처리
    df = handle_missing_values(df)

    # # 이상치 탐지 및 처리
    numeric_columns = ["cement", "slag", "ash", "water", "superplastic", "coarseagg", "fineagg", "age", "strength"]

    
    df = detect_and_handle_outliers(df, numeric_columns)

    # df = df[['cement','water','age','strength']]
    X_train, X_test, y_train, y_test = split_data(df, target="strength")

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)


    # X_train = X_train.to_numpy()
    # X_test = X_test.to_numpy()
    y_train = y_train.to_numpy()
    y_test = y_test.to_numpy()
        

    return X_train, X_test, y_train, y_test
