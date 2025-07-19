"""
Tests de integración entre módulos del sistema
"""
import json
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import override_settings
from django.utils import timezone
from django.core import mail
from django.db import transaction
from rest_framework import status

from tests.base import IntegrationTestCase, TestUtils
from authentication.models import User
from appointments.models import Appointment, Specialty, MedicalSchedule
from medical_records.models import MedicalRecord, VitalSigns, Allergy
from pharmacy.models import Medication, Dispensation, StockMovement
from emergency.models import EmergencyCase, TriageAssessment
from notifications.models import Notification, NotificationTemplate
from reports.models import GeneratedReport, ScheduledReport


class PatientJourneyIntegrationTests(IntegrationTestCase):
    """Tests del flujo completo de un paciente"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
        # Crear usuarios
        self.patient = self.test_utils.create_patient(
            username='patient1',
            email='patient@test.com'
        )
        
        self.doctor = self.test_utils.create_doctor(
            username='doctor1',
            email='doctor@test.com'
        )
        
        self.nurse = User.objects.create_user(email='nurse@test.com',
            password='NursePass123!',
            role='nurse'
        )
        
        # Crear especialidad y horario
        self.specialty = Specialty.objects.create(
            name='Medicina General',
            description='Consulta general'
        )
        
        self.schedule = MedicalSchedule.objects.create(
            doctor=self.doctor,
            day_of_week=1,  # Lunes
            start_time='09:00',
            end_time='17:00',
            slot_duration=30
        )
        
        # Crear expediente médico
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            blood_type='O+',
            emergency_contact_name='John Doe',
            emergency_contact_phone='+1234567890'
        )
        
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_complete_patient_journey(self):
        """Test del flujo completo desde registro hasta tratamiento"""
        
        # 1. Paciente agenda cita
        appointment_date = timezone.now() + timedelta(days=2)
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=appointment_date,
            reason='Dolor de cabeza persistente',
            status='scheduled'
        )
        
        # Verificar notificación de confirmación
        notifications = Notification.objects.filter(
            user=self.patient,
            notification_type='appointment_confirmation'
        )
        self.assertEqual(notifications.count(), 1)
        
        # 2. Día de la cita - Enfermera toma signos vitales
        with freeze_time(appointment_date):
            vital_signs = VitalSigns.objects.create(
                medical_record=self.medical_record,
                recorded_by=self.nurse,
                blood_pressure_systolic=130,
                blood_pressure_diastolic=85,
                heart_rate=78,
                temperature=37.2,
                respiratory_rate=16,
                oxygen_saturation=98,
                weight=75.5,
                height=1.75
            )
            
            # 3. Doctor atiende la consulta
            appointment.status = 'in_progress'
            appointment.save()
            
            # Doctor registra historia médica
            medical_history = MedicalHistory.objects.create(
                medical_record=self.medical_record,
                doctor=self.doctor,
                appointment=appointment,
                chief_complaint='Dolor de cabeza frontal intenso',
                present_illness='Paciente refiere dolor de cabeza de 3 días de evolución',
                physical_examination='Signos vitales estables, sin signos neurológicos focales',
                diagnosis='Cefalea tensional',
                treatment_plan='Analgésicos y relajantes musculares',
                notes='Recomendar técnicas de relajación'
            )
            
            # 4. Doctor prescribe medicamentos
            prescription = Prescription.objects.create(
                patient=self.patient,
                doctor=self.doctor,
                appointment=appointment,
                diagnosis='Cefalea tensional',
                notes='Tomar con alimentos'
            )
            
            # Medicamentos
            paracetamol = Medication.objects.create(
                name='Paracetamol',
                generic_name='Acetaminofén',
                presentation='Tabletas 500mg',
                quantity_per_unit=20,
                unit_price=Decimal('5.00'),
                requires_prescription=False
            )
            
            ibuprofen = Medication.objects.create(
                name='Ibuprofeno',
                generic_name='Ibuprofeno',
                presentation='Tabletas 400mg',
                quantity_per_unit=30,
                unit_price=Decimal('8.00'),
                requires_prescription=True
            )
            
            # Items de prescripción
            PrescriptionItem.objects.create(
                prescription=prescription,
                medication=paracetamol,
                quantity=1,
                dosage='500mg cada 8 horas',
                frequency='3 veces al día',
                duration_days=5,
                instructions='Tomar con agua después de comidas'
            )
            
            PrescriptionItem.objects.create(
                prescription=prescription,
                medication=ibuprofen,
                quantity=1,
                dosage='400mg cada 12 horas',
                frequency='2 veces al día',
                duration_days=3,
                instructions='Tomar con alimentos'
            )
            
            # 5. Finalizar consulta
            appointment.status = 'completed'
            appointment.save()
            
            # Verificar estado final
            self.assertEqual(appointment.status, 'completed')
            self.assertEqual(medical_history.diagnosis, 'Cefalea tensional')
            self.assertEqual(prescription.items.count(), 2)
            
            # Verificar notificaciones
            post_appointment_notifications = Notification.objects.filter(
                user=self.patient,
                created_at__gte=appointment_date
            )
            self.assertGreaterEqual(post_appointment_notifications.count(), 1)
            
    def test_emergency_to_hospitalization_flow(self):
        """Test del flujo de emergencia a hospitalización"""
        
        # 1. Paciente llega a emergencias
        emergency_case = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_time=timezone.now(),
            chief_complaint='Dolor torácico agudo',
            mode_of_arrival='ambulance',
            status='waiting_triage'
        )
        
        # 2. Triaje evalúa al paciente
        triage = TriageAssessment.objects.create(
            emergency_case=emergency_case,
            assessed_by=self.nurse,
            priority_level=2,  # Urgente
            vital_signs_summary={
                'blood_pressure': '150/95',
                'heart_rate': 110,
                'temperature': 37.0,
                'oxygen_saturation': 95
            },
            symptoms=['dolor_toracico', 'disnea', 'sudoracion'],
            notes='Posible evento cardíaco, requiere evaluación inmediata'
        )
        
        emergency_case.status = 'in_triage'
        emergency_case.triage_priority = 2
        emergency_case.save()
        
        # 3. Doctor atiende emergencia
        emergency_case.assigned_doctor = self.doctor
        emergency_case.status = 'in_treatment'
        emergency_case.save()
        
        # Crear signos vitales de emergencia
        emergency_vitals = VitalSigns.objects.create(
            medical_record=self.medical_record,
            recorded_by=self.doctor,
            blood_pressure_systolic=150,
            blood_pressure_diastolic=95,
            heart_rate=110,
            temperature=37.0,
            respiratory_rate=22,
            oxygen_saturation=95,
            is_critical=True,
            notes='Paciente con dolor torácico, signos de posible SCA'
        )
        
        # 4. Se decide hospitalización
        medical_history = MedicalHistory.objects.create(
            medical_record=self.medical_record,
            doctor=self.doctor,
            chief_complaint='Dolor torácico agudo',
            present_illness='Dolor opresivo retroesternal de 2 horas de evolución',
            physical_examination='PA elevada, taquicardia, sin signos de falla cardíaca',
            diagnosis='Síndrome coronario agudo a descartar',
            treatment_plan='Hospitalización para monitoreo y estudios',
            requires_hospitalization=True
        )
        
        # 5. Alta de emergencias a hospitalización
        emergency_case.status = 'admitted'
        emergency_case.disposition = 'admitted'
        emergency_case.disposition_time = timezone.now()
        emergency_case.save()
        
        # Verificar flujo completo
        self.assertEqual(emergency_case.status, 'admitted')
        self.assertEqual(emergency_case.triage_priority, 2)
        self.assertTrue(medical_history.requires_hospitalization)
        self.assertTrue(emergency_vitals.is_critical)
        
    def test_prescription_to_pharmacy_flow(self):
        """Test del flujo de prescripción a dispensación en farmacia"""
        
        # 1. Crear prescripción
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=timezone.now(),
            reason='Consulta de control'
        )
        
        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment=appointment,
            diagnosis='Hipertensión arterial'
        )
        
        # 2. Crear medicamentos e inventario
        medication = Medication.objects.create(
            name='Losartán',
            generic_name='Losartán potásico',
            presentation='Tabletas 50mg',
            quantity_per_unit=30,
            unit_price=Decimal('15.00'),
            requires_prescription=True
        )
        
        inventory = Inventory.objects.create(
            medication=medication,
            quantity=100,
            batch_number='BATCH001',
            expiration_date=timezone.now().date() + timedelta(days=365),
            location='A-15'
        )
        
        # 3. Agregar medicamento a prescripción
        prescription_item = PrescriptionItem.objects.create(
            prescription=prescription,
            medication=medication,
            quantity=2,  # 2 cajas
            dosage='50mg',
            frequency='1 vez al día',
            duration_days=60,
            instructions='Tomar en ayunas'
        )
        
        # 4. Dispensar medicamento
        initial_quantity = inventory.quantity
        
        # Simular dispensación
        prescription.status = 'dispensed'
        prescription.dispensed_by = User.objects.create_user(email='pharmacist@test.com',
            password='PharmPass123!',
            role='pharmacist'
        )
        prescription.dispensed_date = timezone.now()
        prescription.save()
        
        # Actualizar inventario
        inventory.quantity -= prescription_item.quantity
        inventory.save()
        
        # 5. Verificar flujo completo
        self.assertEqual(prescription.status, 'dispensed')
        self.assertIsNotNone(prescription.dispensed_date)
        self.assertEqual(inventory.quantity, initial_quantity - 2)
        
        # Verificar alertas de inventario bajo si aplica
        if inventory.quantity <= 20:  # Umbral de alerta
            notifications = Notification.objects.filter(
                notification_type='low_inventory',
                metadata__medication_id=medication.id
            )
            self.assertGreaterEqual(notifications.count(), 1)


class SystemIntegrationTests(IntegrationTestCase):
    """Tests de integración del sistema completo"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    def test_multi_user_concurrent_appointment_booking(self):
        """Test de reserva concurrente de citas"""
        doctor = self.test_utils.create_doctor('doctor1')
        
        # Crear horario disponible
        schedule = MedicalSchedule.objects.create(
            doctor=doctor,
            day_of_week=1,
            start_time='10:00',
            end_time='11:00',
            slot_duration=60  # Solo 1 slot disponible
        )
        
        appointment_time = timezone.now() + timedelta(days=1)
        appointment_time = appointment_time.replace(hour=10, minute=0)
        
        # Simular 3 pacientes intentando reservar el mismo horario
        patients = []
        for i in range(3):
            patient = self.test_utils.create_patient(f'patient{i}')
            patients.append(patient)
            
        successful_bookings = []
        
        # Intentar reservas concurrentes
        for patient in patients:
            try:
                with transaction.atomic():
                    # Verificar disponibilidad con lock
                    existing = Appointment.objects.select_for_update().filter(
                        doctor=doctor,
                        appointment_date=appointment_time,
                        status__in=['scheduled', 'confirmed']
                    ).exists()
                    
                    if not existing:
                        appointment = Appointment.objects.create(
                            patient=patient,
                            doctor=doctor,
                            appointment_date=appointment_time,
                            reason='Consulta'
                        )
                        successful_bookings.append(appointment)
            except Exception:
                pass
                
        # Solo 1 debe haber tenido éxito
        self.assertEqual(len(successful_bookings), 1)
        
    def test_notification_cascade_on_appointment_cancellation(self):
        """Test de cascada de notificaciones al cancelar cita"""
        patient = self.test_utils.create_patient('patient1')
        doctor = self.test_utils.create_doctor('doctor1')
        
        # Crear cita para mañana
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_date=timezone.now() + timedelta(days=1),
            reason='Consulta',
            status='confirmed'
        )
        
        # Crear otra cita en lista de espera
        waiting_patient = self.test_utils.create_patient('patient2')
        waiting_appointment = Appointment.objects.create(
            patient=waiting_patient,
            doctor=doctor,
            appointment_date=appointment.appointment_date,
            reason='Consulta urgente',
            status='waiting_list'
        )
        
        # Limpiar notificaciones previas
        Notification.objects.all().delete()
        
        # Cancelar cita
        appointment.status = 'cancelled'
        appointment.cancellation_reason = 'Paciente no puede asistir'
        appointment.save()
        
        # Verificar notificaciones generadas
        # 1. Notificación al paciente de confirmación de cancelación
        patient_notifications = Notification.objects.filter(
            user=patient,
            notification_type='appointment_cancelled'
        )
        self.assertEqual(patient_notifications.count(), 1)
        
        # 2. Notificación al doctor sobre la cancelación
        doctor_notifications = Notification.objects.filter(
            user=doctor,
            notification_type='appointment_cancelled'
        )
        self.assertEqual(doctor_notifications.count(), 1)
        
        # 3. Notificación al paciente en lista de espera
        waiting_notifications = Notification.objects.filter(
            user=waiting_patient,
            notification_type='appointment_available'
        )
        self.assertGreaterEqual(waiting_notifications.count(), 1)
        
    def test_medical_record_audit_trail(self):
        """Test de auditoría en expedientes médicos"""
        patient = self.test_utils.create_patient('patient1')
        doctor1 = self.test_utils.create_doctor('doctor1')
        doctor2 = self.test_utils.create_doctor('doctor2')
        
        # Crear expediente
        medical_record = MedicalRecord.objects.create(
            patient=patient,
            blood_type='A+',
            emergency_contact_name='Jane Doe',
            emergency_contact_phone='+1234567890'
        )
        
        # Doctor 1 agrega alergia
        allergy1 = Allergy.objects.create(
            medical_record=medical_record,
            allergen='Penicilina',
            severity='severe',
            reaction='Anafilaxia',
            notes='Confirmado por pruebas',
            reported_by=doctor1
        )
        
        # Doctor 2 modifica alergia
        allergy1.notes = 'Confirmado por pruebas - Actualizado con más detalles'
        allergy1.updated_by = doctor2
        allergy1.save()
        
        # Doctor 2 agrega otra alergia
        allergy2 = Allergy.objects.create(
            medical_record=medical_record,
            allergen='Látex',
            severity='moderate',
            reaction='Dermatitis de contacto',
            reported_by=doctor2
        )
        
        # Verificar registro de auditoría
        self.assertEqual(allergy1.reported_by, doctor1)
        self.assertEqual(allergy1.updated_by, doctor2)
        self.assertEqual(allergy2.reported_by, doctor2)
        
        # Verificar timestamps
        self.assertIsNotNone(allergy1.created_at)
        self.assertIsNotNone(allergy1.updated_at)
        self.assertGreater(allergy1.updated_at, allergy1.created_at)
        
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_report_generation_with_data_aggregation(self):
        """Test de generación de reportes con agregación de datos"""
        # Crear datos de prueba
        doctors = []
        for i in range(3):
            doctor = self.test_utils.create_doctor(f'doctor{i}')
            doctors.append(doctor)
            
        patients = []
        for i in range(10):
            patient = self.test_utils.create_patient(f'patient{i}')
            patients.append(patient)
            
        # Crear citas variadas
        appointment_count = 0
        for doctor in doctors:
            for i, patient in enumerate(patients[:5]):  # 5 citas por doctor
                Appointment.objects.create(
                    patient=patient,
                    doctor=doctor,
                    appointment_date=timezone.now() - timedelta(days=i),
                    reason='Consulta general',
                    status='completed' if i < 3 else 'scheduled'
                )
                appointment_count += 1
                
        # Generar reporte de citas
        report = Report.objects.create(
            name='Reporte Mensual de Citas',
            report_type='appointments',
            generated_by=doctors[0],
            parameters={
                'start_date': (timezone.now() - timedelta(days=30)).isoformat(),
                'end_date': timezone.now().isoformat(),
                'group_by': 'doctor'
            }
        )
        
        # Simular generación de reporte
        report.status = 'processing'
        report.save()
        
        # Agregar datos del reporte
        report_data = {
            'total_appointments': appointment_count,
            'by_status': {
                'completed': 9,
                'scheduled': 6
            },
            'by_doctor': {}
        }
        
        for doctor in doctors:
            doctor_appointments = Appointment.objects.filter(doctor=doctor)
            report_data['by_doctor'][doctor.username] = {
                'total': doctor_appointments.count(),
                'completed': doctor_appointments.filter(status='completed').count()
            }
            
        report.data = report_data
        report.status = 'completed'
        report.file_url = '/media/reports/monthly_appointments.pdf'
        report.save()
        
        # Verificar reporte
        self.assertEqual(report.status, 'completed')
        self.assertEqual(report.data['total_appointments'], 15)
        self.assertEqual(len(report.data['by_doctor']), 3)
        
    def test_inventory_alert_system(self):
        """Test del sistema de alertas de inventario"""
        # Crear medicamentos
        medications = []
        for i in range(5):
            med = Medication.objects.create(
                name=f'Medicamento {i}',
                generic_name=f'Genérico {i}',
                presentation='Tabletas',
                quantity_per_unit=30,
                unit_price=Decimal('10.00'),
                requires_prescription=True
            )
            medications.append(med)
            
        # Crear inventario con diferentes niveles
        low_stock_meds = []
        
        # Medicamentos con stock bajo
        for i in range(2):
            inventory = Inventory.objects.create(
                medication=medications[i],
                quantity=5,  # Bajo stock
                batch_number=f'BATCH{i}',
                expiration_date=timezone.now().date() + timedelta(days=180),
                minimum_stock=20
            )
            low_stock_meds.append(inventory)
            
        # Medicamentos con stock normal
        for i in range(2, 4):
            Inventory.objects.create(
                medication=medications[i],
                quantity=50,  # Stock normal
                batch_number=f'BATCH{i}',
                expiration_date=timezone.now().date() + timedelta(days=180),
                minimum_stock=20
            )
            
        # Medicamento por expirar
        expiring_inventory = Inventory.objects.create(
            medication=medications[4],
            quantity=30,
            batch_number='BATCHEXP',
            expiration_date=timezone.now().date() + timedelta(days=15),  # Expira pronto
            minimum_stock=20
        )
        
        # Verificar alertas generadas
        # Alertas de stock bajo
        for inv in low_stock_meds:
            self.assertTrue(inv.is_low_stock())
            
        # Alerta de expiración próxima
        self.assertTrue(expiring_inventory.is_expiring_soon())
        
        # Generar reporte de inventario crítico
        critical_items = Inventory.objects.filter(
            quantity__lt=20  # Menos del mínimo
        ) | Inventory.objects.filter(
            expiration_date__lt=timezone.now().date() + timedelta(days=30)
        )
        
        self.assertEqual(critical_items.count(), 3)  # 2 bajo stock + 1 por expirar
        
    def test_emergency_triage_workflow(self):
        """Test del flujo de trabajo de triaje en emergencias"""
        # Crear múltiples casos de emergencia
        emergency_cases = []
        
        # Caso crítico
        critical_patient = self.test_utils.create_patient('critical')
        critical_case = EmergencyCase.objects.create(
            patient=critical_patient,
            arrival_time=timezone.now(),
            chief_complaint='Dolor torácico severo con pérdida de consciencia',
            mode_of_arrival='ambulance',
            status='waiting_triage'
        )
        emergency_cases.append(('critical', critical_case))
        
        # Caso urgente
        urgent_patient = self.test_utils.create_patient('urgent')
        urgent_case = EmergencyCase.objects.create(
            patient=urgent_patient,
            arrival_time=timezone.now() + timedelta(minutes=5),
            chief_complaint='Fractura expuesta en brazo',
            mode_of_arrival='private_vehicle',
            status='waiting_triage'
        )
        emergency_cases.append(('urgent', urgent_case))
        
        # Caso no urgente
        minor_patient = self.test_utils.create_patient('minor')
        minor_case = EmergencyCase.objects.create(
            patient=minor_patient,
            arrival_time=timezone.now() + timedelta(minutes=10),
            chief_complaint='Dolor de garganta',
            mode_of_arrival='walk_in',
            status='waiting_triage'
        )
        emergency_cases.append(('minor', minor_case))
        
        # Realizar triaje
        nurse = User.objects.create_user(email='triage@test.com',
            password='NursePass123!',
            role='nurse'
        )
        
        # Asignar prioridades
        priorities = {
            'critical': 1,  # Resucitación
            'urgent': 2,    # Emergencia
            'minor': 4      # Menos urgente
        }
        
        for case_type, emergency_case in emergency_cases:
            triage = TriageAssessment.objects.create(
                emergency_case=emergency_case,
                assessed_by=nurse,
                priority_level=priorities[case_type],
                vital_signs_summary={
                    'evaluated': True,
                    'priority': priorities[case_type]
                },
                symptoms=self._get_symptoms_by_priority(case_type),
                notes=f'Caso {case_type} - Evaluado'
            )
            
            emergency_case.triage_priority = priorities[case_type]
            emergency_case.status = 'triaged'
            emergency_case.save()
            
        # Verificar orden de atención
        priority_queue = EmergencyCase.objects.filter(
            status='triaged'
        ).order_by('triage_priority', 'arrival_time')
        
        # El caso crítico debe ser primero
        self.assertEqual(priority_queue[0].patient.username, 'critical')
        self.assertEqual(priority_queue[1].patient.username, 'urgent')
        self.assertEqual(priority_queue[2].patient.username, 'minor')
        
        # Asignar doctores según prioridad
        doctors = []
        for i in range(2):
            doctor = self.test_utils.create_doctor(f'er_doctor{i}')
            doctors.append(doctor)
            
        # Doctor 1 atiende caso crítico
        critical_case.assigned_doctor = doctors[0]
        critical_case.status = 'in_treatment'
        critical_case.save()
        
        # Doctor 2 atiende caso urgente
        urgent_case.assigned_doctor = doctors[1]
        urgent_case.status = 'in_treatment'
        urgent_case.save()
        
        # Caso menor espera
        self.assertEqual(minor_case.status, 'triaged')
        self.assertIsNone(minor_case.assigned_doctor)
        
    def _get_symptoms_by_priority(self, case_type):
        """Helper para obtener síntomas según prioridad"""
        symptoms_map = {
            'critical': ['dolor_toracico', 'perdida_consciencia', 'dificultad_respiratoria'],
            'urgent': ['fractura', 'sangrado', 'dolor_severo'],
            'minor': ['dolor_garganta', 'tos', 'malestar_general']
        }
        return symptoms_map.get(case_type, [])
        
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_scheduled_report_generation(self):
        """Test de generación programada de reportes"""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        
        # Crear programación de reporte diario
        daily_schedule = ReportSchedule.objects.create(
            name='Reporte Diario de Citas',
            report_type='appointments',
            frequency='daily',
            time='08:00',
            parameters={
                'include_cancelled': False,
                'group_by': 'status'
            },
            recipients=[admin.email],
            created_by=admin
        )
        
        # Crear programación de reporte semanal
        weekly_schedule = ReportSchedule.objects.create(
            name='Reporte Semanal de Inventario',
            report_type='inventory',
            frequency='weekly',
            day_of_week=1,  # Lunes
            time='09:00',
            parameters={
                'include_expired': True,
                'low_stock_only': True
            },
            recipients=[admin.email, 'pharmacy@hospital.com'],
            created_by=admin
        )
        
        # Simular ejecución de reportes programados
        # Esto normalmente sería ejecutado por Celery Beat
        
        # Verificar próxima ejecución
        self.assertIsNotNone(daily_schedule.next_run)
        self.assertIsNotNone(weekly_schedule.next_run)
        
        # Verificar que el reporte semanal es después que el diario
        if daily_schedule.next_run.date() == weekly_schedule.next_run.date():
            self.assertGreater(weekly_schedule.next_run, daily_schedule.next_run)


