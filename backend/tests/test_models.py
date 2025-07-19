"""
Tests unitarios detallados para modelos
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from tests.base import BaseTestCase, TestUtils
from authentication.models import User
from appointments.models import Appointment, Specialty, MedicalSchedule
from medical_records.models import MedicalRecord, VitalSigns, Allergy
from pharmacy.models import Medication, Dispensation, StockMovement
from emergency.models import EmergencyCase, TriageAssessment
from notifications.models import Notification, NotificationTemplate, NotificationPreference
from reports.models import GeneratedReport, ScheduledReport
from api_external.models import ExternalAPIClient, APIAccessLog, APIWebhook


class UserModelTests(BaseTestCase):
    """Tests detallados para el modelo User"""
    
    def test_user_creation_with_all_fields(self):
        """Test de creación de usuario con todos los campos"""
        user = User.objects.create_user(email='testuser@example.com',
            password='TestPass123!',
            first_name='Test',
            last_name='User',
            role='patient',
            phone='+1234567890',
            address='123 Test St',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            identification_number='12345678',
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='+0987654321',
            is_active=True
        )
        
        self.assertEqual(user.username, 'testuser')  # Generado automáticamente desde el email
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertTrue(user.check_password('TestPass123!'))
        self.assertEqual(user.get_full_name(), 'Test User')
        self.assertEqual(user.role, 'patient')
        self.assertEqual(user.age, datetime.now().year - 1990)
        
    def test_user_role_validation(self):
        """Test de validación de roles de usuario"""
        valid_roles = ['patient', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'admin']
        
        for i, role in enumerate(valid_roles):
            user = User(
                username=f'user_{role}_{i}',
                email=f'{role}_{i}@test.com',
                first_name='Test',
                last_name='User',
                phone=f'+123456789{i}',
                role=role
            )
            user.set_password('Pass123!')
            
            # No debe lanzar excepción
            user.full_clean()
            
        # Test rol inválido
        with self.assertRaises(ValidationError):
            user = User(
                username='invalid_role',
                email='invalid@test.com',
                first_name='Test',
                last_name='User',
                phone='+1234567899',
                role='invalid_role'
            )
            user.full_clean()
            
    def test_user_email_uniqueness(self):
        """Test de unicidad de email"""
        User.objects.create_user(email='duplicate@test.com',
            password='Pass123!'
        )
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(email='duplicate@test.com',
                password='Pass123!'
            )
            
    def test_user_phone_validation(self):
        """Test de validación de número de teléfono"""
        # Formato válido
        user = User(
            username='phoneuser',
            email='phone@test.com',
            first_name='Test',
            last_name='User',
            phone='+1234567890'
        )
        user.set_password('Pass123!')
        user.full_clean()  # No debe lanzar excepción
        
        # Formato inválido
        user.phone = 'abc123'  # Contiene letras
        with self.assertRaises(ValidationError):
            user.full_clean()
            
    def test_user_age_calculation(self):
        """Test de cálculo de edad"""
        # Usuario con fecha de nacimiento
        user = User(
            username='agetest',
            email='age@test.com',
            date_of_birth=date(2000, 6, 15)
        )
        
        expected_age = datetime.now().year - 2000
        if datetime.now().date() < date(datetime.now().year, 6, 15):
            expected_age -= 1
            
        self.assertEqual(user.age, expected_age)
        
        # Usuario sin fecha de nacimiento
        user2 = User(username='noage', email='noage@test.com')
        self.assertIsNone(user2.age)
        
    def test_user_soft_delete(self):
        """Test de borrado suave de usuario"""
        user = User.objects.create_user(email='soft@test.com',
            password='Pass123!'
        )
        
        user_id = user.id
        user.delete()
        
        # Usuario debe estar marcado como inactivo, no eliminado
        user = User.objects.get(id=user_id)
        self.assertFalse(user.is_active)
        
    def test_user_permissions_by_role(self):
        """Test de permisos según rol"""
        # Usar los usuarios ya creados en setUp() para evitar conflictos
        # Doctor puede ver expedientes (permisos básicos de Django)
        self.assertTrue(self.doctor.has_perm('auth.view_user'))  # Permiso básico que existe
        
        # Paciente tiene menos permisos
        self.assertFalse(self.patient.has_perm('auth.change_user'))  # Paciente no puede cambiar usuarios


class AppointmentModelTests(BaseTestCase):
    """Tests detallados para el modelo Appointment"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.patient = self.test_utils.create_patient('patient1')
        self.doctor = self.test_utils.create_doctor('doctor1')
        self.specialty = Specialty.objects.create(
            name='Cardiología',
            description='Especialidad del corazón'
        )
        
    def test_appointment_creation(self):
        """Test de creación de cita"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=timezone.now() + timedelta(days=1),
            reason='Consulta general',
            status='scheduled'
        )
        
        self.assertEqual(appointment.patient, self.patient)
        self.assertEqual(appointment.doctor, self.doctor)
        self.assertEqual(appointment.status, 'scheduled')
        self.assertIsNotNone(appointment.appointment_number)
        
    def test_appointment_date_validation(self):
        """Test de validación de fecha de cita"""
        # Cita en el pasado
        with self.assertRaises(ValidationError):
            appointment = Appointment(
                patient=self.patient,
                doctor=self.doctor,
                appointment_date=timezone.now() - timedelta(days=1),
                reason='Consulta'
            )
            appointment.full_clean()
            
    def test_appointment_status_transitions(self):
        """Test de transiciones de estado de cita"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now() + timedelta(days=1),
            reason='Consulta'
        )
        
        # Estado inicial
        self.assertEqual(appointment.status, 'scheduled')
        
        # Transición válida: scheduled -> confirmed
        appointment.status = 'confirmed'
        appointment.save()
        self.assertEqual(appointment.status, 'confirmed')
        
        # Transición válida: confirmed -> in_progress
        appointment.status = 'in_progress'
        appointment.save()
        
        # Transición válida: in_progress -> completed
        appointment.status = 'completed'
        appointment.save()
        
        # No se puede volver a scheduled desde completed
        appointment.status = 'scheduled'
        with self.assertRaises(ValidationError):
            appointment.clean()
            
    def test_appointment_overlap_detection(self):
        """Test de detección de citas superpuestas"""
        appointment_time = timezone.now() + timedelta(days=1)
        
        # Primera cita
        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=appointment_time,
            reason='Primera cita'
        )
        
        # Intento de crear cita superpuesta
        with self.assertRaises(ValidationError):
            overlapping = Appointment(
                patient=self.patient,
                doctor=self.doctor,
                appointment_date=appointment_time,
                reason='Cita superpuesta'
            )
            overlapping.full_clean()
            
    def test_appointment_duration_calculation(self):
        """Test de cálculo de duración de cita"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now() + timedelta(days=1),
            duration_minutes=30,
            reason='Consulta'
        )
        
        self.assertEqual(appointment.duration_minutes, 30)
        self.assertEqual(
            appointment.end_time,
            appointment.appointment_date + timedelta(minutes=30)
        )
        
    def test_appointment_cancellation(self):
        """Test de cancelación de cita"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now() + timedelta(days=1),
            reason='Consulta'
        )
        
        appointment.cancel('Paciente no puede asistir')
        
        self.assertEqual(appointment.status, 'cancelled')
        self.assertEqual(appointment.cancellation_reason, 'Paciente no puede asistir')
        self.assertIsNotNone(appointment.cancelled_at)
        
    def test_appointment_reminder_scheduling(self):
        """Test de programación de recordatorios"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now() + timedelta(days=2),
            reason='Consulta',
            send_reminders=True
        )
        
        self.assertTrue(appointment.send_reminders)
        self.assertEqual(
            appointment.reminder_time,
            appointment.appointment_date - timedelta(hours=24)
        )


class MedicalRecordModelTests(BaseTestCase):
    """Tests detallados para el modelo MedicalRecord"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.patient = self.test_utils.create_patient('patient1')
        
    def test_medical_record_creation(self):
        """Test de creación de expediente médico"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            blood_type='O+',
            allergies_description='Penicilina, Polen',
            chronic_conditions='Hipertensión, Diabetes',
            current_medications='Metformina 500mg',
            family_history='Padre con diabetes',
            surgical_history='Apendicectomía 2015',
            emergency_contact_name='John Doe',
            emergency_contact_phone='+1234567890',
            emergency_contact_relationship='Esposo',
            insurance_provider='Seguro XYZ',
            insurance_policy_number='POL123456'
        )
        
        self.assertEqual(record.patient, self.patient)
        self.assertEqual(record.blood_type, 'O+')
        self.assertTrue(record.has_allergies)
        self.assertTrue(record.has_chronic_conditions)
        
    def test_blood_type_validation(self):
        """Test de validación de tipo de sangre"""
        valid_blood_types = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        
        for blood_type in valid_blood_types:
            record = MedicalRecord(
                patient=self.test_utils.create_patient(f'patient_{blood_type}'),
                blood_type=blood_type,
                emergency_contact_name='Contact',
                emergency_contact_phone='+1234567890'
            )
            record.full_clean()  # No debe lanzar excepción
            
        # Tipo de sangre inválido
        with self.assertRaises(ValidationError):
            record = MedicalRecord(
                patient=self.test_utils.create_patient('invalid_blood'),
                blood_type='X+',
                emergency_contact_name='Contact',
                emergency_contact_phone='+1234567890'
            )
            record.full_clean()
            
    def test_medical_record_uniqueness(self):
        """Test de unicidad de expediente por paciente"""
        MedicalRecord.objects.create(
            patient=self.patient,
            blood_type='O+',
            emergency_contact_name='Contact',
            emergency_contact_phone='+1234567890'
        )
        
        # Intento de crear segundo expediente
        with self.assertRaises(IntegrityError):
            MedicalRecord.objects.create(
                patient=self.patient,
                blood_type='A+',
                emergency_contact_name='Contact2',
                emergency_contact_phone='+0987654321'
            )
            
    def test_emergency_contact_validation(self):
        """Test de validación de contacto de emergencia"""
        # Contacto válido
        record = MedicalRecord(
            patient=self.patient,
            blood_type='O+',
            emergency_contact_name='John Doe',
            emergency_contact_phone='+1234567890',
            emergency_contact_relationship='Padre'
        )
        record.full_clean()
        
        # Teléfono inválido
        record.emergency_contact_phone = '123'
        with self.assertRaises(ValidationError):
            record.full_clean()
            
    def test_medical_record_summary_generation(self):
        """Test de generación de resumen médico"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            blood_type='O+',
            allergies_description='Penicilina',
            chronic_conditions='Diabetes tipo 2',
            current_medications='Metformina',
            emergency_contact_name='Contact',
            emergency_contact_phone='+1234567890'
        )
        
        summary = record.get_summary()
        
        self.assertIn('O+', summary)
        self.assertIn('Penicilina', summary)
        self.assertIn('Diabetes tipo 2', summary)
        self.assertIn('Metformina', summary)


