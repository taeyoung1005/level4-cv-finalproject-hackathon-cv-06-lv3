import os
import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import pandas as pd

from data_processing.models import Project, CsvDataRecord, ColumnRecord


class ColumnsViewTests(APITestCase):
    def setUp(self):
        """
        테스트를 위한 데이터 초기화
        """
        self.columns_url = reverse('data_processing:columns')
        self.features_dir = os.path.join(
            os.path.dirname(__file__), './features')

        # 첫 번째 CSV 파일 선택 및 데이터베이스에 삽입
        self.csv_files = [f for f in os.listdir(
            self.features_dir) if f.endswith('.csv')]
        if not self.csv_files:
            raise FileNotFoundError(
                "No CSV files found in ./features directory.")

        file_path = os.path.join(self.features_dir, self.csv_files[0])
        df = pd.read_csv(file_path)

        # Project 생성
        self.project_record = Project.objects.create(
            name="test_project",
            description="test_description"
        )

        # 데이터베이스에 삽입
        self.csv_record = CsvDataRecord.objects.create(
            project=self.project_record,
            file_name=self.csv_files[0],
        )

        # ColumnRecord 생성
        self.columns = []
        for column in df.columns:
            column_type = "numerical" if pd.api.types.is_numeric_dtype(
                df[column]) else "categorical"
            column_record = ColumnRecord.objects.create(
                csv=self.csv_record,
                column_name=column,
                column_type=column_type,
            )
            self.columns.append(column_record)

    def test_put_property_type_success(self):
        """
        컬럼 타입을 성공적으로 업데이트하는지 테스트
        """
        # 첫 번째 컬럼 데이터를 사용
        column_name = self.columns[0].column_name  # 첫 번째 컬럼 이름
        new_property_type = "categorical"

        data = {
            "csv_id": self.csv_record.id,
            "column_name": column_name,
            "property_type": new_property_type
        }

        response = self.client.put(self.columns_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("column_name", response.json())
        self.assertIn("property_type", response.json())
        self.assertEqual(response.json()["column_name"], column_name)
        self.assertEqual(response.json()["property_type"], new_property_type)

        # DB 업데이트 확인
        column = ColumnRecord.objects.get(column_name=column_name)
        self.assertEqual(column.column_type, new_property_type)

    def test_put_property_type_invalid_request(self):
        """
        잘못된 요청 데이터로 컬럼 타입 업데이트를 테스트
        """
        data = {
            "csv_id": self.csv_record.id,
            "property_type": "numerical"  # column_name이 없음
        }

        response = self.client.put(self.columns_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())
        self.assertEqual(
            response.json()["error"],
            "Both column_name and property_type are required"
        )

    def test_put_property_type_not_found(self):
        """
        존재하지 않는 컬럼 이름으로 요청을 보내는 경우를 테스트
        """
        data = {
            "csv_id": self.csv_record.id,
            "column_name": "nonexistent_column",
            "property_type": "categorical"
        }

        response = self.client.put(self.columns_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "Column not found")

    def test_put_invalid_csv_id(self):
        """
        유효하지 않은 csv_id를 제공했을 때 적절한 에러 반환 테스트
        """
        data = {
            "csv_id": 9999,  # 존재하지 않는 ID
            "column_name": self.columns[0].column_name,
            "property_type": "numerical"
        }

        response = self.client.put(self.columns_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "File not found")

    def test_get_column_list(self):
        """
        컬럼 리스트를 성공적으로 가져오는지 테스트
        """
        # 쿼리파라미터로 csv_id를 전달
        response = self.client.get(
            self.columns_url, {"csv_id": self.csv_record.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 컬럼 타입별로 컬럼 이름 리스트 확인
        self.assertIn("numerical", response.json())
        self.assertIn("categorical", response.json())
        self.assertIn("unavailable", response.json())

    def test_get_column_list_invalid_csv_id(self):
        """
        유효하지 않은 csv_id로 요청을 보내는 경우를 테스트
        """
        response = self.client.get(self.columns_url, {"csv_id": 9999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "File not found")

    def test_get_column_list_no_csv_id(self):
        """
        csv_id를 제공하지 않은 경우를 테스트
        """
        response = self.client.get(self.columns_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "No csv_id provided")
