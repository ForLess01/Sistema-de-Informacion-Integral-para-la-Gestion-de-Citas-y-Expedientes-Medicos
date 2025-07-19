"""
Factories para tests usando factory_boy
"""
import factory
from factory.django import DjangoModelFactory
from factory import fuzzy
from datetime import datetime, timedelta, date, time
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker

# Importar modelos
from authentication.models import User
from appointments.models import Appointment, Specialty, MedicalSchedule
from medical_records.models import (
    MedicalRecord, Prescription, PrescriptionItem, 
    VitalSigns, Allergy, LabTest, MedicalDocument
)
from pharmacy.models import (
    Medication, Dispensation, MedicationCategory,
    MedicationBatch, StockMovement, PharmacyReport
)
from emergency.models import (
    EmergencyCase, EmergencyVitalSigns, EmergencyMedication,
    EmergencyProcedure, EmergencyTransfer
)
from notifications.models import (
    NotificationTemplate, Notification, NotificationPreference,
    NotificationLog, PushDevice
)
from reports.models import (
    ReportTemplate, GeneratedReport, ScheduledReport, ReportAudit
)
from api_external.models import ExternalAPIClient, APIAccessLog, APIWebhook

fake = Faker('es_ES')  # Usar faker en español
User = get_user_model()


class UserFactory(DjangoModelFactory):
    """Factory para usuarios"""
    class Meta:
        model = User
        django_get_or_create = ('username',)
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name', locale='es_ES')
    last_name = factory.Faker('last_name', locale='es_ES')
    role = fuzzy.FuzzyChoice(['patient', 'doctor', 'nurse', 'receptionist', 'pharmacist'])
    phone = factory.Faker('phone_number', locale='es_ES')
    address = factory.Faker('address', locale='es_ES')
    date_of_birth = factory.Faker('date_of_birth', minimum_age=18, maximum_age=80)
    gender = fuzzy.FuzzyChoice(['M', 'F', 'O'])
    identification_number = factory.Sequence(lambda n: f'{70000000 + n}')
    is_active = True
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.set_password(extracted)
        else:
            self.set_password('defaultpass123')


class PatientFactory(UserFactory):
    """Factory específico para pacientes"""
    role = 'patient'
    emergency_contact_name = factory.Faker('name', locale='es_ES')
    emergency_contact_phone = factory.Faker('phone_number', locale='es_ES')
    blood_type = fuzzy.FuzzyChoice(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])


class DoctorFactory(UserFactory):
    """Factory específico para doctores"""
    role = 'doctor'
    professional_id = factory.Sequence(lambda n: f'CMP{10000 + n}')
    specialization = factory.Faker('job', locale='es_ES')
    years_experience = fuzzy.FuzzyInteger(1, 30)


class NurseFactory(UserFactory):
    """Factory específico para enfermeros"""
    role = 'nurse'
    professional_id = factory.Sequence(lambda n: f'CEP{20000 + n}')


class PharmacistFactory(UserFactory):
    """Factory específico para farmacéuticos"""
    role = 'pharmacist'
    professional_id = factory.Sequence(lambda n: f'CFP{30000 + n}')

    is_active = True


class AppointmentFactory(DjangoModelFactory):
    """Factory para citas médicas"""
    class Meta:
        model = Appointment
    
    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorFactory)
    specialty = factory.SubFactory(SpecialtyFactory)
    appointment_date = factory.Faker('date_between', start_date='+1d', end_date='+30d')
    appointment_time = factory.Faker('time_object')
    duration = fuzzy.FuzzyChoice([15, 20, 30, 45, 60])
    status = fuzzy.FuzzyChoice(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    reason = factory.Faker('sentence', nb_words=10, locale='es_ES')
    notes = factory.Faker('text', max_nb_chars=200, locale='es_ES')


class MedicalRecordFactory(DjangoModelFactory):
    """Factory para expedientes médicos"""
    class Meta:
        model = MedicalRecord
    
    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorFactory)
    record_date = factory.Faker('date_this_year')
    description = factory.Faker('text', max_nb_chars=300, locale='es_ES')
    diagnosis = factory.Faker('sentence', nb_words=8, locale='es_ES')
    treatment = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    notes = factory.Faker('text', max_nb_chars=150, locale='es_ES')


