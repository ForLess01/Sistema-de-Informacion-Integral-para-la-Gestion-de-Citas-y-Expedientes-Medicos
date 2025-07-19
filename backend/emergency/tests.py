from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

from .models import (
    EmergencyCase, EmergencyVitalSigns, EmergencyMedication,
    EmergencyProcedure, EmergencyTransfer
)
from .serializers import (
    EmergencyCaseListSerializer, EmergencyCaseDetailSerializer,
    EmergencyVitalSignsSerializer, EmergencyMedicationSerializer,
    EmergencyProcedureSerializer, EmergencyTransferSerializer
)
from pharmacy.models import Medication

User = get_user_model()


class BaseEmergencyTestCase(TestCase):
    """Clase base para los tests de emergency"""
    
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
        
        self.nurse = User.objects.create_user(email='nurse@hospital.com',
            password='nursepassword',
            role='nurse',
            first_name='Jane',
            last_name='Nurse'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            role='patient',
            first_name='John',
            last_name='Doe'
        )
        
        # Crear medicamento para las pruebas
        self.medication = Medication.objects.create(
            name='Epinefrina',
            description='Medicamento de emergencia',
            dosage_form='Inyección',
            strength='1mg/ml',
            quantity_in_stock=50,
            reordering_threshold=10
        )
        
        # Crear caso de emergencia
        self.emergency_case = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='ambulance',
            chief_complaint='Dolor torácico severo',
            status='waiting'
        )
        
        # Crear signos vitales
        self.vital_signs = EmergencyVitalSigns.objects.create(
            emergency_case=self.emergency_case,
            blood_pressure_systolic=140,
            blood_pressure_diastolic=90,
            heart_rate=110,
            respiratory_rate=22,
            temperature=Decimal('37.8'),
            oxygen_saturation=92,
            pain_scale=8,
            glasgow_coma_scale=15,
            recorded_by=self.nurse,
            notes='Paciente ansioso'
        )


class EmergencyCaseModelTests(BaseEmergencyTestCase):
    """Tests para el modelo EmergencyCase"""
    
    def test_emergency_case_creation(self):
        """Prueba la creación y atributos de un caso de emergencia"""
        case = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='walk_in',
            chief_complaint='Fractura de brazo',
            notes='Caída desde escalera'
        )
        
        self.assertEqual(case.patient, self.patient)
        self.assertEqual(case.arrival_mode, 'walk_in')
        self.assertEqual(case.chief_complaint, 'Fractura de brazo')
        self.assertEqual(case.status, 'waiting')
        self.assertIsNone(case.triage_level)
        self.assertIsNone(case.triage_time)
        self.assertIsNone(case.attending_doctor)
        self.assertIsInstance(case.case_id, uuid.UUID)
        self.assertIsNotNone(case.arrival_time)
        self.assertIsNotNone(case.created_at)
        self.assertIsNotNone(case.updated_at)
    
    def test_emergency_case_str_representation(self):
        """Prueba la representación string de un caso de emergencia"""
        expected_str = f"Emergencia {self.emergency_case.case_id} - {self.patient.get_full_name()}"
        self.assertEqual(str(self.emergency_case), expected_str)
    
    def test_emergency_case_waiting_time_property(self):
        """Prueba la propiedad waiting_time"""
        # Caso en espera
        waiting_time = self.emergency_case.waiting_time
        self.assertIsNotNone(waiting_time)
        self.assertGreaterEqual(waiting_time, 0)
        
        # Caso con tratamiento iniciado
        self.emergency_case.treatment_start_time = timezone.now() + timedelta(minutes=30)
        self.emergency_case.save()
        self.assertAlmostEqual(self.emergency_case.waiting_time, 30, delta=1)
        
        # Caso dado de alta
        self.emergency_case.status = 'discharged'
        self.emergency_case.save()
        self.assertIsNotNone(self.emergency_case.waiting_time)
    
    def test_emergency_case_total_time_property(self):
        """Prueba la propiedad total_time"""
        # Caso activo
        total_time = self.emergency_case.total_time
        self.assertIsNotNone(total_time)
        self.assertGreaterEqual(total_time, 0)
        
        # Caso dado de alta
        self.emergency_case.discharge_time = timezone.now() + timedelta(hours=2)
        self.emergency_case.save()
        self.assertAlmostEqual(self.emergency_case.total_time, 120, delta=1)
    
    def test_emergency_case_triage_levels(self):
        """Prueba los niveles de triaje"""
        for level, description in EmergencyCase.TRIAGE_LEVELS:
            case = EmergencyCase.objects.create(
                patient=self.patient,
                arrival_mode='ambulance',
                chief_complaint=f'Caso nivel {level}',
                triage_level=level
            )
            self.assertEqual(case.triage_level, level)
            self.assertIn(str(level), case.get_triage_level_display())
    
    def test_emergency_case_ordering(self):
        """Prueba el ordenamiento de casos de emergencia"""
        # Crear casos adicionales con diferentes tiempos y niveles de triaje
        case1 = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='walk_in',
            chief_complaint='Caso 1',
            triage_level=3
        )
        
        case2 = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='ambulance',
            chief_complaint='Caso 2',
            triage_level=1
        )
        
        cases = EmergencyCase.objects.all()
        # Debe ordenar por tiempo de llegada descendente y nivel de triaje
        self.assertEqual(cases[0], case2)  # Más reciente
        self.assertEqual(cases[1], case1)  # Segundo más reciente
        self.assertEqual(cases[2], self.emergency_case)  # Más antiguo


