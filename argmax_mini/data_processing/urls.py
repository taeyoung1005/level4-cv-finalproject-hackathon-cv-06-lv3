from django.urls import path, include

from .views import UploadCsvView, HistogramDataView

app_name = 'data_processing'

urlpatterns = [
    path(
        'upload-csv/', UploadCsvView.as_view(),
        name='upload-csv'),
    path(
        'histogram-data/', HistogramDataView.as_view(),
        name='histogram-data'),]
