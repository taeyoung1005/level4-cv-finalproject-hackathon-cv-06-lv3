import pandas as pd
from django.core.files.base import ContentFile

from rest_framework.views import APIView
from rest_framework.response import Response

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from hackathon.src.dynamic_pipeline import preprocess_dynamic
from data_processing.models import FlowModel, ConcatColumnModel


class PreprocessingView(APIView):
    '''
    concat된 csv 파일의 전처리 수행
    '''
    @swagger_auto_schema(
        operation_description="concat된 csv 파일의 전처리 수행",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'flow_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the Concated csv file",
                ),
            },
        ),
        responses={
            200: openapi.Response(description="Preprocessing completed successfully"),
            400: openapi.Response(description="Invalid flow ID"),
            404: openapi.Response(description="File not found"),
        },
    )
    def post(self, request, *args, **kwargs):
        '''
        concat된 csv 파일의 전처리 수행
        '''
        flow_id = request.data.get("flow_id")
        if not flow_id or flow_id is None:
            return Response({"error": "No flow_id provided"}, status=400)

        try:
            flow = FlowModel.objects.get(id=flow_id)
        except FlowModel.DoesNotExist:
            return Response({"error": "File not found"}, status=404)

        concat_column = ConcatColumnModel.objects.filter(flow=flow)

        cat_cols = concat_column.filter(
            column_type='categorical').values_list('column_name', flat=True)
        num_cols = concat_column.filter(
            column_type='numerical').values_list('column_name', flat=True)
        text_cols = concat_column.filter(
            column_type='text').values_list('column_name', flat=True)

        concat_df = pd.read_csv(flow.concat_csv)

        df, dtype_info, scaler_info = preprocess_dynamic(concat_df, cat_cols, num_cols, text_cols)
        # 전처리 과정 중 결과물 더 뽑아내기

        return Response({"message": "Preprocessing completed successfully"}, status=200)
