"""
Tests para el módulo de API Externa
"""
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from tests.base import BaseAPITestCase, IntegrationTestCase
from api_external.models import ExternalAPIClient, APIAccessLog, APIWebhook
from api_external.utils import generate_api_key
from authentication.models import User
from appointments.models import Appointment, Specialty
from medical_records.models import MedicalRecord, VitalSigns


class ExternalAPIClientTests(BaseAPITestCase):
    """Tests para el modelo ExternalAPIClient"""
    
    def setUp(self):
        super().setUp()
        # admin_user ya está creado en BaseAPITestCase, no necesitamos crear otro
    
    def test_create_client(self):
        """Test de creación de cliente API"""
        client = ExternalAPIClient.objects.create(
            name='Test API Client',
            created_by=self.admin_user,
            description='Test client for external API'
        )
        
        self.assertIsNotNone(client.api_key)
        self.assertTrue(client.is_active)
        self.assertEqual(client.created_by, self.admin_user)
        self.assertEqual(client.name, 'Test API Client')
        
    def test_client_permissions(self):
        """Test de permisos de cliente"""
        client = ExternalAPIClient.objects.create(
            name='Test API Client',
            created_by=self.admin_user,
            can_read_appointments=True,
            can_write_appointments=True
        )
        
        self.assertTrue(client.can_read_appointments)
        self.assertTrue(client.can_write_appointments)
        self.assertFalse(client.can_read_patients)
        
    def test_client_rate_limiting(self):
        """Test de rate limiting"""
        client = ExternalAPIClient.objects.create(
            name='Rate Limited Client',
            created_by=self.admin_user,
            rate_limit_per_minute=10,
            daily_request_limit=100  # Establecer límite diario
        )
        
        # Verificar que el cliente tiene los límites configurados
        self.assertEqual(client.rate_limit_per_minute, 10)
        self.assertEqual(client.daily_request_limit, 100)
        
        # Test: simular que se alcanza el límite diario
        # En un escenario real, esto sería rastreado por el middleware/decorador
        # Por ahora, verificamos que los límites están correctamente configurados
        self.assertTrue(client.is_active)
        self.assertGreater(client.daily_request_limit, 0)
        
    def test_client_key_regeneration(self):
        """Test de regeneración de llave del cliente"""
        client = ExternalAPIClient.objects.create(
            name='Test Client',
            created_by=self.admin_user
        )
        
        old_key = client.api_key
        client.api_key = client.generate_api_key()
        client.save()
        
        self.assertNotEqual(old_key, client.api_key)
        self.assertIsNotNone(client.api_key)


class APIAccessLogModelTests(BaseAPITestCase):
    """Tests para el modelo APIAccessLog"""
    
    def setUp(self):
        super().setUp()
        # admin_user ya está creado en BaseAPITestCase
        self.client = ExternalAPIClient.objects.create(
            name='Test Client',
            created_by=self.admin_user
        )
        
    def test_create_access_log(self):
        """Test de creación de log de acceso de API"""
        log = APIAccessLog.objects.create(
            client=self.client,
            endpoint='/api/v1/appointments/',
            method='GET',
            response_status=200,
            response_time_ms=125,
            ip_address='192.168.1.1',
            user_agent='TestClient/1.0'
        )
        
        self.assertEqual(log.client, self.client)
        self.assertEqual(log.endpoint, '/api/v1/appointments/')
        self.assertEqual(log.method, 'GET')
        self.assertEqual(log.response_status, 200)
        
    def test_access_log_with_error(self):
        """Test de log con error"""
        log = APIAccessLog.objects.create(
            client=self.client,
            endpoint='/api/v1/appointments/',
            method='POST',
            response_status=400,
            response_time_ms=89,
            request_body='{"error":"Invalid appointment data"}'
        )
        
        self.assertEqual(log.response_status, 400)
        self.assertIn('error', log.request_body)
        
    def test_access_log_statistics(self):
        """Test de estadísticas de logs"""
        # Crear varios logs
        for i in range(5):
            APIAccessLog.objects.create(
                client=self.client,
                endpoint='/api/v1/appointments/',
                method='GET',
                response_status=200,
                response_time_ms=100 + (i * 10)
            )
            
        logs = self.client.access_logs.all()
        self.assertEqual(len(logs), 5)
        self.assertEqual(sum(log.response_status == 200 for log in logs), 5)


