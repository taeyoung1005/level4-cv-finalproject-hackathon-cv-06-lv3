from django.db import models
from .column_model import ColumnRecord

class HistogramRecord(models.Model):
    column_id = models.ForeignKey(
        ColumnRecord, on_delete=models.CASCADE,
        related_name="histogram_record")
    counts = models.JSONField()
    bin_edges = models.JSONField()
