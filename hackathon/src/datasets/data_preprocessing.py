import pandas as pd
from sklearn.model_selection import train_test_split

# 1. 데이터 불러오기
def load_data(file_path):
    df = pd.read_csv(file_path)
    return df

# 2. 결측치 처리
def handle_missing_values(df):
    # 각 열에 대해 결측치가 있는지 확인하고, 간단히 평균으로 채움 (필요 시 다른 전략 사용 가능)
    df = df.fillna(df.mean())
    return df

# 3. 이상치 탐지 및 처리
def detect_and_handle_outliers(df, columns, threshold=3):
    # Z-score 방법을 사용하여 이상치를 처리
    for col in columns:
        mean = df[col].mean()
        std = df[col].std()
        df = df[(df[col] >= mean - threshold * std) & (df[col] <= mean + threshold * std)]
    return df

# 4. 데이터 스케일링
# def scale_features(df, features):
#     scaler = StandardScaler()
#     df[features] = scaler.fit_transform(df[features])
#     return df, scaler

# 5. 학습 및 테스트 데이터 분할
def split_data(df, target, test_size=0.2, random_state=42):
    X = df.drop(columns=[target])
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
    return X_train, X_test, y_train, y_test

# # Main 함수
# if __name__ == "__main__":
#     # CSV 파일 경로
#     file_path = "/data/ephemeral/home/hackerton/data/concrete.csv"

#     # 1. 데이터 불러오기
#     df = load_data(file_path)

#     # 2. 결측치 처리
#     df = handle_missing_values(df)

#     # 3. 이상치 탐지 및 처리
#     numeric_columns = ["cement", "slag", "ash", "water", "superplastic", "coarseagg", "fineagg", "age", "strength"]
#     df = detect_and_handle_outliers(df, numeric_columns)

#     # 4. 데이터 스케일링
#     df, scaler = scale_features(df, numeric_columns[:-1])  # 목표 변수 제외

#     # 5. 학습 및 테스트 데이터 분할
#     X_train, X_test, y_train, y_test = split_data(df, target="strength")

#     # 처리 결과 출력
#     print("Training Data Shape:", X_train.shape)
#     print("Test Data Shape:", X_test.shape)
#     print("Preprocessing completed successfully!")
