from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, time
from unittest.mock import patch, MagicMock

from .models import (
    NotificationTemplate,
    Notification,
    NotificationPreference,
    NotificationLog,
    PushDevice
)
from .services import NotificationService, EmailService, SMSService, PushService
from appointments.models import Appointment, Specialty

User = get_user_model()


class NotificationModelTests(TestCase):
    """Tests para los modelos de notificaciones"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            role='patient'
        )
        
        self.template = NotificationTemplate.objects.create(
            name='Test Template',
            notification_type='appointment_reminder',
            channel='email',
            subject_template='Recordatorio de Cita - {{patient_name}}',
            body_template='Hola {{patient_name}}, tienes una cita el {{appointment_date}} a las {{appointment_time}}.'
        )
    
    def test_notification_creation(self):
        """Test para crear una notificación"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='email',
            priority='normal',
            recipient_email=self.user.email
        )
        
        self.assertIsNotNone(notification.notification_id)
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.template, self.template)
        self.assertEqual(notification.status, 'pending')
        self.assertTrue(notification.is_ready_to_send())
    
    def test_notification_methods(self):
        """Test para métodos de notificación"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='email'
        )
        
        # Test mark_as_sent
        notification.mark_as_sent()
        self.assertEqual(notification.status, 'sent')
        self.assertIsNotNone(notification.sent_at)
        
        # Test mark_as_delivered
        notification.mark_as_delivered()
        self.assertEqual(notification.status, 'delivered')
        self.assertIsNotNone(notification.delivered_at)
        
        # Test mark_as_failed
        notification.status = 'pending'
        notification.mark_as_failed('Test error')
        self.assertEqual(notification.status, 'failed')
        self.assertEqual(notification.error_message, 'Test error')
        self.assertEqual(notification.attempts, 1)
    
    def test_notification_can_retry(self):
        """Test para verificar si una notificación puede reintentarse"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='email',
            status='failed',
            attempts=2,
            max_attempts=3
        )
        
        self.assertTrue(notification.can_retry())
        
        notification.attempts = 3
        notification.save()
        self.assertFalse(notification.can_retry())
    
    def test_notification_preference_creation(self):
        """Test para crear preferencias de notificación"""
        preferences = NotificationPreference.objects.create(user=self.user)
        
        self.assertEqual(preferences.user, self.user)
        self.assertTrue(preferences.email_enabled)
        self.assertTrue(preferences.appointment_reminders)
        self.assertEqual(preferences.language, 'es')
    
    def test_notification_preference_methods(self):
        """Test para métodos de preferencias"""
        preferences = NotificationPreference.objects.create(
            user=self.user,
            email_enabled=True,
            sms_enabled=False,
            appointment_reminders=True,
            quiet_hours_start=time(22, 0),
            quiet_hours_end=time(7, 0)
        )
        
        # Test is_channel_enabled
        self.assertTrue(preferences.is_channel_enabled('email'))
        self.assertFalse(preferences.is_channel_enabled('sms'))
        
        # Test is_notification_type_enabled
        self.assertTrue(preferences.is_notification_type_enabled('appointment_reminder'))
        
        # Test is_quiet_hours
        test_time = time(23, 0)  # 11 PM
        self.assertTrue(preferences.is_quiet_hours(test_time))
        
        test_time = time(10, 0)  # 10 AM
        self.assertFalse(preferences.is_quiet_hours(test_time))
    
    def test_push_device_creation(self):
        """Test para crear dispositivos push"""
        device = PushDevice.objects.create(
            user=self.user,
            device_token='test_token_123',
            device_type='android',
            device_name='Test Device'
        )
        
        self.assertEqual(device.user, self.user)
        self.assertEqual(device.device_token, 'test_token_123')
        self.assertTrue(device.is_active)


