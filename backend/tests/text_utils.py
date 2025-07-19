"""
Utilidades para tests
"""
import json
from datetime import datetime, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class TestDataMixin:
    """Mixin con datos de prueba comunes"""
    
    @classmethod
    def setup_test_data(cls):
        """Configurar datos de prueba comunes"""
        cls.test_users = {
            'admin': User.objects.create_superuser(
                username='admin_test',
                email='admin@test.com',
                password='AdminPass123!'
            ),
            'doctor': User.objects.create_user(email='doctor@test.com',
                password='DoctorPass123!',
                role='doctor',
                first_name='Doctor',
                last_name='Test'
            ),
            'nurse': User.objects.create_user(email='nurse@test.com',
                password='NursePass123!',
                role='nurse',
                first_name='Nurse',
                last_name='Test'
            ),
            'patient': User.objects.create_user(email='patient@test.com',
                password='PatientPass123!',
                role='patient',
                first_name='Patient',
                last_name='Test'
            )
        }


class AuthenticatedAPITestCase(TestCase):
    """Clase base para tests de API con autenticación"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.setup_users()
    
    def setup_users(self):
        """Configurar usuarios de prueba"""
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        
        self.regular_user = User.objects.create_user(email='user@test.com',
            password='UserPass123!',
            role='patient'
        )
    
    def authenticate(self, user=None):
        """Autenticar un usuario en el cliente de test"""
        if user is None:
            user = self.regular_user
        
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return refresh.access_token
    
    def authenticate_as_admin(self):
        """Autenticar como administrador"""
        return self.authenticate(self.admin_user)
    
    def logout(self):
        """Cerrar sesión"""
        self.client.credentials()


class FileTestMixin:
    """Mixin para tests que manejan archivos"""
    
    def create_test_file(self, filename='test.txt', content='Test content', size=None):
        """Crear un archivo de prueba"""
        if isinstance(content, str):
            content = content.encode('utf-8')
        
        if size and len(content) < size:
            content = content + b' ' * (size - len(content))
        
        return ContentFile(content, name=filename)
    
    def create_test_image(self, filename='test.png', width=100, height=100):
        """Crear una imagen de prueba"""
        from PIL import Image
        import io
        
        image = Image.new('RGB', (width, height), color='red')
        buffer = io.BytesIO()
        image.save(buffer, 'PNG')
        buffer.seek(0)
        
        return ContentFile(buffer.getvalue(), name=filename)
    
    def create_test_pdf(self, filename='test.pdf', pages=1):
        """Crear un PDF de prueba"""
        from reportlab.pdfgen import canvas
        import io
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        
        for i in range(pages):
            p.drawString(100, 750, f'Test PDF - Page {i + 1}')
            if i < pages - 1:
                p.showPage()
        
        p.save()
        buffer.seek(0)
        
        return ContentFile(buffer.getvalue(), name=filename)


class DateTimeTestMixin:
    """Mixin para tests que manejan fechas y horas"""
    
    def get_future_date(self, days=7):
        """Obtener una fecha futura"""
        return timezone.now().date() + timedelta(days=days)
    
    def get_past_date(self, days=7):
        """Obtener una fecha pasada"""
        return timezone.now().date() - timedelta(days=days)
    
    def get_future_datetime(self, **kwargs):
        """Obtener un datetime futuro"""
        return timezone.now() + timedelta(**kwargs)
    
    def get_past_datetime(self, **kwargs):
        """Obtener un datetime pasado"""
        return timezone.now() - timedelta(**kwargs)
    
    def freeze_time(self, target_time):
        """Congelar el tiempo para tests"""
        from unittest.mock import patch
        return patch('django.utils.timezone.now', return_value=target_time)


class AssertionHelpers:
    """Helpers para assertions comunes"""
    
    def assert_response_ok(self, response):
        """Verificar que la respuesta sea exitosa (2xx)"""
        self.assertGreaterEqual(response.status_code, 200)
        self.assertLess(response.status_code, 300)
    
    def assert_response_error(self, response, expected_status=None):
        """Verificar que la respuesta sea un error"""
        self.assertGreaterEqual(response.status_code, 400)
        if expected_status:
            self.assertEqual(response.status_code, expected_status)
    
    def assert_contains_keys(self, data, keys):
        """Verificar que un diccionario contenga ciertas claves"""
        for key in keys:
            self.assertIn(key, data)
    
    def assert_datetime_close(self, dt1, dt2, seconds=60):
        """Verificar que dos datetimes estén cerca"""
        diff = abs((dt1 - dt2).total_seconds())
        self.assertLess(diff, seconds)
    
    def assert_decimal_equal(self, d1, d2, places=2):
        """Verificar que dos decimales sean iguales hasta ciertos decimales"""
        self.assertAlmostEqual(float(d1), float(d2), places=places)


class PerformanceTestMixin:
    """Mixin para tests de rendimiento"""
    
    def assert_query_count(self, expected_count, func, *args, **kwargs):
        """Verificar el número de queries ejecutadas"""
        from django.test.utils import override_settings
        from django.db import connection
        from django.conf import settings
        
        with override_settings(DEBUG=True):
            initial_queries = len(connection.queries)
            result = func(*args, **kwargs)
            query_count = len(connection.queries) - initial_queries
            
            self.assertEqual(
                query_count, 
                expected_count,
                f"Expected {expected_count} queries but got {query_count}"
            )
            
            return result
    
    def measure_time(self, func, *args, **kwargs):
        """Medir el tiempo de ejecución de una función"""
        import time
        
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        return result, end_time - start_time
    
    def assert_performance(self, func, max_time=1.0, *args, **kwargs):
        """Verificar que una función se ejecute dentro de un tiempo límite"""
        result, execution_time = self.measure_time(func, *args, **kwargs)
        
        self.assertLess(
            execution_time,
            max_time,
            f"Function took {execution_time:.2f}s, expected less than {max_time}s"
        )
        
        return result


# Funciones de utilidad global
def create_test_data_batch(model_class, count=10, **kwargs):
    """Crear múltiples instancias de un modelo"""
    instances = []
    for i in range(count):
        instance_kwargs = kwargs.copy()
        # Agregar índice a campos string si es necesario
        for key, value in instance_kwargs.items():
            if isinstance(value, str) and '{i}' in value:
                instance_kwargs[key] = value.format(i=i)
        
        instances.append(model_class.objects.create(**instance_kwargs))
    
    return instances


def compare_json_response(response, expected_data):
    """Comparar respuesta JSON con datos esperados"""
    if hasattr(response, 'json'):
        response_data = response.json()
    else:
        response_data = json.loads(response.content)
    
    def compare_recursive(actual, expected, path=''):
        if isinstance(expected, dict):
            for key, value in expected.items():
                current_path = f"{path}.{key}" if path else key
                assert key in actual, f"Key '{current_path}' not found in response"
                compare_recursive(actual[key], value, current_path)
        elif isinstance(expected, list):
            assert len(actual) == len(expected), f"List length mismatch at '{path}'"
            for i, (actual_item, expected_item) in enumerate(zip(actual, expected)):
                compare_recursive(actual_item, expected_item, f"{path}[{i}]")
        else:
            assert actual == expected, f"Value mismatch at '{path}': {actual} != {expected}"
    
    compare_recursive(response_data, expected_data)
    return True


def generate_test_token(user, expires_in=3600):
    """Generar un token JWT de prueba"""
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    
    # Personalizar tiempo de expiración si es necesario
    if expires_in != 3600:
        access.set_exp(lifetime=timedelta(seconds=expires_in))
    
    return {
        'access': str(access),
        'refresh': str(refresh)
    }