from django.http import JsonResponse
from rest_framework.views import APIView

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing import models
from data_processing.serializers import HistogramRecordSerializer


class HistogramDataView(APIView):
    '''
    CSV 파일의 각 컬럼별 히스토그램 데이터 조회
    '''
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
        '''
        CSV 파일의 각 컬럼별 히스토그램 데이터 조회
        '''

        file_id = request.GET.get("file_id")

        if not file_id or not file_id.isdigit():
            return JsonResponse({"error": "No file_id provided"}, status=400)

        # 데이터베이스에서 해당 파일의 히스토그램 데이터 가져오기
        try:
            csv_record = models.CsvDataRecord.objects.get(id=file_id)
        except models.CsvDataRecord.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)

        histograms = models.HistogramRecord.objects.filter(
            column_id__csv_id=csv_record)

        histogram_serializer = HistogramRecordSerializer(histograms, many=True)

        return JsonResponse(
            {"histograms": histogram_serializer.data},
            status=200)