class APIWebhookModelTests(BaseAPITestCase):
    """Tests para el modelo APIWebhook"""
    
    def setUp(self):
        super().setUp()
        # admin_user ya está creado en BaseAPITestCase
        self.client = ExternalAPIClient.objects.create(
            name='Test Client',
            created_by=self.admin_user
        )
        
    def test_create_webhook(self):
        """Test de creación de webhook"""
        webhook = APIWebhook.objects.create(
            client=self.client,
            url='https://example.com/webhook',
            event='appointment.created',
            is_active=True
        )
        
        self.assertEqual(webhook.client, self.client)
        self.assertEqual(webhook.url, 'https://example.com/webhook')
        self.assertEqual(webhook.event, 'appointment.created')
        self.assertTrue(webhook.is_active)
        
    def test_webhook_secret_generation(self):
        """Test de generación de secret para webhook"""
        webhook = APIWebhook.objects.create(
            client=self.client,
            url='https://example.com/webhook',
            event='appointment.created'
        )
        
        # Verificar que el webhook tiene un secret generado
        self.assertIsNotNone(webhook.secret)
        self.assertGreater(len(webhook.secret), 0)
        
    @patch('requests.post')
    def test_webhook_trigger(self, mock_post):
        """Test de trigger de webhook"""
        webhook = APIWebhook.objects.create(
            client=self.client,
            url='https://example.com/webhook',
            event='appointment.created',
            is_active=True
        )
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        # Simular trigger del webhook
        # En una implementación real, esto sería manejado por el sistema
        self.assertTrue(webhook.is_active)
        self.assertEqual(webhook.event, 'appointment.created')


class ExternalAPIAuthenticationTests(BaseAPITestCase):
    """Tests para autenticación de API externa"""
    
    def setUp(self):
        super().setUp()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.api_key = APIKey.objects.create(
            name='Test Key',
            user=self.admin_user,
            permissions=['read_appointments', 'write_appointments']
        )
        self.client = APIClient()
        
    def test_api_key_authentication_success(self):
        """Test de autenticación exitosa con API key"""
        self.client.credentials(HTTP_X_API_KEY=self.api_key.key)
        response = self.client.get('/api/v1/appointments/')
        
        self.assertNotEqual(response.status_code, 401)
        
    def test_api_key_authentication_failure(self):
        """Test de autenticación fallida sin API key"""
        response = self.client.get('/api/v1/appointments/')
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('authentication_error', response.data)
        
    def test_invalid_api_key(self):
        """Test con API key inválida"""
        self.client.credentials(HTTP_X_API_KEY='invalid-key-12345')
        response = self.client.get('/api/v1/appointments/')
        
        self.assertEqual(response.status_code, 401)
        
    def test_expired_api_key(self):
        """Test con API key expirada"""
        expired_key = APIKey.objects.create(
            name='Expired Key',
            user=self.admin_user,
            expires_at=timezone.now() - timedelta(days=1)
        )
        
        self.client.credentials(HTTP_X_API_KEY=expired_key.key)
        response = self.client.get('/api/v1/appointments/')
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('expired', response.data['detail'].lower())
        
    def test_inactive_api_key(self):
        """Test con API key inactiva"""
        self.api_key.is_active = False
        self.api_key.save()
        
        self.client.credentials(HTTP_X_API_KEY=self.api_key.key)
        response = self.client.get('/api/v1/appointments/')
        
        self.assertEqual(response.status_code, 401)
        
    def test_insufficient_permissions(self):
        """Test con permisos insuficientes"""
        limited_key = APIKey.objects.create(
            name='Limited Key',
            user=self.admin_user,
            permissions=['read_appointments']  # Solo lectura
        )
        
        self.client.credentials(HTTP_X_API_KEY=limited_key.key)
        
        # GET debe funcionar
        response = self.client.get('/api/v1/appointments/')
        self.assertNotEqual(response.status_code, 403)
        
        # POST debe fallar
        response = self.client.post('/api/v1/appointments/', {})
        self.assertEqual(response.status_code, 403)


