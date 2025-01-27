from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing.models import ConcatColumnModel
from data_processing.serializers import HistogramModelSerializer


class HistogramDataView(APIView):
    '''
    Concat된 csv 파일의 히스토그램 데이터 조회
    '''
    @swagger_auto_schema(
        operation_description="concat된 csv의 각 컬럼별 히스토그램 데이터 조회",
        manual_parameters=[
            openapi.Parameter(
                'concated_csv_id', openapi.IN_QUERY, type=openapi.TYPE_INTEGER,
                description="ID of the Concated csv file",
            ),
            openapi.Parameter(
                'column_name', openapi.IN_QUERY, type=openapi.TYPE_STRING,
                description="Name of the column",
            ),
        ],
        request_body_required=True,
        responses={
            200: openapi.Response(description="Histogram data retrieved successfully"),
            400: openapi.Response(description="Invalid file ID"),
            404: openapi.Response(description="File not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        특정 컬럼별 히스토그램 데이터 조회
        '''

        concated_csv_id = request.data.get("concated_csv_id")
        column_name = request.data.get("column_name")

        if not concated_csv_id or not concated_csv_id.isdigit():
            return Response({"error": "No concated_csv_id provided"}, status=400)

        # 데이터베이스에서 해당 파일의 히스토그램 데이터 가져오기
        try:
            columns = ConcatColumnModel.objects.get(id=concated_csv_id)
        except ConcatColumnModel.DoesNotExist:
            return Response({"error": "File not found"}, status=404)

        histogram_serializer = HistogramModelSerializer(
            columns.histograms, many=True).filter(column_name=column_name)

        return Response(
            {"histograms": histogram_serializer.data},
            status=200
        )

    @swagger_auto_schema(
        operation_description="concat된 csv의 모든 컬럼 히스토그램 데이터 조회",
        manual_parameters=[
            openapi.Parameter(
                'concated_csv_id', openapi.IN_QUERY, type=openapi.TYPE_INTEGER,
                description="ID of the Concated csv file",
            ),
        ],
        request_body_required=True,
        responses={
            200: openapi.Response(description="Histogram data retrieved successfully"),
            400: openapi.Response(description="Invalid file ID"),
            404: openapi.Response(description="File not found"),
        },
    )
    def get_all(self, request, *args, **kwargs):
        '''
        모든 컬럼 히스토그램 데이터 조회
        '''

        concated_csv_id = request.data.get("concated_csv_id")

        if not concated_csv_id or not concated_csv_id.isdigit():
            return Response({"error": "No concated_csv_id provided"}, status=400)

        # 데이터베이스에서 해당 파일의 히스토그램 데이터 가져오기
        try:
            columns = ConcatColumnModel.objects.get(id=concated_csv_id)
        except ConcatColumnModel.DoesNotExist:
            return Response({"error": "File not found"}, status=404)

        histogram_serializer = HistogramModelSerializer(
            columns.histograms, many=True)

        return Response(
            {"histograms": histogram_serializer.data},
            status=200
        )
