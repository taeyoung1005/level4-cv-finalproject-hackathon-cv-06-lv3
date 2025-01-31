from django.db import models
from .column_model import ConcatColumnModel


class ControllableOptimizationModel(models.Model):
    # 최적화 목표
    OPTIMIZE_GOAL_CHOICES = [
        (1, 'Maximize'),  # 1. Maximize
        (2, 'Minimize'),  # 2. Minimize
        (3, 'Fit_to_the_range'),  # 3. Fit to the range
    ]
    column = models.OneToOneField(
        ConcatColumnModel, on_delete=models.CASCADE, related_name="controllable_optimizations")
    minimum_value = models.FloatField(blank=False, null=False, default=0)
    maximum_value = models.FloatField(blank=False, null=False, default=0)
    optimize_goal = models.IntegerField(
        choices=OPTIMIZE_GOAL_CHOICES, blank=False, null=False, default=1)

    def __str__(self):
        return self.optimization_name


class OutputOptimizationModel(models.Model):
    # 최적화 목표
    OPTIMIZE_GOAL_CHOICES = [
        (1, 'Maximize'),  # 1. Maximize
        (2, 'Minimize'),  # 2. Minimize
        (3, 'Fit_to_the_properties')  # 3. Fit to the properties
    ]
    column = models.OneToOneField(
        ConcatColumnModel, on_delete=models.CASCADE, related_name="output_optimizations")
    optimize_goal = models.IntegerField(
        choices=OPTIMIZE_GOAL_CHOICES, blank=False, null=False, default=1)
    target_value = models.FloatField(blank=False, null=False, default=0)

    def __str__(self):
        return self.optimization_name
