import io

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import pandas as pd


class CsvUploadTests(APITestCase):
    def setUp(self):
        self.upload_url = reverse('data_processing:upload-csv')

    def test_upload_csv_success(self):
        # CSV 파일 생성
        csv_data = io.StringIO()
        df = pd.DataFrame({
            'column1': [1, 2, 3, 4, 5],
            'column2': ['A', 'B', 'A', 'B', 'C']
        })
        df.to_csv(csv_data, index=False)
        csv_data.seek(0)

        # 파일 업로드
        response = self.client.post(
            self.upload_url, {'file': csv_data},
            format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('file_id', response.json())

    def test_upload_csv_no_file(self):
        # 빈 파일 없이 요청
        response = self.client.post(self.upload_url, {}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "No file provided")

    def test_upload_csv_invalid_file(self):
        invalid_file = io.StringIO("invalid data")
        response = self.client.post(
            self.upload_url, {'file': invalid_file},
            format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class HistogramDataTests(APITestCase):
    def setUp(self):
        self.upload_url = reverse('data_processing:upload-csv')
        self.histogram_url = reverse('data_processing:histogram-data')

        # CSV 파일 생성 및 업로드
        csv_data = io.StringIO()
        df = pd.DataFrame({
            'column1': [1, 2, 3, 4, 5],
            'column2': ['A', 'B', 'A', 'B', 'C']
        })
        df.to_csv(csv_data, index=False)
        csv_data.seek(0)
        response = self.client.post(
            self.upload_url, {'file': csv_data},
            format='multipart')
        self.file_id = response.json()['file_id']

    def test_get_histogram_success(self):
        response = self.client.get(
            self.histogram_url, {'file_id': self.file_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('histograms', response.json())

    def test_get_histogram_no_file_id(self):
        response = self.client.get(self.histogram_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()['error'], 'No file_id provided')

    def test_get_histogram_file_not_found(self):
        response = self.client.get(
            self.histogram_url, {'file_id': 'nonexistent_id'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()['error'], 'No file_id provided')
