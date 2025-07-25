# Generated by Django 5.2.3 on 2025-07-09 07:56

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("appointments", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="LoginAttempt",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("email", models.EmailField(max_length=254)),
                ("ip_address", models.GenericIPAddressField()),
                ("user_agent", models.TextField()),
                ("success", models.BooleanField(default=False)),
                ("attempted_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Intento de Login",
                "verbose_name_plural": "Intentos de Login",
                "ordering": ["-attempted_at"],
            },
        ),
        migrations.CreateModel(
            name="User",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "user_id",
                    models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
                ),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                (
                    "dni",
                    models.CharField(
                        max_length=20,
                        unique=True,
                        validators=[
                            django.core.validators.RegexValidator(
                                "^[0-9]+$", "Solo se permiten números"
                            )
                        ],
                    ),
                ),
                ("birth_date", models.DateField(blank=True, null=True)),
                (
                    "gender",
                    models.CharField(
                        blank=True,
                        choices=[("M", "Masculino"), ("F", "Femenino"), ("O", "Otro")],
                        max_length=1,
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        max_length=20,
                        validators=[
                            django.core.validators.RegexValidator(
                                "^[+]?[0-9]+$", "Ingrese un número válido"
                            )
                        ],
                    ),
                ),
                (
                    "emergency_phone",
                    models.CharField(
                        blank=True,
                        max_length=20,
                        validators=[
                            django.core.validators.RegexValidator(
                                "^[+]?[0-9]+$", "Ingrese un número válido"
                            )
                        ],
                    ),
                ),
                ("address", models.TextField(blank=True)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("postal_code", models.CharField(blank=True, max_length=10)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("patient", "Paciente"),
                            ("doctor", "Doctor"),
                            ("nurse", "Enfermero/a"),
                            ("receptionist", "Recepcionista"),
                            ("admin", "Administrador"),
                            ("pharmacist", "Farmaceutico"),
                        ],
                        default="patient",
                        max_length=20,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                (
                    "date_joined",
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                ("last_login", models.DateTimeField(blank=True, null=True)),
                (
                    "profile_picture",
                    models.ImageField(
                        blank=True, null=True, upload_to="profile_pictures/%Y/%m/%d/"
                    ),
                ),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "verbose_name": "Usuario",
                "verbose_name_plural": "Usuarios",
                "ordering": ["last_name", "first_name"],
            },
        ),
        migrations.CreateModel(
            name="DoctorProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "license_number",
                    models.CharField(
                        help_text="Número de cédula profesional",
                        max_length=50,
                        unique=True,
                    ),
                ),
                (
                    "consultation_fee",
                    models.DecimalField(
                        decimal_places=2,
                        default=0,
                        help_text="Costo de consulta",
                        max_digits=10,
                    ),
                ),
                (
                    "bio",
                    models.TextField(blank=True, help_text="Biografía profesional"),
                ),
                ("years_of_experience", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "specialties",
                    models.ManyToManyField(
                        related_name="doctors", to="appointments.specialty"
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        limit_choices_to={"role": "doctor"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="doctor_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Perfil de Doctor",
                "verbose_name_plural": "Perfiles de Doctores",
            },
        ),
        migrations.CreateModel(
            name="PatientProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "blood_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("A+", "A+"),
                            ("A-", "A-"),
                            ("B+", "B+"),
                            ("B-", "B-"),
                            ("AB+", "AB+"),
                            ("AB-", "AB-"),
                            ("O+", "O+"),
                            ("O-", "O-"),
                        ],
                        max_length=3,
                    ),
                ),
                (
                    "allergies",
                    models.TextField(
                        blank=True, help_text="Lista de alergias conocidas"
                    ),
                ),
                (
                    "chronic_conditions",
                    models.TextField(blank=True, help_text="Condiciones crónicas"),
                ),
                (
                    "emergency_contact_name",
                    models.CharField(blank=True, max_length=200),
                ),
                (
                    "emergency_contact_relationship",
                    models.CharField(blank=True, max_length=50),
                ),
                ("insurance_provider", models.CharField(blank=True, max_length=100)),
                (
                    "insurance_policy_number",
                    models.CharField(blank=True, max_length=100),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        limit_choices_to={"role": "patient"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="patient_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Perfil de Paciente",
                "verbose_name_plural": "Perfiles de Pacientes",
            },
        ),
    ]
