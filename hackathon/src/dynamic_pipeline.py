import pandas as pd
import memory_profiler
from src.preprocess.sampling import sample_dataframe
from src.preprocess.datetime_features import remove_datetime_columns
from src.preprocess.detect_features import detect_features
from src.preprocess.dynamic_encoding import dynamic_encode
from src.preprocess.dynamic_outlier import dynamic_outlier_removal
from src.preprocess.dynamic_scaling import dynamic_scaling
from src.preprocess.identity_scaler import IdentityScaler
from src.preprocess.missing_values import (
    drop_high_missing_data,
    fill_missing_categorical,
    fill_missing_numerical,
)
from src.preprocess.text_processing import process_text
from src.preprocess.processing_metadata import get_removed_columns


def log_memory_usage(step):
    """ 현재 메모리 사용량 로깅 """
    mem_usage = memory_profiler.memory_usage()[0]
    print(f"[Memory] Step: {step} → {mem_usage:.2f} MB")


def preprocess_dynamic(df: pd.DataFrame) -> dict:
    """
    입력된 df에 대해 동적 전처리를 수행하며, 각 단계에서 메모리 사용량을 분석한다.
    """

    log_memory_usage("Start")  # 시작 시 메모리 사용량 체크

    # 1. 샘플링된 데이터 생성 (컬럼 타입 분류용)
    sampled_df = sample_dataframe(df)  # 샘플링된 데이터 사용
    log_memory_usage("After Sampling")

    # 2. 데이터 특성 탐지
    feature_info = detect_features(sampled_df)
    log_memory_usage("After Feature Detection")

    cat_cols = feature_info['categorical']
    num_cols = feature_info['numerical']
    num_cat_cols = feature_info['numerical_categorical']
    datetime_cols = feature_info['datetime']
    text_cols = feature_info['text']
    dtype_info = feature_info['dtypes']
    scaler_info = {col: IdentityScaler() for col in df.columns}

    # 백엔드에서 사용할 변수타입별 열 정보 (categorical: 기존 categorical + numerical_categorical)
    combined_cat_cols = cat_cols + num_cat_cols

    # 3. 결측치 처리
    log_memory_usage("Before Missing Value Processing")

    df = drop_high_missing_data(df, threshold=0.5)
    log_memory_usage("After drop_high_missing_data()")

    df = fill_missing_numerical(df, num_cols, strategy='median')
    log_memory_usage("After fill_missing_numerical()")

    df = fill_missing_categorical(df, cat_cols, fill_value='Unknown')
    log_memory_usage("After fill_missing_categorical()")

    if num_cat_cols:
        df = fill_missing_numerical(df, num_cat_cols, strategy='median')
        log_memory_usage("After fill_missing_num_cat()")

    if text_cols:
        df = fill_missing_categorical(df, text_cols, fill_value='Unknown')
        log_memory_usage("After fill_missing_text()")

    # 4. 텍스트 데이터 처리
    if text_cols:
        df = process_text(df, text_cols)
        log_memory_usage("After Text Processing")

    # 5. 날짜형 데이터 처리
    if datetime_cols:
        df = remove_datetime_columns(df, datetime_cols)
        log_memory_usage("After Datetime Processing")

    # 6. 인코딩 (동적 처리)
    df, scaler_info = dynamic_encode(df, feature_info, scaler_info)
    log_memory_usage("After Encoding")

    # 7. 이상치 처리 (동적 처리)
    df = dynamic_outlier_removal(df, num_cols)
    log_memory_usage("After Outlier Removal")

    # 8. 스케일링 (동적 처리)
    df, scaler_info = dynamic_scaling(df, num_cols, scaler_info)
    log_memory_usage("After Scaling")

    # 9. 제거된 컬럼 정보 가져오기
    removed_cols = get_removed_columns()
    log_memory_usage("After Column Removal")

    # 10. 전처리 완료된 데이터프레임 반환
    log_memory_usage("End")
    return {
        'processed_df': df,
        'dtypes': dtype_info,
        'scalers': scaler_info,
        'removed_columns': removed_cols
    }
