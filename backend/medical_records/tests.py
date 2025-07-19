from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

from .models import (
    MedicalRecord, Prescription, PrescriptionItem, VitalSigns,
    Allergy, LabTest, MedicalDocument
)
from .serializers import (
    MedicalRecordSerializer, PrescriptionSerializer, VitalSignsSerializer,
    AllergySerializer, LabTestSerializer, MedicalDocumentSerializer
)
from appointments.models import Appointment
from pharmacy.models import Medication

User = get_user_model()


class BaseMedicalRecordTestCase(TestCase):
    """Clase base para los tests de medical records"""
    
    def setUp(self):
        # Crear usuarios
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        self.doctor = User.objects.create_user(email='doctor@hospital.com',
            password='doctorpassword',
            role='doctor',
            first_name='Dr. John',
            last_name='Smith'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            role='patient',
            first_name='Jane',
            last_name='Doe',
            birth_date='1990-01-01',
            blood_type='O+'
        )
        
        self.pharmacist = User.objects.create_user(email='pharmacist@hospital.com',
            password='pharmacistpassword',
            role='pharmacist',
            first_name='Pharm',
            last_name='Tech'
        )
        
        # Crear registro médico
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            record_date=date.today(),
            description='Consulta por dolor de cabeza severo',
            diagnosis='Migraña con aura',
            treatment='Reposo, hidratación, analgésicos',
            notes='Paciente refiere episodios recurrentes'
        )
        
        # Crear medicamento para prescripciones
        self.medication = Medication.objects.create(
            name='Paracetamol',
            code='PARA500',
            description='Analgésico y antipirético',
            dosage_form='Tableta',
            strength='500mg',
            manufacturer='Genérico',
            price=Decimal('10.00'),
            requires_prescription=False,
            stock_quantity=1000,
            minimum_stock=100,
            is_active=True
        )
        
        # Crear prescripción
        self.prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            medical_record=self.medical_record,
            issue_date=timezone.now(),
            valid_until=date.today() + timedelta(days=30),
            diagnosis='Migraña con aura',
            instructions='Tomar según indicaciones médicas'
        )
        
        # Crear item de prescripción
        self.prescription_item = PrescriptionItem.objects.create(
            prescription=self.prescription,
            medication=self.medication,
            dosage='500mg',
            frequency='Cada 8 horas',
            duration='Por 5 días',
            quantity=15,
            instructions='Tomar con alimentos'
        )
        
        # Crear signos vitales
        self.vital_signs = VitalSigns.objects.create(
            patient=self.patient,
            recorded_by=self.doctor,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            heart_rate=72,
            respiratory_rate=16,
            temperature=Decimal('36.5'),
            oxygen_saturation=98,
            weight=Decimal('70.5'),
            height=Decimal('175.0'),
            notes='Signos vitales normales'
        )
        
        # Crear alergia
        self.allergy = Allergy.objects.create(
            patient=self.patient,
            allergen='Penicilina',
            allergen_type='medication',
            severity='severe',
            reaction='Anafilaxis',
            first_observed=date(2010, 5, 15),
            is_active=True,
            created_by=self.doctor
        )
        
        # Crear examen de laboratorio
        self.lab_test = LabTest.objects.create(
            patient=self.patient,
            ordered_by=self.doctor,
            medical_record=self.medical_record,
            test_name='Hemograma completo',
            test_code='HEM001',
            description='Análisis completo de células sanguíneas',
            status='ordered',
            priority='normal'
        )


