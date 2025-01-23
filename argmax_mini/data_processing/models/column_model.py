from django.db import models
from .csv_model import CsvDataRecord


class ColumnRecord(models.Model):
    COLUMN_TYPE_CHOICES = [
        (1, "Numerical"),
        (2, "Categorical"),
        (3, 'Unavailable')
    ]

    PROPERTYPE_TYPE_CHOICES = [
        (1, 'Environmental'),
        (2, 'Controllable'),
        (3, 'Output'),
    ]

    # 결측치 처리 방법
    MISSING_VALUE_METHOD_CHOICES = [
        (1, 'Drop'),  # 1. 삭제
        (2, 'Mean'),  # 2. 평균값으로 대체
        (3, 'Median'),  # 3. 중앙값으로 대체
        (4, 'Mode'),  # 4. 최빈값으로 대체
        (5, 'Zero')  # 5. 0으로 대체
    ]

    # 최적화 목표
    OPTIMIZE_GOAL_CHOICES = [
        (1, 'Do not optimize'),  # 1. Do not optimize
        (2, 'Maximize'),  # 2. Maximize
        (3, 'Minimize'),  # 3. Minimize
        (4, 'Fit to the range'),  # 4. Fit to the range
        (5, 'Fit to the properties')  # 5. Fit to the properties
    ]

    csv = models.ForeignKey(
        CsvDataRecord, on_delete=models.CASCADE, related_name="column_record")
    column_name = models.CharField(max_length=50, blank=False, null=False)
    column_type = models.IntegerField(
        choices=COLUMN_TYPE_CHOICES, blank=False, null=False, default=1)
    property_type = models.IntegerField(
        choices=PROPERTYPE_TYPE_CHOICES, blank=False, null=False, default=1)
    missing_values_ratio = models.FloatField(
        blank=False, null=False, default=0)
    missing_value_method = models.IntegerField(
        choices=MISSING_VALUE_METHOD_CHOICES, blank=False, null=False, default=1)
    optimize_goal = models.IntegerField(
        choices=OPTIMIZE_GOAL_CHOICES, blank=False, null=False, default=1)

    def __str__(self):
        return self.column_name