class EmergencyVitalSignsModelTests(BaseEmergencyTestCase):
    """Tests para el modelo EmergencyVitalSigns"""
    
    def test_emergency_vital_signs_creation(self):
        """Prueba la creación y atributos de signos vitales de emergencia"""
        vital_signs = EmergencyVitalSigns.objects.create(
            emergency_case=self.emergency_case,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            heart_rate=72,
            respiratory_rate=16,
            temperature=Decimal('36.5'),
            oxygen_saturation=98,
            pain_scale=3,
            glasgow_coma_scale=15,
            recorded_by=self.nurse,
            notes='Signos estables'
        )
        
        self.assertEqual(vital_signs.emergency_case, self.emergency_case)
        self.assertEqual(vital_signs.blood_pressure_systolic, 120)
        self.assertEqual(vital_signs.blood_pressure_diastolic, 80)
        self.assertEqual(vital_signs.heart_rate, 72)
        self.assertEqual(vital_signs.respiratory_rate, 16)
        self.assertEqual(vital_signs.temperature, Decimal('36.5'))
        self.assertEqual(vital_signs.oxygen_saturation, 98)
        self.assertEqual(vital_signs.pain_scale, 3)
        self.assertEqual(vital_signs.glasgow_coma_scale, 15)
        self.assertEqual(vital_signs.recorded_by, self.nurse)
        self.assertEqual(vital_signs.notes, 'Signos estables')
        self.assertIsNotNone(vital_signs.recorded_at)
    
    def test_emergency_vital_signs_str_representation(self):
        """Prueba la representación string de signos vitales de emergencia"""
        expected_str = f"Signos vitales - {self.emergency_case} - {self.vital_signs.recorded_at}"
        self.assertEqual(str(self.vital_signs), expected_str)
    
    def test_emergency_vital_signs_validators(self):
        """Prueba los validadores de signos vitales"""
        # Valores fuera de rango deberían fallar
        with self.assertRaises(Exception):
            EmergencyVitalSigns.objects.create(
                emergency_case=self.emergency_case,
                blood_pressure_systolic=350,  # Muy alto
                recorded_by=self.nurse
            )
        
        with self.assertRaises(Exception):
            EmergencyVitalSigns.objects.create(
                emergency_case=self.emergency_case,
                pain_scale=15,  # Escala es 0-10
                recorded_by=self.nurse
            )
        
        with self.assertRaises(Exception):
            EmergencyVitalSigns.objects.create(
                emergency_case=self.emergency_case,
                glasgow_coma_scale=20,  # Escala es 3-15
                recorded_by=self.nurse
            )
    
    def test_emergency_vital_signs_optional_fields(self):
        """Prueba que los campos de signos vitales son opcionales"""
        # Crear signos vitales con solo algunos campos
        vital_signs = EmergencyVitalSigns.objects.create(
            emergency_case=self.emergency_case,
            heart_rate=80,
            oxygen_saturation=95,
            recorded_by=self.nurse
        )
        
        self.assertIsNone(vital_signs.blood_pressure_systolic)
        self.assertIsNone(vital_signs.blood_pressure_diastolic)
        self.assertIsNone(vital_signs.temperature)
        self.assertEqual(vital_signs.heart_rate, 80)
        self.assertEqual(vital_signs.oxygen_saturation, 95)


