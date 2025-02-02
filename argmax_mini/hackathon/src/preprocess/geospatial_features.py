# src/preprocess/geospatial_features.py

import pandas as pd
from hackathon.src.preprocess.processing_metadata import add_removed_columns


def remove_geospatial_columns(df: pd.DataFrame, geo_columns: list) -> pd.DataFrame:
    """
    지리 정보 컬럼 제거
    :param df: 입력 데이터프레임
    :param geo_columns: 제거할 지리 정보 컬럼 목록 (예: ['latitude', 'longitude'])
    :return: 지리 정보 컬럼이 제거된 데이터프레임
    """
    columns_to_remove = [col for col in geo_columns if col in df.columns]
    add_removed_columns(columns_to_remove)  # 제거된 열 기록
    df = df.drop(columns=columns_to_remove, errors='ignore')
    print(f"Removed geospatial columns: {columns_to_remove}")
    return df
