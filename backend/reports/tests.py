from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, date, time, timedelta
from decimal import Decimal
import json
import uuid

from .models import (
    ReportTemplate, GeneratedReport, ScheduledReport, ReportAudit
)
from .serializers import (
    ReportTemplateSerializer, GeneratedReportSerializer,
    ScheduledReportSerializer, ReportAuditSerializer
)

User = get_user_model()


class BaseReportTestCase(TestCase):
    """Clase base para los tests de reports"""
    
    def setUp(self):
        # Crear usuarios
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        self.regular_user = User.objects.create_user(email='user@hospital.com',
            password='userpassword',
            role='doctor',
            first_name='Regular',
            last_name='User'
        )
        
        # Crear plantilla de reporte
        self.report_template = ReportTemplate.objects.create(
            name='Reporte de Citas Mensual',
            report_type='appointments',
            description='Reporte mensual de citas médicas',
            query_config={
                'model': 'appointments.Appointment',
                'filters': ['appointment_date__range', 'status'],
                'ordering': '-appointment_date'
            },
            columns_config=[
                {'field': 'appointment_date', 'label': 'Fecha'},
                {'field': 'patient__full_name', 'label': 'Paciente'},
                {'field': 'doctor__full_name', 'label': 'Doctor'},
                {'field': 'status', 'label': 'Estado'}
            ],
            filters_config={
                'date_range': True,
                'status_choices': ['scheduled', 'completed', 'cancelled']
            },
            is_active=True,
            created_by=self.admin
        )
        
        # Crear reporte generado
        self.generated_report = GeneratedReport.objects.create(
            template=self.report_template,
            name='Reporte Citas Octubre 2024',
            report_type='appointments',
            format='pdf',
            status='completed',
            parameters={
                'start_date': '2024-10-01',
                'end_date': '2024-10-31'
            },
            start_date=date(2024, 10, 1),
            end_date=date(2024, 10, 31),
            file_size=1024 * 50,  # 50KB
            row_count=150,
            generated_by=self.admin,
            generation_time=2.5
        )
        
        # Crear archivo simulado para el reporte
        self.generated_report.file.save(
            'report_test.pdf',
            ContentFile(b'PDF content')
        )
        
        # Crear reporte programado
        self.scheduled_report = ScheduledReport.objects.create(
            template=self.report_template,
            name='Reporte Semanal de Citas',
            frequency='weekly',
            time_of_day=time(8, 0),
            day_of_week=0,  # Lunes
            format='excel',
            recipients=['admin@hospital.com', 'director@hospital.com'],
            include_in_email=True,
            is_active=True,
            created_by=self.admin
        )
        
        # Crear registro de auditoría
        self.audit_log = ReportAudit.objects.create(
            report=self.generated_report,
            user=self.admin,
            action='generated',
            ip_address='127.0.0.1',
            user_agent='Mozilla/5.0',
            metadata={'duration': 2.5}
        )


class ReportTemplateModelTests(BaseReportTestCase):
    """Tests para el modelo ReportTemplate"""
    
    def test_report_template_creation(self):
        """Prueba la creación y atributos de una plantilla de reporte"""
        template = ReportTemplate.objects.create(
            name='Reporte de Medicamentos',
            report_type='medications',
            description='Reporte de inventario de medicamentos',
            query_config={'model': 'pharmacy.Medication'},
            columns_config=[
                {'field': 'name', 'label': 'Medicamento'},
                {'field': 'quantity_in_stock', 'label': 'Stock'}
            ],
            filters_config={'category': True, 'low_stock': True},
            is_active=True,
            created_by=self.admin
        )
        
        self.assertEqual(template.name, 'Reporte de Medicamentos')
        self.assertEqual(template.report_type, 'medications')
        self.assertEqual(template.description, 'Reporte de inventario de medicamentos')
        self.assertEqual(template.query_config['model'], 'pharmacy.Medication')
        self.assertEqual(len(template.columns_config), 2)
        self.assertTrue(template.is_active)
        self.assertEqual(template.created_by, self.admin)
        self.assertIsNotNone(template.created_at)
        self.assertIsNotNone(template.updated_at)
    
    def test_report_template_str_representation(self):
        """Prueba la representación string de una plantilla"""
        expected_str = "Reporte de Citas Mensual (Reporte de Citas)"
        self.assertEqual(str(self.report_template), expected_str)
    
    def test_report_template_types(self):
        """Prueba los diferentes tipos de reportes"""
        report_types = [
            'appointments', 'patients', 'medications', 'financial',
            'emergency', 'occupancy', 'lab_tests', 'custom'
        ]
        
        for report_type in report_types:
            template = ReportTemplate.objects.create(
                name=f'Template {report_type}',
                report_type=report_type,
                query_config={},
                columns_config=[],
                created_by=self.admin
            )
            self.assertEqual(template.report_type, report_type)
    
    def test_report_template_json_fields(self):
        """Prueba los campos JSON de configuración"""
        # Verificar que los campos JSON se guardan correctamente
        self.assertIsInstance(self.report_template.query_config, dict)
        self.assertIsInstance(self.report_template.columns_config, list)
        self.assertIsInstance(self.report_template.filters_config, dict)
        
        # Verificar contenido
        self.assertIn('model', self.report_template.query_config)
        self.assertIn('filters', self.report_template.query_config)
        self.assertEqual(len(self.report_template.columns_config), 4)