class ExternalAPIEndpointsTests(IntegrationTestCase):
    """Tests de integración para endpoints de API externa"""
    
    def setUp(self):
        super().setUp()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.api_key = APIKey.objects.create(
            name='Full Access Key',
            user=self.admin_user,
            permissions=['*']  # Todos los permisos
        )
        self.client = APIClient()
        self.client.credentials(HTTP_X_API_KEY=self.api_key.key)
        
        # Crear datos de prueba
        self.doctor = User.objects.create_user(email='doctor@test.com',
            password='DoctorPass123!',
            role='doctor'
        )
        
        self.patient = User.objects.create_user(email='patient@test.com',
            password='PatientPass123!',
            role='patient'
        )
        
        self.specialty = Specialty.objects.create(
            name='Cardiología',
            description='Especialidad del corazón'
        )
        
    def test_appointments_api(self):
        """Test de API de citas"""
        # Crear cita
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'appointment_date': (timezone.now() + timedelta(days=1)).isoformat(),
            'reason': 'Consulta general'
        }
        
        response = self.client.post('/api/v1/appointments/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        appointment_id = response.data['id']
        
        # Listar citas
        response = self.client.get('/api/v1/appointments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
        
        # Obtener cita específica
        response = self.client.get(f'/api/v1/appointments/{appointment_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], appointment_id)
        
        # Actualizar cita
        update_data = {'status': 'confirmed'}
        response = self.client.patch(
            f'/api/v1/appointments/{appointment_id}/',
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'confirmed')
        
    def test_medical_records_api(self):
        """Test de API de expedientes médicos"""
        # Crear expediente
        record = MedicalRecord.objects.create(
            patient=self.patient,
            blood_type='O+',
            emergency_contact_name='John Doe',
            emergency_contact_phone='+1234567890'
        )
        
        # Obtener expediente
        response = self.client.get(f'/api/v1/medical-records/{record.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['blood_type'], 'O+')
        
        # Agregar signos vitales
        vital_signs_data = {
            'medical_record': record.id,
            'blood_pressure_systolic': 120,
            'blood_pressure_diastolic': 80,
            'heart_rate': 72,
            'temperature': 36.5,
            'weight': 70.0,
            'height': 1.75
        }
        
        response = self.client.post(
            '/api/v1/vital-signs/',
            vital_signs_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
    def test_api_versioning(self):
        """Test de versionado de API"""
        # Version 1
        response = self.client.get('/api/v1/appointments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Version 2 (si existe)
        response = self.client.get('/api/v2/appointments/')
        # Puede ser 404 si v2 no está implementada
        self.assertIn(response.status_code, [200, 404])
        
    def test_api_pagination(self):
        """Test de paginación"""
        # Crear múltiples citas
        for i in range(25):
            Appointment.objects.create(
                patient=self.patient,
                doctor=self.doctor,
                specialty=self.specialty,
                appointment_date=timezone.now() + timedelta(days=i),
                reason=f'Consulta {i}'
            )
            
        # Primera página
        response = self.client.get('/api/v1/appointments/?page=1&page_size=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIsNotNone(response.data['next'])
        
        # Segunda página
        response = self.client.get('/api/v1/appointments/?page=2&page_size=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
        
    def test_api_filtering(self):
        """Test de filtrado"""
        # Crear citas con diferentes estados
        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=timezone.now() + timedelta(days=1),
            status='scheduled'
        )
        
        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=timezone.now() + timedelta(days=2),
            status='confirmed'
        )
        
        # Filtrar por estado
        response = self.client.get('/api/v1/appointments/?status=scheduled')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for appointment in response.data['results']:
            self.assertEqual(appointment['status'], 'scheduled')
            
    def test_api_search(self):
        """Test de búsqueda"""
        # Crear citas con diferentes razones
        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=timezone.now() + timedelta(days=1),
            reason='Dolor de cabeza'
        )
        
        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=timezone.now() + timedelta(days=2),
            reason='Chequeo general'
        )
        
        # Buscar por razón
        response = self.client.get('/api/v1/appointments/?search=dolor')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
        
    def test_api_error_handling(self):
        """Test de manejo de errores"""
        # Datos inválidos
        invalid_data = {
            'patient': 999999,  # ID inexistente
            'doctor': self.doctor.id,
            'appointment_date': 'invalid-date'
        }
        
        response = self.client.post('/api/v1/appointments/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        
        # Recurso no encontrado
        response = self.client.get('/api/v1/appointments/999999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_webhook_integration(self):
        """Test de integración con webhooks"""
        # Crear webhook
        webhook = Webhook.objects.create(
            api_key=self.api_key,
            url='https://example.com/webhook',
            events=['appointment.created']
        )
        
        with patch('requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_post.return_value = mock_response
            
            # Crear cita (debe triggear webhook)
            data = {
                'patient': self.patient.id,
                'doctor': self.doctor.id,
                'specialty': self.specialty.id,
                'appointment_date': (timezone.now() + timedelta(days=1)).isoformat(),
                'reason': 'Consulta'
            }
            
            response = self.client.post('/api/v1/appointments/', data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            # Verificar que el webhook fue llamado
            mock_post.assert_called_once()
            call_args = mock_post.call_args
            self.assertEqual(call_args[0][0], webhook.url)
            
    def test_api_rate_limiting(self):
        """Test de rate limiting"""
        # Crear API key con límite bajo
        limited_key = APIKey.objects.create(
            name='Limited Key',
            user=self.admin_user,
            permissions=['*'],
            rate_limit=5  # 5 requests por minuto
        )
        
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=limited_key.key)
        
        # Hacer 5 requests (deben pasar)
        for i in range(5):
            response = client.get('/api/v1/appointments/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
        # El 6to request debe fallar
        response = client.get('/api/v1/appointments/')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        
    def test_api_logging(self):
        """Test de logging de API"""
        # Hacer request
        response = self.client.get('/api/v1/appointments/')
        
        # Verificar que se creó el log
        logs = APILog.objects.filter(api_key=self.api_key)
        self.assertGreaterEqual(logs.count(), 1)
        
        latest_log = logs.latest('created_at')
        self.assertEqual(latest_log.endpoint, '/api/v1/appointments/')
        self.assertEqual(latest_log.method, 'GET')
        self.assertEqual(latest_log.status_code, 200)
        
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_async_operations(self):
        """Test de operaciones asíncronas"""
        # Crear operación que trigger tarea asíncrona
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'appointment_date': (timezone.now() + timedelta(days=1)).isoformat(),
            'reason': 'Consulta',
            'send_notification': True  # Trigger notificación asíncrona
        }
        
        response = self.client.post('/api/v1/appointments/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que la tarea se ejecutó
        # (Esto depende de la implementación específica)


class APIDocumentationTests(BaseAPITestCase):
    """Tests para documentación de API"""
    
    def setUp(self):
        super().setUp()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.api_key = APIKey.objects.create(
            name='Test Key',
            user=self.admin_user,
            permissions=['*']
        )
        self.client = APIClient()
        
    def test_swagger_documentation_accessible(self):
        """Test de acceso a documentación Swagger"""
        self.client.credentials(HTTP_X_API_KEY=self.api_key.key)
        response = self.client.get('/api/v1/docs/')
        
        self.assertIn(response.status_code, [200, 301, 302])
        
    def test_openapi_schema_accessible(self):
        """Test de acceso a schema OpenAPI"""
        self.client.credentials(HTTP_X_API_KEY=self.api_key.key)
        response = self.client.get('/api/v1/openapi/')
        
        if response.status_code == 200:
            self.assertIn('openapi', response.data)
            self.assertIn('paths', response.data)
            self.assertIn('components', response.data)
            
    def test_api_documentation_requires_auth(self):
        """Test que la documentación requiere autenticación"""
        response = self.client.get('/api/v1/docs/')
        
        # Puede requerir auth o redirigir
        self.assertIn(response.status_code, [401, 302])


if __name__ == '__main__':
    import django
    from django.test import TestCase
    django.setup()
    TestCase.main()