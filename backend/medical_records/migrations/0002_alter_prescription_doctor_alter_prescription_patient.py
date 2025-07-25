# Generated by Django 5.2.3 on 2025-07-13 03:43

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_records", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="prescription",
            name="doctor",
            field=models.ForeignKey(
                limit_choices_to={"role": "doctor"},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="medical_issued_prescriptions",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="prescription",
            name="patient",
            field=models.ForeignKey(
                limit_choices_to={"role": "patient"},
                on_delete=django.db.models.deletion.CASCADE,
                related_name="medical_prescriptions",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
