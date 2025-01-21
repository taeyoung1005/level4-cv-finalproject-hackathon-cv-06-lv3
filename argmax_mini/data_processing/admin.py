from django.contrib import admin

from data_processing.models import Project, CsvDataRecord, ColumnRecord, FlowModel, FlowCsvDataRecord

admin.site.register(Project)
admin.site.register(CsvDataRecord)
admin.site.register(ColumnRecord)
admin.site.register(FlowModel)
admin.site.register(FlowCsvDataRecord)
