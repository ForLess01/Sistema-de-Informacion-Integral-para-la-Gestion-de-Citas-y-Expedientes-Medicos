"""
Fixtures y factories compartidos para tests
"""
import random
import string
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, List

from django.utils import timezone
from faker import Faker

from authentication.models import User
from appointments.models import Appointment, Specialty, MedicalSchedule
from medical_records.models import MedicalRecord, VitalSigns, Allergy
from pharmacy.models import Medication, Dispensation, StockMovement
from emergency.models import EmergencyCase, TriageAssessment
from notifications.models import Notification, NotificationTemplate, NotificationPreference
from reports.models import GeneratedReport, ScheduledReport
from api_external.models import ExternalAPIClient, APIWebhook

fake = Faker('es_MX')  # Usar faker en español de México


class UserFixtures:
    """Fixtures para usuarios"""
    
    @staticmethod
    def create_complete_patient(
        username: Optional[str] = None,
        with_medical_record: bool = True,
        with_appointments: int = 0,
        with_prescriptions: int = 0,
        **kwargs
    ) -> User:
        """Crear paciente completo con datos relacionados"""
        if not username:
            username = f"patient_{fake.user_name()}"
            
        user = User.objects.create_user(
            username=username,
            email=kwargs.get('email', fake.email()),
            password=kwargs.get('password', 'TestPass123!'),
            first_name=kwargs.get('first_name', fake.first_name()),
            last_name=kwargs.get('last_name', fake.last_name()),
            role='patient',
            phone=kwargs.get('phone', f'+52{fake.msisdn()[3:]}'),
            address=kwargs.get('address', fake.address()),
            date_of_birth=kwargs.get('date_of_birth', fake.date_of_birth(minimum_age=18, maximum_age=80)),
            gender=kwargs.get('gender', random.choice(['M', 'F'])),
            identification_number=kwargs.get('identification_number', fake.ssn()),
            emergency_contact_name=kwargs.get('emergency_contact_name', fake.name()),
            emergency_contact_phone=kwargs.get('emergency_contact_phone', f'+52{fake.msisdn()[3:]}')
        )
        
        if with_medical_record:
            MedicalRecordFixtures.create_complete_medical_record(user)
            
        if with_appointments > 0:
            doctor = UserFixtures.get_or_create_doctor()
            for _ in range(with_appointments):
                AppointmentFixtures.create_appointment(patient=user, doctor=doctor)
                
        # if with_prescriptions > 0:
        #     doctor = UserFixtures.get_or_create_doctor()
        #     for _ in range(with_prescriptions):
        #         PharmacyFixtures.create_prescription_with_items(patient=user, doctor=doctor)
                
        return user
        
    @staticmethod
    def create_complete_doctor(
        username: Optional[str] = None,
        specialties: Optional[List[str]] = None,
        with_schedule: bool = True,
        **kwargs
    ) -> User:
        """Crear doctor completo con especialidades y horarios"""
        if not username:
            username = f"doctor_{fake.user_name()}"
            
        user = User.objects.create_user(
            username=username,
            email=kwargs.get('email', fake.email()),
            password=kwargs.get('password', 'TestPass123!'),
            first_name=kwargs.get('first_name', fake.first_name()),
            last_name=kwargs.get('last_name', fake.last_name()),
            role='doctor',
            phone=kwargs.get('phone', f'+52{fake.msisdn()[3:]}'),
            professional_license=kwargs.get('professional_license', f'CED{fake.random_number(digits=8)}'),
            specialization=kwargs.get('specialization', random.choice(['Medicina General', 'Cardiología', 'Pediatría']))
        )
        
        if specialties:
            for specialty_name in specialties:
                specialty = Specialty.objects.get_or_create(
                    name=specialty_name,
                    defaults={'description': f'Especialidad en {specialty_name}'}
                )[0]
                user.specialties.add(specialty)
                
        if with_schedule:
            MedicalScheduleFixtures.create_weekly_schedule(user)
            
        return user
        
    @staticmethod
    def get_or_create_doctor(username: str = 'default_doctor') -> User:
        """Obtener o crear un doctor por defecto"""
        return User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@hospital.com',
                'first_name': 'Doctor',
                'last_name': 'Default',
                'role': 'doctor',
                'password': 'TestPass123!'
            }
        )[0]
        
    @staticmethod
    def create_staff_users() -> Dict[str, User]:
        """Crear usuarios de staff (uno de cada rol)"""
        staff_users = {}
        
        roles = {
            'nurse': {
                'first_name': 'Enfermera',
                'last_name': 'García',
                'professional_license': f'ENF{fake.random_number(digits=6)}'
            },
            'receptionist': {
                'first_name': 'Recepcionista',
                'last_name': 'López'
            },
            'pharmacist': {
                'first_name': 'Farmacéutico',
                'last_name': 'Martínez',
                'professional_license': f'QFB{fake.random_number(digits=6)}'
            },
            'admin': {
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'is_staff': True,
                'is_superuser': True
            }
        }
        
        for role, data in roles.items():
            user_data = {
                'username': f'{role}_user',
                'email': f'{role}@hospital.com',
                'role': role,
                **data
            }
            
            if role == 'admin':
                user = User.objects.create_superuser(
                    username=user_data['username'],
                    email=user_data['email'],
                    password='AdminPass123!',
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name']
                )
            else:
                user = User.objects.create_user(
                    password='TestPass123!',
                    **user_data
                )
                
            staff_users[role] = user
            
        return staff_users