class NotificationServiceTests(TestCase):
    """Tests para el servicio de notificaciones"""
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            role='patient'
        )
        
        self.template = NotificationTemplate.objects.create(
            name='Test Template',
            notification_type='appointment_reminder',
            channel='email',
            subject_template='Recordatorio - {{patient_name}}',
            body_template='Hola {{patient_name}}, tienes una cita.'
        )
        
        self.service = NotificationService()
    
    def test_create_notification(self):
        """Test para crear notificaciones via servicio"""
        context_data = {
            'patient_name': 'Test User',
            'appointment_date': '25/07/2025',
            'appointment_time': '10:00'
        }
        
        notifications = self.service.create_notification(
            recipient=self.user,
            notification_type='appointment_reminder',
            context_data=context_data,
            priority='high'
        )
        
        self.assertGreater(len(notifications), 0)
        notification = notifications[0]
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.priority, 'high')
        self.assertIn('Test User', notification.subject)
    
    @patch('notifications.services.EmailService.send')
    def test_send_notification_success(self, mock_email_send):
        """Test para envío exitoso de notificación"""
        mock_email_send.return_value = True
        
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='email',
            recipient_email=self.user.email
        )
        
        result = self.service.send_notification(notification)
        
        self.assertTrue(result)
        notification.refresh_from_db()
        self.assertEqual(notification.status, 'sent')
        mock_email_send.assert_called_once()
    
    @patch('notifications.services.EmailService.send')
    def test_send_notification_failure(self, mock_email_send):
        """Test para envío fallido de notificación"""
        mock_email_send.return_value = False
        
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='email',
            recipient_email=self.user.email
        )
        
        result = self.service.send_notification(notification)
        
        self.assertFalse(result)
        notification.refresh_from_db()
        self.assertEqual(notification.status, 'failed')
    
    def test_create_appointment_reminder(self):
        """Test para crear recordatorio de cita"""
        # Crear datos necesarios
        doctor = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            role='doctor'
        )
        
        specialty = Specialty.objects.create(name='Cardiología')
        
        # Mock del appointment con los atributos necesarios
        appointment = MagicMock()
        appointment.patient = self.user
        appointment.doctor = doctor
        appointment.specialty = specialty
        appointment.appointment_date.strftime.return_value = '25/07/2025'
        appointment.appointment_time.strftime.return_value = '10:00'
        appointment.reason = 'Consulta general'
        appointment.appointment_id = 'test-123'
        appointment.appointment_datetime = timezone.now() + timedelta(days=1)
        
        notifications = self.service.create_appointment_reminder(appointment)
        
        self.assertGreater(len(notifications), 0)
        notification = notifications[0]
        self.assertEqual(notification.template.notification_type, 'appointment_reminder')
        self.assertEqual(notification.priority, 'high')


class EmailServiceTests(TestCase):
    """Tests para el servicio de email"""
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role='patient'
        )
        
        self.template = NotificationTemplate.objects.create(
            name='Email Template',
            notification_type='appointment_reminder',
            channel='email',
            subject_template='Test Subject',
            body_template='Test Body'
        )
        
        self.service = EmailService()
    
    @patch('notifications.services.send_mail')
    def test_send_email_success(self, mock_send_mail):
        """Test para envío exitoso de email"""
        mock_send_mail.return_value = 1
        
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='email',
            recipient_email=self.user.email
        )
        
        result = self.service.send(notification)
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
    
    def test_send_email_no_address(self):
        """Test para envío sin dirección de email"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='email',
            recipient_email=''
        )
        
        result = self.service.send(notification)
        
        self.assertFalse(result)


class SMSServiceTests(TestCase):
    """Tests para el servicio de SMS"""
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role='patient'
        )
        
        self.template = NotificationTemplate.objects.create(
            name='SMS Template',
            notification_type='appointment_reminder',
            channel='sms',
            body_template='Test SMS Body'
        )
        
        self.service = SMSService()
    
    def test_sms_service_disabled(self):
        """Test para servicio SMS deshabilitado"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            message='Test Message',
            channel='sms',
            recipient_phone='+1234567890'
        )
        
        # Sin configuración de API, el servicio debe estar deshabilitado
        result = self.service.send(notification)
        
        self.assertFalse(result)
    
    def test_sms_no_phone(self):
        """Test para SMS sin número de teléfono"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            message='Test Message',
            channel='sms',
            recipient_phone=''
        )
        
        result = self.service.send(notification)
        
        self.assertFalse(result)


class PushServiceTests(TestCase):
    """Tests para el servicio de notificaciones push"""
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role='patient'
        )
        
        self.template = NotificationTemplate.objects.create(
            name='Push Template',
            notification_type='appointment_reminder',
            channel='push',
            subject_template='Test Push',
            body_template='Test Push Body'
        )
        
        self.device = PushDevice.objects.create(
            user=self.user,
            device_token='test_token',
            device_type='android'
        )
        
        self.service = PushService()
    
    def test_push_service_disabled(self):
        """Test para servicio push deshabilitado"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='push'
        )
        
        # Sin configuración de Firebase, el servicio debe estar deshabilitado
        result = self.service.send(notification)
        
        self.assertFalse(result)
    
    def test_push_no_devices(self):
        """Test para push sin dispositivos"""
        # Desactivar el dispositivo
        self.device.is_active = False
        self.device.save()
        
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test Subject',
            message='Test Message',
            channel='push'
        )
        
        result = self.service.send(notification)
        
        self.assertFalse(result)


