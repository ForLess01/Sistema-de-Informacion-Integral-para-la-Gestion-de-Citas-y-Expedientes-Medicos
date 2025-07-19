from django.contrib.auth import get_user_model
from django.db import transaction
from appointments.models import DoctorProfile, Specialty, MedicalSchedule
from patients.models import Patient
from django.utils import timezone

User = get_user_model()

def run():
    with transaction.atomic():
        # Crear especialidades
        cardiology = Specialty.objects.create(name='Cardiology')
        dermatology = Specialty.objects.create(name='Dermatology')

        # Crear usuarios doctores
        doctor1 = User.objects.create_user(username='doc1', password='password123', first_name='John', last_name='Doe', email='john.doe@example.com')
        doctor2 = User.objects.create_user(username='doc2', password='password123', first_name='Jane', last_name='Smith', email='jane.smith@example.com')

        # Asignar especialidades a doctores
        doc_profile1 = DoctorProfile.objects.create(user=doctor1, specialty=cardiology)
        doc_profile2 = DoctorProfile.objects.create(user=doctor2, specialty=dermatology)

        # Crear horarios médicos
        today = timezone.now().date()
        MedicalSchedule.objects.create(doctor=doc_profile1, day_of_week=today.weekday(), start_time='08:00', end_time='12:00')
        MedicalSchedule.objects.create(doctor=doc_profile2, day_of_week=today.weekday(), start_time='09:00', end_time='13:00')

        # Crear paciente para pruebas
        patient = User.objects.create_user(username='patient1', password='password123', first_name='Alice', last_name='Brown', email='alice.brown@example.com')
        Patient.objects.create(user=patient, dob='1990-01-01', gender='F')

        print("Database populated with test data!")
