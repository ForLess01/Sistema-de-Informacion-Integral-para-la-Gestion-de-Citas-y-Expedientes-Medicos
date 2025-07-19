# Configurar Django antes de cualquier importación
import os
import django
from django.conf import settings

if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings.testing')
    django.setup()

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
from django.core.cache import cache
from datetime import datetime, date, time, timedelta
from django.utils import timezone
import factory
import json

User = get_user_model()


class BaseTestCase(TestCase):
    """Base test case con utilidades comunes"""
    
    def setUp(self):
        """Configuración común para todos los tests"""
        # Limpiar caché antes de cada test
        cache.clear()
        
        # Crear usuarios de diferentes roles
        self.admin_user = self.create_user(
            username='admin',
            email='admin@test.com',
            role='admin'
        )
        
        self.doctor = self.create_user(
            username='doctor',
            email='doctor@test.com',
            role='doctor',
            first_name='Dr. John',
            last_name='Smith'
        )
        
        self.nurse = self.create_user(
            username='nurse',
            email='nurse@test.com',
            role='nurse'
        )
        
        self.patient = self.create_user(
            username='patient',
            email='patient@test.com',
            role='patient',
            first_name='Jane',
            last_name='Doe'
        )
        
        self.receptionist = self.create_user(
            username='receptionist',
            email='receptionist@test.com',
            role='receptionist'
        )
        
        self.pharmacist = self.create_user(
            username='pharmacist',
            email='pharmacist@test.com',
            role='pharmacist'
        )
    
    def create_user(self, username, email, role, **kwargs):
        """Crear usuario con datos por defecto"""
        import random
        defaults = {
            'first_name': username.capitalize(),
            'last_name': 'Test',
            'dni': kwargs.get('dni', str(random.randint(10000000, 99999999))),
            'phone': kwargs.get('phone', '+521234567890'),
            'is_active': True,
            'username': username  # Agregar username a los defaults
        }
        defaults.update(kwargs)
        
        return User.objects.create_user(
            email=email,  # email debe ser el primer parámetro
            password='testpass123',
            role=role,
            **defaults
        )
    
    def assertFieldError(self, form, field, error_code):
        """Verificar que un campo tiene un error específico"""
        self.assertIn(field, form.errors)
        error_found = any(
            error.code == error_code 
            for error in form.errors[field]
        )
        self.assertTrue(error_found, f"Error code '{error_code}' not found in field '{field}'")
    
    def assertValidationError(self, form_or_serializer, field, message_contains=None):
        """Verificar errores de validación"""
        self.assertFalse(form_or_serializer.is_valid())
        if field:
            self.assertIn(field, form_or_serializer.errors)
        if message_contains:
            error_messages = str(form_or_serializer.errors)
            self.assertIn(message_contains, error_messages)