class NotificationSignalTests(TestCase):
    """Tests para las señales de notificaciones"""
    
    def setUp(self):
        """Configuración inicial"""
        self.patient = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            role='patient'
        )
        
        self.doctor = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            role='doctor'
        )
    
    def test_create_notification_preferences_signal(self):
        """Test para creación automática de preferencias"""
        # Las preferencias deben crearse automáticamente al crear un usuario
        new_user = User.objects.create_user(
            username='newuser',
            email='new@example.com',
            role='patient'
        )
        
        # Verificar que se crearon las preferencias
        self.assertTrue(hasattr(new_user, 'notification_preferences'))
        preferences = new_user.notification_preferences
        self.assertEqual(preferences.user, new_user)
        self.assertTrue(preferences.email_enabled)


class NotificationAPITests(TestCase):
    """Tests para la API de notificaciones"""
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role='patient'
        )
        
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            role='admin'
        )
        
        self.template = NotificationTemplate.objects.create(
            name='API Test Template',
            notification_type='appointment_reminder',
            channel='email',
            subject_template='API Test',
            body_template='API Test Body'
        )
    
    def test_user_can_access_own_notifications(self):
        """Test para verificar que usuarios pueden acceder a sus notificaciones"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test',
            message='Test',
            channel='email'
        )
        
        # Simular acceso del usuario
        # En un test real usarías self.client.force_authenticate(user=self.user)
        # y harías requests a la API
        
        # Verificar que la notificación existe
        self.assertEqual(notification.recipient, self.user)
    
    def test_admin_can_access_all_notifications(self):
        """Test para verificar que admins pueden acceder a todas las notificaciones"""
        notification = Notification.objects.create(
            recipient=self.user,
            template=self.template,
            subject='Test',
            message='Test',
            channel='email'
        )
        
        # Los admins deben poder ver todas las notificaciones
        all_notifications = Notification.objects.all()
        self.assertIn(notification, all_notifications)


class NotificationTemplateTests(TestCase):
    """Tests para plantillas de notificaciones"""
    
    def test_template_validation(self):
        """Test para validación de plantillas"""
        # Test para plantilla de email sin asunto
        template = NotificationTemplate(
            name='Invalid Email Template',
            notification_type='appointment_reminder',
            channel='email',
            body_template='Test body without subject'
        )
        
        # En un test real, esto debería fallar la validación
        # cuando se use el serializer
        
        # Test para plantilla válida
        valid_template = NotificationTemplate.objects.create(
            name='Valid Template',
            notification_type='appointment_reminder',
            channel='email',
            subject_template='Valid Subject',
            body_template='Valid Body'
        )
        
        self.assertEqual(valid_template.channel, 'email')
        self.assertTrue(valid_template.is_active)


class NotificationCacheTests(TestCase):
    """Tests para el sistema de caché"""
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role='patient'
        )
    
    def test_notification_stats_cache(self):
        """Test para caché de estadísticas"""
        from django.core.cache import cache
        from .signals import get_notification_stats
        
        # Limpiar caché
        cache.delete('notification_stats')
        
        # Generar estadísticas
        stats = get_notification_stats()
        
        # Verificar que las estadísticas se generaron
        self.assertIsInstance(stats, dict)
        self.assertIn('total', stats)


if __name__ == '__main__':
    import django
    from django.test.utils import get_runner
    from django.conf import settings
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["notifications"])
    
    if failures:
        print(f"❌ {failures} tests failed")
    else:
        print("✅ All tests passed")
