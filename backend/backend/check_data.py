#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_system.settings')
django.setup()

from appointments.models import Appointment
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date

User = get_user_model()

print("=== VERIFICACIÓN DE DATOS EN LA BASE DE DATOS ===")
print(f"Total de usuarios: {User.objects.count()}")
print(f"Total de doctores: {User.objects.filter(role='doctor').count()}")
print(f"Total de pacientes: {User.objects.filter(role='patient').count()}")
print(f"Total de citas: {Appointment.objects.count()}")

today = timezone.now().date()
print(f"Fecha actual: {today}")
print(f"Citas de hoy: {Appointment.objects.filter(appointment_date=today).count()}")

# Mostrar algunas citas recientes
recent_appointments = Appointment.objects.all().order_by('-created_at')[:3]
print(f"\nÚltimas {len(recent_appointments)} citas creadas:")
for apt in recent_appointments:
    print(f"- ID: {apt.id}, Paciente: {apt.patient.get_full_name()}, Doctor: {apt.doctor.get_full_name()}, Fecha: {apt.appointment_date}")

# Verificar si hay un doctor logueado específico
doctors = User.objects.filter(role='doctor')
print(f"\nDoctores disponibles:")
for doctor in doctors[:3]:
    doctor_appointments_today = Appointment.objects.filter(
        doctor=doctor,
        appointment_date=today
    ).count()
    print(f"- Dr. {doctor.get_full_name()}: {doctor_appointments_today} citas hoy")