class BaseAPITestCase(APITestCase):
    """Base test case para tests de API"""
    
    def setUp(self):
        """Configuración para tests de API"""
        super().setUp()
        
        # Limpiar caché
        cache.clear()
        
        # Crear usuarios de prueba
        self.admin_user = self.create_user('admin', 'admin@test.com', 'admin')
        self.doctor = self.create_user('doctor', 'doctor@test.com', 'doctor')
        self.patient = self.create_user('patient', 'patient@test.com', 'patient')
        self.nurse = self.create_user('nurse', 'nurse@test.com', 'nurse')
        
        # Cliente de API
        self.client = APIClient()
    
    def create_user(self, username, email, role, **kwargs):
        """Crear usuario para tests de API"""
        import random
        defaults = {
            'first_name': username.capitalize(),
            'last_name': 'Test',
            'dni': kwargs.get('dni', str(random.randint(10000000, 99999999))),
            'phone': kwargs.get('phone', '+521234567890'),
            'is_active': True,
            'username': username  # Agregar username a los defaults
        }
        defaults.update(kwargs)
        
        return User.objects.create_user(
            email=email,  # email debe ser el primer parámetro
            password='testpass123',
            role=role,
            **defaults
        )
    
    def authenticate(self, user):
        """Autenticar usuario para requests de API"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return refresh.access_token
    
    def logout(self):
        """Cerrar sesión"""
        self.client.credentials()
    
    def assertUnauthorized(self, response):
        """Verificar respuesta 401"""
        self.assertEqual(response.status_code, 401)
    
    def assertForbidden(self, response):
        """Verificar respuesta 403"""
        self.assertEqual(response.status_code, 403)
    
    def assertNotFound(self, response):
        """Verificar respuesta 404"""
        self.assertEqual(response.status_code, 404)
    
    def assertBadRequest(self, response):
        """Verificar respuesta 400"""
        self.assertEqual(response.status_code, 400)
    
    def assertSuccess(self, response):
        """Verificar respuesta exitosa (200-299)"""
        self.assertIn(response.status_code, range(200, 300))
    
    def assertCreated(self, response):
        """Verificar respuesta 201"""
        self.assertEqual(response.status_code, 201)
    
    def get_json_response(self, response):
        """Obtener respuesta JSON"""
        return json.loads(response.content.decode('utf-8'))


class IntegrationTestCase(TransactionTestCase):
    """Base para tests de integración que requieren transacciones"""
    
    def setUp(self):
        """Configuración para tests de integración"""
        super().setUp()
        cache.clear()
        
        # Crear datos de prueba
        self.setup_test_data()
    
    def setup_test_data(self):
        """Configurar datos de prueba para integración"""
        import random
        # Crear usuarios básicos
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='admin',
            username='admin',
            first_name='Admin',
            last_name='Test',
            dni=str(random.randint(10000000, 99999999)),
            phone='+521234567890'
        )
        
        self.doctor = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            role='doctor',
            username='doctor',
            first_name='Doctor',
            last_name='Test',
            dni=str(random.randint(10000000, 99999999)),
            phone='+521234567891'
        )
        
        self.patient = User.objects.create_user(
            email='patient@test.com',
            password='testpass123',
            role='patient',
            username='patient',
            first_name='Patient',
            last_name='Test',
            dni=str(random.randint(10000000, 99999999)),
            phone='+521234567892'
        )


# Factories para crear datos de prueba
class UserFactory(factory.django.DjangoModelFactory):
    """Factory para crear usuarios de prueba"""
    
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@test.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    role = 'patient'
    is_active = True
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        """Establecer password después de crear el usuario"""
        if not create:
            return
        
        password = extracted or 'testpass123'
        self.set_password(password)
        self.save()


class DoctorFactory(UserFactory):
    """Factory para doctores"""
    role = 'doctor'


class PatientFactory(UserFactory):
    """Factory para pacientes"""
    role = 'patient'


class NurseFactory(UserFactory):
    """Factory para enfermeros"""
    role = 'nurse'


# Utilidades de testing
class TestUtils:
    """Utilidades para tests"""
    
    @staticmethod
    def create_test_appointment(patient, doctor, date_offset=1):
        """Crear cita de prueba"""
        from appointments.models import Appointment, Specialty
        
        specialty = Specialty.objects.create(name='Cardiología')
        
        appointment_date = timezone.now().date() + timedelta(days=date_offset)
        appointment_time = time(10, 0)
        
        return Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            specialty=specialty,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            duration=30,
            reason='Consulta de rutina',
            status='scheduled'
        )
    
    @staticmethod
    def create_test_medical_record(patient, doctor):
        """Crear expediente médico de prueba"""
        from medical_records.models import MedicalRecord
        
        return MedicalRecord.objects.create(
            patient=patient,
            doctor=doctor,
            diagnosis='Diagnosis de prueba',
            treatment='Tratamiento de prueba',
            notes='Notas de prueba'
        )
    
    @staticmethod
    def create_test_emergency_case(patient):
        """Crear caso de emergencia de prueba"""
        from emergency.models import EmergencyCase
        
        return EmergencyCase.objects.create(
            patient=patient,
            symptoms='Síntomas de prueba',
            triage_level='yellow',
            priority='medium',
            arrival_time=timezone.now()
        )
    
    @staticmethod
    def create_test_medication():
        """Crear medicamento de prueba"""
        from pharmacy.models import Medication
        
        return Medication.objects.create(
            name='Paracetamol',
            description='Analgésico y antipirético',
            dosage='500mg',
            stock=100,
            price=10.50,
            requires_prescription=False
        )
    
    @staticmethod
    def create_patient(email='patient_test@example.com', **kwargs):
        """Crear paciente de prueba"""
        from django.contrib.auth import get_user_model
        import random
        
        User = get_user_model()
        
        defaults = {
            'username': email.split('@')[0],
            'first_name': 'Test',
            'last_name': 'Patient',
            'dni': str(random.randint(10000000, 99999999)),
            'phone': '+521234567890',
            'is_active': True,
            'role': 'patient'
        }
        defaults.update(kwargs)
        
        return User.objects.create_user(
            email=email,
            password='testpass123',
            **defaults
        )


# Mixins para funcionalidades comunes
class TimestampTestMixin:
    """Mixin para tests de campos timestamp"""
    
    def assertTimestampsSet(self, obj):
        """Verificar que los timestamps estén configurados"""
        self.assertIsNotNone(obj.created_at)
        if hasattr(obj, 'updated_at'):
            self.assertIsNotNone(obj.updated_at)
    
    def assertTimestampUpdated(self, obj, old_timestamp):
        """Verificar que el timestamp se actualizó"""
        if hasattr(obj, 'updated_at'):
            self.assertGreater(obj.updated_at, old_timestamp)


class PermissionTestMixin:
    """Mixin para tests de permisos"""
    
    def assertRequiresAuth(self, url, method='GET'):
        """Verificar que la URL requiere autenticación"""
        if hasattr(self, 'client'):  # Para APITestCase
            response = getattr(self.client, method.lower())(url)
            self.assertUnauthorized(response)
        else:
            # Para TestCase normal
            response = self.client.get(url) if method == 'GET' else getattr(self.client, method.lower())(url)
            self.assertRedirects(response, f'/login/?next={url}', fetch_redirect_response=False)
    
    def assertRequiresRole(self, url, required_role, method='GET'):
        """Verificar que la URL requiere un rol específico"""
        # Test con usuario sin el rol requerido
        wrong_role = 'patient' if required_role != 'patient' else 'doctor'
        user = self.create_user(f'test_{wrong_role}', f'{wrong_role}@test.com', wrong_role)
        
        if hasattr(self, 'authenticate'):  # Para APITestCase
            self.authenticate(user)
            response = getattr(self.client, method.lower())(url)
            self.assertForbidden(response)
        else:
            # Para TestCase normal
            self.client.force_login(user)
            response = getattr(self.client, method.lower())(url)
            self.assertEqual(response.status_code, 403)


class DatabaseTestMixin:
    """Mixin para tests de base de datos"""
    
    def assertDatabaseCount(self, model, expected_count):
        """Verificar conteo en base de datos"""
        actual_count = model.objects.count()
        self.assertEqual(actual_count, expected_count)
    
    def assertDatabaseHas(self, model, **filters):
        """Verificar que existe un registro en la base de datos"""
        exists = model.objects.filter(**filters).exists()
        self.assertTrue(exists, f"No se encontró {model.__name__} con filtros {filters}")
    
    def assertDatabaseMissing(self, model, **filters):
        """Verificar que NO existe un registro en la base de datos"""
        exists = model.objects.filter(**filters).exists()
        self.assertFalse(exists, f"Se encontró {model.__name__} con filtros {filters} cuando no debería existir")


# Decoradores para tests
def skip_if_no_db(test_func):
    """Saltar test si no hay base de datos disponible"""
    from django.test import override_settings
    from django.db import connection
    
    def wrapper(*args, **kwargs):
        try:
            connection.ensure_connection()
            return test_func(*args, **kwargs)
        except Exception:
            import unittest
            raise unittest.SkipTest("Database not available")
    
    return wrapper


def requires_redis(test_func):
    """Decorador para tests que requieren Redis"""
    def wrapper(*args, **kwargs):
        try:
            from django.core.cache import cache
            cache.set('test_key', 'test_value', 1)
            if cache.get('test_key') != 'test_value':
                raise Exception("Redis not working")
            return test_func(*args, **kwargs)
        except Exception:
            import unittest
            raise unittest.SkipTest("Redis not available")
    
    return wrapper
