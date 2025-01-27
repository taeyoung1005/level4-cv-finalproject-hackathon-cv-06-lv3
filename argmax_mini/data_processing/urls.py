from django.urls import path, include

from data_processing import views

app_name = 'data_processing'

urlpatterns = [
    path('projects/', views.ProjectView.as_view(), name='projects'),
    path(
        'csvs/', views.CsvModelDataView.as_view(),
        name='csvs'),
    path(
        'histograms/', views.HistogramDataView.as_view(),
        name='histograms'),
    path('columns/', views.ColumnView.as_view(), name='columns'),
    path('concat-columns/', views.ConcatColumnView.as_view(), name='concat-columns'),
    path('flows/', views.FlowsView.as_view(), name='flows'),
    path('flows/csv-add/', views.FlowCsvAddView.as_view(), name='flow_add_csv'),
]
