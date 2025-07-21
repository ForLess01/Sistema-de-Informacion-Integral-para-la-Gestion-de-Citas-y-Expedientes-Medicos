from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from appointments.models import Specialty, MedicalSchedule, Appointment
from authentication.models import DoctorProfile, PatientProfile
from pharmacy.models import Medication, MedicationCategory, Inventory, Prescription, PrescriptionItem
from datetime import datetime, timedelta, time
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Poblar la base de datos con datos semilla básicos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Limpiar datos existentes antes de crear nuevos',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🏥 INICIANDO POBLACIÓN DE BASE DE DATOS'))
        self.stdout.write('=' * 50)

        try:
            if options['clear']:
                self.stdout.write('Limpiando datos existentes...')
                # Limpieza opcional (descomentar si es necesario)
                # User.objects.all().delete()
                # Specialty.objects.all().delete()
                
            self.create_specialties()
            self.create_users()
            self.create_medical_schedules()
            self.create_sample_appointments()
            self.create_medicine_data()
            
            self.stdout.write('\n' + '=' * 50)
            self.stdout.write(self.style.SUCCESS('✅ BASE DE DATOS POBLADA EXITOSAMENTE'))
            self.stdout.write('\nUsuarios creados:')
            self.stdout.write('👑 Admin: admin@hospital.com (password: 123456789)')
            self.stdout.write('👨‍⚕️ Doctores: dr.garcia@hospital.com, dra.martinez@hospital.com, dr.rodriguez@hospital.com')
            self.stdout.write('🤱 Obstetriz: obstetriz@hospital.com')
            self.stdout.write('🦷 Odontólogo: odontologo@hospital.com')
            self.stdout.write('👩‍⚕️ Enfermeras: enfermera1@hospital.com, enfermera2@hospital.com')
            self.stdout.write('👥 Recepcionistas: recepcion1@hospital.com, recepcion2@hospital.com')
            self.stdout.write('💊 Farmacéutico: farmacia@hospital.com')
            self.stdout.write('🚑 Emergencias: emergencia1@hospital.com')
            self.stdout.write('🏥 Pacientes: paciente1@email.com, paciente2@email.com, paciente3@email.com')
            self.stdout.write('\n🔑 Todas las contraseñas son: 123456789')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ ERROR: {str(e)}'))
            raise

    def create_specialties(self):
        """Crear especialidades médicas básicas"""
        specialties_data = [
            {'id': 1, 'name': 'Medicina General', 'description': 'Atención médica general y consultas de rutina'},
            {'id': 2, 'name': 'Cardiología', 'description': 'Especialidad del corazón y sistema cardiovascular'},
            {'id': 3, 'name': 'Pediatría', 'description': 'Atención médica para niños y adolescentes'},
            {'id': 4, 'name': 'Ginecología', 'description': 'Salud reproductiva femenina'},
            {'id': 5, 'name': 'Traumatología', 'description': 'Lesiones y enfermedades del sistema musculoesquelético'},
            {'id': 6, 'name': 'Neurología', 'description': 'Enfermedades del sistema nervioso'},
            {'id': 7, 'name': 'Obstetricia', 'description': 'Atención durante el embarazo y parto'},
            {'id': 8, 'name': 'Odontología', 'description': 'Salud dental y oral'},
            {'id': 9, 'name': 'Psiquiatría', 'description': 'Salud mental y trastornos psiquiátricos'},
            {'id': 10, 'name': 'Dermatología', 'description': 'Enfermedades de la piel'},
        ]
        
        self.stdout.write("Creando especialidades...")
        for spec_data in specialties_data:
            try:
                specialty, created = Specialty.objects.get_or_create(
                    name=spec_data['name'],
                    defaults={
                        'description': spec_data['description']
                    }
                )
                if created:
                    self.stdout.write(f"  ✓ {specialty.name}")
                else:
                    self.stdout.write(f"  - {specialty.name} (ya existe)")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Error con especialidad {spec_data['name']}: ignorando")

    def create_users(self):
        """Crear usuarios básicos del sistema"""
        users_data = [
            # Administradores
            {
                'email': 'admin@hospital.com',
                'username': 'admin',
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'role': 'admin',
                'dni': '12345678',
                'phone': '987654321',
                'is_staff': True,
                'is_superuser': True
            },
            
            # Doctores
            {
                'email': 'dr.garcia@hospital.com',
                'username': 'dr.garcia',
                'first_name': 'Carlos',
                'last_name': 'García',
                'role': 'doctor',
                'dni': '23456789',
                'phone': '987654322',
                'gender': 'M',
                'date_of_birth': '1980-05-15',
                'license_number': 'CMP-12345',
                'specialties': [1, 2]  # Medicina General, Cardiología
            },
            {
                'email': 'dra.martinez@hospital.com',
                'username': 'dra.martinez',
                'first_name': 'Ana',
                'last_name': 'Martínez',
                'role': 'doctor',
                'dni': '34567890',
                'phone': '987654323',
                'gender': 'F',
                'date_of_birth': '1985-08-20',
                'license_number': 'CMP-23456',
                'specialties': [3, 4]  # Pediatría, Ginecología
            },
            {
                'email': 'dr.rodriguez@hospital.com',
                'username': 'dr.rodriguez',
                'first_name': 'Miguel',
                'last_name': 'Rodríguez',
                'role': 'doctor',
                'dni': '45678901',
                'phone': '987654324',
                'gender': 'M',
                'date_of_birth': '1978-12-10',
                'license_number': 'CMP-34567',
                'specialties': [5, 6]  # Traumatología, Neurología
            },
            
            # Obstetriz
            {
                'email': 'obstetriz@hospital.com',
                'username': 'obstetriz',
                'first_name': 'María',
                'last_name': 'López',
                'role': 'obstetriz',
                'dni': '56789012',
                'phone': '987654325',
                'gender': 'F',
                'date_of_birth': '1982-03-25'
            },
            
            # Odontólogo
            {
                'email': 'odontologo@hospital.com',
                'username': 'odontologo',
                'first_name': 'Roberto',
                'last_name': 'Vásquez',
                'role': 'odontologo',
                'dni': '67890123',
                'phone': '987654326',
                'gender': 'M',
                'date_of_birth': '1979-07-12'
            },
            
            # Enfermeras
            {
                'email': 'enfermera1@hospital.com',
                'username': 'enfermera1',
                'first_name': 'Carmen',
                'last_name': 'Flores',
                'role': 'nurse',
                'dni': '78901234',
                'phone': '987654327',
                'gender': 'F',
                'date_of_birth': '1990-01-30'
            },
            {
                'email': 'enfermera2@hospital.com',
                'username': 'enfermera2',
                'first_name': 'Rosa',
                'last_name': 'Mendoza',
                'role': 'nurse',
                'dni': '89012345',
                'phone': '987654328',
                'gender': 'F',
                'date_of_birth': '1988-09-18'
            },
            
            # Recepcionistas
            {
                'email': 'recepcion1@hospital.com',
                'username': 'recepcion1',
                'first_name': 'Lucía',
                'last_name': 'Torres',
                'role': 'receptionist',
                'dni': '90123456',
                'phone': '987654329',
                'gender': 'F',
                'date_of_birth': '1992-11-05'
            },
            {
                'email': 'recepcion2@hospital.com',
                'username': 'recepcion2',
                'first_name': 'Pedro',
                'last_name': 'Ramírez',
                'role': 'receptionist',
                'dni': '01234567',
                'phone': '987654330',
                'gender': 'M',
                'date_of_birth': '1985-04-22'
            },
            
            # Farmacéutico
            {
                'email': 'farmacia@hospital.com',
                'username': 'farmacia',
                'first_name': 'Isabel',
                'last_name': 'Herrera',
                'role': 'pharmacist',
                'dni': '11234568',
                'phone': '987654331',
                'gender': 'F',
                'date_of_birth': '1983-06-14'
            },
            
            # Personal de Emergencias
            {
                'email': 'emergencia1@hospital.com',
                'username': 'emergencia1',
                'first_name': 'José',
                'last_name': 'Morales',
                'role': 'emergency',
                'dni': '21234569',
                'phone': '987654332',
                'gender': 'M',
                'date_of_birth': '1981-02-28'
            },
            
            # Pacientes de ejemplo
            {
                'email': 'paciente1@email.com',
                'username': 'paciente1',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'role': 'patient',
                'dni': '31234570',
                'phone': '987654333',
                'gender': 'M',
                'date_of_birth': '1990-03-15',
                'blood_type': 'O+',
                'allergies': 'Penicilina',
                'chronic_conditions': 'Hipertensión'
            },
            {
                'email': 'paciente2@email.com',
                'username': 'paciente2',
                'first_name': 'María',
                'last_name': 'González',
                'role': 'patient',
                'dni': '41234571',
                'phone': '987654334',
                'gender': 'F',
                'date_of_birth': '1985-07-20',
                'blood_type': 'A+',
                'allergies': 'Ninguna conocida',
                'chronic_conditions': ''
            },
            {
                'email': 'paciente3@email.com',
                'username': 'paciente3',
                'first_name': 'Carlos',
                'last_name': 'Ruiz',
                'role': 'patient',
                'dni': '51234572',
                'phone': '987654335',
                'gender': 'M',
                'date_of_birth': '1975-12-08',
                'blood_type': 'B+',
                'allergies': 'Mariscos',
                'chronic_conditions': 'Diabetes tipo 2'
            }
        ]
        
        self.stdout.write("\nCreando usuarios...")
        for user_data in users_data:
            # Extraer datos específicos
            specialties = user_data.pop('specialties', [])
            license_number = user_data.pop('license_number', None)
            blood_type = user_data.pop('blood_type', None)
            allergies = user_data.pop('allergies', None)
            chronic_conditions = user_data.pop('chronic_conditions', None)
            
            # Convertir date_of_birth de string a date
            if 'date_of_birth' in user_data:
                user_data['date_of_birth'] = datetime.strptime(user_data['date_of_birth'], '%Y-%m-%d').date()
            
            # Crear usuario
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            
            if created:
                user.set_password('123456789')  # Password temporal
                user.save()
                self.stdout.write(f"  ✓ {user.get_full_name()} ({user.role})")
                
                # Crear perfiles específicos
                if user.role == 'doctor' and license_number:
                    doctor_profile, _ = DoctorProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'license_number': license_number,
                            'consultation_fee': Decimal('50.00'),
                            'bio': f'Doctor especialista con experiencia en atención médica.',
                            'years_of_experience': random.randint(5, 20)
                        }
                    )
                    # Asignar especialidades
                    if specialties:
                        specialty_objects = Specialty.objects.filter(id__in=specialties)
                        doctor_profile.specialties.set(specialty_objects)
                        
                elif user.role == 'patient' and blood_type:
                    PatientProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'blood_type': blood_type,
                            'allergies': allergies or '',
                            'chronic_conditions': chronic_conditions or '',
                            'emergency_contact_name': 'Contacto de emergencia',
                            'emergency_contact_relationship': 'Familiar'
                        }
                    )
            else:
                self.stdout.write(f"  - {user.get_full_name()} ({user.role}) (ya existe)")

    def create_medical_schedules(self):
        """Crear horarios médicos básicos"""
        self.stdout.write("\nCreando horarios médicos...")
        
        doctors = User.objects.filter(role='doctor')
        
        for doctor in doctors:
            # Crear horarios de lunes a viernes
            for weekday in range(5):  # 0=Lunes, 4=Viernes
                # Horario de mañana
                morning_schedule, created = MedicalSchedule.objects.get_or_create(
                    doctor=doctor,
                    weekday=weekday,
                    start_time=time(8, 0),
                    end_time=time(12, 0),
                    defaults={
                        'specialty': doctor.doctor_profile.specialties.first() if hasattr(doctor, 'doctor_profile') else None,
                        'slot_duration': 30
                    }
                )
                
                # Horario de tarde
                afternoon_schedule, created = MedicalSchedule.objects.get_or_create(
                    doctor=doctor,
                    weekday=weekday,
                    start_time=time(14, 0),
                    end_time=time(18, 0),
                    defaults={
                        'specialty': doctor.doctor_profile.specialties.first() if hasattr(doctor, 'doctor_profile') else None,
                        'slot_duration': 30
                    }
                )
                
                if created:
                    self.stdout.write(f"  ✓ Horario creado para {doctor.get_full_name()} - {morning_schedule.get_weekday_display()}")

    def create_sample_appointments(self):
        """Crear citas de ejemplo"""
        self.stdout.write("\nCreando citas de ejemplo...")
        
        doctors = User.objects.filter(role='doctor')[:3]
        patients = User.objects.filter(role='patient')
        
        if not patients.exists():
            self.stdout.write("  ⚠️  No hay pacientes disponibles, saltando creación de citas...")
            return
        
        # Crear citas para los próximos días
        for i in range(10):
            appointment_date = (timezone.now() + timedelta(days=i)).date()
            
            for doctor in doctors:
                if random.choice([True, False]):  # 50% probabilidad de crear cita
                    patient = random.choice(patients)
                    appointment_time = time(random.choice([9, 10, 11, 15, 16, 17]), 0)
                    
                    appointment, created = Appointment.objects.get_or_create(
                        doctor=doctor,
                        appointment_date=appointment_date,
                        appointment_time=appointment_time,
                        defaults={
                            'patient': patient,
                            'specialty': doctor.doctor_profile.specialties.first() if hasattr(doctor, 'doctor_profile') else None,
                            'duration': 30,
                            'status': random.choice(['scheduled', 'confirmed', 'completed']),
                            'reason': random.choice([
                                'Consulta general',
                                'Control de rutina',
                                'Dolor abdominal',
                                'Dolor de cabeza',
                                'Examen preventivo',
                                'Seguimiento de tratamiento'
                            ]),
                            'notes': 'Cita generada automáticamente para pruebas'
                        }
                    )
                    
                    if created:
                        self.stdout.write(f"  ✓ Cita: {patient.get_full_name()} con {doctor.get_full_name()} el {appointment_date}")

    def create_medicine_data(self):
        """Crear datos básicos de farmacia"""
        self.stdout.write("\nCreando datos de farmacia...")
        
        # Verificar si los modelos existen
        try:
            # Categorías de medicamentos
            categories_data = [
                {'name': 'Analgésicos', 'description': 'Medicamentos para el dolor'},
                {'name': 'Antibióticos', 'description': 'Medicamentos contra infecciones'},
                {'name': 'Antiinflamatorios', 'description': 'Medicamentos antiinflamatorios'},
                {'name': 'Vitaminas', 'description': 'Suplementos vitamínicos'},
                {'name': 'Cardiovasculares', 'description': 'Medicamentos para el corazón'},
                {'name': 'Respiratorios', 'description': 'Medicamentos para vías respiratorias'},
            ]
            
            for cat_data in categories_data:
                category, created = MedicationCategory.objects.get_or_create(
                    name=cat_data['name'],
                    defaults={'description': cat_data['description']}
                )
                if created:
                    self.stdout.write(f"  ✓ Categoría: {category.name}")
            
            # Medicamentos básicos
            medicines_data = [
                {'name': 'Paracetamol', 'strength': '500mg', 'dosage_form': 'Tableta', 'stock': 100, 'threshold': 20},
                {'name': 'Ibuprofeno', 'strength': '400mg', 'dosage_form': 'Cápsula', 'stock': 75, 'threshold': 15},
                {'name': 'Amoxicilina', 'strength': '500mg', 'dosage_form': 'Cápsula', 'stock': 50, 'threshold': 10},
                {'name': 'Aspirina', 'strength': '100mg', 'dosage_form': 'Tableta', 'stock': 80, 'threshold': 25},
                {'name': 'Vitamina C', 'strength': '1g', 'dosage_form': 'Tableta', 'stock': 60, 'threshold': 20},
                {'name': 'Jarabe para la tos', 'strength': '120ml', 'dosage_form': 'Jarabe', 'stock': 30, 'threshold': 5},
                {'name': 'Omeprazol', 'strength': '20mg', 'dosage_form': 'Cápsula', 'stock': 40, 'threshold': 10},
                {'name': 'Loratadina', 'strength': '10mg', 'dosage_form': 'Tableta', 'stock': 25, 'threshold': 8},
            ]
            
            for med_data in medicines_data:
                try:
                    medication, created = Medication.objects.get_or_create(
                        name=f"{med_data['name']} {med_data['strength']}",
                        defaults={
                            'description': f'Medicamento {med_data["name"]}',
                            'dosage_form': med_data['dosage_form'],
                            'strength': med_data['strength'],
                            'quantity_in_stock': med_data['stock'],
                            'reordering_threshold': med_data['threshold'],
                        }
                    )
                    if created:
                        self.stdout.write(f"  ✓ Medicamento: {medication.name}")
                except Exception as e:
                    self.stdout.write(f"  ⚠️ Error creando medicamento {med_data['name']}: {str(e)}")
                    
        except Exception as e:
            self.stdout.write(f"⚠️ No se pudo crear datos de farmacia: {str(e)}")