class MedicalRecordFixtures:
    """Fixtures para expedientes médicos"""
    
    @staticmethod
    def create_complete_medical_record(
        patient: User,
        with_vital_signs: int = 3,
        with_allergies: int = 2,
        with_medical_history: int = 1
    ) -> MedicalRecord:
        """Crear expediente médico completo"""
        blood_types = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        
        record = MedicalRecord.objects.create(
            patient=patient,
            blood_type=random.choice(blood_types),
            allergies_description=fake.text(max_nb_chars=200) if random.random() > 0.7 else '',
            chronic_conditions=MedicalRecordFixtures._generate_chronic_conditions(),
            current_medications=MedicalRecordFixtures._generate_current_medications(),
            family_history=fake.text(max_nb_chars=300),
            surgical_history=MedicalRecordFixtures._generate_surgical_history(),
            emergency_contact_name=patient.emergency_contact_name or fake.name(),
            emergency_contact_phone=patient.emergency_contact_phone or f'+52{fake.msisdn()[3:]}',
            emergency_contact_relationship=random.choice(['Esposo/a', 'Hijo/a', 'Padre/Madre', 'Hermano/a']),
            insurance_provider=random.choice(['IMSS', 'ISSSTE', 'Seguro Popular', 'Privado']),
            insurance_policy_number=f'POL{fake.random_number(digits=10)}'
        )
        
        # Agregar signos vitales
        if with_vital_signs > 0:
            nurse = UserFixtures.get_or_create_doctor()  # Simplificación
            for i in range(with_vital_signs):
                VitalSignsFixtures.create_vital_signs(
                    record, 
                    nurse, 
                    days_ago=i*7  # Uno por semana
                )
                
        # Agregar alergias
        if with_allergies > 0:
            for _ in range(with_allergies):
                AllergyFixtures.create_allergy(record)
                
        # Agregar historia médica
        if with_medical_history > 0:
            doctor = UserFixtures.get_or_create_doctor()
            for i in range(with_medical_history):
                MedicalHistoryFixtures.create_medical_history(
                    record, 
                    doctor,
                    days_ago=i*30  # Una por mes
                )
                
        return record
        
    @staticmethod
    def _generate_chronic_conditions() -> str:
        """Generar condiciones crónicas aleatorias"""
        conditions = [
            'Hipertensión arterial', 'Diabetes mellitus tipo 2', 
            'Asma', 'Artritis', 'Hipotiroidismo', 'Ninguna'
        ]
        
        if random.random() > 0.6:
            selected = random.sample(conditions[:-1], k=random.randint(1, 2))
            return ', '.join(selected)
        return conditions[-1]
        
    @staticmethod
    def _generate_current_medications() -> str:
        """Generar medicamentos actuales"""
        medications = [
            'Metformina 850mg c/12h', 'Losartán 50mg c/24h',
            'Levotiroxina 100mcg c/24h', 'Omeprazol 20mg c/24h',
            'Aspirina 100mg c/24h', 'Ninguno'
        ]
        
        if random.random() > 0.5:
            selected = random.sample(medications[:-1], k=random.randint(1, 3))
            return ', '.join(selected)
        return medications[-1]
        
    @staticmethod
    def _generate_surgical_history() -> str:
        """Generar historial quirúrgico"""
        surgeries = [
            'Apendicectomía', 'Colecistectomía', 'Cesárea',
            'Hernioplastía', 'Amigdalectomía', 'Ninguna'
        ]
        
        if random.random() > 0.7:
            surgery = random.choice(surgeries[:-1])
            year = fake.year()
            return f'{surgery} ({year})'
        return surgeries[-1]


