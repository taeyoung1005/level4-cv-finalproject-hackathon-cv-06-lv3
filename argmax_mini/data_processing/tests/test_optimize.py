from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from data_processing.models import ControllableOptimizationModel, OutputOptimizationModel, ConcatColumnModel, FlowModel, ProjectModel


class ControllableOptimizeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_url = reverse('data_processing:optimize-controllable')
        # 테스트용 ConcatColumnModel 생성

        self.project = ProjectModel.objects.create(
            name="test_project",
            description="test_description"
        )

        self.flow = FlowModel.objects.create(
            project=self.project,
            flow_name="test_flow"
        )

        self.column = ConcatColumnModel.objects.create(
            flow=self.flow,
            column_name="test_column",
            column_type="numerical",
            property_type="controllable",
            missing_values_ratio=0
        )

        # 기본 최적화 목표 데이터
        self.valid_data = {
            "flow_id": self.flow.id,
            "column_name": "test_column",
            "minimum_value": 0,
            "maximum_value": 100,
            "optimize_goal": 1
        }

    # POST 메소드 테스트
    def test_post_create_optimization_success(self):
        """새 최적화 목표 생성 테스트"""
        response = self.client.post(
            self.base_url,
            self.valid_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ControllableOptimizationModel.objects.count(), 1)

    def test_post_update_optimization_success(self):
        """기존 최적화 목표 업데이트 테스트"""
        # 기존 데이터 생성
        ControllableOptimizationModel.objects.create(
            column=self.column,
            minimum_value=0,
            maximum_value=50,
            optimize_goal=2
        )

        response = self.client.post(
            self.base_url,
            self.valid_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated = ControllableOptimizationModel.objects.get(column=self.column)
        self.assertEqual(updated.optimize_goal, 1)

    def test_post_missing_required_field(self):
        """필수 필드 누락 테스트"""
        for field in ['flow_id', 'column_name', 'minimum_value', 'maximum_value', 'optimize_goal']:
            data = self.valid_data.copy()
            del data[field]
            response = self.client.post(self.base_url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_column_not_found(self):
        """존재하지 않는 컬럼 요청 테스트"""
        data = self.valid_data.copy()
        data['column_name'] = 'invalid_column'
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # GET 메소드 테스트
    def test_get_optimization_success(self):
        """최적화 목표 조회 성공 테스트"""
        ControllableOptimizationModel.objects.create(
            column=self.column,
            minimum_value=0,
            maximum_value=100,
            optimize_goal=1
        )
        response = self.client.get(self.base_url, {
                                   'flow_id': self.flow.id, 'column_name': 'test_column'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['optimize_goal'], 1)

    def test_get_optimization_not_found(self):
        """존재하지 않는 최적화 목표 조회 테스트"""
        response = self.client.get(self.base_url, {
                                   'flow_id': self.flow.id, 'column_name': 'test_column'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_missing_parameters(self):
        """필수 쿼리 파라미터 누락 테스트"""
        response = self.client.get(
            self.base_url, {'flow_id': self.flow.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.get(
            self.base_url, {'column_name': 'test_column'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OutputOptimizeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_url = reverse('data_processing:optimize-output')
        # 테스트용 ConcatColumnModel 생성

        self.project = ProjectModel.objects.create(
            name="test_project",
            description="test_description"
        )

        self.flow = FlowModel.objects.create(
            project=self.project,
            flow_name="test_flow"
        )

        self.column = ConcatColumnModel.objects.create(
            flow=self.flow,
            column_name="test_column",
            column_type="numerical",
            property_type="output",
            missing_values_ratio=0
        )

        # 기본 최적화 목표 데이터
        self.valid_data = {
            "flow_id": self.flow.id,
            "column_name": "test_column",
            "optimize_goal": 1,
            "target_value": 100
        }

    # POST 메소드 테스트
    def test_post_create_optimization_success(self):
        """새 최적화 목표 생성 테스트"""
        response = self.client.post(
            self.base_url,
            self.valid_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(OutputOptimizationModel.objects.count(), 1)

    def test_post_update_optimization_success(self):
        """기존 최적화 목표 업데이트 테스트"""
        # 기존 데이터 생성
        OutputOptimizationModel.objects.create(
            column=self.column,
            optimize_goal=2,
            target_value=50
        )

        response = self.client.post(
            self.base_url,
            self.valid_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated = OutputOptimizationModel.objects.get(column=self.column)
        self.assertEqual(updated.optimize_goal, 1)

    def test_post_missing_required_field(self):
        """필수 필드 누락 테스트"""
        for field in ['flow_id', 'column_name', 'optimize_goal', 'target_value']:
            data = self.valid_data.copy()
            del data[field]
            response = self.client.post(self.base_url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_column_not_found(self):
        """
        존재하지 않는 컬럼 요청 테스트
        """
        data = self.valid_data.copy()
        data['column_name'] = 'invalid_column'
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # GET 메소드 테스트
    def test_get_optimization_success(self):
        """최적화 목표 조회 성공 테스트"""
        OutputOptimizationModel.objects.create(
            column=self.column,
            optimize_goal=1,
            target_value=100
        )
        response = self.client.get(self.base_url, {
                                   'flow_id': self.flow.id, 'column_name': 'test_column'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['optimize_goal'], 1)

    def test_get_optimization_not_found(self):
        """존재하지 않는 최적화 목표 조회 테스트"""
        response = self.client.get(self.base_url, {
                                   'flow_id': self.flow.id, 'column_name': 'test_column'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_missing_parameters(self):
        """필수 쿼리 파라미터 누락 테스트"""
        response = self.client.get(
            self.base_url, {'flow_id': self.flow.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.get(
            self.base_url, {'column_name': 'test_column'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
