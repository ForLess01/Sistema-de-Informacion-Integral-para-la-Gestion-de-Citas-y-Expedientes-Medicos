#!/usr/bin/env python
"""
Script para corregir los archivos de pruebas del proyecto.
Corrige el uso de username en User.objects.create_user()
"""

import os
import re
import glob

def fix_create_user_calls(content):
    """
    Corrige las llamadas a User.objects.create_user() para eliminar username
    y usar email como identificador principal.
    """
    # Pattern para encontrar User.objects.create_user con username
    pattern = r'User\.objects\.create_user\(\s*username=[\'"]([^\'"]*)[\'"]\s*,\s*email=[\'"]([^\'"]*)[\'"]\s*,'
    
    # Reemplazar por email primero
    def replace_func(match):
        username_value = match.group(1)
        email_value = match.group(2)
        # Si el email está vacío o es genérico, usar username@example.com
        if not email_value or email_value == 'test@test.com':
            email_value = f"{username_value}@hospital.com"
        return f"User.objects.create_user(email='{email_value}',"
    
    content = re.sub(pattern, replace_func, content)
    
    # También corregir casos donde solo se pasa username
    pattern2 = r'User\.objects\.create_user\(\s*username=[\'"]([^\'"]*)[\'"]\s*\)'
    def replace_func2(match):
        username_value = match.group(1)
        return f"User.objects.create_user(email='{username_value}@hospital.com')"
    
    content = re.sub(pattern2, replace_func2, content)
    
    return content

def fix_profileserializer_import(content):
    """
    Corrige la importación de ProfileSerializer que no existe
    """
    content = content.replace(
        "from .serializers import UserSerializer, RegisterSerializer, ProfileSerializer",
        "from .serializers import UserSerializer, RegisterSerializer"
    )
    return content

def fix_missing_models(content):
    """
    Corrige importaciones de modelos que no existen
    """
    # Corregir importaciones en api_external
    content = content.replace(
        "from api_external.models import ExternalAPIKey, APIAccessLog, WebhookEndpoint",
        "from api_external.models import ExternalAPIClient, APIAccessLog, APIWebhook"
    )
    
    # Corregir importaciones en pharmacy
    content = content.replace(
        "from pharmacy.models import Medication, Inventory",
        "from pharmacy.models import Medication, StockMovement"
    )
    
    content = content.replace(
        "from pharmacy.models import Medication, Prescription, PrescriptionItem, Inventory",
        "from pharmacy.models import Medication, Dispensation, StockMovement"
    )
    
    # Corregir importaciones en medical_records
    content = content.replace(
        "from medical_records.models import MedicalRecord, VitalSigns, Allergy, MedicalHistory",
        "from medical_records.models import MedicalRecord, VitalSigns, Allergy"
    )
    
    return content

def process_file(filepath):
    """
    Procesa un archivo y aplica todas las correcciones
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Aplicar correcciones
        content = fix_create_user_calls(content)
        content = fix_profileserializer_import(content)
        content = fix_missing_models(content)
        
        # Solo escribir si hubo cambios
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Corregido: {filepath}")
            return True
        
        return False
    except Exception as e:
        print(f"✗ Error procesando {filepath}: {str(e)}")
        return False

def main():
    """
    Función principal
    """
    print("Iniciando corrección de archivos de pruebas...")
    
    # Buscar todos los archivos de pruebas
    test_files = []
    for pattern in ['*/tests.py', 'tests/*.py']:
        test_files.extend(glob.glob(pattern, recursive=False))
    
    if not test_files:
        print("No se encontraron archivos de pruebas")
        return
    
    fixed_count = 0
    for filepath in test_files:
        if process_file(filepath):
            fixed_count += 1
    
    print(f"\nProceso completado. Se corrigieron {fixed_count} archivos.")

if __name__ == "__main__":
    main()