class GeneratedReportModelTests(BaseReportTestCase):
    """Tests para el modelo GeneratedReport"""
    
    def test_generated_report_creation(self):
        """Prueba la creación y atributos de un reporte generado"""
        report = GeneratedReport.objects.create(
            name='Reporte de Emergencias',
            report_type='emergency',
            format='csv',
            status='pending',
            parameters={'priority': 'high'},
            generated_by=self.admin
        )
        
        self.assertEqual(report.name, 'Reporte de Emergencias')
        self.assertEqual(report.report_type, 'emergency')
        self.assertEqual(report.format, 'csv')
        self.assertEqual(report.status, 'pending')
        self.assertEqual(report.parameters['priority'], 'high')
        self.assertEqual(report.generated_by, self.admin)
        self.assertIsInstance(report.report_id, uuid.UUID)
        self.assertIsNone(report.file)
        self.assertIsNone(report.completed_at)
        self.assertIsNotNone(report.created_at)
    
    def test_generated_report_str_representation(self):
        """Prueba la representación string de un reporte generado"""
        expected_str = f"Reporte Citas Octubre 2024 - {self.generated_report.created_at.strftime('%Y-%m-%d %H:%M')}"
        self.assertEqual(str(self.generated_report), expected_str)
    
    def test_generated_report_is_expired_property(self):
        """Prueba la propiedad is_expired"""
        # Reporte sin fecha de expiración
        self.assertFalse(self.generated_report.is_expired)
        
        # Reporte con fecha de expiración futura
        self.generated_report.expires_at = timezone.now() + timedelta(days=7)
        self.generated_report.save()
        self.assertFalse(self.generated_report.is_expired)
        
        # Reporte con fecha de expiración pasada
        self.generated_report.expires_at = timezone.now() - timedelta(days=1)
        self.generated_report.save()
        self.assertTrue(self.generated_report.is_expired)
    
    def test_generated_report_status_transitions(self):
        """Prueba las transiciones de estado"""
        statuses = ['pending', 'processing', 'completed', 'failed']
        
        for status_value in statuses:
            report = GeneratedReport.objects.create(
                name=f'Report {status_value}',
                report_type='custom',
                format='json',
                status=status_value,
                generated_by=self.admin
            )
            self.assertEqual(report.status, status_value)
    
    def test_generated_report_formats(self):
        """Prueba los diferentes formatos de reporte"""
        formats = ['pdf', 'excel', 'csv', 'json']
        
        for format_type in formats:
            report = GeneratedReport.objects.create(
                name=f'Report {format_type}',
                report_type='custom',
                format=format_type,
                generated_by=self.admin
            )
            self.assertEqual(report.format, format_type)
    
    def test_generated_report_with_file(self):
        """Prueba un reporte con archivo adjunto"""
        report = GeneratedReport.objects.create(
            name='Reporte con archivo',
            report_type='patients',
            format='excel',
            status='completed',
            generated_by=self.admin
        )
        
        # Simular archivo
        file_content = b'Excel file content'
        report.file.save('test_report.xlsx', ContentFile(file_content))
        report.file_size = len(file_content)
        report.row_count = 100
        report.generation_time = 1.5
        report.completed_at = timezone.now()
        report.save()
        
        self.assertIsNotNone(report.file)
        self.assertEqual(report.file_size, len(file_content))
        self.assertEqual(report.row_count, 100)
        self.assertEqual(report.generation_time, 1.5)
        self.assertIsNotNone(report.completed_at)


