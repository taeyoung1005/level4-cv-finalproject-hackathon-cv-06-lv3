# Generated by Django 4.2.18 on 2025-02-03 00:56

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("data_processing", "0027_remove_flowmodel_processing_csv_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="flowmodel",
            name="preprocessed_csv",
        ),
    ]
