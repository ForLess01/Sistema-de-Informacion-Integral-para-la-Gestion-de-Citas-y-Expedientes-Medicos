#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings')
django.setup()

from appointments.models import Specialty

def fix_specialties():
    print("=== CORRIGIENDO ESPECIALIDADES ===\n")
    
    # Especialidades esperadas
    expected_specialties = [
        "Odontología",
        "Obstetricia", 
        "Medicina General"
    ]
    
    # 1. Desactivar especialidades no deseadas
    unwanted = Specialty.objects.exclude(name__in=expected_specialties)
    if unwanted.exists():
        print("Desactivando especialidades no deseadas:")
        for specialty in unwanted:
            print(f"  - {specialty.name} (ID: {specialty.id})")
            specialty.is_active = False
            specialty.save()
        print()
    
    # 2. Crear especialidades faltantes
    print("Verificando especialidades esperadas:")
    for name in expected_specialties:
        specialty, created = Specialty.objects.get_or_create(
            name=name,
            defaults={'is_active': True}
        )
        
        if created:
            print(f"  ✓ Creada: {name}")
        else:
            if not specialty.is_active:
                specialty.is_active = True
                specialty.save()
                print(f"  ✓ Reactivada: {name}")
            else:
                print(f"  ✓ Ya existe: {name}")
    
    print("\n=== ESTADO FINAL ===")
    active_specialties = Specialty.objects.filter(is_active=True)
    print(f"Total de especialidades activas: {active_specialties.count()}")
    for specialty in active_specialties:
        print(f"  - {specialty.name}")
    
    print("\n¡Especialidades corregidas exitosamente!")

if __name__ == "__main__":
    fix_specialties()
