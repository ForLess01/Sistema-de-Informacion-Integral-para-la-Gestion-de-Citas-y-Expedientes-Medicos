"""
Tests para comandos de Django management
"""
import os
import tempfile
from io import StringIO
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from django.utils import timezone
from django.db import connection

from tests.base import BaseTestCase, IntegrationTestCase, TestUtils
from authentication.models import User
from appointments.models import Appointment, Specialty, MedicalSchedule
from medical_records.models import MedicalRecord, VitalSigns
from pharmacy.models import Medication, StockMovement
from emergency.models import EmergencyCase
from notifications.models import Notification
from reports.models import GeneratedReport


class CreateSuperuserCommandTests(BaseTestCase):
    """Tests para el comando createsuperuser personalizado"""
    
    def test_create_superuser_command(self):
        """Test de creación de superusuario"""
        out = StringIO()
        
        # Simular entrada interactiva
        with patch('builtins.input', side_effect=['admin', 'admin@hospital.com', 'AdminPass123!', 'AdminPass123!']):
            call_command('createsuperuser', stdout=out)
            
        # Verificar que el usuario fue creado
        admin = User.objects.get(username='admin')
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertEqual(admin.email, 'admin@hospital.com')
        self.assertEqual(admin.role, 'admin')
        
    def test_create_superuser_with_weak_password(self):
        """Test de creación con contraseña débil"""
        with patch('builtins.input', side_effect=['admin2', 'admin2@hospital.com', '123', '123']):
            with self.assertRaises(CommandError):
                call_command('createsuperuser')
                
        # Verificar que el usuario no fue creado
        self.assertFalse(User.objects.filter(username='admin2').exists())


class InitializeDataCommandTests(IntegrationTestCase):
    """Tests para comando de inicialización de datos"""
    
    def test_initialize_demo_data(self):
        """Test de inicialización de datos de demostración"""
        out = StringIO()
        
        call_command('initialize_demo_data', stdout=out)
        
        output = out.getvalue()
        
        # Verificar que se crearon datos
        self.assertIn('Creando usuarios de demostración', output)
        self.assertIn('Creando especialidades', output)
        self.assertIn('Creando medicamentos', output)
        
        # Verificar datos creados
        self.assertGreater(User.objects.filter(role='doctor').count(), 0)
        self.assertGreater(User.objects.filter(role='patient').count(), 0)
        self.assertGreater(Specialty.objects.count(), 0)
        self.assertGreater(Medication.objects.count(), 0)
        
    def test_initialize_demo_data_skip_if_exists(self):
        """Test que no duplica datos si ya existen"""
        # Primera ejecución
        call_command('initialize_demo_data', verbosity=0)
        
        initial_doctors = User.objects.filter(role='doctor').count()
        initial_patients = User.objects.filter(role='patient').count()
        
        # Segunda ejecución
        out = StringIO()
        call_command('initialize_demo_data', stdout=out)
        
        # Verificar que no se duplicaron datos
        self.assertEqual(User.objects.filter(role='doctor').count(), initial_doctors)
        self.assertEqual(User.objects.filter(role='patient').count(), initial_patients)
        self.assertIn('Los datos de demostración ya existen', out.getvalue())


