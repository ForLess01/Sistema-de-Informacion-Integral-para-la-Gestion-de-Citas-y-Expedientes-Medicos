from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal

from .models import ReportTemplate, GeneratedReport, ScheduledReport, ReportAudit
from appointments.models import Appointment
from emergency.models import EmergencyCase
from authentication.models import User


class ReportModelTests(TestCase):
    """Tests para los modelos del módulo de reportes"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        
    def test_create_report_template(self):
        """Test crear plantilla de reporte"""
        template = ReportTemplate.objects.create(
            name='Test Template',
            report_type='appointments',
            description='Test description',
            template_config={'test': 'config'},
            created_by=self.user
        )
        
        self.assertEqual(template.name, 'Test Template')
        self.assertEqual(template.report_type, 'appointments')
        self.assertTrue(template.is_active)
        
    def test_create_generated_report(self):
        """Test crear reporte generado"""
        report = GeneratedReport.objects.create(
            name='Test Report',
            report_type='financial',
            format='pdf',
            parameters={'start_date': '2024-01-01'},
            generated_by=self.user,
            status='pending'
        )
        
        self.assertEqual(report.status, 'pending')
        self.assertEqual(report.format, 'pdf')
        self.assertIsNotNone(report.created_at)
        
    def test_report_audit_creation(self):
        """Test registro de auditoría"""
        report = GeneratedReport.objects.create(
            name='Test Report',
            report_type='emergency',
            format='csv',
            generated_by=self.user
        )
        
        audit = ReportAudit.objects.create(
            report=report,
            user=self.user,
            action='generated',
            ip_address='127.0.0.1'
        )
        
        self.assertEqual(audit.action, 'generated')
        self.assertEqual(audit.user, self.user)


class ReportAPITests(APITestCase):
    """Tests para las APIs del módulo de reportes"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            is_staff=True
        )
        self.doctor_user = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            password='doctorpass123',
            role='doctor'
        )
        
    def test_generate_report_authenticated(self):
        """Test generar reporte con usuario autenticado"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('generated-report-generate')
        data = {
            'report_type': 'appointments',
            'format': 'pdf',
            'parameters': {
                'start_date': '2024-01-01',
                'end_date': '2024-01-31'
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        
    def test_generate_report_unauthenticated(self):
        """Test generar reporte sin autenticación"""
        url = reverse('generated-report-generate')
        data = {
            'report_type': 'appointments',
            'format': 'pdf'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_list_generated_reports(self):
        """Test listar reportes generados"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Crear algunos reportes
        for i in range(3):
            GeneratedReport.objects.create(
                name=f'Report {i}',
                report_type='financial',
                format='pdf',
                generated_by=self.admin_user
            )
        
        url = reverse('generated-report-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
        
    def test_filter_reports_by_type(self):
        """Test filtrar reportes por tipo"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Crear reportes de diferentes tipos
        GeneratedReport.objects.create(
            name='Financial Report',
            report_type='financial',
            format='pdf',
            generated_by=self.admin_user
        )
        GeneratedReport.objects.create(
            name='Emergency Report',
            report_type='emergency',
            format='csv',
            generated_by=self.admin_user
        )
        
        url = reverse('generated-report-list')
        response = self.client.get(url, {'report_type': 'financial'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['report_type'], 'financial')


class FinancialReportTests(APITestCase):
    """Tests para reportes financieros"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            is_staff=True
        )
        self.client.force_authenticate(user=self.admin_user)
        
        # Crear datos de prueba
        self.create_test_data()
        
    def create_test_data(self):
        """Crear datos de prueba para reportes financieros"""
        # Crear doctor
        doctor = User.objects.create_user(
            username='testdoctor',
            email='doctor@test.com',
            password='doctorpass',
            role='doctor'
        )
        
        # Crear paciente
        patient = User.objects.create_user(
            username='testpatient',
            email='patient@test.com',
            password='patientpass',
            role='patient'
        )
        
        # Crear citas
        for i in range(5):
            Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=timezone.now().date(),
                appointment_time=timezone.now().time(),
                reason='Test appointment',
                status='completed',
                payment_status='paid',
                consultation_fee=Decimal('100.00')
            )
            
    def test_revenue_summary_endpoint(self):
        """Test endpoint de resumen de ingresos"""
        url = reverse('financial-report-revenue-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('appointments', response.data)
        self.assertIn('pharmacy', response.data)
        self.assertIn('total_revenue', response.data)
        
    def test_revenue_summary_with_date_filter(self):
        """Test resumen de ingresos con filtro de fechas"""
        url = reverse('financial-report-revenue-summary')
        params = {
            'start_date': (timezone.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
            'end_date': timezone.now().strftime('%Y-%m-%d')
        }
        response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period']['start_date'], params['start_date'])
        
    def test_payment_status_analysis(self):
        """Test análisis de estado de pagos"""
        url = reverse('financial-report-payment-status-analysis')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('appointments', response.data)
        self.assertIn('total_receivable', response.data)


class EmergencyReportTests(APITestCase):
    """Tests para reportes de emergencias"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            is_staff=True
        )
        self.client.force_authenticate(user=self.admin_user)
        
    def test_case_summary_endpoint(self):
        """Test endpoint de resumen de casos"""
        url = reverse('emergency-report-case-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('cases_by_status', response.data)
        self.assertIn('cases_by_priority', response.data)
        self.assertIn('statistics', response.data)
        
    def test_triage_analysis_endpoint(self):
        """Test endpoint de análisis de triaje"""
        url = reverse('emergency-report-triage-analysis')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('triage_distribution', response.data)
        self.assertIn('nurse_efficiency', response.data)
        
    def test_response_times_endpoint(self):
        """Test endpoint de tiempos de respuesta"""
        url = reverse('emergency-report-response-times')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('response_metrics', response.data)
        self.assertIn('standards_compliance', response.data)


class ReportCacheTests(TestCase):
    """Tests para el sistema de caché de reportes"""
    
    def setUp(self):
        from .cache import ReportCache
        self.cache = ReportCache
        
    def test_cache_key_generation(self):
        """Test generación de claves de caché"""
        params1 = {'start_date': '2024-01-01', 'end_date': '2024-01-31'}
        params2 = {'end_date': '2024-01-31', 'start_date': '2024-01-01'}
        
        key1 = self.cache._generate_cache_key('financial', params1)
        key2 = self.cache._generate_cache_key('financial', params2)
        
        # Las claves deben ser iguales aunque el orden de parámetros sea diferente
        self.assertEqual(key1, key2)
        
    def test_cache_set_and_get(self):
        """Test guardar y obtener del caché"""
        report_type = 'test_report'
        params = {'test': 'params'}
        data = {'result': 'test data'}
        
        # Guardar en caché
        self.assertTrue(self.cache.set(report_type, params, data))
        
        # Obtener del caché
        cached_data = self.cache.get(report_type, params)
        self.assertEqual(cached_data, data)
        
    def test_cache_delete(self):
        """Test eliminar del caché"""
        report_type = 'test_report'
        params = {'test': 'params'}
        data = {'result': 'test data'}
        
        # Guardar y luego eliminar
        self.cache.set(report_type, params, data)
        self.assertTrue(self.cache.delete(report_type, params))
        
        # Verificar que ya no está en caché
        self.assertIsNone(self.cache.get(report_type, params))


class ReportGeneratorTests(TestCase):
    """Tests para los generadores de reportes"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        
    def test_appointment_report_generator_initialization(self):
        """Test inicialización del generador de reportes de citas"""
        from .generators import AppointmentReportGenerator
        
        generator = AppointmentReportGenerator(
            start_date=datetime.now().date(),
            end_date=datetime.now().date()
        )
        
        self.assertIsNotNone(generator.start_date)
        self.assertIsNotNone(generator.end_date)
        
    def test_financial_report_generator_initialization(self):
        """Test inicialización del generador de reportes financieros"""
        from .generators import FinancialReportGenerator
        
        generator = FinancialReportGenerator(
            start_date=datetime.now().date(),
            end_date=datetime.now().date()
        )
        
        self.assertIsNotNone(generator.start_date)
        self.assertIsNotNone(generator.end_date)
