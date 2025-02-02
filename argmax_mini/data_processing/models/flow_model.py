from django.db import models
from .project_model import ProjectModel
from .csv_model import CsvModel


class FlowModel(models.Model):
    project = models.ForeignKey(
        ProjectModel, on_delete=models.CASCADE, related_name="flow_model")
    csv = models.ManyToManyField(  # Many-to-Many 관계로 변경
        CsvModel, related_name="flow_model", blank=True)
    concat_csv = models.FileField(
        upload_to='flows/concat_csv/', blank=True, null=True)
    # preprocessed_csv = models.FileField(
    #     upload_to='flows/preprocessed_csv', blank=True, null=True)
    flow_name = models.CharField(max_length=255, blank=False, null=False)
    model = models.FileField(upload_to='surrogate_model/',
                             default=None, blank=True, null=True)

    def __str__(self):
        return self.flow_name