class VitalSignsModelTests(BaseTestCase):
    """Tests detallados para el modelo VitalSigns"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.patient = self.test_utils.create_patient('patient1')
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            blood_type='O+',
            emergency_contact_name='Contact',
            emergency_contact_phone='+1234567890'
        )
        self.nurse = User.objects.create_user(email='nurse@test.com',
            password='Pass123!',
            role='nurse'
        )
        
    def test_vital_signs_creation(self):
        """Test de creación de signos vitales"""
        vital_signs = VitalSigns.objects.create(
            medical_record=self.medical_record,
            recorded_by=self.nurse,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            heart_rate=72,
            temperature=36.5,
            respiratory_rate=16,
            oxygen_saturation=98,
            weight=70.5,
            height=1.75,
            notes='Paciente estable'
        )
        
        self.assertEqual(vital_signs.medical_record, self.medical_record)
        self.assertEqual(vital_signs.blood_pressure, '120/80')
        self.assertAlmostEqual(vital_signs.bmi, 23.02, places=2)
        
    def test_vital_signs_validation(self):
        """Test de validación de signos vitales"""
        # Valores válidos
        vital_signs = VitalSigns(
            medical_record=self.medical_record,
            recorded_by=self.nurse,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            heart_rate=72,
            temperature=36.5
        )
        vital_signs.full_clean()
        
        # Presión sistólica menor que diastólica
        vital_signs.blood_pressure_systolic = 70
        vital_signs.blood_pressure_diastolic = 120
        with self.assertRaises(ValidationError):
            vital_signs.full_clean()
            
        # Frecuencia cardíaca fuera de rango
        vital_signs.blood_pressure_systolic = 120
        vital_signs.blood_pressure_diastolic = 80
        vital_signs.heart_rate = 300  # Muy alta
        with self.assertRaises(ValidationError):
            vital_signs.full_clean()
            
    def test_bmi_calculation(self):
        """Test de cálculo de BMI"""
        vital_signs = VitalSigns.objects.create(
            medical_record=self.medical_record,
            recorded_by=self.nurse,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            weight=70,
            height=1.70
        )
        
        expected_bmi = 70 / (1.70 ** 2)
        self.assertAlmostEqual(vital_signs.bmi, expected_bmi, places=2)
        
        # Sin peso o altura
        vital_signs2 = VitalSigns.objects.create(
            medical_record=self.medical_record,
            recorded_by=self.nurse,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80
        )
        self.assertIsNone(vital_signs2.bmi)
        
    def test_critical_values_detection(self):
        """Test de detección de valores críticos"""
        # Valores normales
        normal_vitals = VitalSigns.objects.create(
            medical_record=self.medical_record,
            recorded_by=self.nurse,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            heart_rate=72,
            temperature=36.5,
            oxygen_saturation=98
        )
        self.assertFalse(normal_vitals.is_critical)
        
        # Valores críticos
        critical_vitals = VitalSigns.objects.create(
            medical_record=self.medical_record,
            recorded_by=self.nurse,
            blood_pressure_systolic=180,  # Hipertensión severa
            blood_pressure_diastolic=120,
            heart_rate=140,  # Taquicardia
            temperature=39.5,  # Fiebre alta
            oxygen_saturation=88  # Hipoxia
        )
        self.assertTrue(critical_vitals.is_critical)
        self.assertIn('hipertensión', critical_vitals.get_alerts().lower())
        self.assertIn('taquicardia', critical_vitals.get_alerts().lower())
        self.assertIn('fiebre', critical_vitals.get_alerts().lower())
        self.assertIn('hipoxia', critical_vitals.get_alerts().lower())


class MedicationModelTests(BaseTestCase):
    """Tests detallados para el modelo Medication"""
    
    def test_medication_creation(self):
        """Test de creación de medicamento"""
        medication = Medication.objects.create(
            name='Paracetamol',
            generic_name='Acetaminofén',
            presentation='Tabletas 500mg',
            laboratory='Lab XYZ',
            quantity_per_unit=20,
            unit_price=Decimal('5.50'),
            requires_prescription=False,
            controlled_medication=False,
            active_ingredient='Acetaminofén',
            concentration='500mg',
            administration_route='Oral',
            indications='Dolor leve a moderado, fiebre',
            contraindications='Hipersensibilidad al acetaminofén',
            side_effects='Raros: reacciones alérgicas',
            storage_conditions='Temperatura ambiente, lugar seco'
        )
        
        self.assertEqual(medication.name, 'Paracetamol')
        self.assertEqual(medication.unit_price, Decimal('5.50'))
        self.assertFalse(medication.requires_prescription)
        self.assertEqual(str(medication), 'Paracetamol - Tabletas 500mg')
        
    def test_medication_price_validation(self):
        """Test de validación de precio"""
        # Precio negativo
        with self.assertRaises(ValidationError):
            medication = Medication(
                name='Test Med',
                generic_name='Test',
                presentation='Test',
                quantity_per_unit=10,
                unit_price=Decimal('-5.00')
            )
            medication.full_clean()
            
    def test_controlled_medication_validation(self):
        """Test de validación de medicamento controlado"""
        medication = Medication(
            name='Morfina',
            generic_name='Morfina',
            presentation='Ampolla 10mg',
            quantity_per_unit=5,
            unit_price=Decimal('25.00'),
            controlled_medication=True,
            requires_prescription=False  # Debe ser True si es controlado
        )
        
        with self.assertRaises(ValidationError) as context:
            medication.full_clean()
            
        self.assertIn('controlled', str(context.exception))
        
    def test_medication_search(self):
        """Test de búsqueda de medicamentos"""
        # Crear varios medicamentos
        Medication.objects.create(
            name='Amoxicilina',
            generic_name='Amoxicilina',
            presentation='Cápsulas 500mg',
            quantity_per_unit=21,
            unit_price=Decimal('12.00')
        )
        
        Medication.objects.create(
            name='Amoxicilina + Ácido Clavulánico',
            generic_name='Amoxicilina/Clavulanato',
            presentation='Tabletas 875/125mg',
            quantity_per_unit=14,
            unit_price=Decimal('18.00')
        )
        
        # Búsqueda por nombre
        results = Medication.objects.filter(name__icontains='amoxicilina')
        self.assertEqual(results.count(), 2)
        
        # Búsqueda por genérico
        results = Medication.objects.filter(generic_name__icontains='clavulan')
        self.assertEqual(results.count(), 1)


class PrescriptionModelTests(BaseTestCase):
    """Tests detallados para el modelo Prescription"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.patient = self.test_utils.create_patient('patient1')
        self.doctor = self.test_utils.create_doctor('doctor1')
        self.medication = Medication.objects.create(
            name='Test Med',
            generic_name='Test Generic',
            presentation='Tablets',
            quantity_per_unit=30,
            unit_price=Decimal('10.00')
        )
        
    def test_prescription_creation(self):
        """Test de creación de prescripción"""
        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Infección respiratoria',
            notes='Tomar con alimentos'
        )
        
        self.assertEqual(prescription.patient, self.patient)
        self.assertEqual(prescription.doctor, self.doctor)
        self.assertEqual(prescription.status, 'pending')
        self.assertIsNotNone(prescription.prescription_number)
        
    def test_prescription_item_creation(self):
        """Test de creación de items de prescripción"""
        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Test'
        )
        
        item = PrescriptionItem.objects.create(
            prescription=prescription,
            medication=self.medication,
            quantity=2,
            dosage='500mg',
            frequency='Cada 8 horas',
            duration_days=7,
            instructions='Tomar después de comidas'
        )
        
        self.assertEqual(item.prescription, prescription)
        self.assertEqual(item.total_doses, 21)  # 3 veces al día x 7 días
        
    def test_prescription_validation(self):
        """Test de validación de prescripción"""
        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Test'
        )
        
        # No se puede dispensar sin items
        prescription.status = 'dispensed'
        with self.assertRaises(ValidationError):
            prescription.clean()
            
        # Agregar item
        PrescriptionItem.objects.create(
            prescription=prescription,
            medication=self.medication,
            quantity=1,
            dosage='500mg',
            frequency='Diario'
        )
        
        # Ahora sí se puede dispensar
        prescription.clean()  # No debe lanzar excepción
        
    def test_prescription_total_calculation(self):
        """Test de cálculo de total de prescripción"""
        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Test'
        )
        
        # Agregar múltiples items
        PrescriptionItem.objects.create(
            prescription=prescription,
            medication=self.medication,
            quantity=2,
            dosage='500mg',
            frequency='Diario'
        )
        
        medication2 = Medication.objects.create(
            name='Med 2',
            generic_name='Generic 2',
            presentation='Syrup',
            quantity_per_unit=1,
            unit_price=Decimal('15.50')
        )
        
        PrescriptionItem.objects.create(
            prescription=prescription,
            medication=medication2,
            quantity=1,
            dosage='5ml',
            frequency='Cada 12 horas'
        )
        
        expected_total = (2 * Decimal('10.00')) + (1 * Decimal('15.50'))
        self.assertEqual(prescription.total_amount, expected_total)
        
    def test_prescription_expiration(self):
        """Test de expiración de prescripción"""
        # Prescripción reciente
        recent = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Test',
            created_at=timezone.now()
        )
        self.assertFalse(recent.is_expired)
        
        # Prescripción antigua
        old = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Test',
            created_at=timezone.now() - timedelta(days=35)
        )
        self.assertTrue(old.is_expired)


