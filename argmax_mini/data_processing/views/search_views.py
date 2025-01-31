from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from rest_framework.response import Response

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing.models import SearchResultModel


class SearchResultView(APIView):
    '''
    Search Result 조회
    '''
    @swagger_auto_schema(
        operation_description="Search Result 조회",
        manual_parameters=[
            openapi.Parameter(
                'flow_id', openapi.IN_QUERY, type=openapi.TYPE_INTEGER,
                description="ID of the flow",
            ),
        ],
        responses={
            200: openapi.Response(description="Search Result retrieved successfully"),
            400: openapi.Response(description="Invalid flow ID"),
            404: openapi.Response(description="File not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        Search Result 조회
        '''

        flow_id = request.GET.get("flow_id")

        if not flow_id or not flow_id.isdigit():
            return Response({"error": "No flow_id provided"}, status=400)

        if not SearchResultModel.objects.filter(flow=flow_id).exists():
            return Response({"error": "File not found"}, status=404)

        search_result = SearchResultModel.objects.filter(
            flow=flow_id).values_list('search_result', flat=True)

        return Response({"search_result": list(search_result)}, status=200)


def insert_search_result(flow_id, column_id, ground_truth, predicted, importance):
    '''
    Search Result 추가
    '''

    search_result = SearchResultModel.objects.create(
        flow=flow_id,
        column=column_id,
        ground_truth=ground_truth,
        predicted=predicted,
        importance=importance
    )

    return search_result