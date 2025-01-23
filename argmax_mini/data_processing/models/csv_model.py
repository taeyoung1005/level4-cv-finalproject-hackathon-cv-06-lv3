import os

from django.conf import settings
from django.db import models
from .project_model import Project


class CsvDataRecord(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="csv_data_record")
    file = models.FileField(upload_to='csv_files/', blank=False, null=False)
    writer = models.CharField(max_length=20, blank=False, null=False)
    size = models.FloatField(blank=False, null=False, default=0)
    rows = models.IntegerField(blank=False, null=False, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name