class VitalSignsFixtures:
    """Fixtures para signos vitales"""
    
    @staticmethod
    def create_vital_signs(
        medical_record: MedicalRecord,
        recorded_by: User,
        days_ago: int = 0,
        is_critical: bool = False
    ) -> VitalSigns:
        """Crear signos vitales"""
        if is_critical:
            # Valores críticos
            systolic = random.randint(160, 200)
            diastolic = random.randint(100, 130)
            heart_rate = random.randint(120, 150)
            temperature = random.uniform(38.5, 40.0)
            oxygen_saturation = random.randint(85, 90)
        else:
            # Valores normales
            systolic = random.randint(110, 130)
            diastolic = random.randint(70, 85)
            heart_rate = random.randint(60, 80)
            temperature = random.uniform(36.0, 37.0)
            oxygen_saturation = random.randint(95, 99)
            
        return VitalSigns.objects.create(
            medical_record=medical_record,
            recorded_by=recorded_by,
            blood_pressure_systolic=systolic,
            blood_pressure_diastolic=diastolic,
            heart_rate=heart_rate,
            temperature=temperature,
            respiratory_rate=random.randint(12, 20),
            oxygen_saturation=oxygen_saturation,
            weight=random.uniform(50, 100),
            height=random.uniform(1.50, 1.90),
            pain_scale=random.randint(0, 3) if not is_critical else random.randint(6, 10),
            glucose_level=random.randint(80, 120) if not is_critical else random.randint(200, 400),
            notes='Valores críticos - Requiere atención inmediata' if is_critical else 'Paciente estable',
            created_at=timezone.now() - timedelta(days=days_ago)
        )


class AllergyFixtures:
    """Fixtures para alergias"""
    
    @staticmethod
    def create_allergy(medical_record: MedicalRecord) -> Allergy:
        """Crear alergia"""
        allergens = [
            ('Penicilina', 'severe', 'Anafilaxia'),
            ('Aspirina', 'moderate', 'Urticaria'),
            ('Látex', 'moderate', 'Dermatitis de contacto'),
            ('Mariscos', 'severe', 'Edema laríngeo'),
            ('Polen', 'mild', 'Rinitis alérgica'),
            ('Ácaros', 'mild', 'Estornudos y congestión'),
            ('Ibuprofeno', 'moderate', 'Erupción cutánea')
        ]
        
        allergen, severity, reaction = random.choice(allergens)
        
        return Allergy.objects.create(
            medical_record=medical_record,
            allergen=allergen,
            severity=severity,
            reaction=reaction,
            first_observed=fake.date_between(start_date='-10y', end_date='today'),
            notes=f'Confirmado por {random.choice(["pruebas cutáneas", "historia clínica", "exposición previa"])}'
        )


# class MedicalHistoryFixtures:
#     """Fixtures para historias médicas"""
#     
#     @staticmethod
#     def create_medical_history(
#         medical_record: MedicalRecord,
#         doctor: User,
#         appointment: Optional[Appointment] = None,
#         days_ago: int = 0
#     ) -> MedicalHistory:
#         """Crear historia médica"""
#         # Comentado porque el modelo MedicalHistory no existe
#         pass