class ScheduledReportModelTests(BaseReportTestCase):
    """Tests para el modelo ScheduledReport"""
    
    def test_scheduled_report_creation(self):
        """Prueba la creación y atributos de un reporte programado"""
        report = ScheduledReport.objects.create(
            template=self.report_template,
            name='Reporte Diario de Citas',
            frequency='daily',
            time_of_day=time(6, 0),
            format='pdf',
            recipients=['manager@hospital.com'],
            include_in_email=False,
            is_active=True,
            created_by=self.admin
        )
        
        self.assertEqual(report.template, self.report_template)
        self.assertEqual(report.name, 'Reporte Diario de Citas')
        self.assertEqual(report.frequency, 'daily')
        self.assertEqual(report.time_of_day, time(6, 0))
        self.assertEqual(report.format, 'pdf')
        self.assertEqual(report.recipients, ['manager@hospital.com'])
        self.assertFalse(report.include_in_email)
        self.assertTrue(report.is_active)
        self.assertEqual(report.created_by, self.admin)
        self.assertIsNone(report.last_run)
        self.assertIsNone(report.next_run)
    
    def test_scheduled_report_str_representation(self):
        """Prueba la representación string de un reporte programado"""
        expected_str = "Reporte Semanal de Citas (Semanal)"
        self.assertEqual(str(self.scheduled_report), expected_str)
    
    def test_scheduled_report_calculate_next_run_daily(self):
        """Prueba el cálculo de próxima ejecución para reportes diarios"""
        report = ScheduledReport.objects.create(
            template=self.report_template,
            name='Reporte Diario',
            frequency='daily',
            time_of_day=time(9, 0),
            format='csv',
            created_by=self.admin
        )
        
        next_run = report.calculate_next_run()
        self.assertIsNotNone(next_run)
        self.assertEqual(next_run.hour, 9)
        self.assertEqual(next_run.minute, 0)
        
        # Si la hora ya pasó hoy, debe ser mañana
        now = timezone.now()
        if now.hour >= 9:
            self.assertEqual(next_run.date(), (now + timedelta(days=1)).date())
        else:
            self.assertEqual(next_run.date(), now.date())
    
    def test_scheduled_report_calculate_next_run_weekly(self):
        """Prueba el cálculo de próxima ejecución para reportes semanales"""
        report = ScheduledReport.objects.create(
            template=self.report_template,
            name='Reporte Semanal',
            frequency='weekly',
            time_of_day=time(10, 0),
            day_of_week=2,  # Miércoles
            format='pdf',
            created_by=self.admin
        )
        
        next_run = report.calculate_next_run()
        self.assertIsNotNone(next_run)
        self.assertEqual(next_run.weekday(), 2)  # Miércoles
        self.assertEqual(next_run.hour, 10)
    
    def test_scheduled_report_calculate_next_run_monthly(self):
        """Prueba el cálculo de próxima ejecución para reportes mensuales"""
        report = ScheduledReport.objects.create(
            template=self.report_template,
            name='Reporte Mensual',
            frequency='monthly',
            time_of_day=time(8, 0),
            day_of_month=15,
            format='excel',
            created_by=self.admin
        )
        
        next_run = report.calculate_next_run()
        self.assertIsNotNone(next_run)
        self.assertEqual(next_run.day, 15)
        self.assertEqual(next_run.hour, 8)
    
    def test_scheduled_report_frequency_types(self):
        """Prueba los diferentes tipos de frecuencia"""
        frequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
        
        for frequency in frequencies:
            report = ScheduledReport.objects.create(
                template=self.report_template,
                name=f'Reporte {frequency}',
                frequency=frequency,
                time_of_day=time(12, 0),
                format='json',
                created_by=self.admin
            )
            self.assertEqual(report.frequency, frequency)


