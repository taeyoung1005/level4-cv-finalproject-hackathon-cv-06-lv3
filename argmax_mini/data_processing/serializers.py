from rest_framework import serializers
from .models import CsvDataRecord, HistogramRecord


class CsvDataRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CsvDataRecord
        fields = '__all__'


class HistogramRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistogramRecord
        fields = '__all__'
