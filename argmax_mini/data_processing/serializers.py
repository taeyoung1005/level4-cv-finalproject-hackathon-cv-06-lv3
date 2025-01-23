from rest_framework import serializers
from data_processing import models


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Project
        fields = '__all__'


class CsvDataRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CsvDataRecord
        fields = '__all__'


class ColumnRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ColumnRecord
        fields = '__all__'


class HistogramRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HistogramRecord
        fields = '__all__'


class FlowSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FlowModel
        fields = '__all__'


class FlowCsvDataRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FlowCsvDataRecord
        fields = '__all__'
