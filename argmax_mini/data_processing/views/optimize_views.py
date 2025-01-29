from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.response import Response

from data_processing.models import OptimizationModel
from data_processing.serializers import OptimizationModelSerializer


# class OptimizationView(APIView):
#     '''
#     controllable variable, Output variable 최적화 목표 설정
#     '''

#     @swagger_auto_schema(
#         operation_description="최적화 목표 설정",
#         request_body=openapi.Schema(
#             type=openapi.TYPE_OBJECT,
#             properties={
#                 'column_id': openapi.Schema(
#                     type=openapi.TYPE_INTEGER,
#                     description="ID of the column",
#                 ),
#                 'minimum_value': openapi.Schema(
#                     type=openapi.TYPE_NUMBER,
#                     description="Minimum value of the optimization goal",
#                 ),
#                 'maximum_value': openapi.Schema(
#                     type=openapi.TYPE_NUMBER
#                     description="Maximum value of the optimization goal",
#                 ),
#                 'optimize_goal': openapi.Schema(
#                     type=openapi.
#                 ),
#             },
#             required=['controllable_variable', 'output_variable'],
#         ),
#         responses={
#             201: openapi.Response(description="Optimization goal set successfully"),
#             400: openapi.Response(description="Invalid or empty optimization goal"),
#         },