class EmergencyMedicationModelTests(BaseEmergencyTestCase):
    """Tests para el modelo EmergencyMedication"""
    
    def test_emergency_medication_creation(self):
        """Prueba la creación y atributos de medicación de emergencia"""
        medication = EmergencyMedication.objects.create(
            emergency_case=self.emergency_case,
            medication=self.medication,
            dose='0.5mg',
            route='iv',
            administered_by=self.doctor,
            response='Mejoría inmediata',
            adverse_reaction=False
        )
        
        self.assertEqual(medication.emergency_case, self.emergency_case)
        self.assertEqual(medication.medication, self.medication)
        self.assertEqual(medication.dose, '0.5mg')
        self.assertEqual(medication.route, 'iv')
        self.assertEqual(medication.administered_by, self.doctor)
        self.assertEqual(medication.response, 'Mejoría inmediata')
        self.assertFalse(medication.adverse_reaction)
        self.assertEqual(medication.adverse_reaction_details, '')
        self.assertIsNotNone(medication.administered_at)
    
    def test_emergency_medication_str_representation(self):
        """Prueba la representación string de medicación de emergencia"""
        medication = EmergencyMedication.objects.create(
            emergency_case=self.emergency_case,
            medication=self.medication,
            dose='1mg',
            route='im',
            administered_by=self.doctor
        )
        
        expected_str = f"{self.medication.name} - {self.emergency_case}"
        self.assertEqual(str(medication), expected_str)
    
    def test_emergency_medication_with_adverse_reaction(self):
        """Prueba medicación con reacción adversa"""
        medication = EmergencyMedication.objects.create(
            emergency_case=self.emergency_case,
            medication=self.medication,
            dose='2mg',
            route='iv',
            administered_by=self.doctor,
            adverse_reaction=True,
            adverse_reaction_details='Taquicardia severa'
        )
        
        self.assertTrue(medication.adverse_reaction)
        self.assertEqual(medication.adverse_reaction_details, 'Taquicardia severa')
    
    def test_emergency_medication_routes(self):
        """Prueba las diferentes rutas de administración"""
        routes = ['oral', 'iv', 'im', 'sc', 'topical', 'inhalation', 'other']
        
        for route in routes:
            medication = EmergencyMedication.objects.create(
                emergency_case=self.emergency_case,
                medication=self.medication,
                dose='Test dose',
                route=route,
                administered_by=self.doctor
            )
            self.assertEqual(medication.route, route)


