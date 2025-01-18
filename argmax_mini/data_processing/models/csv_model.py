from django.db import models
from .project_model import Project


class CsvDataRecord(models.Model):
    project_id = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="csv_data_record")
    file_name = models.CharField(max_length=255, blank=False, null=False)
    data = models.JSONField()
    writer = models.CharField(max_length=20, blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
