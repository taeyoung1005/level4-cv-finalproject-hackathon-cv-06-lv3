
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing import models


class ColumnsView(APIView):
    '''
    CSV 파일의 컬럼 속성 조회 및 수정
    '''
    parser_classes = [JSONParser]  # 파일 업로드를 지원하는 파서 추가

    @swagger_auto_schema(
        operation_description="CSV 파일의 컬럼 속성 조회",
        manual_parameters=[
            openapi.Parameter(
                "csv_id",
                openapi.IN_QUERY,
                description="ID of the uploaded CSV file",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            200: openapi.Response(description="Column columns retrieved successfully"),
            400: openapi.Response(description="Invalid file ID"),
            404: openapi.Response(description="File not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        CSV 파일의 컬럼 속성 조회
        '''
        column_type = models.ColumnRecord.COLUMN_TYPE_CHOICES
        csv_id = request.GET.get("csv_id")

        if not csv_id or not csv_id.isdigit():
            return JsonResponse({"error": "No csv_id provided"}, status=400)

        if not models.CsvDataRecord.objects.filter(id=csv_id).exists():
            return JsonResponse({"error": "File not found"}, status=404)

        context = {}

        for i in column_type:
            # QuerySet을 list로 변환
            context[i[0]] = list(models.ColumnRecord.objects.filter(
                csv=csv_id,
                column_type=i[0]).values_list('column_name', flat=True))

        return JsonResponse(context, status=200)

    @swagger_auto_schema(
        operation_description="CSV 파일의 컬럼 속성 수정",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'csv_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the uploaded CSV file",
                ),
                'column_name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="수정하려는 컬럼의 이름"
                ),
                'property_type': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=["numerical", "categorical",
                          "unavailable"],  # 선택 가능한 옵션
                    description="컬럼의 새로운 타입 (선택 가능)"
                ),
            }
        ),
        request_body_required=True,
        responses={
            200: openapi.Response(description="Column properties updated successfully"),
            400: openapi.Response(description="Invalid request body"),
            404: openapi.Response(description="Column or File not found"),
        },
    )
    def put(self, request, *args, **kwargs):
        '''
        CSV 파일의 컬럼 속성 수정
        '''
        column_name = str(request.data.get("column_name"))
        property_type = str(request.data.get("property_type"))
        csv_id = str(request.data.get("csv_id"))

        if column_name == 'None' or property_type == 'None' or csv_id == 'None':
            return JsonResponse(
                {"error": "Both column_name and property_type are required"},
                status=400)

        if not csv_id.isdigit():
            return JsonResponse({"error": "No csv_id provided"}, status=400)

        if not models.CsvDataRecord.objects.filter(id=csv_id).exists():
            return JsonResponse({"error": "File not found"}, status=404)

        column = models.ColumnRecord.objects.filter(
            column_name=column_name, csv=csv_id).first()

        if not column:
            return JsonResponse({"error": "Column not found"}, status=404)

        column.property_type = property_type
        column.save()

        return JsonResponse(
            {"column_name": column.column_name,
             "property_type": column.property_type},
            status=200)
