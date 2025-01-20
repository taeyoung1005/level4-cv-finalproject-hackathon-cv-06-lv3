import sys
import pandas as pd
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.dynamic_pipeline import preprocess_dynamic

def main():
    """
    실행 엔트리 포인트
    사용 예:
      python main.py /path/to/data.csv
    """
    if len(sys.argv) < 2:
        print("Usage: python main.py <data_path>")
        sys.exit(1)

    data_path = sys.argv[1]

    # CSV 로드
    try:
        df = pd.read_csv(data_path)
    except Exception as e:
        print(f"파일 로드 실패: {e}")
        sys.exit(1)

    print(f"데이터셋 로드 성공: {data_path} (shape={df.shape})")

    # 동적 전처리 실행
    try:
        processed_df = preprocess_dynamic(df)
        print("전처리 완료!")
        print(f"전처리 후 shape: {processed_df.shape}")
    except Exception as e:
        print(f"전처리 중 오류 발생: {e}")
        sys.exit(1)

    # 전처리 결과 저장
    output_path = data_path.replace(".csv", "_processed.csv")
    try:
        processed_df.to_csv(output_path, index=False)
        print(f"전처리 결과 저장: {output_path}")
    except Exception as e:
        print(f"결과 저장 중 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
