from django.contrib import admin

from data_processing.models import ConcatColumnModel, CsvModel, HistogramModel, ProjectModel, FlowModel, SearchResultModel, SurrogateMatricModel, SurrogateResultModel


class ProjectModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')


class CsvModelAdmin(admin.ModelAdmin):
    list_display = ('project', 'csv', 'writer', 'size', 'rows', 'created_at')


class FlowModelAdmin(admin.ModelAdmin):
    list_display = ('project', 'get_csv', 'concat_csv', 'flow_name')

    def get_csv(self, obj):
        return ", ".join([csv.csv.name for csv in obj.csv.all()])


admin.site.register(ProjectModel, ProjectModelAdmin)
admin.site.register(CsvModel, CsvModelAdmin)
admin.site.register(HistogramModel)
admin.site.register(ConcatColumnModel)
admin.site.register(FlowModel, FlowModelAdmin)
admin.site.register(SearchResultModel)
admin.site.register(SurrogateMatricModel)
admin.site.register(SurrogateResultModel)