class VitalSignsFactory(DjangoModelFactory):
    """Factory para signos vitales"""
    class Meta:
        model = VitalSigns
    
    patient = factory.SubFactory(PatientFactory)
    recorded_by = factory.SubFactory(UserFactory)
    blood_pressure_systolic = fuzzy.FuzzyInteger(90, 140)
    blood_pressure_diastolic = fuzzy.FuzzyInteger(60, 90)
    heart_rate = fuzzy.FuzzyInteger(60, 100)
    respiratory_rate = fuzzy.FuzzyInteger(12, 20)
    temperature = fuzzy.FuzzyDecimal(36.0, 37.5, precision=1)
    oxygen_saturation = fuzzy.FuzzyInteger(95, 100)
    weight = fuzzy.FuzzyDecimal(50.0, 100.0, precision=1)
    height = fuzzy.FuzzyDecimal(1.50, 1.90, precision=2)
    notes = factory.Faker('sentence', locale='es_ES')


class AllergyFactory(DjangoModelFactory):
    """Factory para alergias"""
    class Meta:
        model = Allergy
    
    patient = factory.SubFactory(PatientFactory)
    allergen = factory.Faker('word', locale='es_ES')
    allergen_type = fuzzy.FuzzyChoice(['medication', 'food', 'environmental', 'other'])
    severity = fuzzy.FuzzyChoice(['mild', 'moderate', 'severe'])
    reaction = factory.Faker('sentence', nb_words=10, locale='es_ES')
    first_observed = factory.Faker('date_between', start_date='-5y', end_date='today')
    is_active = True
    created_by = factory.SubFactory(DoctorFactory)


class MedicationFactory(DjangoModelFactory):
    """Factory para medicamentos"""
    class Meta:
        model = Medication
    
    name = factory.Faker('word', locale='es_ES')
    code = factory.Sequence(lambda n: f'MED{1000 + n}')
    description = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    dosage_form = fuzzy.FuzzyChoice(['Tableta', 'Cápsula', 'Jarabe', 'Inyección', 'Crema'])
    strength = factory.LazyAttribute(lambda obj: f'{fake.random_int(1, 1000)}mg')
    manufacturer = factory.Faker('company', locale='es_ES')
    price = fuzzy.FuzzyDecimal(1.0, 100.0, precision=2)
    requires_prescription = fuzzy.FuzzyChoice([True, False])
    stock_quantity = fuzzy.FuzzyInteger(0, 1000)
    minimum_stock = fuzzy.FuzzyInteger(10, 100)
    is_active = True


class PrescriptionFactory(DjangoModelFactory):
    """Factory para prescripciones"""
    class Meta:
        model = Prescription
    
    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorFactory)
    medical_record = factory.SubFactory(MedicalRecordFactory)
    issue_date = factory.Faker('date_time_this_year', tzinfo=timezone.get_current_timezone())
    valid_until = factory.Faker('date_between', start_date='+7d', end_date='+30d')
    diagnosis = factory.Faker('sentence', nb_words=8, locale='es_ES')
    instructions = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    is_active = True


class PrescriptionItemFactory(DjangoModelFactory):
    """Factory para items de prescripción"""
    class Meta:
        model = PrescriptionItem
    
    prescription = factory.SubFactory(PrescriptionFactory)
    medication = factory.SubFactory(MedicationFactory)
    dosage = factory.LazyAttribute(lambda obj: f'{fake.random_int(1, 3)} tabletas')
    frequency = fuzzy.FuzzyChoice(['Cada 8 horas', 'Cada 12 horas', 'Una vez al día', 'Dos veces al día'])
    duration = factory.LazyAttribute(lambda obj: f'{fake.random_int(3, 14)} días')
    quantity = fuzzy.FuzzyInteger(10, 60)
    instructions = factory.Faker('sentence', locale='es_ES')


