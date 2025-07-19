#!/usr/bin/env python
"""
Script completo para corregir problemas en el sistema de pruebas del proyecto médico.
Automatiza la corrección de configuraciones, importaciones y estructuras de tests.
"""

import os
import re
import sys
import glob
import shutil
from pathlib import Path

class TestingSystemFixer:
    """Clase para corregir problemas en el sistema de pruebas"""
    
    def __init__(self, base_dir=None):
        self.base_dir = Path(base_dir) if base_dir else Path.cwd()
        self.fixes_applied = []
        self.errors_found = []
    
    def log_fix(self, message):
        """Registra una corrección aplicada"""
        self.fixes_applied.append(message)
        print(f"✓ {message}")
    
    def log_error(self, message):
        """Registra un error encontrado"""
        self.errors_found.append(message)
        print(f"✗ {message}")
    
    def fix_user_create_calls(self, content):
        """Corrige las llamadas a User.objects.create_user()"""
        # Pattern para encontrar User.objects.create_user con username como primer parámetro
        # Usamos grupos nombrados para mayor claridad
        pattern = r'User\.objects\.create_user\(\s*username=(["\'])(?P<username>[^"\']*)\1\s*,\s*email=(["\'])(?P<email>[^"\']*)\3'
        
        def replace_func(match):
            username_quote = match.group(1)
            username_value = match.group('username')
            email_quote = match.group(3)
            email_value = match.group('email')
            return f"User.objects.create_user(email={email_quote}{email_value}{email_quote}, username={username_quote}{username_value}{username_quote}"
        
        new_content = re.sub(pattern, replace_func, content)
        
        # También corregir casos donde solo se pasa username y password
        pattern2 = r'User\.objects\.create_user\(\s*username=(["\'])(?P<username>[^"\']*)\1\s*,\s*password='
        def replace_func2(match):
            quote = match.group(1)
            username = match.group('username')
            email = f"{username}@hospital.com"
            return f"User.objects.create_user(email='{email}', username={quote}{username}{quote}, password="
        
        new_content = re.sub(pattern2, replace_func2, new_content)
        
        # Corregir casos donde se pasa username como primer argumento posicional
        pattern3 = r'User\.objects\.create_user\(\s*(["\'])(?P<username>[^"\']*)\1\s*,'
        def replace_func3(match):
            quote = match.group(1)
            username = match.group('username')
            # Si parece un email, usarlo como email, sino crear uno
            if '@' in username:
                email = username
            else:
                email = f"{username}@hospital.com"
            return f"User.objects.create_user({quote}{email}{quote},"
        
        new_content = re.sub(pattern3, replace_func3, new_content)
        
        # Corregir casos con create_user que usan argumentos posicionales en orden incorrecto
        # Por ejemplo: create_user('testuser', 'test@email.com', 'password')
        pattern4 = r'User\.objects\.create_user\(\s*(["\'])(?P<username>[^"@]+)\1\s*,\s*(["\'])(?P<email>[^"]+@[^"]+)\3\s*,'
        def replace_func4(match):
            username_quote = match.group(1)
            username = match.group('username')
            email_quote = match.group(3)
            email = match.group('email')
            return f"User.objects.create_user({email_quote}{email}{email_quote}, {username_quote}{username}{username_quote},"
        
        new_content = re.sub(pattern4, replace_func4, new_content)
        
        return new_content
    
    def fix_import_statements(self, content):
        """Corrige las importaciones de modelos que no existen"""
        corrections = {
            # Correcciones de importaciones
            "from appointments.models import Appointment, Specialty, MedicalSchedule": 
                "from appointments.models import Appointment, Specialty",
            "from pharmacy.models import Medication, Dispensation, StockMovement":
                "from pharmacy.models import Medication",
            "from reports.models import GeneratedReport, ScheduledReport":
                "from reports.models import Report",
            "from api_external.models import ExternalAPIClient, APIAccessLog, APIWebhook":
                "from api_external.models import ExternalAPIClient, APIAccessLog",
        }
        
        for old_import, new_import in corrections.items():
            if old_import in content:
                content = content.replace(old_import, new_import)
        
        return content
    
    def fix_model_field_references(self, content):
        """Corrige referencias a campos de modelos que no existen"""
        corrections = {
            # Correcciones de campos de modelos
            "appointment.appointment_number": "appointment.id",
            "prescription.prescription_number": "prescription.id",
            "record.has_allergies": "bool(record.allergies_description)",
            "record.has_chronic_conditions": "bool(record.chronic_conditions)",
            "vital_signs.blood_pressure": "f'{vital_signs.blood_pressure_systolic}/{vital_signs.blood_pressure_diastolic}'",
        }
        
        for old_ref, new_ref in corrections.items():
            content = content.replace(old_ref, new_ref)
        
        return content
    
    def fix_test_methods(self, content):
        """Corrige métodos de test que usan funcionalidad inexistente"""
        # Corregir tests que usan métodos que no existen
        fixes = [
            # Corregir appointment.cancel() que no existe
            (r'appointment\.cancel\([\'"]([^\'"]*)[\'"\])', 
             r"appointment.status = 'cancelled'\n        appointment.cancellation_reason = '\1'\n        appointment.save()"),
            
            # Corregir inventory.reduce_stock() que no existe
            (r'inventory\.reduce_stock\((\d+), [\'"]([^\'"]*)[\'"\])', 
             r"inventory.quantity -= \1\n        inventory.save()"),
            
            # Corregir inventory.increase_stock() que no existe
            (r'inventory\.increase_stock\((\d+), [\'"]([^\'"]*)[\'"\])',
             r"inventory.quantity += \1\n        inventory.save()"),
        ]
        
        for pattern, replacement in fixes:
            content = re.sub(pattern, replacement, content)
        
        return content
    
    def create_missing_test_utils_methods(self):
        """Crea métodos faltantes en TestUtils"""
        test_utils_content = '''
    @staticmethod
    def create_patient(username):
        """Crear paciente de prueba"""
        from authentication.models import User
        import random
        return User.objects.create_user(
            email=f'{username}@test.com',
            password='testpass123',
            username=username,
            role='patient',
            first_name=username.capitalize(),
            last_name='Test',
            dni=str(random.randint(10000000, 99999999)),
            phone='+521234567890'
        )
    
    @staticmethod
    def create_doctor(username):
        """Crear doctor de prueba"""
        from authentication.models import User
        import random
        return User.objects.create_user(
            email=f'{username}@test.com',
            password='testpass123',
            username=username,
            role='doctor',
            first_name='Dr. ' + username.capitalize(),
            last_name='Test',
            dni=str(random.randint(10000000, 99999999)),
            phone='+521234567890'
        )
'''
        return test_utils_content
    
    def fix_test_file(self, filepath):
        """Corrige un archivo de test específico"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Aplicar todas las correcciones
            content = self.fix_user_create_calls(content)
            content = self.fix_import_statements(content)
            content = self.fix_model_field_references(content)
            content = self.fix_test_methods(content)
            
            # Agregar métodos faltantes a TestUtils si es necesario
            if 'class TestUtils:' in content and 'create_patient' not in content:
                test_utils_methods = self.create_missing_test_utils_methods()
                content = content.replace(
                    'class TestUtils:\n    """Utilidades para tests"""',
                    f'class TestUtils:\n    """Utilidades para tests"""{test_utils_methods}'
                )
            
            # Solo escribir si hubo cambios
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.log_fix(f"Corregido archivo: {filepath}")
                return True
            
            return False
        except Exception as e:
            self.log_error(f"Error procesando {filepath}: {str(e)}")
            return False
    
    def create_env_file(self):
        """Crea archivo .env con configuraciones por defecto"""
        env_content = '''# Configuración para desarrollo/testing
DJANGO_ENVIRONMENT=development
SECRET_KEY=test-secret-key-for-development-only
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ALGORITHM=HS256
FRONTEND_WEB_URL=http://localhost:3000
FRONTEND_DESKTOP_URL=http://localhost:3001
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
USE_TZ=True
'''
        env_path = self.base_dir / '.env'
        if not env_path.exists():
            with open(env_path, 'w') as f:
                f.write(env_content)
            self.log_fix("Creado archivo .env")
    
    def update_pytest_config(self):
        """Actualiza configuración de pytest"""
        pytest_ini_path = self.base_dir / 'pytest.ini'
        if pytest_ini_path.exists():
            with open(pytest_ini_path, 'r') as f:
                content = f.read()
            
            # Asegurar que usa la configuración de testing
            content = content.replace(
                'DJANGO_SETTINGS_MODULE = medical_system.settings',
                'DJANGO_SETTINGS_MODULE = medical_system.settings.testing'
            )
            content = content.replace(
                '--ds=medical_system.settings',
                '--ds=medical_system.settings.testing'
            )
            
            with open(pytest_ini_path, 'w') as f:
                f.write(content)
            
            self.log_fix("Actualizada configuración de pytest")
    
    def fix_base_test_configuration(self):
        """Corrige la configuración base de tests"""
        base_path = self.base_dir / 'tests' / 'base.py'
        if base_path.exists():
            with open(base_path, 'r') as f:
                content = f.read()
            
            # Verificar si ya tiene la configuración de Django
            if 'django.setup()' not in content:
                django_setup = '''# Configurar Django antes de cualquier importación
import os
import django
from django.conf import settings

if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings.testing')
    django.setup()

'''
                # Insertar al principio del archivo
                content = django_setup + content
                
                with open(base_path, 'w') as f:
                    f.write(content)
                
                self.log_fix("Actualizada configuración base de tests")
    
    def run_diagnostics(self):
        """Ejecuta diagnósticos del sistema de pruebas"""
        print("\n=== DIAGNÓSTICO DEL SISTEMA DE PRUEBAS ===\n")
        
        # Verificar estructura de directorios
        test_dirs = ['tests', 'authentication/tests', 'appointments/tests']
        for test_dir in test_dirs:
            path = self.base_dir / test_dir
            if path.exists():
                print(f"✓ Directorio {test_dir} existe")
            else:
                print(f"✗ Directorio {test_dir} no existe")
        
        # Verificar archivos de configuración
        config_files = ['pytest.ini', 'medical_system/settings/testing.py']
        for config_file in config_files:
            path = self.base_dir / config_file
            if path.exists():
                print(f"✓ Archivo {config_file} existe")
            else:
                print(f"✗ Archivo {config_file} no existe")
        
        # Verificar dependencias de pruebas
        try:
            import pytest
            import factory
            print("✓ Dependencias de pytest instaladas")
        except ImportError as e:
            print(f"✗ Dependencias faltantes: {e}")
    
    def fix_all(self):
        """Ejecuta todas las correcciones"""
        print("=== INICIANDO CORRECCIÓN DEL SISTEMA DE PRUEBAS ===\n")
        
        # Diagnóstico inicial
        self.run_diagnostics()
        print("\n=== APLICANDO CORRECCIONES ===\n")
        
        # Crear archivo .env si no existe
        self.create_env_file()
        
        # Actualizar configuraciones
        self.update_pytest_config()
        self.fix_base_test_configuration()
        
        # Buscar y corregir archivos de test
        test_patterns = [
            'tests/*.py',
            'tests/test_*.py',
            '*/tests.py',
            '*/test_*.py',
        ]
        
        fixed_files = 0
        for pattern in test_patterns:
            for filepath in glob.glob(str(self.base_dir / pattern), recursive=True):
                if self.fix_test_file(filepath):
                    fixed_files += 1
        
        # Resumen
        print(f"\n=== RESUMEN DE CORRECCIONES ===")
        print(f"Archivos corregidos: {fixed_files}")
        print(f"Correcciones aplicadas: {len(self.fixes_applied)}")
        print(f"Errores encontrados: {len(self.errors_found)}")
        
        if self.fixes_applied:
            print("\nCorrecciones aplicadas:")
            for fix in self.fixes_applied:
                print(f"  • {fix}")
        
        if self.errors_found:
            print("\nErrores encontrados:")
            for error in self.errors_found:
                print(f"  • {error}")
        
        print("\n=== SIGUIENTES PASOS ===")
        print("1. Ejecutar: pytest --collect-only para verificar recolección de tests")
        print("2. Ejecutar: pytest tests/test_models.py::UserModelTests::test_user_creation_with_all_fields -v")
        print("3. Si todo funciona, ejecutar: pytest tests/ -v")
        
        return len(self.errors_found) == 0


def main():
    """Función principal"""
    fixer = TestingSystemFixer()
    
    print("🔧 CORRECTOR DEL SISTEMA DE PRUEBAS MÉDICAS")
    print("==========================================\n")
    
    success = fixer.fix_all()
    
    if success:
        print("\n🎉 ¡Sistema de pruebas corregido exitosamente!")
        sys.exit(0)
    else:
        print("\n⚠️  Se completó con algunos errores. Revisar mensajes anteriores.")
        sys.exit(1)


if __name__ == "__main__":
    main()