class EmergencyProcedureModelTests(BaseEmergencyTestCase):
    """Tests para el modelo EmergencyProcedure"""
    
    def test_emergency_procedure_creation(self):
        """Prueba la creación y atributos de procedimiento de emergencia"""
        procedure = EmergencyProcedure.objects.create(
            emergency_case=self.emergency_case,
            procedure_name='Intubación endotraqueal',
            procedure_code='INTUB001',
            description='Intubación de emergencia por insuficiencia respiratoria',
            performed_by=self.doctor,
            duration_minutes=15,
            outcome='successful',
            notes='Procedimiento sin complicaciones'
        )
        
        self.assertEqual(procedure.emergency_case, self.emergency_case)
        self.assertEqual(procedure.procedure_name, 'Intubación endotraqueal')
        self.assertEqual(procedure.procedure_code, 'INTUB001')
        self.assertEqual(procedure.description, 'Intubación de emergencia por insuficiencia respiratoria')
        self.assertEqual(procedure.performed_by, self.doctor)
        self.assertEqual(procedure.duration_minutes, 15)
        self.assertEqual(procedure.outcome, 'successful')
        self.assertEqual(procedure.complications, '')
        self.assertEqual(procedure.notes, 'Procedimiento sin complicaciones')
        self.assertIsNotNone(procedure.performed_at)
    
    def test_emergency_procedure_str_representation(self):
        """Prueba la representación string de procedimiento de emergencia"""
        procedure = EmergencyProcedure.objects.create(
            emergency_case=self.emergency_case,
            procedure_name='RCP',
            description='Reanimación cardiopulmonar',
            performed_by=self.doctor,
            outcome='successful'
        )
        
        expected_str = f"RCP - {self.emergency_case}"
        self.assertEqual(str(procedure), expected_str)
    
    def test_emergency_procedure_outcomes(self):
        """Prueba los diferentes resultados de procedimientos"""
        outcomes = ['successful', 'partial', 'failed', 'aborted']
        
        for outcome in outcomes:
            procedure = EmergencyProcedure.objects.create(
                emergency_case=self.emergency_case,
                procedure_name=f'Procedimiento {outcome}',
                description='Test',
                performed_by=self.doctor,
                outcome=outcome
            )
            self.assertEqual(procedure.outcome, outcome)
    
    def test_emergency_procedure_with_complications(self):
        """Prueba procedimiento con complicaciones"""
        procedure = EmergencyProcedure.objects.create(
            emergency_case=self.emergency_case,
            procedure_name='Cateterización venosa central',
            description='Acceso venoso central de emergencia',
            performed_by=self.doctor,
            outcome='partial',
            complications='Hematoma en sitio de punción',
            duration_minutes=30
        )
        
        self.assertEqual(procedure.outcome, 'partial')
        self.assertEqual(procedure.complications, 'Hematoma en sitio de punción')
        self.assertEqual(procedure.duration_minutes, 30)


