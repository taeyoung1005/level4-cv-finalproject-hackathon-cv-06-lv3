from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.response import Response
from rest_framework import status

from data_processing.models import ControllableOptimizationModel, ConcatColumnModel, OutputOptimizationModel
from data_processing.serializers import ControllableOptimizationModelSerializer, OutputOptimizationModelSerializer


class ControllableOptimizeView(APIView):
    '''
    controllable variable, Output variable 최적화 목표 설정
    '''

    @swagger_auto_schema(
        operation_description="최적화 목표 설정",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'flow_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Flow ID",
                ),
                'column_name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Name of the column",
                ),
                'minimum_value': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    description="Minimum value of the optimization goal",
                ),
                'maximum_value': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    description="Maximum value of the optimization goal",
                ),
                'optimize_goal': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Optimization goal (1. No optimization, 2. Maximize, 3. Minimize, 4. Fit to the range)",
                ),
            },
        ),
        request_body_required=True,
        responses={
            201: openapi.Response(description="Optimization goal set successfully"),
            400: openapi.Response(description="Invalid or empty optimization goal"),
        },
    )
    def post(self, request, *args, **kwargs):

        flow_id = request.data.get("flow_id")
        column_name = request.data.get("column_name")
        minimum_value = request.data.get("minimum_value")
        maximum_value = request.data.get("maximum_value")
        # 1. Maximize, 2. Minimize, 3. Fit to the range
        optimize_goal = request.data.get("optimize_goal")

        if not flow_id:
            return Response({"error": "No flow_id provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not column_name:
            return Response({"error": "No column_name provided"}, status=status.HTTP_400_BAD_REQUEST)

        if minimum_value is None or maximum_value is None:
            return Response({"error": "No minimum_value or maximum_value provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not optimize_goal:
            return Response({"error": "No optimize_goal provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not ConcatColumnModel.objects.filter(flow=flow_id, column_name=column_name).exists():
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve the column; .first() will return None if not found.
        column = ConcatColumnModel.objects.filter(
            flow=flow_id, column_name=column_name).first()
        if not column:
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)

        # Instead of using update_or_create, use a try/except block to update or create manually.
        try:
            optimization = ControllableOptimizationModel.objects.get(
                column=column)
            # Update existing record.
            optimization.minimum_value = minimum_value
            optimization.maximum_value = maximum_value
            optimization.optimize_goal = optimize_goal
            optimization.save()
            created = False
        except ControllableOptimizationModel.DoesNotExist:
            # Create a new record if none exists.
            optimization = ControllableOptimizationModel.objects.create(
                column=column,
                minimum_value=minimum_value,
                maximum_value=maximum_value,
                optimize_goal=optimize_goal
            )
            created = True

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response(
            ControllableOptimizationModelSerializer(optimization).data,
            status=status_code
        )

    @swagger_auto_schema(
        operation_description="최적화 목표 조회",
        manual_parameters=[
            openapi.Parameter(
                'flow_id', openapi.IN_QUERY, type=openapi.TYPE_INTEGER,
                description="Flow ID",
            ),
            openapi.Parameter(
                'column_name', openapi.IN_QUERY, type=openapi.TYPE_STRING,
                description="Name of the column",
            ),
        ],
        responses={
            200: openapi.Response(description="Optimization goal retrieved successfully"),
            400: openapi.Response(description="Invalid flow ID or column name"),
            404: openapi.Response(description="Optimization goal not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        최적화 목표 조회
        '''
        flow_id = request.GET.get("flow_id")
        column_name = request.GET.get("column_name")

        if not flow_id:
            return Response({"error": "No flow_id provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not column_name:
            return Response({"error": "No column_name provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            column = ConcatColumnModel.objects.filter(
                flow=flow_id, column_name=column_name).first()
        except ConcatColumnModel.DoesNotExist:
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)

        optimization = ControllableOptimizationModel.objects.filter(
            column=column)

        if optimization.exists():
            return Response(
                ControllableOptimizationModelSerializer(
                    optimization.first()).data,
                status=status.HTTP_200_OK
            )

        return Response(
            {"error": "Optimization goal not found"},
            status=status.HTTP_404_NOT_FOUND
        )


class OutputOptimizeView(APIView):
    '''
    Output variable 최적화 목표 설정
    '''

    @swagger_auto_schema(
        operation_description="Output variable 최적화 목표 설정",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'flow_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Flow ID",
                ),
                'column_name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Name of the column",
                ),
                'optimize_goal': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Optimization goal (1. Maximize, 2. Minimize, 3. Fit to the range, 4. Fit to the properties)",
                ),
                'minimum_value': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    description="Minimum value of the optimization goal",
                ),
                'maximum_value': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    description="Maximum value of the optimization goal",
                ),
            },
        ),
        request_body_required=True,
        responses={
            201: openapi.Response(description="Optimization goal set successfully"),
            400: openapi.Response(description="Invalid or empty optimization goal"),
        },
    )
    def post(self, request, *args, **kwargs):

        flow_id = request.data.get("flow_id")
        column_name = request.data.get("column_name")
        optimize_goal = request.data.get("optimize_goal")
        minimum_value = request.data.get("minimum_value")
        maximum_value = request.data.get("maximum_value")

        if not flow_id:
            return Response({"error": "No flow_id provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not column_name:
            return Response({"error": "No column_name provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not optimize_goal:
            return Response({"error": "No optimize_goal provided"}, status=status.HTTP_400_BAD_REQUEST)

        if minimum_value is None or maximum_value is None:
            return Response({"error": "No minimum_value or maximum_value provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not ConcatColumnModel.objects.filter(flow=flow_id, column_name=column_name).exists():
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            column = ConcatColumnModel.objects.filter(
                flow=flow_id, column_name=column_name).first()
        except ConcatColumnModel.DoesNotExist:
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            # 이미 존재하는 경우, 객체를 가져와서 필드 업데이트 후 저장합니다.
            optimization = OutputOptimizationModel.objects.get(column=column)
            optimization.optimize_goal = optimize_goal
            optimization.minimum_value = minimum_value
            optimization.maximum_value = maximum_value
            optimization.save()
            created = False
        except OutputOptimizationModel.DoesNotExist:
            # 객체가 존재하지 않으면 새로 생성합니다.
            optimization = OutputOptimizationModel.objects.create(
                column=column,
                optimize_goal=optimize_goal,
                minimum_value=minimum_value,
                maximum_value=maximum_value
            )
            created = True

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response(
            OutputOptimizationModelSerializer(optimization).data,
            status=status_code
        )

    @swagger_auto_schema(
        operation_description="Output variable 최적화 목표 조회",
        manual_parameters=[
            openapi.Parameter(
                'flow_id', openapi.IN_QUERY, type=openapi.TYPE_INTEGER,
                description="Flow ID",
            ),
            openapi.Parameter(
                'column_name', openapi.IN_QUERY, type=openapi.TYPE_STRING,
                description="Name of the column",
            ),
        ],
        responses={
            200: openapi.Response(description="Optimization goal retrieved successfully"),
            400: openapi.Response(description="Invalid flow ID or column name"),
            404: openapi.Response(description="Optimization goal not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        Output variable 최적화 목표 조회
        '''
        flow_id = request.GET.get("flow_id")
        column_name = request.GET.get("column_name")

        if not flow_id:
            return Response({"error": "No flow_id provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not column_name:
            return Response({"error": "No column_name provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            column = ConcatColumnModel.objects.filter(
                flow=flow_id, column_name=column_name).first()
        except ConcatColumnModel.DoesNotExist:
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)

        optimization = OutputOptimizationModel.objects.filter(
            column=column)

        if optimization.exists():
            return Response(
                OutputOptimizationModelSerializer(
                    optimization.first()).data,
                status=status.HTTP_200_OK
            )

        return Response(
            {"error": "Optimization goal not found"},
            status=status.HTTP_404_NOT_FOUND
        )
