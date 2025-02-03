import os
import argparse

import numpy as np
import pandas as pd
from django.core.files.base import ContentFile

from rest_framework.views import APIView
from rest_framework.response import Response

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing.models import FlowModel, ConcatColumnModel

from hackathon.src.dynamic_pipeline import preprocess_dynamic
from hackathon import surrogate_model


def flow_progress(flow, progress):
    '''
    flow의 progress 업데이트
    '''
    flow.progress = progress
    flow.save()


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

        flow_progress(flow, 'Preprocessing started')

        df, df_scaled, dtype_info, scaler_info = preprocess_dynamic(
            concat_df, cat_cols, num_cols, text_cols)

        flow.preprocessed_csv.save(
            f'{flow.flow_name}_preprocessed.csv', ContentFile(df.to_csv(index=False)))

        flow_progress(flow, 'Preprocessing completed')

        output_columns = ConcatColumnModel.objects.filter(
            flow=flow, property_type='output').values_list('column_name', flat=True)

        flow_progress(flow, 'Model training started')

        args = argparse.Namespace(
            target=output_columns,
            data_path=flow.preprocessed_csv.path,
            model='tabpfn',
            flow_id=flow_id,
            seed=40
        )
        print(args)
        df_rank, df_eval, df_importance, model_path = surrogate_model.main(
            args, scaler_info)
        flow_progress(flow, 'Model training completed')

        flow.model.save(
            f"{model_path.split('/')[-1]}", ContentFile(model_path))

        os.remove(model_path)

        print(f'{df_rank=}')
        print(f'{df_eval=}')
        print(f'{df_importance=}')

        return Response({"message": "Preprocessing completed successfully"}, status=200)