class EmergencyCaseFactory(DjangoModelFactory):
    """Factory para casos de emergencia"""
    class Meta:
        model = EmergencyCase
    
    patient = factory.SubFactory(PatientFactory)
    arrival_mode = fuzzy.FuzzyChoice(['ambulance', 'walk_in', 'private_vehicle', 'police', 'other'])
    chief_complaint = factory.Faker('sentence', nb_words=15, locale='es_ES')
    triage_level = fuzzy.FuzzyInteger(1, 5)
    triage_nurse = factory.SubFactory(NurseFactory)
    triage_time = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())
    attending_doctor = factory.SubFactory(DoctorFactory)
    status = fuzzy.FuzzyChoice(['waiting', 'in_triage', 'triaged', 'in_treatment', 'admitted', 'discharged'])
    notes = factory.Faker('text', max_nb_chars=300, locale='es_ES')


class NotificationTemplateFactory(DjangoModelFactory):
    """Factory para plantillas de notificación"""
    class Meta:
        model = NotificationTemplate
    
    name = factory.Faker('sentence', nb_words=4, locale='es_ES')
    notification_type = fuzzy.FuzzyChoice([
        'appointment_reminder', 'appointment_confirmation', 
        'appointment_cancelled', 'prescription_ready',
        'lab_results_ready', 'general'
    ])
    channel = fuzzy.FuzzyChoice(['email', 'sms', 'push', 'in_app'])
    subject_template = factory.Faker('sentence', locale='es_ES')
    body_template = factory.Faker('text', locale='es_ES')
    is_active = True
    created_by = factory.SubFactory(UserFactory)


class NotificationFactory(DjangoModelFactory):
    """Factory para notificaciones"""
    class Meta:
        model = Notification
    
    recipient = factory.SubFactory(UserFactory)
    template = factory.SubFactory(NotificationTemplateFactory)
    subject = factory.Faker('sentence', locale='es_ES')
    message = factory.Faker('text', max_nb_chars=300, locale='es_ES')
    channel = fuzzy.FuzzyChoice(['email', 'sms', 'push', 'in_app'])
    priority = fuzzy.FuzzyChoice(['low', 'normal', 'high', 'urgent'])
    status = fuzzy.FuzzyChoice(['pending', 'sent', 'delivered', 'failed'])


class ReportTemplateFactory(DjangoModelFactory):
    """Factory para plantillas de reportes"""
    class Meta:
        model = ReportTemplate
    
    name = factory.Faker('sentence', nb_words=4, locale='es_ES')
    report_type = fuzzy.FuzzyChoice([
        'appointments', 'patients', 'medications', 'financial',
        'emergency', 'occupancy', 'lab_tests', 'custom'
    ])
    description = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    query_config = factory.LazyFunction(lambda: {
        'model': fake.random_element(['appointments.Appointment', 'medical_records.MedicalRecord']),
        'filters': []
    })
    columns_config = factory.LazyFunction(lambda: [
        {'field': 'id', 'label': 'ID'},
        {'field': 'created_at', 'label': 'Fecha'}
    ])
    is_active = True
    created_by = factory.SubFactory(UserFactory)


class GeneratedReportFactory(DjangoModelFactory):
    """Factory para reportes generados"""
    class Meta:
        model = GeneratedReport
    
    template = factory.SubFactory(ReportTemplateFactory)
    name = factory.Faker('sentence', nb_words=5, locale='es_ES')
    report_type = fuzzy.FuzzyChoice([
        'appointments', 'patients', 'medications', 'financial'
    ])
    format = fuzzy.FuzzyChoice(['pdf', 'excel', 'csv', 'json'])
    status = fuzzy.FuzzyChoice(['pending', 'processing', 'completed', 'failed'])
    parameters = factory.LazyFunction(lambda: {})
    start_date = factory.Faker('date_this_year')
    end_date = factory.Faker('date_between', start_date='+1d', end_date='+30d')
    generated_by = factory.SubFactory(UserFactory)


