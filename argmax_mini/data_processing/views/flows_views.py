
from django.http import JsonResponse
from rest_framework.views import APIView

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing import models


class FlowsView(APIView):
    '''
    프로젝트의 Flow 조회, 생성, 삭제, 수정
    '''
    @swagger_auto_schema(
        operation_description="프로젝트의 Flow 조회",
        manual_parameters=[
            openapi.Parameter(
                "project_id",
                openapi.IN_QUERY,
                description="ID of the project",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            200: openapi.Response(description="Flow data retrieved successfully"),
            400: openapi.Response(description="Invalid project ID"),
            404: openapi.Response(description="Project not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        프로젝트의 Flow 조회
        '''
        project_id = str(request.GET.get("project_id"))

        if not project_id or not project_id.isdigit() or project_id == "None":
            return JsonResponse({"error": "No project_id provided"}, status=400)

        if not models.Project.objects.filter(id=project_id).exists():
            return JsonResponse({"error": "Project not found"}, status=404)

        flows = models.FlowModel.objects.filter(project_id=project_id)

        context = {
            "flows": list(flows.values())
        }

        return JsonResponse(context, status=200)

    @swagger_auto_schema(
        operation_description="프로젝트의 Flow 생성",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'project_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID of the project"),
                'flow_name': openapi.Schema(type=openapi.TYPE_STRING, description="Name of the flow"),
            }
        ),
        responses={
            201: openapi.Response(description="Flow created successfully"),
            400: openapi.Response(description="Invalid project ID or flow name"),
            404: openapi.Response(description="Project not found"),
        },
    )
    def post(self, request, *args, **kwargs):
        '''
        프로젝트의 Flow 생성
        '''
        project_id: str = str(request.data.get("project_id"))
        flow_name: str = str(request.data.get("flow_name"))

        if not project_id or not project_id.isdigit() or project_id == "None":
            return JsonResponse({"error": "No project_id provided"}, status=400)

        if not models.Project.objects.filter(id=project_id).exists():
            return JsonResponse({"error": "Project not found"}, status=404)
        if not flow_name or flow_name == "None":
            return JsonResponse({"error": "No flow_name provided"}, status=400)

        flow = models.FlowModel.objects.create(
            project_id=project_id, flow_name=flow_name)

        return JsonResponse({"flow_id": flow.id}, status=201)

    @swagger_auto_schema(
        operation_description="프로젝트의 Flow 삭제",
        manual_parameters=[
            openapi.Parameter(
                "flow_id",
                openapi.IN_QUERY,
                description="ID of the flow",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            200: openapi.Response(description="Flow deleted successfully"),
            400: openapi.Response(description="Invalid flow ID"),
            404: openapi.Response(description="Flow not found"),
        },
    )
    def delete(self, request, *args, **kwargs):
        '''
        프로젝트의 Flow 삭제
        '''
        flow_id = str(request.data.get("flow_id"))

        if not flow_id or not flow_id.isdigit():
            return JsonResponse({"error": "No flow_id provided"}, status=400)

        if not models.FlowModel.objects.filter(id=flow_id).exists():
            return JsonResponse({"error": "Flow not found"}, status=404)

        return JsonResponse({"flow_id": flow_id}, status=200)

    @swagger_auto_schema(
        operation_description="프로젝트의 Flow 수정",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'flow_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID of the flow"),
                'flow_name': openapi.Schema(type=openapi.TYPE_STRING, description="Name of the flow"),
            }
        ),
        responses={
            200: openapi.Response(description="Flow updated successfully"),
            400: openapi.Response(description="Invalid flow ID or flow name"),
        },
    )
    def put(self, request, *args, **kwargs):
        '''
        프로젝트의 Flow 수정
        '''
        flow_id: str = str(request.data.get("flow_id"))
        flow_name: str = str(request.data.get("flow_name"))

        if not flow_id or not flow_id.isdigit() or flow_id == "None":
            return JsonResponse({"error": "No flow_id provided"}, status=400)

        if not models.FlowModel.objects.filter(id=flow_id).exists():
            return JsonResponse({"error": "Flow not found"}, status=404)

        if not flow_name or flow_name == "None":
            return JsonResponse({"error": "No flow_name provided"}, status=400)

        return JsonResponse({"flow_name": flow_name}, status=200)


class FlowCsvDataRecordView(APIView):
    '''
    Flow에 속한 CSV 데이터 조회, 추가, 삭제
    '''

    @swagger_auto_schema(
        operation_description="Flow에 속한 CSV 데이터 추가",
        manual_parameters=[
            openapi.Parameter(
                "flow_id",
                openapi.IN_QUERY,
                description="ID of the flow",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
            openapi.Parameter(
                "csv_id",
                openapi.IN_QUERY,
                description="ID of the CSV file",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            201: openapi.Response(description="CSV data added successfully"),
            400: openapi.Response(description="Invalid flow ID"),
            404: openapi.Response(description="Flow not found"),
        },
    )
    def post(self, request, *args, **kwargs):
        '''
        Flow에 CSV 데이터 추가
        '''

        csv_ids: list = request.data.get("csv_ids")
        flow_id = str(request.data.get("flow_id"))

        if not flow_id or not flow_id.isdigit():
            return JsonResponse({"error": "No flow_id provided"}, status=400)

        if not models.FlowModel.objects.filter(id=flow_id).exists():
            return JsonResponse({"error": "Flow not found"}, status=404)

        if not csv_ids:
            return JsonResponse({"error": "No csv_id provided"}, status=400)

        for csv_id in csv_ids:
            if not models.CsvDataRecord.objects.filter(id=csv_id).exists():
                return JsonResponse({"error": "CSV not found"}, status=404)
            else:
                models.FlowCsvDataRecord.objects.create(
                    flow_id=flow_id, csv_id=csv_id)

        return JsonResponse({'flow_id': flow_id}, status=201)

    @swagger_auto_schema(
        operation_description="Flow에 속한 CSV 데이터 삭제",
        manual_parameters=[
            openapi.Parameter(
                "flow_id",
                openapi.IN_QUERY,
                description="ID of the flow",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
            openapi.Parameter(
                "csv_id",
                openapi.IN_QUERY,
                description="ID of the CSV file",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            200: openapi.Response(description="CSV data deleted successfully"),
            400: openapi.Response(description="Invalid flow ID or CSV ID"),
            404: openapi.Response(description="Flow or CSV not found"),
        },
    )
    def delete(self, request, *args, **kwags):
        '''
        Flow에 속한 CSV 데이터 삭제
        '''
        flow_id = str(request.data.get("flow_id"))
        csv_id = str(request.data.get("csv_id"))

        if not flow_id or not flow_id.isdigit() or flow_id == "None":
            return JsonResponse({"error": "No flow_id provided"}, status=400)

        if not models.FlowModel.objects.filter(id=flow_id).exists():
            return JsonResponse({"error": "Flow not found"}, status=404)

        if not csv_id or not csv_id.isdigit() or csv_id == "None":
            return JsonResponse({"error": "No csv_id provided"}, status=400)

        if not models.CsvDataRecord.objects.filter(id=csv_id).exists():
            return JsonResponse({"error": "CSV not found"}, status=404)

        return JsonResponse({}, status=200)

    @swagger_auto_schema(
        operation_description="Flow에 속한 CSV 데이터 조회",
        manual_parameters=[
            openapi.Parameter(
                "flow_id",
                openapi.IN_QUERY,
                description="ID of the flow",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            200: openapi.Response(description="CSV data retrieved successfully"),
            400: openapi.Response(description="Invalid flow ID"),
            404: openapi.Response(description="Flow not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        Flow에 속한 CSV 데이터 조회
        '''
        flow_id = str(request.GET.get("flow_id"))

        if not flow_id or not flow_id.isdigit() or flow_id == "None":
            return JsonResponse({"error": "No flow_id provided"}, status=400)

        if not models.FlowModel.objects.filter(id=flow_id).exists():
            return JsonResponse({"error": "Flow not found"}, status=404)

        csv_data = models.FlowCsvDataRecord.objects.filter(flow_id=flow_id)

        return JsonResponse({
            "flow_csv_data_records": list(csv_data.values())
        }, status=200)