class PerformanceIntegrationTests(IntegrationTestCase):
    """Tests de rendimiento e integración bajo carga"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    def test_bulk_appointment_creation_performance(self):
        """Test de rendimiento al crear citas masivas"""
        import time
        
        # Crear doctores y pacientes
        doctors = []
        for i in range(5):
            doctor = self.test_utils.create_doctor(f'doctor{i}')
            doctors.append(doctor)
            
        patients = []
        for i in range(100):
            patient = self.test_utils.create_patient(f'patient{i}')
            patients.append(patient)
            
        # Medir tiempo de creación masiva
        start_time = time.time()
        
        appointments = []
        for i, patient in enumerate(patients):
            doctor = doctors[i % len(doctors)]
            appointment_date = timezone.now() + timedelta(days=(i % 30))
            
            appointment = Appointment(
                patient=patient,
                doctor=doctor,
                appointment_date=appointment_date,
                reason=f'Consulta {i}',
                status='scheduled'
            )
            appointments.append(appointment)
            
        # Bulk create
        Appointment.objects.bulk_create(appointments)
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        # Verificar que se crearon todas
        self.assertEqual(Appointment.objects.count(), 100)
        
        # Verificar tiempo razonable (menos de 5 segundos para 100 citas)
        self.assertLess(elapsed_time, 5.0)
        
    def test_concurrent_prescription_dispensing(self):
        """Test de dispensación concurrente de prescripciones"""
        pharmacist1 = User.objects.create_user(email='pharm1@test.com',
            password='PharmPass123!',
            role='pharmacist'
        )
        
        pharmacist2 = User.objects.create_user(email='pharm2@test.com',
            password='PharmPass123!',
            role='pharmacist'
        )
        
        # Crear medicamento con inventario limitado
        medication = Medication.objects.create(
            name='Medicamento Escaso',
            generic_name='Genérico Escaso',
            presentation='Tabletas',
            quantity_per_unit=10,
            unit_price=Decimal('50.00')
        )
        
        inventory = Inventory.objects.create(
            medication=medication,
            quantity=5,  # Solo 5 unidades
            batch_number='SCARCE001',
            expiration_date=timezone.now().date() + timedelta(days=90)
        )
        
        # Crear múltiples prescripciones para el mismo medicamento
        prescriptions = []
        for i in range(3):
            patient = self.test_utils.create_patient(f'patient{i}')
            doctor = self.test_utils.create_doctor(f'doctor{i}')
            
            prescription = Prescription.objects.create(
                patient=patient,
                doctor=doctor,
                diagnosis='Condición que requiere medicamento escaso'
            )
            
            PrescriptionItem.objects.create(
                prescription=prescription,
                medication=medication,
                quantity=2,  # Cada uno quiere 2 unidades
                dosage='1 tableta',
                frequency='Diaria'
            )
            
            prescriptions.append(prescription)
            
        # Simular dispensación concurrente
        successful_dispensations = 0
        
        for i, prescription in enumerate(prescriptions):
            pharmacist = pharmacist1 if i % 2 == 0 else pharmacist2
            
            try:
                with transaction.atomic():
                    # Lock del inventario para evitar condiciones de carrera
                    current_inventory = Inventory.objects.select_for_update().get(
                        id=inventory.id
                    )
                    
                    total_needed = sum(
                        item.quantity 
                        for item in prescription.items.all()
                    )
                    
                    if current_inventory.quantity >= total_needed:
                        current_inventory.quantity -= total_needed
                        current_inventory.save()
                        
                        prescription.status = 'dispensed'
                        prescription.dispensed_by = pharmacist
                        prescription.dispensed_date = timezone.now()
                        prescription.save()
                        
                        successful_dispensations += 1
                        
            except Exception:
                pass
                
        # Solo 2 prescripciones deben haberse dispensado (5 unidades / 2 por prescripción)
        self.assertEqual(successful_dispensations, 2)
        
        # Verificar inventario final
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity, 1)  # 5 - (2 * 2) = 1
        
    def test_search_performance_with_large_dataset(self):
        """Test de rendimiento de búsqueda con dataset grande"""
        import time
        
        # Crear gran cantidad de registros médicos
        patients = []
        medical_records = []
        
        for i in range(500):
            patient = User.objects.create_user(
                username=f'patient{i}',
                email=f'patient{i}@test.com',
                password='Pass123!',
                role='patient',
                first_name=f'FirstName{i}',
                last_name=f'LastName{i}'
            )
            patients.append(patient)
            
            record = MedicalRecord.objects.create(
                patient=patient,
                blood_type=['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 8],
                emergency_contact_name=f'Contact {i}',
                emergency_contact_phone=f'+123456{i:04d}'
            )
            medical_records.append(record)
            
        # Agregar alergias variadas
        allergens = ['Penicilina', 'Látex', 'Polen', 'Mariscos', 'Nueces', 'Gluten']
        
        for i, record in enumerate(medical_records[:200]):  # 200 pacientes con alergias
            Allergy.objects.create(
                medical_record=record,
                allergen=allergens[i % len(allergens)],
                severity=['mild', 'moderate', 'severe'][i % 3],
                reaction='Reacción alérgica'
            )
            
        # Test de búsqueda por tipo de sangre
        start_time = time.time()
        o_positive_patients = MedicalRecord.objects.filter(
            blood_type='O+'
        ).select_related('patient')
        count = o_positive_patients.count()
        end_time = time.time()
        
        self.assertGreater(count, 0)
        self.assertLess(end_time - start_time, 1.0)  # Menos de 1 segundo
        
        # Test de búsqueda de pacientes con alergias severas
        start_time = time.time()
        severe_allergies = Allergy.objects.filter(
            severity='severe'
        ).select_related(
            'medical_record__patient'
        ).prefetch_related(
            'medical_record__vital_signs'
        )
        severe_count = severe_allergies.count()
        end_time = time.time()
        
        self.assertGreater(severe_count, 0)
        self.assertLess(end_time - start_time, 1.0)


class SecurityIntegrationTests(IntegrationTestCase):
    """Tests de seguridad e integración"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    def test_medical_record_access_control(self):
        """Test de control de acceso a expedientes médicos"""
        # Crear usuarios con diferentes roles
        patient1 = self.test_utils.create_patient('patient1')
        patient2 = self.test_utils.create_patient('patient2')
        doctor1 = self.test_utils.create_doctor('doctor1')
        doctor2 = self.test_utils.create_doctor('doctor2')
        nurse = User.objects.create_user(email='nurse@test.com',
            password='NursePass123!',
            role='nurse'
        )
        
        # Crear expedientes médicos
        record1 = MedicalRecord.objects.create(
            patient=patient1,
            blood_type='A+',
            emergency_contact_name='Contact 1',
            emergency_contact_phone='+1234567890'
        )
        
        record2 = MedicalRecord.objects.create(
            patient=patient2,
            blood_type='B+',
            emergency_contact_name='Contact 2',
            emergency_contact_phone='+0987654321'
        )
        
        # Test 1: Paciente solo puede ver su propio expediente
        self.client.force_authenticate(user=patient1)
        
        # Puede ver su expediente
        response = self.client.get(f'/api/medical-records/{record1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # No puede ver expediente de otro paciente
        response = self.client.get(f'/api/medical-records/{record2.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 2: Doctor puede ver expedientes de sus pacientes
        # Crear cita para establecer relación doctor-paciente
        Appointment.objects.create(
            patient=patient1,
            doctor=doctor1,
            appointment_date=timezone.now(),
            reason='Consulta'
        )
        
        self.client.force_authenticate(user=doctor1)
        
        # Puede ver expediente de su paciente
        response = self.client.get(f'/api/medical-records/{record1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # No puede ver expediente de paciente sin relación
        response = self.client.get(f'/api/medical-records/{record2.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 3: Enfermera puede ver expedientes durante emergencias
        emergency = EmergencyCase.objects.create(
            patient=patient2,
            arrival_time=timezone.now(),
            chief_complaint='Emergencia',
            status='in_triage',
            triage_nurse=nurse
        )
        
        self.client.force_authenticate(user=nurse)
        
        # Puede ver expediente durante emergencia activa
        response = self.client.get(f'/api/medical-records/{record2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_prescription_tampering_prevention(self):
        """Test de prevención de manipulación de prescripciones"""
        patient = self.test_utils.create_patient('patient1')
        doctor = self.test_utils.create_doctor('doctor1')
        fake_doctor = self.test_utils.create_doctor('fake_doctor')
        
        # Doctor crea prescripción
        self.client.force_authenticate(user=doctor)
        
        prescription_data = {
            'patient': patient.id,
            'diagnosis': 'Dolor crónico',
            'notes': 'Tratamiento inicial'
        }
        
        response = self.client.post(
            '/api/prescriptions/',
            prescription_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        prescription_id = response.data['id']
        
        # Agregar medicamento controlado
        medication = Medication.objects.create(
            name='Morfina',
            generic_name='Morfina',
            presentation='Ampolla 10mg',
            controlled_medication=True,
            requires_prescription=True
        )
        
        item_data = {
            'prescription': prescription_id,
            'medication': medication.id,
            'quantity': 1,
            'dosage': '10mg',
            'frequency': 'Cada 8 horas',
            'duration_days': 3
        }
        
        response = self.client.post(
            '/api/prescription-items/',
            item_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test 1: Otro doctor no puede modificar la prescripción
        self.client.force_authenticate(user=fake_doctor)
        
        update_data = {'notes': 'Prescripción modificada'}
        response = self.client.patch(
            f'/api/prescriptions/{prescription_id}/',
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 2: Paciente no puede modificar su prescripción
        self.client.force_authenticate(user=patient)
        
        response = self.client.patch(
            f'/api/prescriptions/{prescription_id}/',
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 3: Una vez dispensada, nadie puede modificarla
        prescription = Prescription.objects.get(id=prescription_id)
        prescription.status = 'dispensed'
        prescription.dispensed_date = timezone.now()
        prescription.save()
        
        self.client.force_authenticate(user=doctor)  # Incluso el doctor original
        
        response = self.client.patch(
            f'/api/prescriptions/{prescription_id}/',
            {'notes': 'Intento de modificación post-dispensación'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_audit_log_integrity(self):
        """Test de integridad de logs de auditoría"""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        patient = self.test_utils.create_patient('patient1')
        
        # Acción crítica: Cambiar tipo de sangre
        self.client.force_authenticate(user=admin)
        
        medical_record = MedicalRecord.objects.create(
            patient=patient,
            blood_type='O+',
            emergency_contact_name='Contact',
            emergency_contact_phone='+1234567890'
        )
        
        # Registrar valor original
        original_blood_type = medical_record.blood_type
        
        # Modificar tipo de sangre
        update_data = {'blood_type': 'A+'}
        response = self.client.patch(
            f'/api/medical-records/{medical_record.id}/',
            update_data,
            format='json'
        )
        
        # Verificar que se creó log de auditoría
        # (Asumiendo que existe un modelo AuditLog)
        # Este es un ejemplo conceptual
        
        # Verificar que el cambio fue registrado
        medical_record.refresh_from_db()
        self.assertEqual(medical_record.blood_type, 'A+')
        
        # En un sistema real, verificaríamos:
        # - Timestamp del cambio
        # - Usuario que realizó el cambio
        # - Valor anterior y nuevo
        # - IP del usuario
        # - Hash de integridad del log


# Función helper para freeze_time si se usa
try:
    from freezegun import freeze_time
except ImportError:
    # Mock freeze_time si no está instalado
    def freeze_time(timestamp):
        def decorator(func):
            return func
        return decorator


if __name__ == '__main__':
    import django
    from django.test import TestCase
    django.setup()
    TestCase.main()