class InventoryModelTests(BaseTestCase):
    """Tests detallados para el modelo Inventory"""
    
    def setUp(self):
        super().setUp()
        self.medication = Medication.objects.create(
            name='Test Med',
            generic_name='Test Generic',
            presentation='Tablets',
            quantity_per_unit=30,
            unit_price=Decimal('10.00')
        )
        
    def test_inventory_creation(self):
        """Test de creación de inventario"""
        inventory = Inventory.objects.create(
            medication=self.medication,
            quantity=100,
            batch_number='BATCH001',
            manufacturing_date=date.today() - timedelta(days=30),
            expiration_date=date.today() + timedelta(days=365),
            supplier='Supplier XYZ',
            purchase_price=Decimal('8.00'),
            location='A-15',
            minimum_stock=20,
            maximum_stock=200
        )
        
        self.assertEqual(inventory.medication, self.medication)
        self.assertEqual(inventory.quantity, 100)
        self.assertFalse(inventory.is_expired)
        self.assertFalse(inventory.is_low_stock())
        
    def test_inventory_date_validation(self):
        """Test de validación de fechas de inventario"""
        # Fecha de expiración antes de manufactura
        with self.assertRaises(ValidationError):
            inventory = Inventory(
                medication=self.medication,
                quantity=100,
                batch_number='BATCH002',
                manufacturing_date=date.today(),
                expiration_date=date.today() - timedelta(days=1)
            )
            inventory.full_clean()
            
    def test_inventory_stock_alerts(self):
        """Test de alertas de stock"""
        inventory = Inventory.objects.create(
            medication=self.medication,
            quantity=15,
            batch_number='BATCH003',
            expiration_date=date.today() + timedelta(days=365),
            minimum_stock=20,
            maximum_stock=100
        )
        
        self.assertTrue(inventory.is_low_stock())
        self.assertEqual(inventory.reorder_quantity, 85)  # maximum - current
        
    def test_inventory_expiration_alerts(self):
        """Test de alertas de expiración"""
        # Medicamento por expirar (15 días)
        expiring = Inventory.objects.create(
            medication=self.medication,
            quantity=50,
            batch_number='BATCHEXP',
            expiration_date=date.today() + timedelta(days=15)
        )
        
        self.assertTrue(expiring.is_expiring_soon())
        self.assertEqual(expiring.days_until_expiration, 15)
        
        # Medicamento expirado
        expired = Inventory.objects.create(
            medication=self.medication,
            quantity=30,
            batch_number='BATCHOLD',
            expiration_date=date.today() - timedelta(days=5)
        )
        
        self.assertTrue(expired.is_expired)
        self.assertEqual(expired.days_until_expiration, -5)
        
    def test_inventory_movement_tracking(self):
        """Test de seguimiento de movimientos de inventario"""
        inventory = Inventory.objects.create(
            medication=self.medication,
            quantity=100,
            batch_number='BATCH004',
            expiration_date=date.today() + timedelta(days=365)
        )
        
        initial_quantity = inventory.quantity
        
        # Reducir stock
        inventory.reduce_stock(10, 'Dispensación')
        self.assertEqual(inventory.quantity, 90)
        
        # Aumentar stock
        inventory.increase_stock(20, 'Reposición')
        self.assertEqual(inventory.quantity, 110)
        
        # Intento de reducir más de lo disponible
        with self.assertRaises(ValidationError):
            inventory.reduce_stock(200, 'Dispensación excesiva')


