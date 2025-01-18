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
    - CSV 파일 업로드
    - CSV 파일 목록 조회
    - CSV 파일 삭제
    """

    def setUp(self):
        """
        테스트 환경을 설정합니다.
        업로드 URL, 조회 URL, 삭제 URL을 정의하고 테스트에 사용할 CSV 파일이 포함된 features 디렉토리 경로를 설정합니다.
        """
        self.base_url = reverse('data_processing:csvs')
        self.features_dir = os.path.join(
            os.path.dirname(__file__), './features')

        # Project와 writer 생성
        self.project = Project.objects.create(name="Test Project")
        self.writer = "test_writer"

        # 테스트 데이터 업로드
        csv_data = io.StringIO()
        df = pd.DataFrame({
            'column1': [1, 2, 3, 4, 5],
            'column2': ['A', 'B', 'A', 'B', 'C']
        })
        df.to_csv(csv_data, index=False)
        csv_data.seek(0)
        response = self.client.post(
            self.base_url,
            {
                'file': csv_data,
                'writer': self.writer,
                'project_id': self.project.id
            },
            format='multipart'
        )
        self.file_id = response.json()['file_id']

    def test_upload_all_csv_files(self):
        """
        모든 CSV 파일 업로드 테스트.
        features 디렉토리의 모든 CSV 파일을 업로드하고, 서버가 201 상태 코드를 반환하는지 확인합니다.
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
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_csv_file_list(self):
        """
        업로드된 CSV 파일 목록 조회 테스트.
        서버가 200 상태 코드를 반환하고 파일 목록을 포함하는지 검증합니다.
        """
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csv_records', response.json())
        self.assertGreaterEqual(len(response.json()['csv_records']), 1)

    def test_delete_csv_file(self):
        """
        업로드된 CSV 파일 삭제 테스트.
        서버가 204 상태 코드를 반환하고 파일이 삭제되었는지 확인합니다.
        """
        response = self.client.delete(
            f"{self.base_url}?file_id={self.file_id}")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # 파일이 삭제되었는지 확인
        with self.assertRaises(CsvDataRecord.DoesNotExist):
            CsvDataRecord.objects.get(id=self.file_id)

    def test_delete_csv_file_not_found(self):
        """
        존재하지 않는 CSV 파일 삭제 시도 테스트.
        서버가 404 상태 코드를 반환하는지 확인합니다.
        """
        response = self.client.delete(f"{self.base_url}?file_id=9999")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'File not found')
