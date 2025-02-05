from data_processing.serializers import SurrogateResultModelSerializer, SurrogateMatricModelSerializer, FeatureImportanceModelSerializer, SearchResultModelSerializer
from data_processing.models import FlowModel, ConcatColumnModel
import os
import sys

import django
from django.core.files.uploadedfile import SimpleUploadedFile
import pandas as pd
from tqdm import tqdm

sys.path.append(os.path.dirname(os.path.abspath(
    os.path.dirname(__file__))) + "/argmax_mini")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'argmax_mini.settings')
django.setup()


def insert_surrogate_matric(csv_file, flow_id):
    '''
    Surrogate Model Metric 추가
    '''

    df = pd.read_csv(csv_file)
    flow = FlowModel.objects.get(id=flow_id)

    # Column 객체를 딕셔너리로 변환 (column_name 기준으로 매핑)
    columns = {
        column.column_name: column
        for column in ConcatColumnModel.objects.filter(flow=flow)
    }

    # 데이터 저장
    for index, row in tqdm(df.iterrows(), total=len(df)):
        # column_name이 columns에 있는지 확인
        column = columns.get(row['column_name'])
        if not column:
            print(
                f"Column {row['column_name']} not found for Flow ID {flow_id}")
            continue

        # 임시 model 파일 생성
        model_path = f"./surrogate_model.pkl"
        with open(model_path, 'wb') as f:
            f.write('test'.encode())

        model_file = SimpleUploadedFile(
            name='surrogate_model.pkl', content=open(model_path, 'rb').read())

        # 시리얼라이저 생성 및 저장
        serializer = SurrogateMatricModelSerializer(data={
            'flow': flow.id,
            'column': column.id,
            'r_squared': row['r_squared'],
            'rmse': row['rmse'],
            'model': model_file
        })
        if serializer.is_valid():
            serializer.save()
        else:
            print(f"Error saving row {index}: {serializer.errors}")

    print("Surrogate Matric data inserted successfully")


def insert_surrogate_result(csv_file, flow_id):
    '''
    Surrogate Model Result 추가
    '''
    df = pd.read_csv(csv_file)
    flow = FlowModel.objects.get(id=flow_id)

    # Column 객체를 딕셔너리로 변환 (column_name 기준으로 매핑)
    columns = {
        column.column_name: column
        for column in ConcatColumnModel.objects.filter(flow=flow)
    }

    # 데이터 저장
    for index, row in tqdm(df.iterrows(), total=len(df)):
        # column_name이 columns에 있는지 확인
        column = columns.get(row['column_name'])
        if not column:
            print(
                f"Column {row['column_name']} not found for Flow ID {flow_id}")
            continue

        # 시리얼라이저 생성 및 저장
        serializer = SurrogateResultModelSerializer(data={
            'flow': flow.id,
            'column': column.id,
            'ground_truth': row['ground_truth'],
            'predicted': row['predicted'],
            'rank': row['rank']
        })
        if serializer.is_valid():
            serializer.save()
        else:
            print(f"Error saving row {index}: {serializer.errors}")

    print("Surrogate Result data inserted successfully")


def insert_feature_importance(csv_file, flow_id):
    '''
    Feature Importance 추가
    '''
    df = pd.read_csv(csv_file)
    flow = FlowModel.objects.get(id=flow_id)

    # Column 객체를 딕셔너리로 변환 (column_name 기준으로 매핑)
    columns = {
        column.column_name: column
        for column in ConcatColumnModel.objects.filter(flow=flow)
    }

    # 데이터 저장
    for index, row in tqdm(df.iterrows(), total=len(df)):
        # column_name이 columns에 있는지 확인
        column = columns.get(row['column_name'])
        if not column:
            print(
                f"Column {row['column_name']} not found for Flow ID {flow_id}")
            continue

        # 시리얼라이저 생성 및 저장
        serializer = FeatureImportanceModelSerializer(data={
            'flow': flow.id,
            'column': column.id,
            'importance': row['importance']
        })
        if serializer.is_valid():
            serializer.save()
        else:
            print(f"Error saving row {index}: {serializer.errors}")

    print("Feature Importance data inserted successfully")


def insert_search_result(csv_file, flow_id, column_name):
    '''
    Search Result 추가
    '''
    df = pd.read_csv(csv_file)
    flow = FlowModel.objects.get(id=flow_id)
    column = ConcatColumnModel.objects.get(flow=flow, column_name=column_name)

    # 데이터 저장
    # 시리얼라이저 생성 및 저장
    serializer = SearchResultModelSerializer(data={
        'flow': flow.id,
        'column': column.id,
        'ground_truth': df['ground_truth'].tolist(),
        'predicted': df['predicted'].tolist()
    })
    if serializer.is_valid():
        serializer.save()
    else:
        print(f"Error saving : {serializer.errors}")

# 함수 실행
# insert_surrogate_matric('/Users/parktaeyeong/Downloads/surrogate_matric.csv', 3)
# insert_surrogate_result('/Users/parktaeyeong/Downloads/surrogate_output.csv', 3)
# insert_feature_importance('/Users/parktaeyeong/Downloads/feature_importance.csv', 3)


for column_name in ['age', 'ash', 'cement', 'coarseagg', 'fineagg', 'slag', 'water', 'strength']:
    insert_search_result(
        f'/Users/parktaeyeong/Desktop/{column_name}.csv', 1, column_name)