class CleanupCommandTests(IntegrationTestCase):
    """Tests para comandos de limpieza"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    def test_cleanup_old_appointments(self):
        """Test de limpieza de citas antiguas"""
        doctor = self.test_utils.create_doctor('doctor1')
        patient = self.test_utils.create_patient('patient1')
        
        # Crear citas antiguas
        old_appointments = []
        for i in range(5):
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=timezone.now() - timedelta(days=100 + i),
                status='completed',
                reason='Cita antigua'
            )
            old_appointments.append(appointment)
            
        # Crear citas recientes
        recent_appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_date=timezone.now() - timedelta(days=10),
            status='completed',
            reason='Cita reciente'
        )
        
        out = StringIO()
        call_command('cleanup_old_appointments', days=90, stdout=out)
        
        # Verificar que solo se eliminaron las citas antiguas
        self.assertEqual(Appointment.objects.filter(id__in=[a.id for a in old_appointments]).count(), 0)
        self.assertTrue(Appointment.objects.filter(id=recent_appointment.id).exists())
        self.assertIn('5 citas antiguas eliminadas', out.getvalue())
        
    def test_cleanup_expired_notifications(self):
        """Test de limpieza de notificaciones expiradas"""
        user = self.test_utils.create_patient('patient1')
        
        # Crear notificaciones antiguas
        for i in range(10):
            Notification.objects.create(
                user=user,
                title='Notificación antigua',
                message='Mensaje',
                notification_type='general',
                created_at=timezone.now() - timedelta(days=40 + i)
            )
            
        # Crear notificación reciente
        recent = Notification.objects.create(
            user=user,
            title='Notificación reciente',
            message='Mensaje',
            notification_type='general'
        )
        
        out = StringIO()
        call_command('cleanup_notifications', days=30, stdout=out)
        
        # Verificar limpieza
        self.assertEqual(Notification.objects.filter(title='Notificación antigua').count(), 0)
        self.assertTrue(Notification.objects.filter(id=recent.id).exists())
        self.assertIn('10 notificaciones eliminadas', out.getvalue())
        
    def test_cleanup_with_dry_run(self):
        """Test de modo dry-run (sin eliminar)"""
        user = self.test_utils.create_patient('patient1')
        
        # Crear notificaciones antiguas
        for i in range(5):
            Notification.objects.create(
                user=user,
                title='Test',
                message='Test',
                notification_type='general',
                created_at=timezone.now() - timedelta(days=40)
            )
            
        initial_count = Notification.objects.count()
        
        out = StringIO()
        call_command('cleanup_notifications', days=30, dry_run=True, stdout=out)
        
        # Verificar que no se eliminó nada
        self.assertEqual(Notification.objects.count(), initial_count)
        self.assertIn('DRY RUN', out.getvalue())
        self.assertIn('Se eliminarían 5 notificaciones', out.getvalue())


class DatabaseMaintenanceCommandTests(IntegrationTestCase):
    """Tests para comandos de mantenimiento de base de datos"""
    
    def test_analyze_database_command(self):
        """Test de análisis de base de datos"""
        out = StringIO()
        
        call_command('analyze_database', stdout=out)
        
        output = out.getvalue()
        
        # Verificar output
        self.assertIn('Analizando base de datos', output)
        self.assertIn('Tablas analizadas', output)
        self.assertIn('authentication_user', output)
        self.assertIn('appointments_appointment', output)
        
    def test_vacuum_database_command(self):
        """Test de vacuum de base de datos (solo PostgreSQL)"""
        if connection.vendor != 'postgresql':
            self.skipTest('Vacuum solo disponible en PostgreSQL')
            
        out = StringIO()
        
        call_command('vacuum_database', stdout=out)
        
        output = out.getvalue()
        self.assertIn('Vacuum completado', output)
        
    def test_check_indexes_command(self):
        """Test de verificación de índices"""
        out = StringIO()
        
        call_command('check_indexes', stdout=out)
        
        output = out.getvalue()
        
        # Verificar que lista índices importantes
        self.assertIn('Verificando índices', output)
        self.assertIn('appointments_appointment', output)
        
        # Verificar sugerencias si faltan índices
        if 'FALTA ÍNDICE' in output:
            self.assertIn('Se recomienda crear', output)


class ExportImportCommandTests(IntegrationTestCase):
    """Tests para comandos de exportación/importación"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.temp_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        super().tearDown()
        # Limpiar directorio temporal
        import shutil
        shutil.rmtree(self.temp_dir)
        
    def test_export_medications_command(self):
        """Test de exportación de medicamentos"""
        # Crear medicamentos
        medications = []
        for i in range(5):
            med = Medication.objects.create(
                name=f'Medicamento {i}',
                generic_name=f'Genérico {i}',
                presentation='Tabletas',
                quantity_per_unit=30,
                unit_price=Decimal('10.00')
            )
            medications.append(med)
            
        output_file = os.path.join(self.temp_dir, 'medications.csv')
        
        out = StringIO()
        call_command('export_medications', output=output_file, stdout=out)
        
        # Verificar archivo creado
        self.assertTrue(os.path.exists(output_file))
        self.assertIn('5 medicamentos exportados', out.getvalue())
        
        # Verificar contenido
        with open(output_file, 'r', encoding='utf-8') as f:
            content = f.read()
            for med in medications:
                self.assertIn(med.name, content)
                
    def test_import_medications_command(self):
        """Test de importación de medicamentos"""
        # Crear archivo CSV de prueba
        csv_content = """name,generic_name,presentation,quantity_per_unit,unit_price,requires_prescription
Aspirina,Ácido acetilsalicílico,Tabletas 100mg,30,5.50,false
Amoxicilina,Amoxicilina,Cápsulas 500mg,21,12.00,true
"""
        
        input_file = os.path.join(self.temp_dir, 'import_meds.csv')
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(csv_content)
            
        out = StringIO()
        call_command('import_medications', input=input_file, stdout=out)
        
        # Verificar importación
        self.assertTrue(Medication.objects.filter(name='Aspirina').exists())
        self.assertTrue(Medication.objects.filter(name='Amoxicilina').exists())
        self.assertIn('2 medicamentos importados', out.getvalue())
        
    def test_export_patient_data_command(self):
        """Test de exportación de datos de paciente (GDPR)"""
        patient = self.test_utils.create_patient('patient1')
        
        # Crear datos relacionados
        medical_record = MedicalRecord.objects.create(
            patient=patient,
            blood_type='O+',
            emergency_contact_name='Contact',
            emergency_contact_phone='+1234567890'
        )
        
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=self.test_utils.create_doctor('doctor1'),
            appointment_date=timezone.now() + timedelta(days=1),
            reason='Consulta'
        )
        
        output_file = os.path.join(self.temp_dir, 'patient_data.json')
        
        out = StringIO()
        call_command('export_patient_data', 
                    patient_id=patient.id, 
                    output=output_file, 
                    stdout=out)
        
        # Verificar archivo
        self.assertTrue(os.path.exists(output_file))
        
        # Verificar contenido
        import json
        with open(output_file, 'r') as f:
            data = json.load(f)
            
        self.assertEqual(data['user']['username'], 'patient1')
        self.assertEqual(data['medical_record']['blood_type'], 'O+')
        self.assertEqual(len(data['appointments']), 1)


