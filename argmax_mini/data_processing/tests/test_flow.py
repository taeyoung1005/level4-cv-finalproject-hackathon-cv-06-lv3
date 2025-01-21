import io
import os
import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import pandas as pd

from data_processing.models import CsvDataRecord, Project, FlowModel


class FlowsTest(APITestCase):
    """
    FlowModel의 테스트 클래스
    """

    def setUp(self):
        """
        테스트 환경을 설정합니다.
        ./features 폴더에서 CSV 파일을 읽어와 데이터베이스에 초기 데이터를 삽입합니다.
        """
        self.features_dir = os.path.join(
            os.path.dirname(__file__), './features')

        # 첫 번째 CSV 파일 사용
        csv_files = [f for f in os.listdir(
            self.features_dir) if f.endswith('.csv')]
        if not csv_files:
            raise FileNotFoundError(
                "No CSV files found in ./features directory.")

        self.project_record = Project.objects.create(
            name="test_project",
            description="test_description"
        )

        self.csv_records = []
        for csv in csv_files:
            file_path = os.path.join(self.features_dir, csv)
            df = pd.read_csv(file_path)

            # 데이터베이스에 삽입
            self.csv_record = CsvDataRecord.objects.create(
                project=self.project_record,
                file_name=csv,
                data=json.loads(df.to_json(orient="records")),
                writer="test_writer"
            )
            self.csv_records.append(self.csv_record)

    def test_create_flow(self):
        """
        FlowModel을 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('flow_id', response.json())

    def test_create_flow_no_project_id(self):
        """
        project_id가 없는 경우 FlowModel을 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_flow_no_flow_name(self):
        """
        flow_name이 없는 경우 FlowModel을 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_flows(self):
        """
        FlowModel을 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id
        }

        response = self.client.get(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['flows']), 0)

    def test_get_flows_invalid_project_id(self):
        """
        유효하지 않은 project_id로 FlowModel을 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': 999
        }

        response = self.client.get(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_flows_no_project_id(self):
        """
        project_id가 없는 경우 FlowModel을 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')

        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_flows_invalid_project_id_type(self):
        """
        유효하지 않은 project_id 타입으로 FlowModel을 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': 'invalid'
        }

        response = self.client.get(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_flows(self):
        """
        FlowModel을 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.delete(
            url, {'flow_id': response.json()['flow_id']}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_flows_invalid_flow_id(self):
        """
        유효하지 않은 flow_id로 FlowModel을 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.delete(url, {'flow_id': 999}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_flows_no_flow_id(self):
        """
        flow_id가 없는 경우 FlowModel을 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.delete(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_flows_invalid_flow_id_type(self):
        """
        유효하지 않은 flow_id 타입으로 FlowModel을 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.delete(
            url, {'flow_id': 'invalid'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_flow(self):
        """
        FlowModel을 업데이트하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = {
            'flow_id': response.json()['flow_id'],
            'flow_name': 'updated_flow'
        }

        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_flow_no_flow_id(self):
        """
        flow_id가 없는 경우 FlowModel을 업데이트하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = {
            'flow_name': 'updated_flow'
        }

        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_flow_no_flow_name(self):
        """
        flow_name이 없는 경우 FlowModel을 업데이트하는지 테스트합니다.
        """
        url = reverse('data_processing:flows')
        data = {
            'project_id': self.project_record.id,
            'flow_name': 'test_flow'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = {
            'flow_id': response.json()['flow_id']
        }

        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FlowCsvDataRecordTest(APITestCase):
    """
    FlowCsvDataRecord의 테스트 클래스
    """

    def setUp(self):
        """
        테스트 환경을 설정합니다.
        ./features 폴더에서 CSV 파일을 읽어와 데이터베이스에 초기 데이터를 삽입합니다.
        """
        self.features_dir = os.path.join(
            os.path.dirname(__file__), './features')

        # 첫 번째 CSV 파일 사용
        csv_files = [f for f in os.listdir(
            self.features_dir) if f.endswith('.csv')]
        if not csv_files:
            raise FileNotFoundError(
                "No CSV files found in ./features directory.")

        self.project_record = Project.objects.create(
            name="test_project",
            description="test_description"
        )

        self.csv_records = []
        for csv in csv_files:
            file_path = os.path.join(self.features_dir, csv)
            df = pd.read_csv(file_path)

            # 데이터베이스에 삽입
            self.csv_record = CsvDataRecord.objects.create(
                project=self.project_record,
                file_name=csv,
                data=json.loads(df.to_json(orient="records")),
                writer="test_writer"
            )
            self.csv_records.append(self.csv_record)

    def test_create_flow_csv_data_record(self):
        """
        FlowCsvDataRecord를 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id,
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_flow_csv_data_record_no_flow_id(self):
        """
        flow_id가 없는 경우 FlowCsvDataRecord를 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        data = {
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_flow_csv_data_record_no_csv_ids(self):
        """
        csv_ids가 없는 경우 FlowCsvDataRecord를 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_flow_csv_data_record_invalid_flow_id(self):
        """
        유효하지 않은 flow_id로 FlowCsvDataRecord를 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        data = {
            'flow_id': 999,
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_flow_csv_data_record_invalid_csv_ids(self):
        """
        유효하지 않은 csv_ids로 FlowCsvDataRecord를 생성하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id,
            'csv_ids': [999]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_flow_csv_data_record(self):
        """
        FlowCsvDataRecord를 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id,
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.get(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.json()['flow_csv_data_records']), len(self.csv_records))

    def test_get_flow_csv_data_record_no_flow_id(self):
        """
        flow_id가 없는 경우 FlowCsvDataRecord를 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_flow_csv_data_record_invalid_flow_id(self):
        """
        유효하지 않은 flow_id로 FlowCsvDataRecord를 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        data = {
            'flow_id': 999
        }

        response = self.client.get(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_flow_csv_data_record_invalid_flow_id_type(self):
        """
        유효하지 않은 flow_id 타입으로 FlowCsvDataRecord를 조회하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        data = {
            'flow_id': 'invalid'
        }

        response = self.client.get(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_flow_csv_data_record(self):
        """
        FlowCsvDataRecord를 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id,
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = {
            'flow_id': temp_flow.id,
            'csv_id': self.csv_records[0].id
        }

        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_flow_csv_data_record_no_flow_id(self):
        """
        flow_id가 없는 경우 FlowCsvDataRecord를 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        response = self.client.delete(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_flow_csv_data_record_no_csv_id(self):
        """
        csv_id가 없는 경우 FlowCsvDataRecord를 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id,
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = {
            'flow_id': temp_flow.id
        }

        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_flow_csv_data_record_invalid_flow_id(self):
        """
        유효하지 않은 flow_id로 FlowCsvDataRecord를 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        data = {
            'flow_id': 999,
            'csv_id': self.csv_records[0].id
        }

        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_flow_csv_data_record_invalid_csv_id(self):
        """
        유효하지 않은 csv_id로 FlowCsvDataRecord를 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id,
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = {
            'flow_id': temp_flow.id,
            'csv_id': 999
        }

        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_flow_csv_data_record_invalid_flow_id_type(self):
        """
        유효하지 않은 flow_id 타입으로 FlowCsvDataRecord를 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        data = {
            'flow_id': 'invalid',
            'csv_id': self.csv_records[0].id
        }

        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_flow_csv_data_record_invalid_csv_id_type(self):
        """
        유효하지 않은 csv_id 타입으로 FlowCsvDataRecord를 삭제하는지 테스트합니다.
        """
        url = reverse('data_processing:flow_csvs')

        temp_flow = FlowModel.objects.create(
            project=self.project_record,
            flow_name='test_flow'
        )

        data = {
            'flow_id': temp_flow.id,
            'csv_ids': [csv_record.id for csv_record in self.csv_records]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = {
            'flow_id': temp_flow.id,
            'csv_id': 'invalid'
        }

        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