class MedicalRecordModelTests(BaseMedicalRecordTestCase):
    """Tests para el modelo MedicalRecord"""
    
    def test_medical_record_creation(self):
        """Prueba la creación y atributos de un registro médico"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            record_date=date.today(),
            description='Consulta de seguimiento',
            diagnosis='Hipertensión arterial',
            treatment='Medicación antihipertensiva',
            notes='Paciente con buena adherencia al tratamiento'
        )
        
        self.assertEqual(record.patient, self.patient)
        self.assertEqual(record.doctor, self.doctor)
        self.assertEqual(record.record_date, date.today())
        self.assertEqual(record.description, 'Consulta de seguimiento')
        self.assertEqual(record.diagnosis, 'Hipertensión arterial')
        self.assertEqual(record.treatment, 'Medicación antihipertensiva')
        self.assertEqual(record.notes, 'Paciente con buena adherencia al tratamiento')
        self.assertIsNotNone(record.created_at)
        self.assertIsNotNone(record.updated_at)
    
    def test_medical_record_str_representation(self):
        """Prueba la representación string de un registro médico"""
        expected_str = f"Registro de {self.patient.get_full_name()} - {self.medical_record.record_date}"
        self.assertEqual(str(self.medical_record), expected_str)
    
    def test_medical_record_ordering(self):
        """Prueba el ordenamiento de registros médicos"""
        # Crear registros adicionales con diferentes fechas
        MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            record_date=date.today() - timedelta(days=1),
            description='Consulta anterior',
            diagnosis='Gripe',
            treatment='Reposo'
        )
        
        MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            record_date=date.today() + timedelta(days=1),
            description='Consulta futura',
            diagnosis='Control',
            treatment='Ninguno'
        )
        
        records = MedicalRecord.objects.all()
        # Debe ordenar por fecha descendente (más reciente primero)
        self.assertEqual(records[0].record_date, date.today() + timedelta(days=1))
        self.assertEqual(records[1].record_date, date.today())
        self.assertEqual(records[2].record_date, date.today() - timedelta(days=1))


class PrescriptionModelTests(BaseMedicalRecordTestCase):
    """Tests para el modelo Prescription"""
    
    def test_prescription_creation(self):
        """Prueba la creación y atributos de una prescripción"""
        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            medical_record=self.medical_record,
            issue_date=timezone.now(),
            valid_until=date.today() + timedelta(days=15),
            diagnosis='Infección respiratoria',
            instructions='Completar el tratamiento antibiótico'
        )
        
        self.assertEqual(prescription.patient, self.patient)
        self.assertEqual(prescription.doctor, self.doctor)
        self.assertEqual(prescription.medical_record, self.medical_record)
        self.assertEqual(prescription.diagnosis, 'Infección respiratoria')
        self.assertEqual(prescription.instructions, 'Completar el tratamiento antibiótico')
        self.assertTrue(prescription.is_active)
        self.assertIsInstance(prescription.prescription_id, uuid.UUID)
        self.assertIsNotNone(prescription.created_at)
        self.assertIsNotNone(prescription.updated_at)
    
    def test_prescription_str_representation(self):
        """Prueba la representación string de una prescripción"""
        expected_str = f"Receta {self.prescription.prescription_id} - {self.patient.get_full_name()}"
        self.assertEqual(str(self.prescription), expected_str)
    
    def test_prescription_is_expired_property(self):
        """Prueba la propiedad is_expired de una prescripción"""
        # Prescripción vigente
        self.assertFalse(self.prescription.is_expired)
        
        # Prescripción expirada
        expired_prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            valid_until=date.today() - timedelta(days=1),  # Ayer
            diagnosis='Dolor muscular',
            instructions='Aplicar gel antiinflamatorio'
        )
        self.assertTrue(expired_prescription.is_expired)


class PrescriptionItemModelTests(BaseMedicalRecordTestCase):
    """Tests para el modelo PrescriptionItem"""
    
    def test_prescription_item_creation(self):
        """Prueba la creación y atributos de un item de prescripción"""
        item = PrescriptionItem.objects.create(
            prescription=self.prescription,
            medication=self.medication,
            dosage='1000mg',
            frequency='Cada 12 horas',
            duration='Por 7 días',
            quantity=14,
            instructions='No exceder la dosis máxima diaria'
        )
        
        self.assertEqual(item.prescription, self.prescription)
        self.assertEqual(item.medication, self.medication)
        self.assertEqual(item.dosage, '1000mg')
        self.assertEqual(item.frequency, 'Cada 12 horas')
        self.assertEqual(item.duration, 'Por 7 días')
        self.assertEqual(item.quantity, 14)
        self.assertEqual(item.instructions, 'No exceder la dosis máxima diaria')
        self.assertFalse(item.is_dispensed)
        self.assertIsNone(item.dispensed_at)
        self.assertIsNone(item.dispensed_by)
    
    def test_prescription_item_str_representation(self):
        """Prueba la representación string de un item de prescripción"""
        expected_str = f"{self.medication.name} - {self.prescription_item.dosage}"
        self.assertEqual(str(self.prescription_item), expected_str)
    
    def test_prescription_item_mark_as_dispensed_method(self):
        """Prueba el método mark_as_dispensed de un item de prescripción"""
        self.prescription_item.mark_as_dispensed(self.pharmacist)
        
        # Recargar desde la base de datos
        self.prescription_item.refresh_from_db()
        
        self.assertTrue(self.prescription_item.is_dispensed)
        self.assertIsNotNone(self.prescription_item.dispensed_at)
        self.assertEqual(self.prescription_item.dispensed_by, self.pharmacist)


class VitalSignsModelTests(BaseMedicalRecordTestCase):
    """Tests para el modelo VitalSigns"""
    
    def test_vital_signs_creation(self):
        """Prueba la creación y atributos de signos vitales"""
        vital_signs = VitalSigns.objects.create(
            patient=self.patient,
            recorded_by=self.doctor,
            blood_pressure_systolic=130,
            blood_pressure_diastolic=85,
            heart_rate=78,
            respiratory_rate=18,
            temperature=Decimal('37.0'),
            oxygen_saturation=97,
            weight=Decimal('72.3'),
            height=Decimal('178.5'),
            notes='Leve hipertensión'
        )
        
        self.assertEqual(vital_signs.patient, self.patient)
        self.assertEqual(vital_signs.recorded_by, self.doctor)
        self.assertEqual(vital_signs.blood_pressure_systolic, 130)
        self.assertEqual(vital_signs.blood_pressure_diastolic, 85)
        self.assertEqual(vital_signs.heart_rate, 78)
        self.assertEqual(vital_signs.respiratory_rate, 18)
        self.assertEqual(vital_signs.temperature, Decimal('37.0'))
        self.assertEqual(vital_signs.oxygen_saturation, 97)
        self.assertEqual(vital_signs.weight, Decimal('72.3'))
        self.assertEqual(vital_signs.height, Decimal('178.5'))
        self.assertEqual(vital_signs.notes, 'Leve hipertensión')
        self.assertIsNotNone(vital_signs.recorded_at)
    
    def test_vital_signs_str_representation(self):
        """Prueba la representación string de signos vitales"""
        expected_str = f"Signos vitales de {self.patient.get_full_name()} - {self.vital_signs.recorded_at}"
        self.assertEqual(str(self.vital_signs), expected_str)
    
    def test_vital_signs_bmi_property(self):
        """Prueba la propiedad BMI de signos vitales"""
        # BMI = peso (kg) / (altura (m))^2
        # 70.5 / (1.75)^2 = 70.5 / 3.0625 = 23.02
        self.assertEqual(self.vital_signs.bmi, Decimal('23.02'))
        
        # Probar con signos vitales sin peso o altura
        incomplete_vitals = VitalSigns.objects.create(
            patient=self.patient,
            recorded_by=self.doctor,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            heart_rate=72,
            respiratory_rate=16,
            temperature=Decimal('36.5'),
            oxygen_saturation=98,
            weight=None,
            height=None
        )
        self.assertIsNone(incomplete_vitals.bmi)
    
    def test_vital_signs_blood_pressure_property(self):
        """Prueba la propiedad blood_pressure de signos vitales"""
        self.assertEqual(self.vital_signs.blood_pressure, "120/80")
    
    def test_vital_signs_validators(self):
        """Prueba los validadores de signos vitales"""
        # Valores fuera de rango deberían fallar
        with self.assertRaises(Exception):
            VitalSigns.objects.create(
                patient=self.patient,
                recorded_by=self.doctor,
                blood_pressure_systolic=300,  # Muy alto
                blood_pressure_diastolic=80,
                heart_rate=72,
                respiratory_rate=16,
                temperature=Decimal('36.5'),
                oxygen_saturation=98,
                weight=Decimal('70.5'),
                height=Decimal('175.0')
            )


class AllergyModelTests(BaseMedicalRecordTestCase):
    """Tests para el modelo Allergy"""
    
    def test_allergy_creation(self):
        """Prueba la creación y atributos de una alergia"""
        allergy = Allergy.objects.create(
            patient=self.patient,
            allergen='Ibuprofeno',
            allergen_type='medication',
            severity='moderate',
            reaction='Urticaria y edema',
            first_observed=date(2015, 3, 10),
            is_active=True,
            created_by=self.doctor
        )
        
        self.assertEqual(allergy.patient, self.patient)
        self.assertEqual(allergy.allergen, 'Ibuprofeno')
        self.assertEqual(allergy.allergen_type, 'medication')
        self.assertEqual(allergy.severity, 'moderate')
        self.assertEqual(allergy.reaction, 'Urticaria y edema')
        self.assertEqual(allergy.first_observed, date(2015, 3, 10))
        self.assertTrue(allergy.is_active)
        self.assertEqual(allergy.created_by, self.doctor)
        self.assertIsNotNone(allergy.created_at)
        self.assertIsNotNone(allergy.updated_at)
    
    def test_allergy_str_representation(self):
        """Prueba la representación string de una alergia"""
        expected_str = f"{self.patient.get_full_name()} - {self.allergy.allergen} (Severa)"
        self.assertEqual(str(self.allergy), expected_str)
    
    def test_allergy_ordering(self):
        """Prueba el ordenamiento de alergias"""
        # Crear alergias con diferentes severidades
        mild_allergy = Allergy.objects.create(
            patient=self.patient,
            allergen='Polen',
            allergen_type='environmental',
            severity='mild',
            reaction='Rinitis',
            created_by=self.doctor
        )
        
        moderate_allergy = Allergy.objects.create(
            patient=self.patient,
            allergen='Mariscos',
            allergen_type='food',
            severity='moderate',
            reaction='Náuseas y vómitos',
            created_by=self.doctor
        )
        
        allergies = Allergy.objects.filter(patient=self.patient)
        # Debe ordenar por severidad descendente y luego por alérgeno
        self.assertEqual(allergies[0].severity, 'severe')
        self.assertEqual(allergies[1].severity, 'moderate')
        self.assertEqual(allergies[2].severity, 'mild')
    
    def test_allergy_unique_together_constraint(self):
        """Prueba la restricción de unicidad para alergias"""
        # Intentar crear una alergia duplicada (mismo paciente y alérgeno)
        with self.assertRaises(Exception):
            Allergy.objects.create(
                patient=self.patient,
                allergen='Penicilina',  # Ya existe
                allergen_type='medication',
                severity='mild',
                reaction='Erupción cutánea',
                created_by=self.doctor
            )


class LabTestModelTests(BaseMedicalRecordTestCase):
    """Tests para el modelo LabTest"""
    
    def test_lab_test_creation(self):
        """Prueba la creación y atributos de un examen de laboratorio"""
        lab_test = LabTest.objects.create(
            patient=self.patient,
            ordered_by=self.doctor,
            medical_record=self.medical_record,
            test_name='Perfil lipídico',
            test_code='LIP001',
            description='Análisis de colesterol y triglicéridos',
            status='ordered',
            priority='urgent',
            ordered_date=timezone.now()
        )
        
        self.assertEqual(lab_test.patient, self.patient)
        self.assertEqual(lab_test.ordered_by, self.doctor)
        self.assertEqual(lab_test.medical_record, self.medical_record)
        self.assertEqual(lab_test.test_name, 'Perfil lipídico')
        self.assertEqual(lab_test.test_code, 'LIP001')
        self.assertEqual(lab_test.description, 'Análisis de colesterol y triglicéridos')
        self.assertEqual(lab_test.status, 'ordered')
        self.assertEqual(lab_test.priority, 'urgent')
        self.assertIsNotNone(lab_test.ordered_date)
        self.assertIsNone(lab_test.collection_date)
        self.assertIsNone(lab_test.result_date)
        self.assertEqual(lab_test.results, '')
        self.assertIsNotNone(lab_test.created_at)
        self.assertIsNotNone(lab_test.updated_at)
    
    def test_lab_test_str_representation(self):
        """Prueba la representación string de un examen de laboratorio"""
        expected_str = f"{self.lab_test.test_name} - {self.patient.get_full_name()} (Ordenado)"
        self.assertEqual(str(self.lab_test), expected_str)
    
    def test_lab_test_update_status_method(self):
        """Prueba el método update_status de un examen de laboratorio"""
        # Actualizar a muestra recolectada
        self.lab_test.update_status('sample_collected')
        self.lab_test.refresh_from_db()
        
        self.assertEqual(self.lab_test.status, 'sample_collected')
        self.assertIsNotNone(self.lab_test.collection_date)
        self.assertIsNone(self.lab_test.result_date)
        
        # Actualizar a completado
        self.lab_test.update_status('completed')
        self.lab_test.refresh_from_db()
        
        self.assertEqual(self.lab_test.status, 'completed')
        self.assertIsNotNone(self.lab_test.result_date)


class MedicalDocumentModelTests(BaseMedicalRecordTestCase):
    """Tests para el modelo MedicalDocument"""
    
    def test_medical_document_creation(self):
        """Prueba la creación y atributos de un documento médico"""
        # Crear un archivo de prueba
        test_file = SimpleUploadedFile(
            "test_document.pdf",
            b"file_content",
            content_type="application/pdf"
        )
        
        document = MedicalDocument.objects.create(
            record=self.medical_record,
            document_name='Radiografía de tórax',
            document_file=test_file
        )
        
        self.assertEqual(document.record, self.medical_record)
        self.assertEqual(document.document_name, 'Radiografía de tórax')
        self.assertIsNotNone(document.document_file)
        self.assertIsNotNone(document.uploaded_at)
    
    def test_medical_document_str_representation(self):
        """Prueba la representación string de un documento médico"""
        test_file = SimpleUploadedFile(
            "test_doc.pdf",
            b"content",
            content_type="application/pdf"
        )
        
        document = MedicalDocument.objects.create(
            record=self.medical_record,
            document_name='Resultados de laboratorio',
            document_file=test_file
        )
        
        expected_str = f"Resultados de laboratorio - {self.patient.get_full_name()}"
        self.assertEqual(str(document), expected_str)


class MedicalRecordSerializerTests(BaseMedicalRecordTestCase):
    """Tests para los serializadores de medical records"""
    
    def test_medical_record_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = MedicalRecordSerializer(self.medical_record)
        expected_fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'record_date', 'description', 'diagnosis', 'treatment',
            'notes', 'documents', 'prescriptions', 'lab_tests',
            'created_at', 'updated_at'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_medical_record_serializer_nested_data(self):
        """Prueba los datos anidados del serializador"""
        serializer = MedicalRecordSerializer(self.medical_record)
        
        # Verificar que incluye las prescripciones relacionadas
        self.assertEqual(len(serializer.data['prescriptions']), 1)
        self.assertEqual(
            serializer.data['prescriptions'][0]['prescription_id'],
            str(self.prescription.prescription_id)
        )
        
        # Verificar que incluye los exámenes de laboratorio relacionados
        self.assertEqual(len(serializer.data['lab_tests']), 1)
        self.assertEqual(
            serializer.data['lab_tests'][0]['test_name'],
            self.lab_test.test_name
        )


class AllergySerializerTests(BaseMedicalRecordTestCase):
    """Tests para el serializador de Allergy"""
    
    def test_allergy_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = AllergySerializer(self.allergy)
        expected_fields = [
            'id', 'patient', 'patient_name', 'allergen', 'allergen_type',
            'allergen_type_display', 'severity', 'severity_display', 'reaction',
            'first_observed', 'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_allergy_serializer_display_fields(self):
        """Prueba los campos de visualización del serializador"""
        serializer = AllergySerializer(self.allergy)
        self.assertEqual(serializer.data['patient_name'], self.patient.get_full_name())
        self.assertEqual(serializer.data['created_by_name'], self.doctor.get_full_name())
        self.assertEqual(serializer.data['allergen_type_display'], 'Medicamento')
        self.assertEqual(serializer.data['severity_display'], 'Severa')


class VitalSignsSerializerTests(BaseMedicalRecordTestCase):
    """Tests para el serializador de VitalSigns"""
    
    def test_vital_signs_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = VitalSignsSerializer(self.vital_signs)
        expected_fields = [
            'id', 'patient', 'patient_name', 'recorded_by', 'recorded_by_name',
            'appointment', 'blood_pressure_systolic', 'blood_pressure_diastolic',
            'blood_pressure', 'heart_rate', 'respiratory_rate', 'temperature',
            'oxygen_saturation', 'weight', 'height', 'bmi', 'recorded_at', 'notes'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_vital_signs_serializer_calculated_fields(self):
        """Prueba los campos calculados del serializador"""
        serializer = VitalSignsSerializer(self.vital_signs)
        self.assertEqual(serializer.data['blood_pressure'], '120/80')
        self.assertEqual(serializer.data['bmi'], '23.02')


class MedicalRecordAPITests(APITestCase):
    """Tests para la API de Medical Records"""
    
    def setUp(self):
        # Crear usuarios
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            role='admin'
        )
        
        self.doctor = User.objects.create_user(email='doctor@hospital.com',
            password='doctorpassword',
            role='doctor'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            role='patient'
        )
        
        self.other_patient = User.objects.create_user(email='other@example.com',
            password='otherpassword',
            role='patient'
        )
        
        # Crear registro médico
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            record_date=date.today(),
            description='Consulta inicial',
            diagnosis='Hipertensión',
            treatment='Medicación',
            notes='Seguimiento en 1 mes'
        )
        
        # URLs de la API
        self.medical_record_list_url = reverse('medicalrecord-list')
        self.medical_record_detail_url = reverse('medicalrecord-detail', args=[self.medical_record.id])
        self.medical_record_summary_url = reverse('medicalrecord-summary')
        
    def test_admin_can_access_all_records(self):
        """Prueba que un admin pueda acceder a todos los registros"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(self.medical_record_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_doctor_can_access_patient_records(self):
        """Prueba que un doctor pueda acceder a registros de pacientes"""
        self.client.force_authenticate(user=self.doctor)
        
        response = self.client.get(self.medical_record_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.medical_record.id)
    
    def test_patient_can_only_access_own_records(self):
        """Prueba que un paciente solo pueda acceder a sus propios registros"""
        self.client.force_authenticate(user=self.patient)
        
        # Puede acceder a su propio registro
        response = self.client.get(self.medical_record_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Crear registro para otro paciente
        other_record = MedicalRecord.objects.create(
            patient=self.other_patient,
            doctor=self.doctor,
            record_date=date.today(),
            description='Consulta otro paciente',
            diagnosis='Gripe',
            treatment='Reposo'
        )
        
        # No puede acceder al registro de otro paciente
        other_url = reverse('medicalrecord-detail', args=[other_record.id])
        response = self.client.get(other_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_medical_record(self):
        """Prueba crear un nuevo registro médico"""
        self.client.force_authenticate(user=self.doctor)
        
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'record_date': date.today().isoformat(),
            'description': 'Nueva consulta',
            'diagnosis': 'Faringitis',
            'treatment': 'Antibióticos',
            'notes': 'Revisar en 1 semana'
        }
        
        response = self.client.post(self.medical_record_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MedicalRecord.objects.count(), 2)
        
        # Verificar los datos creados
        new_record = MedicalRecord.objects.get(id=response.data['id'])
        self.assertEqual(new_record.patient, self.patient)
        self.assertEqual(new_record.diagnosis, 'Faringitis')
    
    def test_update_medical_record(self):
        """Prueba actualizar un registro médico"""
        self.client.force_authenticate(user=self.doctor)
        
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'record_date': self.medical_record.record_date.isoformat(),
            'description': self.medical_record.description,
            'diagnosis': 'Hipertensión controlada',  # Actualizar diagnóstico
            'treatment': 'Continuar medicación',  # Actualizar tratamiento
            'notes': 'Paciente estable'  # Actualizar notas
        }
        
        response = self.client.put(self.medical_record_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar la actualización
        self.medical_record.refresh_from_db()
        self.assertEqual(self.medical_record.diagnosis, 'Hipertensión controlada')
        self.assertEqual(self.medical_record.treatment, 'Continuar medicación')
        self.assertEqual(self.medical_record.notes, 'Paciente estable')
    
    def test_medical_record_summary(self):
        """Prueba obtener el resumen del expediente médico"""
        self.client.force_authenticate(user=self.patient)
        
        response = self.client.get(self.medical_record_summary_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que contiene los campos esperados
        expected_fields = [
            'patient_name', 'blood_type', 'age', 'allergies_count',
            'active_prescriptions', 'pending_lab_results', 'last_visit',
            'total_records', 'recent_vital_signs'
        ]
        for field in expected_fields:
            self.assertIn(field, response.data)
    
    def test_patient_privacy_protection(self):
        """Prueba la protección de privacidad de datos médicos"""
        # Usuario no autenticado no puede acceder
        response = self.client.get(self.medical_record_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.get(self.medical_record_detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)