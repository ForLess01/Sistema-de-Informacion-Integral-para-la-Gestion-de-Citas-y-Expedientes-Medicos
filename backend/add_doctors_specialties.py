#!/usr/bin/env python3
"""
Script para agregar doctores de ejemplo para las especialidades de Odontología y Obstetricia.
Este script debe ejecutarse desde el directorio backend del proyecto Django.

Ejecutar con: python manage.py shell < add_doctors_specialties.py
o
python add_doctors_specialties.py
"""

import os
import sys
import django
from datetime import time

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from appointments.models import Specialty, MedicalSchedule

User = get_user_model()

def create_doctors_and_schedules():
    """Crear doctores de ejemplo para Odontología y Obstetricia"""
    
    with transaction.atomic():
        try:
            # Obtener las especialidades
            odontologia = Specialty.objects.get(name__icontains='odontolog')
            obstetricia = Specialty.objects.get(name__icontains='obstetricia')
            
            print(f"✅ Especialidades encontradas:")
            print(f"   - {odontologia.name}")
            print(f"   - {obstetricia.name}")
            
            # Doctores para Odontología
            odontologia_doctors = [
                {
                    'username': 'dr_odontologia_1',
                    'first_name': 'Carlos',
                    'last_name': 'Mendoza',
                    'email': 'carlos.mendoza@hospital.pe',
                    'password': 'doctor123'
                },
                {
                    'username': 'dr_odontologia_2', 
                    'first_name': 'Ana',
                    'last_name': 'Ruiz',
                    'email': 'ana.ruiz@hospital.pe',
                    'password': 'doctor123'
                },
                {
                    'username': 'dr_odontologia_3',
                    'first_name': 'Luis',
                    'last_name': 'Torres',
                    'email': 'luis.torres@hospital.pe',
                    'password': 'doctor123'
                },
                {
                    'username': 'dr_odontologia_4',
                    'first_name': 'Patricia',
                    'last_name': 'Vega',
                    'email': 'patricia.vega@hospital.pe',
                    'password': 'doctor123'
                }
            ]
            
            # Doctores para Obstetricia
            obstetricia_doctors = [
                {
                    'username': 'dr_obstetricia_1',
                    'first_name': 'María',
                    'last_name': 'Gonzalez',
                    'email': 'maria.gonzalez@hospital.pe',
                    'password': 'doctor123'
                },
                {
                    'username': 'dr_obstetricia_2',
                    'first_name': 'Roberto',
                    'last_name': 'Herrera',
                    'email': 'roberto.herrera@hospital.pe',
                    'password': 'doctor123'
                },
                {
                    'username': 'dr_obstetricia_3',
                    'first_name': 'Carmen',
                    'last_name': 'Silva',
                    'email': 'carmen.silva@hospital.pe',
                    'password': 'doctor123'
                },
                {
                    'username': 'dr_obstetricia_4',
                    'first_name': 'Eduardo',
                    'last_name': 'Ramirez',
                    'email': 'eduardo.ramirez@hospital.pe',
                    'password': 'doctor123'
                }
            ]
            
            # Horarios base (igual que medicina general)
            # Lunes a Viernes: 8:00-11:30 y 14:00-17:30
            morning_schedules = [
                {'weekday': 0, 'start_time': time(8, 0), 'end_time': time(11, 30)},   # Lunes
                {'weekday': 1, 'start_time': time(8, 0), 'end_time': time(11, 30)},   # Martes
                {'weekday': 2, 'start_time': time(8, 0), 'end_time': time(11, 30)},   # Miércoles
                {'weekday': 3, 'start_time': time(8, 0), 'end_time': time(11, 30)},   # Jueves
                {'weekday': 4, 'start_time': time(8, 0), 'end_time': time(11, 30)},   # Viernes
            ]
            
            afternoon_schedules = [
                {'weekday': 0, 'start_time': time(14, 0), 'end_time': time(17, 30)},  # Lunes
                {'weekday': 1, 'start_time': time(14, 0), 'end_time': time(17, 30)},  # Martes
                {'weekday': 2, 'start_time': time(14, 0), 'end_time': time(17, 30)},  # Miércoles
                {'weekday': 3, 'start_time': time(14, 0), 'end_time': time(17, 30)},  # Jueves
                {'weekday': 4, 'start_time': time(14, 0), 'end_time': time(17, 30)},  # Viernes
            ]
            
            # Crear doctores de Odontología
            print("\n🦷 Creando doctores de Odontología...")
            created_odontologia = 0
            for doctor_data in odontologia_doctors:
                if not User.objects.filter(username=doctor_data['username']).exists():
                    doctor = User.objects.create_user(
                        username=doctor_data['username'],
                        first_name=doctor_data['first_name'],
                        last_name=doctor_data['last_name'],
                        email=doctor_data['email'],
                        password=doctor_data['password']
                    )
                    # Marcar como staff para que aparezca en el admin
                    doctor.is_staff = True
                    doctor.save()
                    
                    # Crear horarios matutinos
                    for schedule_data in morning_schedules:
                        MedicalSchedule.objects.create(
                            doctor=doctor,
                            specialty=odontologia,
                            weekday=schedule_data['weekday'],
                            start_time=schedule_data['start_time'],
                            end_time=schedule_data['end_time'],
                            slot_duration=30,
                            is_active=True
                        )
                    
                    # Crear horarios vespertinos
                    for schedule_data in afternoon_schedules:
                        MedicalSchedule.objects.create(
                            doctor=doctor,
                            specialty=odontologia,
                            weekday=schedule_data['weekday'],
                            start_time=schedule_data['start_time'],
                            end_time=schedule_data['end_time'],
                            slot_duration=30,
                            is_active=True
                        )
                    
                    created_odontologia += 1
                    print(f"   ✅ Dr(a). {doctor.get_full_name()} creado(a) con horarios completos")
                else:
                    print(f"   ⚠️  Dr(a). {doctor_data['first_name']} {doctor_data['last_name']} ya existe")
            
            # Crear doctores de Obstetricia
            print("\n🤱 Creando doctores de Obstetricia...")
            created_obstetricia = 0
            for doctor_data in obstetricia_doctors:
                if not User.objects.filter(username=doctor_data['username']).exists():
                    doctor = User.objects.create_user(
                        username=doctor_data['username'],
                        first_name=doctor_data['first_name'],
                        last_name=doctor_data['last_name'],
                        email=doctor_data['email'],
                        password=doctor_data['password']
                    )
                    # Marcar como staff para que aparezca en el admin
                    doctor.is_staff = True
                    doctor.save()
                    
                    # Crear horarios matutinos
                    for schedule_data in morning_schedules:
                        MedicalSchedule.objects.create(
                            doctor=doctor,
                            specialty=obstetricia,
                            weekday=schedule_data['weekday'],
                            start_time=schedule_data['start_time'],
                            end_time=schedule_data['end_time'],
                            slot_duration=30,
                            is_active=True
                        )
                    
                    # Crear horarios vespertinos
                    for schedule_data in afternoon_schedules:
                        MedicalSchedule.objects.create(
                            doctor=doctor,
                            specialty=obstetricia,
                            weekday=schedule_data['weekday'],
                            start_time=schedule_data['start_time'],
                            end_time=schedule_data['end_time'],
                            slot_duration=30,
                            is_active=True
                        )
                    
                    created_obstetricia += 1
                    print(f"   ✅ Dr(a). {doctor.get_full_name()} creado(a) con horarios completos")
                else:
                    print(f"   ⚠️  Dr(a). {doctor_data['first_name']} {doctor_data['last_name']} ya existe")
            
            print(f"\n🎉 ¡Proceso completado exitosamente!")
            print(f"   📊 Doctores de Odontología creados: {created_odontologia}/4")
            print(f"   📊 Doctores de Obstetricia creados: {created_obstetricia}/4")
            print(f"   📅 Horarios: Lunes a Viernes, 8:00-11:30 y 14:00-17:30")
            print(f"   ⏰ Duración de cita: 30 minutos")
            
            print(f"\n🔧 Acceso al admin Django:")
            print(f"   URL: http://127.0.0.1:8000/admin/")
            print(f"   Usuario: admin (o tu usuario admin)")
            print(f"   Los doctores creados aparecerán en:")
            print(f"   - Authentication and Authorization > Users")
            print(f"   - Appointments > Medical schedules")
            
        except Specialty.DoesNotExist as e:
            print(f"❌ Error: No se encontraron las especialidades necesarias.")
            print(f"   Asegúrate de que existan especialidades con nombres que contengan:")
            print(f"   - 'odontolog' (para Odontología)")
            print(f"   - 'obstetricia' (para Obstetricia)")
            print(f"   Detalle del error: {e}")
            
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            return False
    
    return True

if __name__ == "__main__":
    print("🏥 SISTEMA DE INFORMACIÓN INTEGRAL - AGREGAR DOCTORES")
    print("=" * 60)
    create_doctors_and_schedules()