class APIKeyFactory(DjangoModelFactory):
    """Factory para API Keys"""
    class Meta:
        model = APIKey
    
    name = factory.Faker('sentence', nb_words=3, locale='es_ES')
    user = factory.SubFactory(UserFactory)
    key = factory.Faker('sha256')
    is_active = True
    expires_at = factory.Faker('date_time_between', start_date='+1d', end_date='+1y', tzinfo=timezone.get_current_timezone())
    permissions = factory.LazyFunction(lambda: ['read', 'write'])


class WebhookFactory(DjangoModelFactory):
    """Factory para Webhooks"""
    class Meta:
        model = Webhook
    
    user = factory.SubFactory(UserFactory)
    name = factory.Faker('sentence', nb_words=3, locale='es_ES')
    url = factory.Faker('url')
    events = factory.LazyFunction(lambda: ['appointment.created', 'appointment.updated'])
    secret = factory.Faker('sha256')
    is_active = True


# Funciones auxiliares para crear objetos con relaciones completas
def create_complete_patient():
    """Crear un paciente con expediente médico completo"""
    patient = PatientFactory()
    medical_record = MedicalRecordFactory(patient=patient)
    
    # Agregar signos vitales
    for _ in range(3):
        VitalSignsFactory(patient=patient)
    
    # Agregar alergias
    for _ in range(2):
        AllergyFactory(patient=patient)
    
    return patient


def create_complete_appointment():
    """Crear una cita con todos los datos relacionados"""
    patient = create_complete_patient()
    doctor = DoctorFactory()
    specialty = SpecialtyFactory()
    
    # Crear horario médico
    MedicalScheduleFactory(doctor=doctor, specialty=specialty)
    
    # Crear cita
    appointment = AppointmentFactory(
        patient=patient,
        doctor=doctor,
        specialty=specialty,
        status='scheduled'
    )
    
    return appointment


def create_complete_prescription():
    """Crear una prescripción completa con medicamentos"""
    patient = create_complete_patient()
    doctor = DoctorFactory()
    medical_record = MedicalRecordFactory(patient=patient, doctor=doctor)
    
    prescription = PrescriptionFactory(
        patient=patient,
        doctor=doctor,
        medical_record=medical_record
    )
    
    # Agregar medicamentos
    for _ in range(3):
        medication = MedicationFactory()
        PrescriptionItemFactory(prescription=prescription, medication=medication)
    
    return prescription


def create_emergency_case_with_data():
    """Crear un caso de emergencia completo"""
    patient = create_complete_patient()
    case = EmergencyCaseFactory(patient=patient)
    
    # Agregar signos vitales de emergencia
    EmergencyVitalSigns.objects.create(
        emergency_case=case,
        blood_pressure_systolic=140,
        blood_pressure_diastolic=90,
        heart_rate=100,
        recorded_by=NurseFactory()
    )
    
    return case
class SpecialtyFactory(DjangoModelFactory):
    """Factory para especialidades médicas"""
    class Meta:
        model = Specialty
    
    name = factory.Faker('job', locale='es_ES')
    description = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    is_active = True


class MedicalScheduleFactory(DjangoModelFactory):
    """Factory para horarios médicos"""
    class Meta:
        model = MedicalSchedule
    
    doctor = factory.SubFactory(DoctorFactory)
    specialty = factory.SubFactory(SpecialtyFactory)
    weekday = fuzzy.FuzzyInteger(0, 6)
    start_time = time(9, 0)
    end_time = time(17, 0)
    slot_duration = fuzzy.FuzzyChoice([15, 20, 30, 45, 60])