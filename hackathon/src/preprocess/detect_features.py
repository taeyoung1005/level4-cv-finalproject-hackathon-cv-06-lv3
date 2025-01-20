import pandas as pd

def detect_features(df: pd.DataFrame) -> dict:
    """
    데이터프레임의 컬럼들을 데이터 타입별로 자동 분류하여 반환한다.
    - 범주형(categorical), 수치형(numerical), 날짜형(datetime), 텍스트(text), 지리정보형(geospatial)을 포함.
    """
    # 기본 수치형, 범주형 분류
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    # 날짜형 컬럼 탐지
    datetime_cols = []
    for col in df.columns:
        if 'date' in col.lower() or 'time' in col.lower():
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                if df[col].dtype == 'datetime64[ns]':
                    datetime_cols.append(col)
            except:
                continue

    # 텍스트 컬럼 탐지 (예: Address, Description)
    text_cols = []
    for col in categorical_cols:
        if 'address' in col.lower() or 'description' in col.lower() or 'text' in col.lower():
            text_cols.append(col)
    
    # 지리정보형 컬럼 탐지 (예: Latitude, Longitude)
    geospatial_cols = []
    latitude_cols = [col for col in df.columns if 'latitude' in col.lower()]
    longitude_cols = [col for col in df.columns if 'longitude' in col.lower()]
    if latitude_cols and longitude_cols:
        geospatial_cols.extend(latitude_cols)
        geospatial_cols.extend(longitude_cols)

    
    # 결과 딕셔너리 구성
    feature_info = {
        'categorical': categorical_cols,  # 텍스트 컬럼 포함
        'numerical': numerical_cols,      # 지리정보형 컬럼 포함
        'datetime': datetime_cols,
        'text': text_cols,                # 텍스트 컬럼 추가
        'geospatial': geospatial_cols     # 지리정보형 컬럼 추가
    }
    return feature_info
