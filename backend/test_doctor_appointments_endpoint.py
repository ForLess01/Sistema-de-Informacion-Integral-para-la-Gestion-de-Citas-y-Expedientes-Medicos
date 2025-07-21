#!/usr/bin/env python
import os
import sys
import django
import requests
from datetime import datetime, time
import json

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
from rest_framework.authtoken.models import Token

User = get_user_model()

print("=== PRUEBA DEL ENDPOINT DE CITAS DEL DOCTOR ===")

# Obtener un doctor para hacer la prueba
doctors = User.objects.filter(role='doctor')
if doctors.count() == 0:
    print("❌ No hay doctores en la base de datos")
    exit(1)

doctor = doctors.first()
print(f"🔍 Probando con: Dr. {doctor.get_full_name()} ({doctor.email})")

# Crear o obtener token para el doctor
token, created = Token.objects.get_or_create(user=doctor)
print(f"🔑 Token: {token.key}")

# Crear cliente de prueba
client = Client()

print(f"\n📡 Probando endpoints del dashboard:")

# Test 1: Estadísticas del doctor
print(f"\n1️⃣ GET /dashboard/doctor/stats/")
try:
    response = client.get('/dashboard/doctor/stats/', 
                         HTTP_AUTHORIZATION=f'Token {token.key}')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Datos: {data}")
    else:
        print(f"   ❌ Error: {response.content}")
except Exception as e:
    print(f"   ❌ Excepción: {e}")

# Test 2: Citas de hoy del doctor
print(f"\n2️⃣ GET /dashboard/doctor/appointments/")
try:
    response = client.get('/dashboard/doctor/appointments/', 
                         HTTP_AUTHORIZATION=f'Token {token.key}')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Citas encontradas: {len(data)}")
        for appointment in data:
            print(f"      - {appointment.get('time', 'N/A')} | {appointment.get('patient_name', 'N/A')} | {appointment.get('status', 'N/A')}")
    else:
        print(f"   ❌ Error: {response.content}")
except Exception as e:
    print(f"   ❌ Excepción: {e}")

# Test 3: Cola de triaje
print(f"\n3️⃣ GET /dashboard/doctor/triage-queue/")
try:
    response = client.get('/dashboard/doctor/triage-queue/', 
                         HTTP_AUTHORIZATION=f'Token {token.key}')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Pacientes en triaje: {len(data)}")
    else:
        print(f"   ❌ Error: {response.content}")
except Exception as e:
    print(f"   ❌ Excepción: {e}")

# Test 4: Pacientes esperando
print(f"\n4️⃣ GET /dashboard/doctor/waiting-patients/")
try:
    response = client.get('/dashboard/doctor/waiting-patients/', 
                         HTTP_AUTHORIZATION=f'Token {token.key}')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Pacientes esperando: {len(data)}")
    else:
        print(f"   ❌ Error: {response.content}")
except Exception as e:
    print(f"   ❌ Excepción: {e}")

print(f"\n🌐 URLs completas para pruebas manuales:")
print(f"   BASE_URL: http://localhost:8000")
print(f"   Header: Authorization: Token {token.key}")
print(f"   GET /dashboard/doctor/stats/")
print(f"   GET /dashboard/doctor/appointments/")
print(f"   GET /dashboard/doctor/triage-queue/")
print(f"   GET /dashboard/doctor/waiting-patients/")

print(f"\n💡 Para probar en el navegador o Postman:")
print(f"   URL: http://localhost:8000/dashboard/doctor/appointments/")
print(f"   Header: Authorization: Token {token.key}")