class ReportAuditModelTests(BaseReportTestCase):
    """Tests para el modelo ReportAudit"""
    
    def test_report_audit_creation(self):
        """Prueba la creación y atributos de un registro de auditoría"""
        audit = ReportAudit.objects.create(
            report=self.generated_report,
            user=self.regular_user,
            action='viewed',
            ip_address='192.168.1.100',
            user_agent='Chrome/120.0',
            metadata={'view_duration': 30}
        )
        
        self.assertEqual(audit.report, self.generated_report)
        self.assertEqual(audit.user, self.regular_user)
        self.assertEqual(audit.action, 'viewed')
        self.assertEqual(audit.ip_address, '192.168.1.100')
        self.assertEqual(audit.user_agent, 'Chrome/120.0')
        self.assertEqual(audit.metadata['view_duration'], 30)
        self.assertIsNotNone(audit.timestamp)
    
    def test_report_audit_str_representation(self):
        """Prueba la representación string de un registro de auditoría"""
        expected_str = f"{self.admin} - Generado - {self.generated_report.name}"
        self.assertEqual(str(self.audit_log), expected_str)
    
    def test_report_audit_action_types(self):
        """Prueba los diferentes tipos de acciones"""
        actions = ['generated', 'viewed', 'downloaded', 'emailed', 'deleted']
        
        for action in actions:
            audit = ReportAudit.objects.create(
                report=self.generated_report,
                user=self.admin,
                action=action
            )
            self.assertEqual(audit.action, action)


