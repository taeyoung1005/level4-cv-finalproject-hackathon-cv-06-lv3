import json
import pandas as pd
import numpy as np
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import CsvDataRecord, HistogramRecord
from .serializers import CsvDataRecordSerializer, HistogramRecordSerializer


class UploadCsvView(APIView):
    parser_classes = [MultiPartParser]  # 파일 업로드를 지원하는 파서 추가

    @swagger_auto_schema(
        operation_description="CSV 파일 업로드",
        manual_parameters=[
            openapi.Parameter(
                "file",
                openapi.IN_FORM,
                description="CSV 파일을 업로드합니다.",
                type=openapi.TYPE_FILE,
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
        if not csv_file:
            return JsonResponse({"error": "No file provided"}, status=400)

        try:
            df = pd.read_csv(csv_file)
        except Exception as e:
            return JsonResponse({"error": f"Failed to read CSV: {str(e)} "},status=400)

        if df.empty:
            return JsonResponse({"error": "Empty CSV file provided"},status=400)

        # NaN 값 처리
        ## 중앙값, 최빈값 등 다른 방법도 고려 가능
        ## NaN 값을 제거하는 방법도 가능
        ## Nan 값을 예측하여 대체하는 방법도 가능
        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                # 숫자형 컬럼의 NaN 값을 평균으로 대체
                df[column].fillna(df[column].mean(), inplace=True)
            else:
                # 범주형 컬럼의 NaN 값을 unknown 으로 대체
                df[column].fillna("unknown", inplace=True)

        # 이상치 처리 (IQR 방법 사용)
        ## 다른 방법인 Z-score, DBSCAN, Isolation Forest 등도 가능
        for column in df.select_dtypes(include=[np.number]).columns:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]

        data_json = df.to_json(orient="records")
        csv_record_serializer = CsvDataRecordSerializer(data={
            'file_name': csv_file.name,
            'data': json.loads(data_json),
        })

        if csv_record_serializer.is_valid():
            csv_record = csv_record_serializer.save()
        else:
            return JsonResponse(csv_record_serializer.errors, status=400)

        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                column_type = "numerical"
                counts, bin_edges = np.histogram(df[column], bins=20)
                counts = counts.tolist()
                bin_edges = bin_edges.tolist()
            else:
                column_type = "categorical"
                counts = df[column].value_counts().tolist()
                bin_edges = df[column].value_counts().index.tolist()

            histogram_record_serializer = HistogramRecordSerializer(data={
                'csv_record': csv_record.id,
                'column_name': column,
                'counts': counts,
                'bin_edges': bin_edges,
                'column_type': column_type,
            })

            if histogram_record_serializer.is_valid():
                histogram_record_serializer.save()
            else:
                return JsonResponse(
                    histogram_record_serializer.errors, status=400)

        return JsonResponse(
            {'file_id': csv_record.id},
            status=status.HTTP_201_CREATED)


class HistogramDataView(APIView):
    @swagger_auto_schema(
        operation_description="CSV의 각 컬럼별 히스토그램 데이터 조회",
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
            200: openapi.Response(description="Histogram data retrieved successfully"),
            400: openapi.Response(description="Invalid file ID"),
            404: openapi.Response(description="File not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        file_id = request.GET.get("file_id")

        if not file_id or not file_id.isdigit():
            return JsonResponse({"error": "No file_id provided"}, status=400)

        # 데이터베이스에서 해당 파일의 히스토그램 데이터 가져오기
        try:
            csv_record = CsvDataRecord.objects.get(id=file_id)
        except CsvDataRecord.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)

        histograms = HistogramRecord.objects.filter(csv_record=csv_record)
        histogram_serializer = HistogramRecordSerializer(histograms, many=True)

        return JsonResponse(
            {"histograms": histogram_serializer.data},
            status=200)