class ScheduledTasksCommandTests(IntegrationTestCase):
    """Tests para comandos de tareas programadas"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_send_appointment_reminders_command(self):
        """Test de envío de recordatorios de citas"""
        doctor = self.test_utils.create_doctor('doctor1')
        
        # Crear citas para mañana
        tomorrow = timezone.now() + timedelta(days=1)
        
        patients = []
        for i in range(3):
            patient = self.test_utils.create_patient(f'patient{i}')
            patients.append(patient)
            
            Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=tomorrow.replace(hour=10+i, minute=0),
                status='confirmed',
                reason='Consulta'
            )
            
        out = StringIO()
        call_command('send_appointment_reminders', stdout=out)
        
        output = out.getvalue()
        
        # Verificar envío
        self.assertIn('3 recordatorios enviados', output)
        
        # Verificar notificaciones creadas
        for patient in patients:
            notifications = Notification.objects.filter(
                user=patient,
                notification_type='appointment_reminder'
            )
            self.assertEqual(notifications.count(), 1)
            
    def test_generate_daily_reports_command(self):
        """Test de generación de reportes diarios"""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@hospital.com',
            password='AdminPass123!'
        )
        
        # Crear datos para el reporte
        doctor = self.test_utils.create_doctor('doctor1')
        
        for i in range(5):
            patient = self.test_utils.create_patient(f'patient{i}')
            Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=timezone.now() - timedelta(hours=i),
                status='completed',
                reason='Consulta'
            )
            
        out = StringIO()
        call_command('generate_daily_reports', stdout=out)
        
        output = out.getvalue()
        
        # Verificar generación
        self.assertIn('Reporte diario generado', output)
        
        # Verificar que se creó el reporte
        reports = Report.objects.filter(
            report_type='daily_summary',
            created_at__date=timezone.now().date()
        )
        self.assertEqual(reports.count(), 1)
        
    def test_check_inventory_alerts_command(self):
        """Test de verificación de alertas de inventario"""
        # Crear medicamentos con bajo stock
        low_stock_meds = []
        
        for i in range(3):
            med = Medication.objects.create(
                name=f'Medicamento Bajo {i}',
                generic_name=f'Genérico {i}',
                presentation='Tabletas',
                quantity_per_unit=30,
                unit_price=Decimal('10.00')
            )
            
            Inventory.objects.create(
                medication=med,
                quantity=5,  # Bajo stock
                batch_number=f'BATCH{i}',
                expiration_date=timezone.now().date() + timedelta(days=180),
                minimum_stock=20
            )
            
            low_stock_meds.append(med)
            
        # Crear medicamento por expirar
        expiring_med = Medication.objects.create(
            name='Medicamento Por Expirar',
            generic_name='Genérico Exp',
            presentation='Tabletas',
            quantity_per_unit=30,
            unit_price=Decimal('15.00')
        )
        
        Inventory.objects.create(
            medication=expiring_med,
            quantity=50,
            batch_number='BATCHEXP',
            expiration_date=timezone.now().date() + timedelta(days=10),  # Expira pronto
            minimum_stock=20
        )
        
        out = StringIO()
        call_command('check_inventory_alerts', stdout=out)
        
        output = out.getvalue()
        
        # Verificar alertas
        self.assertIn('3 medicamentos con stock bajo', output)
        self.assertIn('1 medicamento próximo a expirar', output)
        
        # Verificar notificaciones creadas
        admin = User.objects.filter(role='admin').first()
        if admin:
            notifications = Notification.objects.filter(
                user=admin,
                notification_type__in=['low_inventory', 'expiring_medication']
            )
            self.assertGreater(notifications.count(), 0)


class SystemHealthCommandTests(IntegrationTestCase):
    """Tests para comandos de salud del sistema"""
    
    def test_check_system_health_command(self):
        """Test de verificación de salud del sistema"""
        out = StringIO()
        
        call_command('check_system_health', stdout=out)
        
        output = out.getvalue()
        
        # Verificar componentes chequeados
        self.assertIn('Verificando salud del sistema', output)
        self.assertIn('Base de datos', output)
        self.assertIn('Cache', output)
        self.assertIn('Almacenamiento', output)
        self.assertIn('Celery', output)
        
        # Verificar estados
        self.assertIn('OK', output)
        
    def test_generate_system_stats_command(self):
        """Test de generación de estadísticas del sistema"""
        # Crear algunos datos
        for i in range(10):
            self.test_utils.create_patient(f'stat_patient_{i}')
            
        for i in range(3):
            self.test_utils.create_doctor(f'stat_doctor_{i}')
            
        out = StringIO()
        
        call_command('generate_system_stats', stdout=out)
        
        output = out.getvalue()
        
        # Verificar estadísticas
        self.assertIn('Estadísticas del Sistema', output)
        self.assertIn('Total de usuarios:', output)
        self.assertIn('Pacientes:', output)
        self.assertIn('Doctores:', output)
        self.assertIn('Citas:', output)
        self.assertIn('Uso de almacenamiento:', output)


class CustomValidationCommandTests(BaseTestCase):
    """Tests para comandos de validación personalizados"""
    
    def test_validate_data_integrity_command(self):
        """Test de validación de integridad de datos"""
        # Crear datos con problemas potenciales
        patient = User.objects.create_user(email='orphan@test.com',
            password='Pass123!',
            role='patient'
        )
        
        # No crear expediente médico (problema de integridad)
        
        out = StringIO()
        err = StringIO()
        
        call_command('validate_data_integrity', stdout=out, stderr=err)
        
        output = out.getvalue()
        errors = err.getvalue()
        
        # Verificar detección de problemas
        self.assertIn('Validando integridad de datos', output)
        
        if 'pacientes sin expediente médico' in errors:
            self.assertIn('orphan_patient', errors)
            
    def test_fix_data_issues_command(self):
        """Test de corrección de problemas de datos"""
        # Crear paciente sin expediente
        patient = User.objects.create_user(email='fix@test.com',
            password='Pass123!',
            role='patient'
        )
        
        self.assertFalse(hasattr(patient, 'medical_record'))
        
        out = StringIO()
        
        call_command('fix_data_issues', auto_fix=True, stdout=out)
        
        # Verificar corrección
        patient.refresh_from_db()
        self.assertTrue(hasattr(patient, 'medical_record'))
        self.assertIn('Expediente médico creado para fix_patient', out.getvalue())


class BackupRestoreCommandTests(IntegrationTestCase):
    """Tests para comandos de backup y restauración"""
    
    def setUp(self):
        super().setUp()
        self.backup_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        super().tearDown()
        import shutil
        shutil.rmtree(self.backup_dir)
        
    @override_settings(BACKUP_DIR=property(lambda self: self.backup_dir))
    def test_backup_database_command(self):
        """Test de backup de base de datos"""
        # Crear algunos datos
        self.test_utils.create_patient('backup_patient')
        self.test_utils.create_doctor('backup_doctor')
        
        out = StringIO()
        
        call_command('backup_database', 
                    output_dir=self.backup_dir,
                    stdout=out)
        
        output = out.getvalue()
        
        # Verificar creación de backup
        self.assertIn('Backup completado', output)
        
        # Verificar que se creó archivo
        backup_files = os.listdir(self.backup_dir)
        self.assertGreater(len(backup_files), 0)
        
        # Verificar que el archivo contiene datos
        backup_file = os.path.join(self.backup_dir, backup_files[0])
        self.assertGreater(os.path.getsize(backup_file), 0)
        
    def test_backup_with_encryption(self):
        """Test de backup con encriptación"""
        out = StringIO()
        
        with patch.dict(os.environ, {'BACKUP_ENCRYPTION_KEY': 'test-key-123'}):
            call_command('backup_database',
                        output_dir=self.backup_dir,
                        encrypt=True,
                        stdout=out)
            
        output = out.getvalue()
        
        self.assertIn('Backup encriptado completado', output)


class PerformanceOptimizationCommandTests(IntegrationTestCase):
    """Tests para comandos de optimización de rendimiento"""
    
    def test_optimize_queries_command(self):
        """Test de optimización de consultas"""
        out = StringIO()
        
        with override_settings(DEBUG=True):
            # Hacer algunas consultas
            list(User.objects.all())
            list(Appointment.objects.select_related('patient', 'doctor').all())
            
            call_command('optimize_queries', stdout=out)
            
        output = out.getvalue()
        
        # Verificar análisis
        self.assertIn('Analizando consultas', output)
        self.assertIn('Consultas detectadas:', output)
        
        # Si hay sugerencias
        if 'Sugerencias de optimización' in output:
            self.assertIn('select_related', output)
            
    def test_cache_warmup_command(self):
        """Test de calentamiento de caché"""
        # Crear datos frecuentemente accedidos
        for i in range(5):
            Specialty.objects.create(
                name=f'Especialidad {i}',
                description=f'Descripción {i}'
            )
            
        out = StringIO()
        
        call_command('cache_warmup', stdout=out)
        
        output = out.getvalue()
        
        # Verificar calentamiento
        self.assertIn('Calentando caché', output)
        self.assertIn('Especialidades cacheadas', output)
        self.assertIn('Configuraciones cacheadas', output)


if __name__ == '__main__':
    import django
    from django.test import TestCase
    django.setup()
    TestCase.main()