class ReportSerializerTests(BaseReportTestCase):
    """Tests para los serializadores de reports"""
    
    def test_report_template_serializer(self):
        """Prueba el serializador de ReportTemplate"""
        serializer = ReportTemplateSerializer(self.report_template)
        expected_fields = [
            'id', 'name', 'report_type', 'report_type_display',
            'description', 'query_config', 'columns_config',
            'filters_config', 'is_active', 'created_by',
            'created_by_name', 'created_at', 'updated_at'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
        self.assertEqual(serializer.data['created_by_name'], self.admin.get_full_name())
        self.assertEqual(serializer.data['report_type_display'], 'Reporte de Citas')
    
    def test_generated_report_serializer(self):
        """Prueba el serializador de GeneratedReport"""
        serializer = GeneratedReportSerializer(self.generated_report)
        
        self.assertIn('report_id', serializer.data)
        self.assertIn('template_name', serializer.data)
        self.assertIn('generated_by_name', serializer.data)
        self.assertIn('report_type_display', serializer.data)
        self.assertIn('format_display', serializer.data)
        self.assertIn('status_display', serializer.data)
        self.assertIn('is_expired', serializer.data)
        
        self.assertEqual(serializer.data['template_name'], self.report_template.name)
        self.assertEqual(serializer.data['generated_by_name'], self.admin.get_full_name())
        self.assertEqual(serializer.data['format_display'], 'PDF')
        self.assertEqual(serializer.data['status_display'], 'Completado')
        self.assertFalse(serializer.data['is_expired'])
    
    def test_scheduled_report_serializer(self):
        """Prueba el serializador de ScheduledReport"""
        serializer = ScheduledReportSerializer(self.scheduled_report)
        
        self.assertIn('template_name', serializer.data)
        self.assertIn('created_by_name', serializer.data)
        self.assertIn('frequency_display', serializer.data)
        self.assertIn('format_display', serializer.data)
        
        self.assertEqual(serializer.data['template_name'], self.report_template.name)
        self.assertEqual(serializer.data['frequency_display'], 'Semanal')
        self.assertEqual(serializer.data['day_of_week'], 0)
        self.assertEqual(serializer.data['recipients'], ['admin@hospital.com', 'director@hospital.com'])
    
    def test_scheduled_report_serializer_validation(self):
        """Prueba la validación del serializador de ScheduledReport"""
        # Reporte semanal sin día de la semana
        data = {
            'template': self.report_template.id,
            'name': 'Test Weekly',
            'frequency': 'weekly',
            'time_of_day': '10:00:00',
            'format': 'pdf'
        }
        serializer = ScheduledReportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('day_of_week', serializer.errors)
        
        # Reporte mensual sin día del mes
        data['frequency'] = 'monthly'
        serializer = ScheduledReportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('day_of_month', serializer.errors)
    
    def test_report_audit_serializer(self):
        """Prueba el serializador de ReportAudit"""
        serializer = ReportAuditSerializer(self.audit_log)
        
        self.assertIn('user_name', serializer.data)
        self.assertIn('action_display', serializer.data)
        self.assertIn('report_name', serializer.data)
        
        self.assertEqual(serializer.data['user_name'], self.admin.get_full_name())
        self.assertEqual(serializer.data['action_display'], 'Generado')
        self.assertEqual(serializer.data['report_name'], self.generated_report.name)


class ReportAPITests(APITestCase):
    """Tests para la API de Reports"""
    
    def setUp(self):
        # Crear usuarios
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            role='admin'
        )
        
        self.regular_user = User.objects.create_user(email='user@hospital.com',
            password='userpassword',
            role='doctor'
        )
        
        # Crear plantilla de reporte
        self.report_template = ReportTemplate.objects.create(
            name='Template de Prueba',
            report_type='appointments',
            query_config={},
            columns_config=[],
            created_by=self.admin
        )
        
        # URLs de la API
        self.template_list_url = reverse('reporttemplate-list')
        self.generated_list_url = reverse('generatedreport-list')
        self.generate_report_url = reverse('generatedreport-generate')
        self.scheduled_list_url = reverse('scheduledreport-list')
        self.dashboard_summary_url = reverse('dashboardstats-summary')
    
    def test_unauthenticated_access_denied(self):
        """Prueba que usuarios no autenticados no puedan acceder"""
        response = self.client.get(self.template_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_report_template(self):
        """Prueba crear una plantilla de reporte"""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'name': 'Nueva Plantilla',
            'report_type': 'medications',
            'description': 'Plantilla para reportes de medicamentos',
            'query_config': {'model': 'pharmacy.Medication'},
            'columns_config': [
                {'field': 'name', 'label': 'Medicamento'}
            ],
            'filters_config': {},
            'is_active': True
        }
        
        response = self.client.post(self.template_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReportTemplate.objects.count(), 2)
        
        # Verificar los datos creados
        template = ReportTemplate.objects.get(name='Nueva Plantilla')
        self.assertEqual(template.report_type, 'medications')
        self.assertEqual(template.created_by, self.admin)
    
    def test_generate_report(self):
        """Prueba generar un reporte"""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'template_id': self.report_template.id,
            'report_type': 'appointments',
            'name': 'Reporte de Prueba',
            'format': 'csv',
            'start_date': '2024-01-01',
            'end_date': '2024-01-31',
            'parameters': {'status': 'completed'}
        }
        
        response = self.client.post(self.generate_report_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que se creó el reporte
        report = GeneratedReport.objects.get(name='Reporte de Prueba')
        self.assertEqual(report.report_type, 'appointments')
        self.assertEqual(report.format, 'csv')
        self.assertEqual(report.status, 'pending')
        self.assertEqual(report.generated_by, self.admin)
        
        # Verificar que se creó el registro de auditoría
        audit = ReportAudit.objects.filter(
            report=report,
            action='generated'
        ).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.user, self.admin)
    
    def test_generate_report_validation(self):
        """Prueba la validación al generar reportes"""
        self.client.force_authenticate(user=self.admin)
        
        # Sin template_id ni name
        data = {
            'report_type': 'appointments',
            'format': 'pdf'
        }
        response = self.client.post(self.generate_report_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Fecha de inicio posterior a fecha de fin
        data = {
            'template_id': self.report_template.id,
            'report_type': 'appointments',
            'format': 'pdf',
            'start_date': '2024-01-31',
            'end_date': '2024-01-01'
        }
        response = self.client.post(self.generate_report_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_download_report(self):
        """Prueba descargar un reporte completado"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear reporte completado
        report = GeneratedReport.objects.create(
            name='Reporte para Descarga',
            report_type='patients',
            format='pdf',
            status='completed',
            generated_by=self.admin
        )
        report.file.save('test.pdf', ContentFile(b'PDF content'))
        
        download_url = reverse('generatedreport-download', args=[report.id])
        response = self.client.get(download_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('attachment', response['Content-Disposition'])
        
        # Verificar auditoría
        audit = ReportAudit.objects.filter(
            report=report,
            action='downloaded'
        ).first()
        self.assertIsNotNone(audit)
    
    def test_preview_report(self):
        """Prueba vista previa de reporte JSON/CSV"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear reporte JSON
        report = GeneratedReport.objects.create(
            name='Reporte JSON',
            report_type='custom',
            format='json',
            status='completed',
            generated_by=self.admin
        )
        json_data = {'data': [{'id': 1, 'name': 'Test'}]}
        report.file.save('test.json', ContentFile(json.dumps(json_data).encode()))
        
        preview_url = reverse('generatedreport-preview', args=[report.id])
        response = self.client.get(preview_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, json_data)
        
        # Verificar auditoría
        audit = ReportAudit.objects.filter(
            report=report,
            action='viewed'
        ).first()
        self.assertIsNotNone(audit)
    
    def test_create_scheduled_report(self):
        """Prueba crear un reporte programado"""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'template': self.report_template.id,
            'name': 'Reporte Diario Automático',
            'frequency': 'daily',
            'time_of_day': '07:00:00',
            'format': 'excel',
            'recipients': ['manager@hospital.com', 'admin@hospital.com'],
            'include_in_email': True,
            'is_active': True
        }
        
        response = self.client.post(self.scheduled_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que se creó y calculó next_run
        scheduled = ScheduledReport.objects.get(name='Reporte Diario Automático')
        self.assertEqual(scheduled.frequency, 'daily')
        self.assertEqual(scheduled.created_by, self.admin)
        self.assertIsNotNone(scheduled.next_run)
    
    def test_toggle_scheduled_report(self):
        """Prueba activar/desactivar un reporte programado"""
        self.client.force_authenticate(user=self.admin)
        
        scheduled = ScheduledReport.objects.create(
            template=self.report_template,
            name='Reporte Toggle Test',
            frequency='weekly',
            time_of_day=time(9, 0),
            day_of_week=1,
            format='pdf',
            is_active=True,
            created_by=self.admin
        )
        
        toggle_url = reverse('scheduledreport-toggle-active', args=[scheduled.id])
        
        # Desactivar
        response = self.client.post(toggle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])
        
        # Activar
        response = self.client.post(toggle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_active'])
        self.assertIsNotNone(response.data['next_run'])
    
    def test_run_scheduled_report_now(self):
        """Prueba ejecutar un reporte programado inmediatamente"""
        self.client.force_authenticate(user=self.admin)
        
        scheduled = ScheduledReport.objects.create(
            template=self.report_template,
            name='Reporte Manual',
            frequency='monthly',
            time_of_day=time(8, 0),
            day_of_month=1,
            format='csv',
            created_by=self.admin
        )
        
        run_now_url = reverse('scheduledreport-run-now', args=[scheduled.id])
        response = self.client.post(run_now_url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que se creó el reporte
        report = GeneratedReport.objects.filter(
            name__contains='Reporte Manual - Manual'
        ).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.status, 'pending')
    
    def test_dashboard_summary(self):
        """Prueba obtener el resumen del dashboard"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(self.dashboard_summary_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar estructura de datos
        expected_sections = ['appointments', 'patients', 'emergency', 'prescriptions']
        for section in expected_sections:
            self.assertIn(section, response.data)
        
        self.assertIn('generated_at', response.data)
        
        # Verificar sub-campos
        self.assertIn('today', response.data['appointments'])
        self.assertIn('pending', response.data['appointments'])
        self.assertIn('total', response.data['patients'])
        self.assertIn('new_this_month', response.data['patients'])
    
    def test_filter_generated_reports(self):
        """Prueba filtrar reportes generados"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear reportes adicionales
        GeneratedReport.objects.create(
            name='Reporte Fallido',
            report_type='medications',
            format='pdf',
            status='failed',
            generated_by=self.admin
        )
        
        GeneratedReport.objects.create(
            name='Reporte Usuario Regular',
            report_type='patients',
            format='csv',
            status='completed',
            generated_by=self.regular_user
        )
        
        # Filtrar por tipo
        response = self.client.get(self.generated_list_url, {'report_type': 'medications'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Filtrar por estado
        response = self.client.get(self.generated_list_url, {'status': 'failed'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_regular_user_permissions(self):
        """Prueba permisos de usuario regular"""
        self.client.force_authenticate(user=self.regular_user)
        
        # Usuario regular solo ve sus propios reportes
        GeneratedReport.objects.create(
            name='Mi Reporte',
            report_type='custom',
            format='json',
            generated_by=self.regular_user
        )
        
        GeneratedReport.objects.create(
            name='Reporte de Admin',
            report_type='custom',
            format='json',
            generated_by=self.admin
        )
        
        response = self.client.get(self.generated_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Mi Reporte')