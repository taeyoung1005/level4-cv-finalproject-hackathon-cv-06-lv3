from django.urls import path, include

from data_processing import views

app_name = 'data_processing'

urlpatterns = [
    path('projects/', views.ProjectView.as_view(), name='projects'),
    path(
        'csvs/', views.CsvView.as_view(),
        name='csvs'),
    path('histograms/', views.HistogramView.as_view(), name='histograms'),
    path('histograms/all', views.HistogramAllView.as_view(),
         name='histograms-all'),
    path('columns/', views.ColumnView.as_view(), name='columns'),
    path('concat-columns/', views.ConcatColumnView.as_view(), name='concat-columns'),
    path('flows/', views.FlowsView.as_view(), name='flows'),
    path('flows/csv-add/', views.FlowCsvAddView.as_view(), name='flow_add_csv'),
    path('flows/concat-csv/', views.FlowConcatCsvView.as_view(),
         name='flow_concat_csv'),
    path('optimize/controllable/', views.ControllableOptimizeView.as_view(),
         name='optimize-controllable'),
    path('optimize/output/', views.OutputOptimizeView.as_view(),
         name='optimize-output'),
    path('surrogate/matric/', views.SurrogateMatricView.as_view(),
         name='surrogate-matric'),
    path('surrogate/result/', views.SurrogateResultView.as_view(),
         name='surrogate-result'),
]