class EmergencyTransferModelTests(BaseEmergencyTestCase):
    """Tests para el modelo EmergencyTransfer"""
    
    def test_emergency_transfer_creation(self):
        """Prueba la creación y atributos de transferencia de emergencia"""
        transfer = EmergencyTransfer.objects.create(
            emergency_case=self.emergency_case,
            transfer_type='icu',
            destination='UCI Cardiológica',
            reason='Infarto agudo de miocardio confirmado',
            arranged_by=self.doctor,
            transport_mode='stretcher',
            transfer_notes='Paciente estable, monitoreo continuo',
            receiving_doctor='Dr. Cardiólogo'
        )
        
        self.assertEqual(transfer.emergency_case, self.emergency_case)
        self.assertEqual(transfer.transfer_type, 'icu')
        self.assertEqual(transfer.destination, 'UCI Cardiológica')
        self.assertEqual(transfer.reason, 'Infarto agudo de miocardio confirmado')
        self.assertEqual(transfer.arranged_by, self.doctor)
        self.assertEqual(transfer.transport_mode, 'stretcher')
        self.assertEqual(transfer.transfer_notes, 'Paciente estable, monitoreo continuo')
        self.assertEqual(transfer.receiving_doctor, 'Dr. Cardiólogo')
        self.assertIsNotNone(transfer.transfer_time)
    
    def test_emergency_transfer_str_representation(self):
        """Prueba la representación string de transferencia de emergencia"""
        transfer = EmergencyTransfer.objects.create(
            emergency_case=self.emergency_case,
            transfer_type='ward',
            destination='Sala General 3B',
            reason='Observación post-tratamiento',
            arranged_by=self.doctor,
            transport_mode='wheelchair',
            transfer_notes='Paciente estable'
        )
        
        expected_str = f"Transferencia {self.emergency_case} a Sala General 3B"
        self.assertEqual(str(transfer), expected_str)
    
    def test_emergency_transfer_types(self):
        """Prueba los diferentes tipos de transferencia"""
        transfer_types = ['ward', 'icu', 'surgery', 'other_hospital', 'specialist']
        
        for i, transfer_type in enumerate(transfer_types):
            # Crear nuevos casos para cada transferencia
            case = EmergencyCase.objects.create(
                patient=self.patient,
                arrival_mode='ambulance',
                chief_complaint=f'Caso {i}'
            )
            
            transfer = EmergencyTransfer.objects.create(
                emergency_case=case,
                transfer_type=transfer_type,
                destination=f'Destino {transfer_type}',
                reason='Test',
                arranged_by=self.doctor,
                transport_mode='stretcher',
                transfer_notes='Test'
            )
            self.assertEqual(transfer.transfer_type, transfer_type)
    
    def test_emergency_transfer_one_to_one_relationship(self):
        """Prueba la relación uno a uno con EmergencyCase"""
        # Ya existe una transferencia para self.emergency_case
        transfer = EmergencyTransfer.objects.create(
            emergency_case=self.emergency_case,
            transfer_type='surgery',
            destination='Quirófano 2',
            reason='Cirugía de emergencia',
            arranged_by=self.doctor,
            transport_mode='stretcher',
            transfer_notes='Urgente'
        )
        
        # Intentar crear otra transferencia para el mismo caso debería fallar
        with self.assertRaises(Exception):
            EmergencyTransfer.objects.create(
                emergency_case=self.emergency_case,
                transfer_type='ward',
                destination='Otra sala',
                reason='Otro motivo',
                arranged_by=self.doctor,
                transport_mode='wheelchair',
                transfer_notes='Test'
            )


