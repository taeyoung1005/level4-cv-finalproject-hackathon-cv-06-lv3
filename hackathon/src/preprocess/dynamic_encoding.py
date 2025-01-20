import pandas as pd
from transformers import BertTokenizer, BertModel
from src.preprocess.encoding import label_encode, bert_encode

def dynamic_encode(df: pd.DataFrame, feature_info: dict) -> pd.DataFrame:
    """
    동적으로 범주형 데이터를 처리.
    - 'text' 타입의 컬럼은 BERT 임베딩 적용
    - 'categorical' 타입의 컬럼은 Label Encoding 적용
    :param df: 입력 데이터프레임
    :param feature_info: detect_features에서 반환된 컬럼 타입 정보 (예: {'text': [...], 'categorical': [...]})
    :return: 인코딩된 데이터프레임
    """
    # BERT 모델 및 토크나이저 로드 (필요 시)
    bert_model, bert_tokenizer = None, None
    if 'text' in feature_info and feature_info['text']:
        try:
            print("BERT 토크나이저 및 모델 로드 중...")
            bert_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
            bert_model = BertModel.from_pretrained('bert-base-uncased')
            bert_model.eval()  # 평가 모드로 전환
            print("BERT 모델 및 토크나이저 로드 완료.")
        except Exception as e:
            raise RuntimeError(f"BERT 모델 로드 중 오류 발생: {e}")

    # 텍스트 데이터 처리
    if 'text' in feature_info:
        for col in feature_info['text']:
            print(f"{col}: BERT 임베딩 적용 중...")

            # 결측치 확인 (이미 'Unknown'으로 대체되었는지 확인)
            missing_count = df[col].isnull().sum()
            if missing_count > 0:
                raise ValueError(
                    f"{col} 컬럼에 결측치가 {missing_count}개 남아 있습니다. "
                    "결측치를 처리한 후에 임베딩을 시도해야 합니다."
                )
            else:
                print(f"{col}: 결측치 없음. 안전하게 진행 가능합니다.")

            try:
                # 고유값 추출 및 문자열 변환
                unique_values = df[col].unique().astype(str)
                print(f"{col}: 고유값 개수 = {len(unique_values)}")
                print(f"{col}: 고유값 예시: {unique_values[:5]}")

                # BERT 임베딩 수행
                bert_embeddings = bert_encode(unique_values, bert_model, bert_tokenizer)
                embeddings_df = pd.DataFrame(bert_embeddings, index=unique_values)
                embeddings_df.columns = [f"{col}_bert_{i}" for i in range(embeddings_df.shape[1])]
                embeddings_df.index = embeddings_df.index.astype(str)  # 인덱스 타입 통일

                # 원본 데이터와 병합 후 컬럼 드롭
                df = df.merge(
                    embeddings_df, left_on=col, right_index=True, how='left'
                ).drop(columns=[col])
                print(f"{col}: BERT 임베딩 적용 완료.")

            except Exception as e:
                raise RuntimeError(f"{col}: BERT 임베딩 적용 중 오류 발생: {e}")

    # 일반 범주형 데이터 처리 (Label Encoding으로 통일)
    if 'categorical' in feature_info:
        for col in feature_info['categorical']:
            print(f"{col}: Label Encoding 적용 (범주형 데이터)")
            df = label_encode(df, [col])
            print(f"{col}: Label Encoding 적용 완료.")
    
    return df
