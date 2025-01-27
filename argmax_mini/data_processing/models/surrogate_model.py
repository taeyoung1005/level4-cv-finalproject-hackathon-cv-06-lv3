from django.db import models
from .flow_model import FlowModel
from .column_model import ConcatColumnModel


class SurrogateMatricModel(models.Model):
    flow = models.ForeignKey(
        FlowModel, on_delete=models.CASCADE, related_name="surrogate_matric")
    column = models.ForeignKey(
        ConcatColumnModel, on_delete=models.CASCADE, related_name="surrogate_matric")
    r_squared = models.FloatField(blank=False, null=False)
    rmse = models.FloatField(blank=False, null=False)
    model = models.FileField(
        upload_to='surrogate_model/', blank=False, null=False)

    def __str__(self):
        return self.surrogate_model_name


class SurrogateResultModel(models.Model):
    flow = models.ForeignKey(
        FlowModel, on_delete=models.CASCADE, related_name="surrogate_result")
    column = models.ForeignKey(
        ConcatColumnModel, on_delete=models.CASCADE, related_name="surrogate_result")
    ground_truth = models.JSONField(blank=False, null=False)
    predicted = models.JSONField(blank=False, null=False)
    rank = models.IntegerField(blank=False, null=False)

    def __str__(self):
        return self.surrogate_model_name