class AppointmentFixtures:
    """Fixtures para citas"""
    
    @staticmethod
    def create_appointment(
        patient: User,
        doctor: User,
        days_from_now: Optional[int] = None,
        status: str = 'scheduled',
        **kwargs
    ) -> Appointment:
        """Crear cita"""
        if days_from_now is None:
            days_from_now = random.randint(1, 30)
            
        specialties = ['Medicina General', 'Cardiología', 'Pediatría', 'Ginecología']
        specialty = Specialty.objects.get_or_create(
            name=kwargs.get('specialty_name', random.choice(specialties)),
            defaults={'description': 'Especialidad médica'}
        )[0]
        
        reasons = [
            'Consulta general', 'Control de seguimiento', 'Dolor persistente',
            'Chequeo anual', 'Segunda opinión', 'Evaluación inicial'
        ]
        
        appointment_date = timezone.now() + timedelta(days=days_from_now)
        appointment_date = appointment_date.replace(
            hour=random.randint(9, 17),
            minute=random.choice([0, 30]),
            second=0,
            microsecond=0
        )
        
        return Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            specialty=specialty,
            appointment_date=appointment_date,
            reason=kwargs.get('reason', random.choice(reasons)),
            status=status,
            duration_minutes=kwargs.get('duration_minutes', 30),
            notes=kwargs.get('notes', ''),
            created_at=timezone.now() - timedelta(days=random.randint(0, 7))
        )
        
    @staticmethod
    def create_appointment_series(
        patient: User,
        doctor: User,
        count: int = 5,
        frequency_days: int = 7
    ) -> List[Appointment]:
        """Crear serie de citas (ej: seguimiento semanal)"""
        appointments = []
        
        for i in range(count):
            appointment = AppointmentFixtures.create_appointment(
                patient=patient,
                doctor=doctor,
                days_from_now=i * frequency_days,
                status='scheduled' if i > 0 else 'completed',
                reason=f'Seguimiento #{i+1}'
            )
            appointments.append(appointment)
            
        return appointments


class MedicalScheduleFixtures:
    """Fixtures para horarios médicos"""
    
    @staticmethod
    def create_weekly_schedule(doctor: User) -> List[MedicalSchedule]:
        """Crear horario semanal para doctor"""
        schedules = []
        
        # Lunes a Viernes
        for day in range(1, 6):
            # Turno mañana
            morning = MedicalSchedule.objects.create(
                doctor=doctor,
                day_of_week=day,
                start_time='09:00',
                end_time='13:00',
                slot_duration=30,
                max_appointments_per_slot=1
            )
            schedules.append(morning)
            
            # Turno tarde (excepto viernes)
            if day < 5:
                afternoon = MedicalSchedule.objects.create(
                    doctor=doctor,
                    day_of_week=day,
                    start_time='15:00',
                    end_time='19:00',
                    slot_duration=30,
                    max_appointments_per_slot=1
                )
                schedules.append(afternoon)
                
        return schedules


class PharmacyFixtures:
    """Fixtures para farmacia"""
    
    @staticmethod
    def create_common_medications() -> List[Medication]:
        """Crear medicamentos comunes"""
        medications_data = [
            {
                'name': 'Paracetamol',
                'description': 'Analgésico y antipirético',
                'dosage_form': 'Tabletas',
                'strength': '500mg',
                'quantity_in_stock': 100,
                'reordering_threshold': 20
            },
            {
                'name': 'Amoxicilina',
                'description': 'Antibiótico de amplio espectro',
                'dosage_form': 'Cápsulas',
                'strength': '500mg',
                'quantity_in_stock': 50,
                'reordering_threshold': 15
            },
            {
                'name': 'Omeprazol',
                'description': 'Inhibidor de la bomba de protones',
                'dosage_form': 'Cápsulas',
                'strength': '20mg',
                'quantity_in_stock': 75,
                'reordering_threshold': 20
            },
            {
                'name': 'Loratadina',
                'description': 'Antihistamínico',
                'dosage_form': 'Tabletas',
                'strength': '10mg',
                'quantity_in_stock': 60,
                'reordering_threshold': 15
            },
            {
                'name': 'Metformina',
                'description': 'Antidiabético oral',
                'dosage_form': 'Tabletas',
                'strength': '850mg',
                'quantity_in_stock': 80,
                'reordering_threshold': 25
            }
        ]
        
        medications = []
        for data in medications_data:
            medication, created = Medication.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            medications.append(medication)
            
        return medications
        
    # @staticmethod
    # def create_prescription_with_items(
    #     patient: User,
    #     doctor: User,
    #     medications_count: int = 3,
    #     appointment: Optional[Appointment] = None
    # ) -> Prescription:
    #     """Crear prescripción con medicamentos"""
    #     # Comentado porque el modelo Prescription no existe
    #     pass
        
    # @staticmethod
    # def create_inventory_with_stock(medication: Medication, low_stock: bool = False) -> Inventory:
    #     """Crear inventario con stock"""
    #     # Comentado porque el modelo Inventory no existe
    #     pass


