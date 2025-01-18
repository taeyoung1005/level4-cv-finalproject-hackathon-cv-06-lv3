import json
import pandas as pd
import numpy as np
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from data_processing import models
from data_processing.serializers import ProjectSerializer


class ProjectView(APIView):
    '''
    프로젝트 생성 및 조회
    '''
    @swagger_auto_schema(
        operation_description="프로젝트 생성",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="프로젝트 이름"
                ),
                'description': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="프로젝트 설명"
                ),
            }
        ),
        responses={
            201: openapi.Response(description="Project created successfully"),
            400: openapi.Response(description="Invalid request body"),
        },
    )
    def post(self, request, *args, **kwargs):
        '''
        프로젝트 생성
        '''
        project_serializer = ProjectSerializer(data=request.data)

        if project_serializer.is_valid():
            project = project_serializer.save()
        else:
            return JsonResponse(project_serializer.errors, status=400)

        return JsonResponse(
            {'project_id': project.id},
            status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        operation_description="프로젝트 목록 조회",
        responses={
            200: openapi.Response(description="Projects retrieved successfully"),
        },
    )
    def get(self, request, *args, **kwargs):
        '''
        프로젝트 목록 조회
        '''
        projects = models.Project.objects.all()
        project_serializer = ProjectSerializer(projects, many=True)

        return JsonResponse(
            {"projects": project_serializer.data},
            status=200)

    @swagger_auto_schema(
        operation_description="프로젝트 삭제",
        manual_parameters=[
            openapi.Parameter(
                "project_id",
                openapi.IN_QUERY,
                description="ID of the project to delete",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={
            204: openapi.Response(description="Project deleted successfully"),
            400: openapi.Response(description="Invalid project ID"),
            404: openapi.Response(description="Project not found"),
        },
    )
    def delete(self, request, *args, **kwargs):
        '''
        프로젝트 삭제
        '''
        project_id = request.GET.get("project_id")

        if not project_id or not project_id.isdigit():
            return JsonResponse(
                {"error": "No project_id provided"},
                status=400)

        try:
            project = models.Project.objects.get(id=project_id)
        except models.Project.DoesNotExist:
            return JsonResponse({"error": "Project not found"}, status=404)

        project.delete()

        return JsonResponse({}, status=204)

    @swagger_auto_schema(
        operation_description="프로젝트 수정",
        manual_parameters=[
            openapi.Parameter(
                "project_id",
                openapi.IN_QUERY,
                description="ID of the project to update",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="프로젝트 이름"
                ),
                'description': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="프로젝트 설명"
                ),
            }
        ),
        responses={
            200: openapi.Response(description="Project updated successfully"),
            400: openapi.Response(description="Invalid request body"),
            404: openapi.Response(description="Project not found"),
        },
    )
    def put(self, request, *args, **kwargs):
        '''
        프로젝트 수정
        '''
        project_id = request.GET.get("project_id")

        if not project_id or not project_id.isdigit():
            return JsonResponse(
                {"error": "No project_id provided"},
                status=400)

        try:
            project = models.Project.objects.get(id=project_id)
        except models.Project.DoesNotExist:
            return JsonResponse({"error": "Project not found"}, status=404)

        project_serializer = ProjectSerializer(
            project, data=request.data, partial=True)

        if project_serializer.is_valid():
            project = project_serializer.save()
        else:
            return JsonResponse(project_serializer.errors, status=400)

        return JsonResponse(
            {'project_id': project.id},
            status=status.HTTP_200_OK)
