# Generated by Django 4.2.18 on 2025-01-24 20:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data_processing', '0003_alter_flowmodel_csv'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='flowmodel',
            name='csv',
        ),
        migrations.AddField(
            model_name='flowmodel',
            name='csv',
            field=models.ManyToManyField(blank=True, related_name='flow_model', to='data_processing.csvmodel'),
        ),
    ]
