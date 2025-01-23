import json
import pandas as pd
import numpy as np

from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser,  JSONParser, FormParser
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing import models
from data_processing.serializers import CsvDataRecordSerializer, ColumnRecordSerializer


class CsvDataView(APIView):
    '''
    CSV 파일 업로드, 조회, 수정 및 삭제 기능 제공
    '''
    parser_classes = [MultiPartParser, JSONParser, FormParser]

    @swagger_auto_schema(
        operation_description="CSV 파일 업로드",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'file': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    format='binary',  # 파일 업로드를 위한 형식
                    description="CSV file to upload",
                ),
                'writer': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Writer of the CSV file",
                ),
                'project_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the project to which the CSV file belongs",
                ),
            },
            required=['file', 'writer', 'project_id'],  # 필수 필드 정의
        ),
        responses={
            201: openapi.Response(description="File uploaded successfully"),
            400: openapi.Response(description="Invalid or empty CSV file"),
        },
        consumes=["multipart/form-data"],  # Swagger에서 form-data를 명시
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
            'project': project.id,
            'file': csv_file,
            'writer': writer,
            'size': round(csv_file.size / 1024, 2),
            'rows': len(df),
        })

        if csv_record_serializer.is_valid():
            csv_record = csv_record_serializer.save()
        else:
            return JsonResponse(csv_record_serializer.errors, status=400)

        for column_name in df.columns:
            # 컬럼 정보 저장
            column_type = "numerical" if pd.api.types.is_numeric_dtype(
                df[column_name]) else "categorical"
            column_record_serializer = ColumnRecordSerializer(data={
                'csv': csv_record.id,
                'column_name': column_name,
                'column_type': column_type,
                'property_type': 'environmental',
                'missing_values_ratio': round(df[column_name].isnull().sum() / len(df) * 100, 2),
            })

            if column_record_serializer.is_valid():
                column_record_serializer.save()
            else:
                return JsonResponse(column_record_serializer.errors, status=400)

            # 히스토그램 데이터 저장
            if column_type == "numerical":
                counts, bin_edges = np.histogram(
                    df[column_name].dropna(), bins=10)
                models.HistogramRecord.objects.create(
                    column=column_record_serializer.instance,
                    counts=json.dumps(counts.tolist()),
                    bin_edges=json.dumps(bin_edges.tolist())
                )
            elif column_type == "categorical":
                # 카테고리별 빈도 계산
                value_counts = df[column_name].dropna().value_counts()
                category_counts = value_counts.tolist()
                category_names = value_counts.index.tolist()

                # 히스토그램 데이터 저장
                models.HistogramRecord.objects.create(
                    column=column_record_serializer.instance,
                    counts=json.dumps(category_counts),  # 빈도 직렬화
                    bin_edges=json.dumps(category_names)  # 카테고리 이름 직렬화
                )

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
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'file_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the CSV file to delete"
                ),
            }
        ),
        request_body_required=True,
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
        file_id = str(request.data.get("file_id"))

        if not file_id or not file_id.isdigit() or file_id == 'None':
            return JsonResponse({"error": "No file_id provided"}, status=400)

        try:
            csv_record = models.CsvDataRecord.objects.get(id=file_id)
        except models.CsvDataRecord.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)

        csv_record.delete()

        return JsonResponse({'file_id': file_id}, status=200)
