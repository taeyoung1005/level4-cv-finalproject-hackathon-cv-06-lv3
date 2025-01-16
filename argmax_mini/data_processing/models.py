from django.db import models


class CsvDataRecord(models.Model):
    file_name = models.CharField(max_length=255, blank=False, null=False)
    data = models.JSONField()  # Django 기본 JSONField
    created_at = models.DateTimeField(auto_now_add=True)


class HistogramRecord(models.Model):
    COLUMN_TYPE_CHOICES = [
        ("numerical", "Numerical"),
        ("categorical", "Categorical"),
    ]

    csv_record = models.ForeignKey(
        CsvDataRecord, on_delete=models.CASCADE, related_name="histograms"
    )
    column_name = models.CharField(max_length=255, blank=False, null=False)
    counts = models.JSONField()  # Django 기본 JSONField
    bin_edges = models.JSONField()  # Django 기본 JSONField
    column_type = models.CharField(
        max_length=12,
        choices=COLUMN_TYPE_CHOICES,
        blank=False,
        null=False,
        default="numerical",
    )  # 컬럼 타입
    created_at = models.DateTimeField(auto_now_add=True)
