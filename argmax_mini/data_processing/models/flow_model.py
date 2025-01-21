from django.db import models
from .project_model import Project
from .csv_model import CsvDataRecord


class FlowModel(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="flow_model")
    flow_name = models.CharField(max_length=255, blank=False, null=False)

class FlowCsvDataRecord(models.Model):
    flow = models.ForeignKey(
        FlowModel, on_delete=models.CASCADE, related_name="flow_csv_data_record")
    csv = models.ForeignKey(
        CsvDataRecord, on_delete=models.CASCADE, related_name="flow_csv_data_record")