# Generated by Django 4.2.18 on 2025-01-24 23:49

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('data_processing', '0005_flowmodel_concat_csv'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='ColumnModel',
            new_name='ConcatColumnModel',
        ),
    ]
