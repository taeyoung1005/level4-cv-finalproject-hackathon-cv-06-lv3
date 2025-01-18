from django.urls import path, include

from data_processing import views

app_name = 'data_processing'

urlpatterns = [
    path('projects/', views.ProjectView.as_view(), name='projects'),
    path(
        'csvs/', views.CsvDataView.as_view(),
        name='csvs'),
    path(
        'histograms/', views.HistogramDataView.as_view(),
        name='histograms'),
    path('columns/', views.ColumnsView.as_view(), name='columns'),
]