class EmergencyFixtures:
    """Fixtures para emergencias"""
    
    @staticmethod
    def create_emergency_case(
        patient: User,
        severity: str = 'moderate',
        with_triage: bool = True
    ) -> EmergencyCase:
        """Crear caso de emergencia"""
        complaints_by_severity = {
            'critical': [
                'Dolor torácico opresivo con irradiación',
                'Pérdida súbita de consciencia',
                'Dificultad respiratoria severa',
                'Traumatismo craneoencefálico con pérdida de consciencia'
            ],
            'severe': [
                'Fractura expuesta',
                'Hemorragia activa',
                'Dolor abdominal intenso',
                'Crisis convulsiva'
            ],
            'moderate': [
                'Esguince de tobillo',
                'Cefalea intensa',
                'Vómitos persistentes',
                'Fiebre alta'
            ],
            'mild': [
                'Dolor de garganta',
                'Tos sin fiebre',
                'Dolor muscular leve',
                'Mareo ocasional'
            ]
        }
        
        emergency = EmergencyCase.objects.create(
            patient=patient,
            arrival_time=timezone.now() - timedelta(hours=random.randint(0, 4)),
            chief_complaint=random.choice(complaints_by_severity.get(severity, complaints_by_severity['moderate'])),
            mode_of_arrival=random.choice(['walk_in', 'private_vehicle', 'ambulance']),
            accompanied_by=random.choice(['Familiar', 'Solo', 'Amigo']),
            status='waiting_triage'
        )
        
        if with_triage:
            nurse = User.objects.filter(role='nurse').first()
            if not nurse:
                nurse = UserFixtures.create_staff_users()['nurse']
                
            TriageFixtures.create_triage_assessment(emergency, nurse, severity)
            
        return emergency


class TriageFixtures:
    """Fixtures para triaje"""
    
    @staticmethod
    def create_triage_assessment(
        emergency_case: EmergencyCase,
        nurse: User,
        severity: str = 'moderate'
    ) -> TriageAssessment:
        """Crear evaluación de triaje"""
        priority_map = {
            'critical': 1,
            'severe': 2,
            'moderate': 3,
            'mild': 4
        }
        
        vital_signs_map = {
            'critical': {
                'blood_pressure': '180/110',
                'heart_rate': 130,
                'respiratory_rate': 28,
                'oxygen_saturation': 88,
                'temperature': 38.5
            },
            'severe': {
                'blood_pressure': '150/95',
                'heart_rate': 110,
                'respiratory_rate': 22,
                'oxygen_saturation': 93,
                'temperature': 38.0
            },
            'moderate': {
                'blood_pressure': '130/85',
                'heart_rate': 90,
                'respiratory_rate': 18,
                'oxygen_saturation': 96,
                'temperature': 37.5
            },
            'mild': {
                'blood_pressure': '120/80',
                'heart_rate': 75,
                'respiratory_rate': 16,
                'oxygen_saturation': 98,
                'temperature': 36.8
            }
        }
        
        symptoms_map = {
            'critical': ['dolor_toracico', 'disnea_severa', 'alteracion_consciencia'],
            'severe': ['dolor_intenso', 'sangrado_activo', 'fiebre_alta'],
            'moderate': ['dolor_moderado', 'nauseas', 'mareo'],
            'mild': ['dolor_leve', 'malestar_general']
        }
        
        triage = TriageAssessment.objects.create(
            emergency_case=emergency_case,
            assessed_by=nurse,
            priority_level=priority_map[severity],
            vital_signs_summary=vital_signs_map[severity],
            symptoms=symptoms_map[severity],
            pain_scale=random.randint(7, 10) if severity in ['critical', 'severe'] else random.randint(3, 6),
            notes=f'Paciente con cuadro de {severity} severidad'
        )
        
        # Actualizar caso de emergencia
        emergency_case.triage_priority = triage.priority_level
        emergency_case.status = 'triaged'
        emergency_case.save()
        
        return triage


