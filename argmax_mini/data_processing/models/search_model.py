from django.db import models
from .flow_model import FlowModel
from .column_model import ConcatColumnModel


class SearchResultModel(models.Model):
    flow = models.ForeignKey(
        FlowModel, on_delete=models.CASCADE, related_name="search_result")
    column = models.ForeignKey(
        ConcatColumnModel, on_delete=models.CASCADE, related_name="search_result")
    ground_truth = models.JSONField()
    predicted = models.JSONField()
    # importance = models.FloatField(blank=False, null=False)

    def __str__(self):
        return self.search_result
