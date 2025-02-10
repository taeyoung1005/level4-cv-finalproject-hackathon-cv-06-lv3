# Generated by Django 4.2.18 on 2025-01-30 14:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data_processing', '0010_optimizationmodel'),
    ]

    operations = [
        migrations.AlterField(
            model_name='optimizationmodel',
            name='optimize_goal',
            field=models.IntegerField(choices=[(1, 'Maximize'), (2, 'Minimize'), (3, 'Fit_to_the_range'), (4, 'Fit_to_the_properties')], default=1),
        ),
    ]