class NotificationFixtures:
    """Fixtures para notificaciones"""
    
    @staticmethod
    def create_notification_templates() -> Dict[str, NotificationTemplate]:
        """Crear plantillas de notificación estándar"""
        templates_data = [
            {
                'name': 'appointment_reminder',
                'subject': 'Recordatorio de Cita - {{hospital_name}}',
                'body': '''Estimado/a {{patient_name}},

Le recordamos que tiene una cita programada:
- Fecha: {{appointment_date}}
- Hora: {{appointment_time}}
- Doctor: {{doctor_name}}
- Especialidad: {{specialty}}

Por favor, llegue 15 minutos antes de su cita.

Saludos cordiales,
{{hospital_name}}''',
                'notification_type': 'appointment_reminder'
            },
            {
                'name': 'appointment_confirmation',
                'subject': 'Confirmación de Cita - {{hospital_name}}',
                'body': '''Estimado/a {{patient_name}},

Su cita ha sido confirmada:
- Fecha: {{appointment_date}}
- Hora: {{appointment_time}}
- Doctor: {{doctor_name}}
- Número de cita: {{appointment_number}}

Gracias por confiar en nosotros.

{{hospital_name}}''',
                'notification_type': 'appointment_confirmation'
            },
            {
                'name': 'prescription_ready',
                'subject': 'Receta Lista para Recoger',
                'body': '''Estimado/a {{patient_name}},

Su receta médica está lista para ser recogida en la farmacia.
- Número de receta: {{prescription_number}}
- Medicamentos: {{medications_count}}

Horario de farmacia: 8:00 AM - 8:00 PM

{{hospital_name}}''',
                'notification_type': 'prescription_ready'
            }
        ]
        
        templates = {}
        for data in templates_data:
            template, created = NotificationTemplate.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            templates[data['name']] = template
            
        return templates
        
    @staticmethod
    def create_user_notifications(user: User, count: int = 5) -> List[Notification]:
        """Crear notificaciones para un usuario"""
        notifications = []
        
        notification_types = [
            ('appointment_reminder', 'Recordatorio de Cita', 'high'),
            ('prescription_ready', 'Receta Lista', 'normal'),
            ('lab_results', 'Resultados de Laboratorio', 'high'),
            ('general', 'Información General', 'low')
        ]
        
        for i in range(count):
            notif_type, title_base, priority = random.choice(notification_types)
            
            notification = Notification.objects.create(
                user=user,
                title=f'{title_base} #{i+1}',
                message=fake.text(max_nb_chars=200),
                notification_type=notif_type,
                priority=priority,
                is_read=random.random() > 0.5,
                created_at=timezone.now() - timedelta(days=random.randint(0, 30))
            )
            
            if notification.is_read:
                notification.read_at = notification.created_at + timedelta(hours=random.randint(1, 24))
                notification.save()
                
            notifications.append(notification)
            
        return notifications


class ReportFixtures:
    """Fixtures para reportes"""
    
    @staticmethod
    def create_sample_reports(admin_user: User) -> List[GeneratedReport]:
        """Crear reportes de muestra"""
        reports = []
        
        report_types = [
            {
                'name': 'Reporte Mensual de Citas',
                'report_type': 'appointments',
                'parameters': {
                    'month': datetime.now().month,
                    'year': datetime.now().year,
                    'group_by': 'status'
                }
            },
            {
                'name': 'Reporte de Inventario Bajo',
                'report_type': 'inventory',
                'parameters': {
                    'threshold': 20,
                    'include_expired': True
                }
            },
            {
                'name': 'Reporte de Emergencias',
                'report_type': 'emergency',
                'parameters': {
                    'date_range': 'last_week',
                    'group_by': 'priority'
                }
            }
        ]
        
        for report_data in report_types:
            report = GeneratedReport.objects.create(
                name=report_data['name'],
                report_type=report_data['report_type'],
                generated_by=admin_user,
                parameters=report_data['parameters'],
                status=random.choice(['completed', 'processing', 'failed']),
                format=random.choice(['pdf', 'excel', 'csv'])
            )
            
            if report.status == 'completed':
                report.file_url = f'/media/reports/{report.id}_{report.format}'
                report.row_count = random.randint(10, 1000)
                report.save()
                
            reports.append(report)
            
        return reports


class APIFixtures:
    """Fixtures para API externa"""
    
    @staticmethod
    def create_api_keys(admin_user: User) -> List[ExternalAPIClient]:
        """Crear API keys de muestra"""
        api_clients = []
        
        key_configs = [
            {
                'name': 'Sistema Externo A',
                'allowed_scopes': ['read:appointments', 'read:patients'],
                'rate_limit_per_hour': 100
            },
            {
                'name': 'Aplicación Móvil',
                'allowed_scopes': ['read:appointments', 'write:appointments', 'read:medical_records'],
                'rate_limit_per_hour': 1000
            },
            {
                'name': 'Portal Web',
                'allowed_scopes': ['full:access'],  # Todos los permisos
                'rate_limit_per_hour': 5000
            }
        ]
        
        for config in key_configs:
            api_client = ExternalAPIClient.objects.create(
                name=config['name'],
                owner=admin_user,
                allowed_scopes=config['allowed_scopes'],
                rate_limit_per_hour=config['rate_limit_per_hour'],
                description=f'API Client para {config["name"]}'
            )
            api_clients.append(api_client)
            
        return api_clients