class EmergencyModelTests(BaseTestCase):
    """Tests detallados para modelos de emergencia"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.patient = self.test_utils.create_patient('emergency_patient')
        self.nurse = User.objects.create_user(email='nurse@test.com',
            password='Pass123!',
            role='nurse'
        )
        
    def test_emergency_case_creation(self):
        """Test de creación de caso de emergencia"""
        emergency = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_time=timezone.now(),
            chief_complaint='Dolor torácico agudo',
            mode_of_arrival='ambulance',
            accompanied_by='Esposa',
            status='waiting_triage',
            notes='Paciente con antecedentes cardíacos'
        )
        
        self.assertEqual(emergency.patient, self.patient)
        self.assertEqual(emergency.status, 'waiting_triage')
        self.assertIsNone(emergency.triage_priority)
        
    def test_triage_assessment_creation(self):
        """Test de creación de evaluación de triaje"""
        emergency = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_time=timezone.now(),
            chief_complaint='Fractura de brazo',
            status='waiting_triage'
        )
        
        triage = TriageAssessment.objects.create(
            emergency_case=emergency,
            assessed_by=self.nurse,
            priority_level=3,
            vital_signs_summary={
                'blood_pressure': '130/85',
                'heart_rate': 88,
                'pain_scale': 7
            },
            symptoms=['dolor', 'deformidad', 'hinchazón'],
            allergies=['Penicilina'],
            current_medications=['Aspirina'],
            medical_history='Sin antecedentes relevantes',
            notes='Posible fractura de radio'
        )
        
        self.assertEqual(triage.emergency_case, emergency)
        self.assertEqual(triage.priority_level, 3)
        self.assertEqual(triage.get_priority_display(), 'Urgente')
        
        # Actualizar caso de emergencia
        emergency.refresh_from_db()
        self.assertEqual(emergency.triage_priority, 3)
        
    def test_triage_priority_validation(self):
        """Test de validación de prioridad de triaje"""
        emergency = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_time=timezone.now(),
            chief_complaint='Test',
            status='waiting_triage'
        )
        
        # Prioridad válida (1-5)
        for priority in range(1, 6):
            triage = TriageAssessment(
                emergency_case=emergency,
                assessed_by=self.nurse,
                priority_level=priority
            )
            triage.full_clean()  # No debe lanzar excepción
            
        # Prioridad inválida
        with self.assertRaises(ValidationError):
            triage = TriageAssessment(
                emergency_case=emergency,
                assessed_by=self.nurse,
                priority_level=6
            )
            triage.full_clean()
            
    def test_emergency_case_flow(self):
        """Test del flujo completo de caso de emergencia"""
        # Llegada
        emergency = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_time=timezone.now(),
            chief_complaint='Dolor abdominal severo',
            status='waiting_triage'
        )
        
        # Triaje
        emergency.status = 'in_triage'
        emergency.save()
        
        triage = TriageAssessment.objects.create(
            emergency_case=emergency,
            assessed_by=self.nurse,
            priority_level=2
        )
        
        # Asignación de doctor
        doctor = self.test_utils.create_doctor('er_doctor')
        emergency.assigned_doctor = doctor
        emergency.status = 'in_treatment'
        emergency.save()
        
        # Alta
        emergency.status = 'discharged'
        emergency.disposition = 'home'
        emergency.disposition_time = timezone.now()
        emergency.discharge_instructions = 'Reposo, analgésicos'
        emergency.save()
        
        # Verificar duración
        self.assertIsNotNone(emergency.total_time)
        self.assertGreater(emergency.total_time.seconds, 0)


class NotificationModelTests(BaseTestCase):
    """Tests detallados para modelos de notificaciones"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.user = self.test_utils.create_patient('notif_patient')
        
    def test_notification_creation(self):
        """Test de creación de notificación"""
        notification = Notification.objects.create(
            user=self.user,
            title='Recordatorio de Cita',
            message='Su cita es mañana a las 10:00 AM',
            notification_type='appointment_reminder',
            priority='high',
            metadata={
                'appointment_id': 123,
                'doctor_name': 'Dr. Smith'
            }
        )
        
        self.assertEqual(notification.user, self.user)
        self.assertFalse(notification.is_read)
        self.assertEqual(notification.priority, 'high')
        self.assertEqual(notification.metadata['appointment_id'], 123)
        
    def test_notification_template_creation(self):
        """Test de creación de plantilla de notificación"""
        template = NotificationTemplate.objects.create(
            name='appointment_reminder',
            subject='Recordatorio de Cita - {{hospital_name}}',
            body='Estimado {{patient_name}}, le recordamos su cita con {{doctor_name}} el {{appointment_date}}',
            notification_type='appointment_reminder',
            available_variables=['patient_name', 'doctor_name', 'appointment_date', 'hospital_name']
        )
        
        self.assertEqual(template.name, 'appointment_reminder')
        self.assertIn('{{patient_name}}', template.body)
        
        # Renderizar plantilla
        context = {
            'patient_name': 'Juan Pérez',
            'doctor_name': 'Dr. García',
            'appointment_date': '15/01/2024',
            'hospital_name': 'Hospital Central'
        }
        
        rendered = template.render(context)
        self.assertIn('Juan Pérez', rendered['body'])
        self.assertIn('Dr. García', rendered['body'])
        self.assertIn('Hospital Central', rendered['subject'])
        
    def test_notification_preferences(self):
        """Test de preferencias de notificación"""
        preference = NotificationPreference.objects.create(
            user=self.user,
            email_enabled=True,
            sms_enabled=False,
            push_enabled=True,
            notification_types={
                'appointment_reminder': True,
                'prescription_ready': True,
                'lab_results': False
            },
            quiet_hours_start='22:00',
            quiet_hours_end='08:00'
        )
        
        self.assertTrue(preference.email_enabled)
        self.assertFalse(preference.sms_enabled)
        self.assertTrue(preference.is_enabled_for('appointment_reminder'))
        self.assertFalse(preference.is_enabled_for('lab_results'))
        
        # Test de horas silenciosas
        # Esto requeriría mockear la hora actual
        
    def test_notification_delivery_tracking(self):
        """Test de seguimiento de entrega de notificaciones"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test',
            message='Test message',
            notification_type='general'
        )
        
        # Marcar como enviada
        notification.mark_as_sent('email')
        self.assertTrue(notification.sent_via_email)
        self.assertIsNotNone(notification.sent_at)
        
        # Marcar como leída
        notification.mark_as_read()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)
        
        # Marcar como fallida
        notification.mark_as_failed('sms', 'Invalid phone number')
        self.assertTrue(notification.failed)
        self.assertEqual(notification.failure_reason, 'Invalid phone number')


class ReportModelTests(BaseTestCase):
    """Tests detallados para modelos de reportes"""
    
    def setUp(self):
        super().setUp()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        
    def test_report_creation(self):
        """Test de creación de reporte"""
        report = Report.objects.create(
            name='Reporte Mensual de Citas',
            report_type='appointments',
            generated_by=self.admin,
            parameters={
                'start_date': '2024-01-01',
                'end_date': '2024-01-31',
                'group_by': 'status'
            },
            format='pdf'
        )
        
        self.assertEqual(report.generated_by, self.admin)
        self.assertEqual(report.status, 'pending')
        self.assertEqual(report.format, 'pdf')
        
    def test_report_schedule_creation(self):
        """Test de creación de programación de reporte"""
        schedule = ReportSchedule.objects.create(
            name='Reporte Diario de Emergencias',
            report_type='emergency',
            frequency='daily',
            time='08:00',
            parameters={
                'include_triage': True,
                'include_discharged': True
            },
            recipients=['admin@hospital.com', 'emergency@hospital.com'],
            format='excel',
            created_by=self.admin
        )
        
        self.assertEqual(schedule.frequency, 'daily')
        self.assertEqual(len(schedule.recipients), 2)
        self.assertTrue(schedule.is_active)
        
        # Calcular próxima ejecución
        self.assertIsNotNone(schedule.next_run)
        self.assertGreater(schedule.next_run, timezone.now())
        
    def test_report_data_validation(self):
        """Test de validación de datos de reporte"""
        report = Report(
            name='Test Report',
            report_type='invalid_type',  # Tipo inválido
            generated_by=self.admin
        )
        
        with self.assertRaises(ValidationError):
            report.full_clean()
            
    def test_report_file_generation(self):
        """Test de generación de archivo de reporte"""
        report = Report.objects.create(
            name='Test Report',
            report_type='appointments',
            generated_by=self.admin,
            format='csv'
        )
        
        # Simular generación
        report.status = 'processing'
        report.save()
        
        # Simular completado
        report.status = 'completed'
        report.data = {'total': 100, 'by_status': {'completed': 80, 'cancelled': 20}}
        report.file_url = '/media/reports/test_report.csv'
        report.file_size = 2048  # 2KB
        report.save()
        
        self.assertEqual(report.status, 'completed')
        self.assertIsNotNone(report.file_url)
        self.assertEqual(report.file_size_display, '2.0 KB')


if __name__ == '__main__':
    import django
    from django.test import TestCase
    django.setup()
    TestCase.main()