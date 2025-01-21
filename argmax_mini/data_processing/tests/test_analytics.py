import io
import os
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import pandas as pd

from data_processing.models import Project


class HistogramDataTests(APITestCase):
    """
    data_processing 앱의 히스토그램 데이터 엔드포인트를 테스트하는 클래스.
    """

    def setUp(self):
        """
        테스트 환경을 설정합니다.
        - CSV 파일 업로드를 위한 URL과 히스토그램 데이터를 가져오는 URL을 설정합니다.
        - ./features 폴더에 있는 CSV 파일들을 읽어옵니다.
        """
        self.upload_url = reverse('data_processing:csvs')
        self.histogram_url = reverse('data_processing:histograms')
        self.features_dir = os.path.join(
            os.path.dirname(__file__), './features')

        # features 폴더에서 CSV 파일 로드
        self.csv_files = [
            os.path.join(self.features_dir, f)
            for f in os.listdir(self.features_dir) if f.endswith('.csv')]

        self.project = Project.objects.create(name="Test Project")

    def test_get_histogram_success(self):
        """
        유효한 CSV 파일들을 업로드하고 히스토그램 데이터를 성공적으로 가져오는지 테스트.
        """
        for file_path in self.csv_files:
            with open(file_path, 'r') as csv_file:
                # CSV 파일 업로드
                response = self.client.post(
                    self.upload_url, {'file': csv_file, 'writer': '박태영', 'project_id': self.project.id}, format='multipart')
                self.assertEqual(
                    response.status_code,
                    status.HTTP_201_CREATED,
                    f"Failed to upload {file_path}"
                )
                file_id = response.json()['file_id']

                # 히스토그램 데이터 요청
                response = self.client.get(
                    self.histogram_url, {'file_id': file_id})
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertIn('histograms', response.json())

    def test_get_histogram_no_file_id(self):
        """
        file_id 없이 히스토그램 데이터를 요청했을 때의 동작을 테스트.
        """
        response = self.client.get(self.histogram_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()['error'], 'No file_id provided')

    def test_get_histogram_file_not_found(self):
        """
        존재하지 않는 file_id로 히스토그램 데이터를 요청했을 때의 동작을 테스트.
        """
        response = self.client.get(
            self.histogram_url, {'file_id': 'nonexistent_id'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()['error'], 'No file_id provided')
