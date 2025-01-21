from django.db import models
from .csv_model import CsvDataRecord


class ColumnRecord(models.Model):
    COLUMN_TYPE_CHOICES = [
        ("numerical", "Numerical"),
        ("categorical", "Categorical"),
        ('unavailable', 'Unavailable')
    ]

    PROPERTYPE_TYPE_CHOICES = [
        ('environmental', 'Environmental'),
        ('controllable', 'Controllable'),
        ('output', 'Output'),
    ]

    csv = models.ForeignKey(
        CsvDataRecord, on_delete=models.CASCADE, related_name="column_record")
    column_name = models.CharField(max_length=50, blank=False, null=False)
    column_type = models.CharField(
        max_length=13, choices=COLUMN_TYPE_CHOICES, blank=False, null=False,
        default='unavailable')
    property_type = models.CharField(
        max_length=13, choices=PROPERTYPE_TYPE_CHOICES, blank=False,
        null=False, default='environmental')
    
    def save(self, *args, **kwargs):
        # 
        super().save(*args, **kwargs)

    def __str__(self):
        return self.column_name