class TestDataGenerator:
    """Generador principal de datos de prueba"""
    
    @staticmethod
    def generate_complete_test_environment():
        """Generar ambiente de prueba completo"""
        print("Generando ambiente de prueba completo...")
        
        # 1. Crear usuarios de staff
        print("- Creando usuarios de staff...")
        staff_users = UserFixtures.create_staff_users()
        
        # 2. Crear doctores con especialidades
        print("- Creando doctores...")
        doctors = []
        specialties = ['Medicina General', 'Cardiología', 'Pediatría', 'Ginecología', 'Traumatología']
        
        for i in range(5):
            doctor = UserFixtures.create_complete_doctor(
                username=f'doctor_{i}',
                specialties=[specialties[i]],
                with_schedule=True
            )
            doctors.append(doctor)
            
        # 3. Crear pacientes con expedientes completos
        print("- Creando pacientes...")
        patients = []
        
        for i in range(20):
            patient = UserFixtures.create_complete_patient(
                username=f'patient_{i}',
                with_medical_record=True,
                with_appointments=random.randint(1, 3),
                with_prescriptions=random.randint(0, 2)
            )
            patients.append(patient)
            
        # 4. Crear medicamentos e inventario
        print("- Creando medicamentos e inventario...")
        medications = PharmacyFixtures.create_common_medications()
        
        # for medication in medications:
        #     PharmacyFixtures.create_inventory_with_stock(
        #         medication, 
        #         low_stock=random.random() > 0.8  # 20% con stock bajo
        #     )
            
        # 5. Crear casos de emergencia
        print("- Creando casos de emergencia...")
        emergency_patients = random.sample(patients, 5)
        
        for patient in emergency_patients:
            severity = random.choice(['critical', 'severe', 'moderate', 'mild'])
            EmergencyFixtures.create_emergency_case(patient, severity, with_triage=True)
            
        # 6. Crear plantillas de notificación
        print("- Creando plantillas de notificación...")
        NotificationFixtures.create_notification_templates()
        
        # 7. Crear notificaciones para usuarios
        print("- Creando notificaciones...")
        for patient in patients[:10]:  # Primeros 10 pacientes
            NotificationFixtures.create_user_notifications(patient, count=3)
            
        # 8. Crear reportes
        print("- Creando reportes...")
        ReportFixtures.create_sample_reports(staff_users['admin'])
        
        # 9. Crear API keys
        print("- Creando API keys...")
        APIFixtures.create_api_keys(staff_users['admin'])
        
        print("¡Ambiente de prueba completo generado exitosamente!")
        
        return {
            'staff_users': staff_users,
            'doctors': doctors,
            'patients': patients,
            'medications': medications
        }


# Funciones helper para uso directo en tests
def get_test_patient(**kwargs) -> User:
    """Obtener un paciente de prueba"""
    return UserFixtures.create_complete_patient(**kwargs)


def get_test_doctor(**kwargs) -> User:
    """Obtener un doctor de prueba"""
    return UserFixtures.create_complete_doctor(**kwargs)


def get_test_appointment(patient: Optional[User] = None, doctor: Optional[User] = None, **kwargs) -> Appointment:
    """Obtener una cita de prueba"""
    if not patient:
        patient = get_test_patient()
    if not doctor:
        doctor = get_test_doctor()
        
    return AppointmentFixtures.create_appointment(patient, doctor, **kwargs)


# def get_test_prescription(patient: Optional[User] = None, doctor: Optional[User] = None, **kwargs) -> Prescription:
#     """Obtener una prescripción de prueba"""
#     # Comentado porque el modelo Prescription no existe
#     pass


def setup_test_data_minimal():
    """Configurar datos de prueba mínimos"""
    staff = UserFixtures.create_staff_users()
    doctor = get_test_doctor()
    patient = get_test_patient()
    medications = PharmacyFixtures.create_common_medications()
    
    return {
        'staff': staff,
        'doctor': doctor,
        'patient': patient,
        'medications': medications
    }


def setup_test_data_complete():
    """Configurar datos de prueba completos"""
    return TestDataGenerator.generate_complete_test_environment()