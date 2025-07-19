#!/usr/bin/env python
"""
Script para inspeccionar las especialidades en la base de datos
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings')
django.setup()

from appointments.models import Specialty

def main():
    print("=== ESPECIALIDADES EN LA BASE DE DATOS ===")
    print()
    
    specialties = Specialty.objects.all().order_by('id')
    
    if not specialties:
        print("No hay especialidades en la base de datos.")
        return
    
    print(f"Total de especialidades encontradas: {specialties.count()}")
    print()
    
    for specialty in specialties:
        status = "✓ ACTIVA" if specialty.is_active else "✗ INACTIVA"
        print(f"ID: {specialty.id:2d} | {specialty.name:20s} | {status}")
    
    print()
    print("=== ESPECIALIDADES ACTIVAS ===")
    active_specialties = Specialty.objects.filter(is_active=True)
    for specialty in active_specialties:
        print(f"- {specialty.name}")
    
    print()
    print("=== ESPECIALIDADES ESPERADAS ===")
    expected = ["Odontología", "Obstetricia", "Medicina General"]
    for exp in expected:
        exists = Specialty.objects.filter(name=exp, is_active=True).exists()
        status = "✓ EXISTE" if exists else "✗ FALTA"
        print(f"- {exp:20s} | {status}")

if __name__ == "__main__":
    main()
