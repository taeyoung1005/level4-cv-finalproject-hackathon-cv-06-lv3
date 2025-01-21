import io
import os
import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import pandas as pd

from data_processing.models import CsvDataRecord, Project


class CsvDataViewTests(APITestCase):
    """
    CsvDataView 클래스의 엔드포인트를 테스트합니다.
    """

    def setUp(self):
        """
        테스트 환경 설정
        """
        self.base_url = reverse('data_processing:csvs')
        self.features_dir = os.path.join(
            os.path.dirname(__file__), './features')

        # 테스트용 프로젝트 및 작성자 생성
        self.project = Project.objects.create(name="Test Project")
        self.writer = "test_writer"

        # 테스트용 CSV 데이터 생성 및 업로드
        csv_data = io.StringIO()
        df = pd.DataFrame({
            'column1': [1, 2, 3, 4, 5],
            'column2': ['A', 'B', 'A', 'B', 'C']
        })
        df.to_csv(csv_data, index=False)
        csv_data.seek(0)  # 파일 포인터를 처음으로 이동

        response = self.client.post(
            self.base_url,
            {
                'file': csv_data,
                'writer': self.writer,
                'project_id': self.project.id
            },
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.file_id = response.json().get('file_id')  # 업로드된 파일 ID 저장

    def test_post_all_csv_files(self):
        """
        모든 CSV 파일 업로드 테스트
        """
        for file_name in os.listdir(self.features_dir):
            with open(os.path.join(self.features_dir, file_name), 'rb') as file:
                response = self.client.post(
                    self.base_url,
                    {
                        'file': file,
                        'writer': self.writer,
                        'project_id': self.project.id
                    },
                    format='multipart'
                )
                self.assertEqual(
                    response.status_code, status.HTTP_201_CREATED,
                    f"Failed to upload file {file_name}"
                )

    def test_get_csv_file_list(self):
        """
        업로드된 CSV 파일 목록 조회 테스트
        """
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 파일 목록 검증
        self.assertIn('csv_records', response.json())
        records = response.json()['csv_records']
        self.assertGreaterEqual(
            len(records), 1, "Expected at least one CSV file in the list")

    def test_delete_csv_file(self):
        """
        업로드된 CSV 파일 삭제 테스트
        """
        response = self.client.delete(self.base_url, data={'file_id': self.file_id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_csv_file_not_found(self):
        """
        존재하지 않는 CSV 파일 삭제 시도 테스트
        """
        response = self.client.delete(self.base_url, data={'file_id': 999}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # 오류 메시지 확인
        error_response = response.json()
        self.assertIn('error', error_response)
        self.assertEqual(error_response['error'], 'File not found')
