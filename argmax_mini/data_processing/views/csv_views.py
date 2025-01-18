import json
import pandas as pd
import numpy as np
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing import models
from data_processing.serializers import CsvDataRecordSerializer, ColumnRecordSerializer, HistogramRecordSerializer


class CsvDataView(APIView):
    '''
    CSV 파일 업로드, 조회, 수정 및 삭제 기능 제공
    '''
    parser_classes = [MultiPartParser]  # 파일 업로드를 지원하는 파서 추가

    def handle_nan_values(self, df):
        '''
        NaN 값을 처리합니다. 숫자형은 평균으로 대체하고, 범주형은 최빈값으로 대체합니다.
        '''
        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                df[column] = df[column].fillna(df[column].mean())
            else:
                df[column] = df[column].fillna(df[column].mode()[0])

    def remove_outliers(self, df):
        '''
        이상치 제거를 수행합니다. IQR 방식을 사용합니다.
        '''
        for column in df.select_dtypes(include=[np.number]).columns:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
        return df

    def save_column_and_histogram_data(self, df, csv_record):
        '''
        데이터프레임의 각 컬럼에 대한 데이터를 저장하고 히스토그램 데이터를 생성합니다.
        '''
        for column in df.columns:
            # 컬럼 데이터 저장
            column_data = {
                'csv_id': csv_record.id,
                'column_name': column,
                'is_unique': df[column].is_unique,
                'column_type': "numerical" if pd.api.types.is_numeric_dtype(df[column]) else "categorical", }

            column_record_serializer = ColumnRecordSerializer(data=column_data)

            if column_record_serializer.is_valid():
                column_record = column_record_serializer.save()
            else:
                raise ValueError("Failed to save column data")

            # 히스토그램 데이터 생성 및 저장
            if pd.api.types.is_numeric_dtype(df[column]):
                counts, bin_edges = np.histogram(df[column], bins=20)
                counts = counts.tolist()
                bin_edges = bin_edges.tolist()
            else:
                counts = df[column].value_counts().tolist()
                bin_edges = df[column].value_counts().index.tolist()

            histogram_data = {
                'column_id': column_record.id,
                'counts': counts,
                'bin_edges': bin_edges,
            }

            histogram_record_serializer = HistogramRecordSerializer(
                data=histogram_data)

            if histogram_record_serializer.is_valid():
                histogram_record_serializer.save()
            else:
                raise ValueError("Failed to save histogram data")

    @swagger_auto_schema(
        operation_description="CSV 파일 업로드",
        manual_parameters=[
            openapi.Parameter(
                name="file",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                description="CSV file to upload",
                required=True,
            ),
            openapi.Parameter(
                name="writer",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                description="파일 작성자",
                required=True,
            ),
            openapi.Parameter(
                name="project_id",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_INTEGER,
                description="프로젝트 ID",
                required=True,
            ),
        ],
        responses={
            201: openapi.Response(description="File uploaded successfully"),
            400: openapi.Response(description="Invalid or empty CSV file"),
        },
    )
    def post(self, request, *args, **kwargs):
        csv_file = request.FILES.get("file")
        writer = request.data.get("writer")
        project_id = request.data.get("project_id")

        if not csv_file or not writer or not project_id:
            return JsonResponse(
                {"error": "file, writer, and project_id are required"},
                status=400)

        try:
            df = pd.read_csv(csv_file)
        except Exception as e:
            return JsonResponse(
                {"error": f"Failed to read CSV: {str(e)} "},
                status=400)

        if df.empty:
            return JsonResponse(
                {"error": "Empty CSV file provided"},
                status=400)

        # 프로젝트 확인
        try:
            project = models.Project.objects.get(id=project_id)
        except models.Project.DoesNotExist:
            return JsonResponse({"error": "Project not found"}, status=404)

        # CSV 데이터 저장
        data_json = df.to_json(orient="records")
        csv_record_serializer = CsvDataRecordSerializer(data={
            'project_id': project.id,
            'file_name': csv_file.name,
            'data': json.loads(data_json),
            'writer': writer,
        })

        if csv_record_serializer.is_valid():
            csv_record = csv_record_serializer.save()
        else:
            return JsonResponse(csv_record_serializer.errors, status=400)

        return JsonResponse(
            {'file_id': csv_record.id},
            status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        operation_description="CSV 파일 목록 조회",
        responses={
            200: openapi.Response(description="CSV files retrieved successfully"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        CSV 파일 목록 조회
        '''

        csv_records = models.CsvDataRecord.objects.all()
        csv_record_serializer = CsvDataRecordSerializer(csv_records, many=True)

        return JsonResponse(
            {"csv_records": csv_record_serializer.data},
            status=200)

    @swagger_auto_schema(
        operation_description="CSV 파일 삭제",
        manual_parameters=[
            openapi.Parameter(
                "file_id",
                openapi.IN_QUERY,
                description="ID of the uploaded CSV file",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            204: openapi.Response(description="File deleted successfully"),
            400: openapi.Response(description="Invalid file ID"),
            404: openapi.Response(description="File not found"),
        },
    )
    def delete(self, request, *args, **kwargs):
        '''
        CSV 파일 삭제
        '''
        file_id = request.GET.get("file_id")

        if not file_id or not file_id.isdigit():
            return JsonResponse({"error": "No file_id provided"}, status=400)

        try:
            csv_record = models.CsvDataRecord.objects.get(id=file_id)
        except models.CsvDataRecord.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)

        csv_record.delete()

        return JsonResponse({}, status=204)