class EmergencySerializerTests(BaseEmergencyTestCase):
    """Tests para los serializadores de emergency"""
    
    def test_emergency_case_list_serializer(self):
        """Prueba el serializador de lista de casos de emergencia"""
        serializer = EmergencyCaseListSerializer(self.emergency_case)
        expected_fields = [
            'id', 'case_id', 'patient_name', 'arrival_time', 'chief_complaint',
            'triage_level', 'triage_level_display', 'status', 'status_display',
            'waiting_time'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
        self.assertEqual(serializer.data['patient_name'], self.patient.get_full_name())
        self.assertEqual(serializer.data['status'], 'waiting')
        self.assertEqual(serializer.data['status_display'], 'En espera')
    
    def test_emergency_case_detail_serializer(self):
        """Prueba el serializador detallado de casos de emergencia"""
        # Agregar algunos datos relacionados
        EmergencyMedication.objects.create(
            emergency_case=self.emergency_case,
            medication=self.medication,
            dose='1mg',
            route='iv',
            administered_by=self.doctor
        )
        
        serializer = EmergencyCaseDetailSerializer(self.emergency_case)
        
        # Verificar campos básicos
        self.assertIn('patient', serializer.data)
        self.assertIn('vital_signs', serializer.data)
        self.assertIn('medications', serializer.data)
        self.assertIn('procedures', serializer.data)
        self.assertIn('transfer', serializer.data)
        self.assertIn('waiting_time', serializer.data)
        self.assertIn('total_time', serializer.data)
        
        # Verificar datos anidados
        self.assertEqual(len(serializer.data['vital_signs']), 1)
        self.assertEqual(len(serializer.data['medications']), 1)
    
    def test_emergency_vital_signs_serializer(self):
        """Prueba el serializador de signos vitales de emergencia"""
        serializer = EmergencyVitalSignsSerializer(self.vital_signs)
        
        self.assertIn('recorded_by_name', serializer.data)
        self.assertEqual(serializer.data['recorded_by_name'], self.nurse.get_full_name())
        self.assertEqual(serializer.data['blood_pressure_systolic'], 140)
        self.assertEqual(serializer.data['pain_scale'], 8)
    
    def test_emergency_medication_serializer(self):
        """Prueba el serializador de medicación de emergencia"""
        medication = EmergencyMedication.objects.create(
            emergency_case=self.emergency_case,
            medication=self.medication,
            dose='0.5mg',
            route='im',
            administered_by=self.doctor,
            response='Buena respuesta'
        )
        
        serializer = EmergencyMedicationSerializer(medication)
        
        self.assertIn('medication_detail', serializer.data)
        self.assertIn('administered_by_name', serializer.data)
        self.assertEqual(serializer.data['administered_by_name'], self.doctor.get_full_name())
        self.assertEqual(serializer.data['medication_detail']['name'], self.medication.name)


class EmergencyAPITests(APITestCase):
    """Tests para la API de Emergency"""
    
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
        
        self.nurse = User.objects.create_user(email='nurse@hospital.com',
            password='nursepassword',
            role='nurse'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            role='patient'
        )
        
        # Crear caso de emergencia
        self.emergency_case = EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='ambulance',
            chief_complaint='Dolor abdominal severo',
            status='waiting'
        )
        
        # URLs de la API
        self.emergency_list_url = reverse('emergencycase-list')
        self.emergency_detail_url = reverse('emergencycase-detail', args=[self.emergency_case.id])
        self.emergency_triage_url = reverse('emergencycase-triage', args=[self.emergency_case.id])
        self.emergency_discharge_url = reverse('emergencycase-discharge', args=[self.emergency_case.id])
        self.emergency_dashboard_url = reverse('emergencycase-dashboard')
    
    def test_unauthenticated_access_denied(self):
        """Prueba que usuarios no autenticados no puedan acceder"""
        response = self.client.get(self.emergency_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_emergency_case(self):
        """Prueba crear un nuevo caso de emergencia"""
        self.client.force_authenticate(user=self.nurse)
        
        new_patient = User.objects.create_user(email='new@example.com',
            password='newpassword',
            role='patient'
        )
        
        data = {
            'patient_id': new_patient.id,
            'arrival_mode': 'walk_in',
            'chief_complaint': 'Fiebre alta y dolor de cabeza',
            'notes': 'Síntomas desde hace 2 días'
        }
        
        response = self.client.post(self.emergency_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EmergencyCase.objects.count(), 2)
        
        # Verificar los datos creados
        new_case = EmergencyCase.objects.get(patient=new_patient)
        self.assertEqual(new_case.arrival_mode, 'walk_in')
        self.assertEqual(new_case.chief_complaint, 'Fiebre alta y dolor de cabeza')
        self.assertEqual(new_case.status, 'waiting')
    
    def test_triage_emergency_case(self):
        """Prueba realizar triaje en un caso de emergencia"""
        self.client.force_authenticate(user=self.nurse)
        
        data = {
            'triage_level': 2,
            'vital_signs': {
                'blood_pressure_systolic': 150,
                'blood_pressure_diastolic': 95,
                'heart_rate': 120,
                'respiratory_rate': 24,
                'temperature': 38.5,
                'oxygen_saturation': 90,
                'pain_scale': 7
            },
            'notes': 'Paciente con signos de shock'
        }
        
        response = self.client.post(self.emergency_triage_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que se actualizó el caso
        self.emergency_case.refresh_from_db()
        self.assertEqual(self.emergency_case.triage_level, 2)
        self.assertEqual(self.emergency_case.triage_nurse, self.nurse)
        self.assertIsNotNone(self.emergency_case.triage_time)
        self.assertEqual(self.emergency_case.status, 'in_triage')
        
        # Verificar que se crearon los signos vitales
        vital_signs = EmergencyVitalSigns.objects.filter(
            emergency_case=self.emergency_case
        ).first()
        self.assertIsNotNone(vital_signs)
        self.assertEqual(vital_signs.blood_pressure_systolic, 150)
        self.assertEqual(vital_signs.pain_scale, 7)
    
    def test_discharge_emergency_case(self):
        """Prueba dar de alta a un paciente de emergencia"""
        self.client.force_authenticate(user=self.doctor)
        
        # Primero asignar doctor y cambiar estado
        self.emergency_case.attending_doctor = self.doctor
        self.emergency_case.status = 'in_treatment'
        self.emergency_case.save()
        
        data = {
            'discharge_diagnosis': 'Gastroenteritis aguda',
            'discharge_instructions': 'Dieta blanda, hidratación, reposo. Control en 48h si persisten síntomas.'
        }
        
        response = self.client.post(self.emergency_discharge_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que se actualizó el caso
        self.emergency_case.refresh_from_db()
        self.assertEqual(self.emergency_case.status, 'discharged')
        self.assertIsNotNone(self.emergency_case.discharge_time)
        self.assertEqual(self.emergency_case.discharge_diagnosis, 'Gastroenteritis aguda')
        self.assertIn('Dieta blanda', self.emergency_case.discharge_instructions)
    
    def test_emergency_dashboard(self):
        """Prueba obtener el dashboard de emergencias"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear más casos para las estadísticas
        EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='ambulance',
            chief_complaint='Trauma',
            status='in_treatment',
            triage_level=1
        )
        
        EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='walk_in',
            chief_complaint='Fiebre',
            status='waiting',
            triage_level=4
        )
        
        response = self.client.get(self.emergency_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar estructura de datos del dashboard
        expected_fields = [
            'total_cases_today', 'active_cases', 'waiting_cases',
            'critical_cases', 'average_waiting_time',
            'cases_by_triage', 'cases_by_status'
        ]
        for field in expected_fields:
            self.assertIn(field, response.data)
        
        # Verificar valores
        self.assertGreaterEqual(response.data['total_cases_today'], 3)
        self.assertGreaterEqual(response.data['waiting_cases'], 2)
        self.assertGreaterEqual(response.data['critical_cases'], 1)
    
    def test_filter_emergency_cases_by_status(self):
        """Prueba filtrar casos de emergencia por estado"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear casos con diferentes estados
        EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='ambulance',
            chief_complaint='Caso en tratamiento',
            status='in_treatment'
        )
        
        EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='walk_in',
            chief_complaint='Caso dado de alta',
            status='discharged'
        )
        
        # Filtrar por estado 'waiting'
        response = self.client.get(self.emergency_list_url, {'status': 'waiting'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'waiting')
    
    def test_patient_can_only_see_own_cases(self):
        """Prueba que un paciente solo pueda ver sus propios casos"""
        self.client.force_authenticate(user=self.patient)
        
        # Crear caso para otro paciente
        other_patient = User.objects.create_user(email='other@example.com',
            password='otherpassword',
            role='patient'
        )
        
        other_case = EmergencyCase.objects.create(
            patient=other_patient,
            arrival_mode='ambulance',
            chief_complaint='Caso de otro paciente'
        )
        
        response = self.client.get(self.emergency_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.emergency_case.id)
    
    def test_nurse_filter_shows_triaged_cases(self):
        """Prueba que enfermera vea casos que ha triado"""
        self.client.force_authenticate(user=self.nurse)
        
        # Asignar triaje al caso
        self.emergency_case.triage_nurse = self.nurse
        self.emergency_case.triage_level = 3
        self.emergency_case.save()
        
        # Crear otro caso sin triaje de esta enfermera
        EmergencyCase.objects.create(
            patient=self.patient,
            arrival_mode='walk_in',
            chief_complaint='Otro caso'
        )
        
        response = self.client.get(self.emergency_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.emergency_case.id)