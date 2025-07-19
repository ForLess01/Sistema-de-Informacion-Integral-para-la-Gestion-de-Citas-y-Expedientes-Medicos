from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, date, time, timedelta
import uuid

from .models import Specialty, MedicalSchedule, Appointment, AppointmentReminder
from .serializers import (
    SpecialtySerializer, MedicalScheduleSerializer, 
    AppointmentSerializer, AppointmentReminderSerializer
)

User = get_user_model()

class BaseAppointmentTestCase(TestCase):
    """Clase base para los tests de appointments"""
    
    def setUp(self):
        # Crear usuarios (admin, doctor, paciente)
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            first_name='Admin',
            last_name='User'
        )
        
        self.doctor = User.objects.create_user(email='doctor@hospital.com',
            password='doctorpassword',
            first_name='Doctor',
            last_name='Test'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            first_name='Patient',
            last_name='Test'
        )
        
        # Crear especialidad
        self.specialty = Specialty.objects.create(
            name='Cardiología',
            description='Especialidad en enfermedades cardiovasculares',
            is_active=True
        )
        
        # Crear horario médico (lunes a viernes, 9am-5pm)
        for weekday in range(5):  # 0-4 (lunes a viernes)
            schedule = MedicalSchedule.objects.create(
                doctor=self.doctor,
                specialty=self.specialty,
                weekday=weekday,
                start_time=time(9, 0),  # 9:00 AM
                end_time=time(17, 0),   # 5:00 PM
                slot_duration=30,
                is_active=True
            )
            # Guardar el horario del lunes específicamente para los tests
            if weekday == 0:
                self.schedule = schedule
        
        # Crear una cita médica
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=date.today() + timedelta(days=1),  # Mañana
            appointment_time=time(10, 0),  # 10:00 AM
            duration=30,
            status='scheduled',
            reason='Consulta rutinaria',
            notes='Paciente con hipertensión'
        )
        
        # Crear un recordatorio
        self.reminder = AppointmentReminder.objects.create(
            appointment=self.appointment,
            reminder_type='email',
            scheduled_for=timezone.now() + timedelta(hours=1),
            is_sent=False
        )


class SpecialtyModelTests(BaseAppointmentTestCase):
    """Tests para el modelo Specialty"""
    
    def test_specialty_creation(self):
        """Prueba la creación y atributos de una especialidad"""
        specialty = Specialty.objects.create(
            name='Pediatría',
            description='Especialidad en niños',
            is_active=True
        )
        
        self.assertEqual(specialty.name, 'Pediatría')
        self.assertEqual(specialty.description, 'Especialidad en niños')
        self.assertTrue(specialty.is_active)
        self.assertIsNotNone(specialty.created_at)
        self.assertIsNotNone(specialty.updated_at)
    
    def test_specialty_str_representation(self):
        """Prueba la representación string de una especialidad"""
        self.assertEqual(str(self.specialty), 'Cardiología')
    
    def test_specialty_ordering(self):
        """Prueba el ordenamiento de especialidades"""
        Specialty.objects.create(name='Dermatología')
        Specialty.objects.create(name='Anestesiología')
        
        specialties = Specialty.objects.all()
        self.assertEqual(specialties[0].name, 'Anestesiología')
        self.assertEqual(specialties[1].name, 'Cardiología')
        self.assertEqual(specialties[2].name, 'Dermatología')


class MedicalScheduleModelTests(BaseAppointmentTestCase):
    """Tests para el modelo MedicalSchedule"""
    
    def test_medical_schedule_creation(self):
        """Prueba la creación y atributos de un horario médico"""
        schedule = MedicalSchedule.objects.create(
            doctor=self.doctor,
            specialty=self.specialty,
            weekday=0,  # Lunes
            start_time=time(8, 0),
            end_time=time(12, 0),
            slot_duration=45,
            is_active=True
        )
        
        self.assertEqual(schedule.doctor, self.doctor)
        self.assertEqual(schedule.specialty, self.specialty)
        self.assertEqual(schedule.weekday, 0)
        self.assertEqual(schedule.start_time, time(8, 0))
        self.assertEqual(schedule.end_time, time(12, 0))
        self.assertEqual(schedule.slot_duration, 45)
        self.assertTrue(schedule.is_active)
        self.assertIsNotNone(schedule.created_at)
        self.assertIsNotNone(schedule.updated_at)
    
    def test_medical_schedule_str_representation(self):
        """Prueba la representación string de un horario médico"""
        expected_str = f"{self.doctor.get_full_name()} - Lunes {time(9, 0)}-{time(17, 0)}"
        self.assertEqual(str(self.schedule), expected_str)
    
    def test_unique_together_constraint(self):
        """Prueba la restricción de unicidad para horarios médicos"""
        # Intenta crear un horario con los mismos datos (debería fallar)
        with self.assertRaises(Exception):
            MedicalSchedule.objects.create(
                doctor=self.doctor,
                specialty=self.specialty,
                weekday=0,  # Mismo día que self.schedule
                start_time=time(9, 0),  # Mismo tiempo de inicio
                end_time=time(17, 0),   # Mismo tiempo de fin
                slot_duration=30
            )


class AppointmentModelTests(BaseAppointmentTestCase):
    """Tests para el modelo Appointment"""
    
    def test_appointment_creation(self):
        """Prueba la creación y atributos de una cita"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=date.today() + timedelta(days=2),
            appointment_time=time(11, 0),
            duration=45,
            status='scheduled',
            reason='Dolor de cabeza',
            notes='Paciente con migraña recurrente'
        )
        
        self.assertEqual(appointment.patient, self.patient)
        self.assertEqual(appointment.doctor, self.doctor)
        self.assertEqual(appointment.specialty, self.specialty)
        self.assertEqual(appointment.appointment_date, date.today() + timedelta(days=2))
        self.assertEqual(appointment.appointment_time, time(11, 0))
        self.assertEqual(appointment.duration, 45)
        self.assertEqual(appointment.status, 'scheduled')
        self.assertEqual(appointment.reason, 'Dolor de cabeza')
        self.assertEqual(appointment.notes, 'Paciente con migraña recurrente')
        self.assertIsNone(appointment.cancelled_at)
        self.assertEqual(appointment.cancellation_reason, '')
        self.assertIsNotNone(appointment.created_at)
        self.assertIsNotNone(appointment.updated_at)
        self.assertIsInstance(appointment.appointment_id, uuid.UUID)
    
    def test_appointment_str_representation(self):
        """Prueba la representación string de una cita"""
        expected_str = f"Cita {self.appointment.appointment_id} - {self.patient.get_full_name()} con {self.doctor.get_full_name()} el {self.appointment.appointment_date}"
        self.assertEqual(str(self.appointment), expected_str)
    
    def test_appointment_datetime_property(self):
        """Prueba la propiedad appointment_datetime"""
        expected_datetime = datetime.combine(
            self.appointment.appointment_date,
            self.appointment.appointment_time
        )
        self.assertEqual(self.appointment.appointment_datetime, expected_datetime)
    
    def test_appointment_cancel_method(self):
        """Prueba el método cancel de una cita"""
        reason = 'Paciente no disponible'
        self.appointment.cancel(reason=reason)
        
        # Recarga la cita desde la base de datos
        self.appointment.refresh_from_db()
        
        self.assertEqual(self.appointment.status, 'cancelled')
        self.assertIsNotNone(self.appointment.cancelled_at)
        self.assertEqual(self.appointment.cancellation_reason, reason)
    
    def test_appointment_confirm_method(self):
        """Prueba el método confirm de una cita"""
        self.appointment.confirm()
        
        # Recarga la cita desde la base de datos
        self.appointment.refresh_from_db()
        
        self.assertEqual(self.appointment.status, 'confirmed')
    
    def test_appointment_complete_method(self):
        """Prueba el método complete de una cita"""
        self.appointment.complete()
        
        # Recarga la cita desde la base de datos
        self.appointment.refresh_from_db()
        
        self.assertEqual(self.appointment.status, 'completed')
    
    def test_appointment_mark_no_show_method(self):
        """Prueba el método mark_no_show de una cita"""
        self.appointment.mark_no_show()
        
        # Recarga la cita desde la base de datos
        self.appointment.refresh_from_db()
        
        self.assertEqual(self.appointment.status, 'no_show')
    
    def test_unique_together_constraint(self):
        """Prueba la restricción de unicidad para citas"""
        # Intenta crear una cita con la misma fecha, hora y doctor (debería fallar)
        with self.assertRaises(Exception):
            Appointment.objects.create(
                patient=self.patient,
                doctor=self.doctor,  # Mismo doctor
                specialty=self.specialty,
                appointment_date=self.appointment.appointment_date,  # Misma fecha
                appointment_time=self.appointment.appointment_time,  # Misma hora
                duration=30,
                status='scheduled',
                reason='Nueva consulta'
            )


class AppointmentReminderModelTests(BaseAppointmentTestCase):
    """Tests para el modelo AppointmentReminder"""
    
    def test_appointment_reminder_creation(self):
        """Prueba la creación y atributos de un recordatorio"""
        reminder = AppointmentReminder.objects.create(
            appointment=self.appointment,
            reminder_type='sms',
            scheduled_for=timezone.now() + timedelta(hours=2),
            is_sent=False
        )
        
        self.assertEqual(reminder.appointment, self.appointment)
        self.assertEqual(reminder.reminder_type, 'sms')
        self.assertFalse(reminder.is_sent)
        self.assertIsNone(reminder.sent_at)
        self.assertEqual(reminder.error_message, '')
        self.assertIsNotNone(reminder.created_at)
    
    def test_appointment_reminder_str_representation(self):
        """Prueba la representación string de un recordatorio"""
        expected_str = f"Recordatorio email para cita {self.appointment.appointment_id}"
        self.assertEqual(str(self.reminder), expected_str)
    
    def test_appointment_reminder_mark_as_sent_method(self):
        """Prueba el método mark_as_sent de un recordatorio"""
        self.reminder.mark_as_sent()
        
        # Recarga el recordatorio desde la base de datos
        self.reminder.refresh_from_db()
        
        self.assertTrue(self.reminder.is_sent)
        self.assertIsNotNone(self.reminder.sent_at)
    
    def test_appointment_reminder_mark_as_failed_method(self):
        """Prueba el método mark_as_failed de un recordatorio"""
        error_message = 'Error al enviar el correo electrónico'
        self.reminder.mark_as_failed(error_message)
        
        # Recarga el recordatorio desde la base de datos
        self.reminder.refresh_from_db()
        
        self.assertEqual(self.reminder.error_message, error_message)
        self.assertFalse(self.reminder.is_sent)


class SpecialtySerializerTests(BaseAppointmentTestCase):
    """Tests para el serializador de Specialty"""
    
    def test_specialty_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = SpecialtySerializer(self.specialty)
        expected_fields = ['id', 'name', 'description', 'is_active', 
                          'doctor_count', 'created_at', 'updated_at']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_specialty_serializer_doctor_count(self):
        """Prueba el método get_doctor_count del serializador"""
        serializer = SpecialtySerializer(self.specialty)
        self.assertEqual(serializer.data['doctor_count'], 1)  # Solo tenemos un doctor
        
        # Crear un segundo doctor con horario en la misma especialidad
        doctor2 = User.objects.create_user(email='doctor2@hospital.com',
            password='doctor2password',
            first_name='Doctor',
            last_name='Two'
        )
        MedicalSchedule.objects.create(
            doctor=doctor2,
            specialty=self.specialty,
            weekday=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
            slot_duration=30,
            is_active=True
        )
        
        # Actualizar el serializador
        serializer = SpecialtySerializer(self.specialty)
        self.assertEqual(serializer.data['doctor_count'], 2)  # Ahora tenemos dos doctores
    
    def test_specialty_serializer_inactive_doctors_not_counted(self):
        """Prueba que los doctores con horarios inactivos no se cuenten"""
        # Desactivar el horario del doctor
        schedule = MedicalSchedule.objects.get(doctor=self.doctor, weekday=0)
        schedule.is_active = False
        schedule.save()
        
        serializer = SpecialtySerializer(self.specialty)
        # Aún tenemos doctores en otros días de la semana (1-4)
        self.assertEqual(serializer.data['doctor_count'], 1)
        
        # Desactivar todos los horarios
        MedicalSchedule.objects.filter(doctor=self.doctor).update(is_active=False)
        
        # Actualizar el serializador
        serializer = SpecialtySerializer(self.specialty)
        self.assertEqual(serializer.data['doctor_count'], 0)  # No hay doctores activos


class MedicalScheduleSerializerTests(BaseAppointmentTestCase):
    """Tests para el serializador de MedicalSchedule"""
    
    def test_medical_schedule_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = MedicalScheduleSerializer(self.schedule)
        expected_fields = ['id', 'doctor', 'doctor_name', 'specialty', 'specialty_name',
                          'weekday', 'weekday_display', 'start_time', 'end_time',
                          'slot_duration', 'is_active', 'created_at', 'updated_at']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_medical_schedule_serializer_read_only_fields(self):
        """Prueba los campos de solo lectura del serializador"""
        serializer = MedicalScheduleSerializer(self.schedule)
        self.assertEqual(serializer.data['doctor_name'], self.doctor.get_full_name())
        self.assertEqual(serializer.data['specialty_name'], self.specialty.name)
        self.assertEqual(serializer.data['weekday_display'], 'Lunes')  # Para weekday=0


class AppointmentSerializerTests(BaseAppointmentTestCase):
    """Tests para el serializador de Appointment"""
    
    def test_appointment_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = AppointmentSerializer(self.appointment)
        expected_fields = ['id', 'appointment_id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                          'specialty', 'specialty_name', 'appointment_date', 'appointment_time',
                          'appointment_datetime', 'duration', 'status', 'status_display',
                          'reason', 'notes', 'cancelled_at', 'cancellation_reason',
                          'created_at', 'updated_at']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_appointment_serializer_read_only_fields(self):
        """Prueba los campos de solo lectura del serializador"""
        serializer = AppointmentSerializer(self.appointment)
        self.assertEqual(serializer.data['patient_name'], self.patient.get_full_name())
        self.assertEqual(serializer.data['doctor_name'], self.doctor.get_full_name())
        self.assertEqual(serializer.data['specialty_name'], self.specialty.name)
        self.assertEqual(serializer.data['status_display'], 'Agendada')  # Para status='scheduled'
    
    def test_appointment_serializer_validate_past_date(self):
        """Prueba la validación de fechas pasadas"""
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'appointment_date': date.today() - timedelta(days=1),  # Ayer
            'appointment_time': time(10, 0),
            'duration': 30,
            'reason': 'Consulta'
        }
        serializer = AppointmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('La fecha de la cita no puede ser en el pasado', str(serializer.errors))
    
    def test_appointment_serializer_validate_doctor_schedule(self):
        """Prueba la validación del horario del doctor"""
        # Calcular el próximo domingo (día 6)
        days_until_sunday = (6 - date.today().weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7  # Si hoy es domingo, tomar el próximo domingo
        sunday_date = date.today() + timedelta(days=days_until_sunday)
        
        # Crear un doctor sin horario los domingos
        new_doctor = User.objects.create_user(
            email='doctorsinhorario@hospital.com',
            password='password',
            first_name='Doctor',
            last_name='SinHorario'
        )
        
        # Intentar agendar un domingo cuando el doctor no tiene horario
        data = {
            'patient': self.patient.id,
            'doctor': new_doctor.id,
            'specialty': self.specialty.id,
            'appointment_date': sunday_date,
            'appointment_time': time(10, 0),
            'duration': 30,
            'reason': 'Consulta'
        }
        serializer = AppointmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('El doctor no tiene horario disponible en esa fecha y hora', str(serializer.errors))


class AppointmentReminderSerializerTests(BaseAppointmentTestCase):
    """Tests para el serializador de AppointmentReminder"""
    
    def test_appointment_reminder_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = AppointmentReminderSerializer(self.reminder)
        expected_fields = ['id', 'appointment', 'appointment_info', 'reminder_type',
                          'reminder_type_display', 'scheduled_for', 'sent_at',
                          'is_sent', 'error_message', 'created_at']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_appointment_reminder_serializer_appointment_info(self):
        """Prueba el método get_appointment_info del serializador"""
        serializer = AppointmentReminderSerializer(self.reminder)
        appointment_info = serializer.data['appointment_info']
        
        self.assertEqual(appointment_info['appointment_id'], str(self.appointment.appointment_id))
        self.assertEqual(appointment_info['patient'], self.patient.get_full_name())
        self.assertEqual(appointment_info['doctor'], self.doctor.get_full_name())
        self.assertEqual(appointment_info['date'], self.appointment.appointment_date.isoformat())
        self.assertEqual(appointment_info['time'], self.appointment.appointment_time.isoformat())


class AppointmentAPITests(APITestCase):
    """Tests para la API de Appointment"""
    
    def setUp(self):
        # Crear usuarios (admin, doctor, paciente)
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        
        self.doctor = User.objects.create_user(email='doctor@hospital.com',
            password='doctorpassword',
            first_name='Doctor',
            last_name='Test'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            first_name='Patient',
            last_name='Test',
            role='patient'
        )
        
        # Crear especialidad
        self.specialty = Specialty.objects.create(
            name='Cardiología',
            description='Especialidad en enfermedades cardiovasculares',
            is_active=True
        )
        
        # Crear horario médico (lunes a viernes, 9am-5pm)
        for weekday in range(5):  # 0-4 (lunes a viernes)
            MedicalSchedule.objects.create(
                doctor=self.doctor,
                specialty=self.specialty,
                weekday=weekday,
                start_time=time(9, 0),  # 9:00 AM
                end_time=time(17, 0),   # 5:00 PM
                slot_duration=30,
                is_active=True
            )
        
        # Crear una cita médica
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=date.today() + timedelta(days=1),  # Mañana
            appointment_time=time(10, 0),  # 10:00 AM
            duration=30,
            status='scheduled',
            reason='Consulta rutinaria',
            notes='Paciente con hipertensión'
        )
        
        # URLs de la API
        self.appointment_list_url = reverse('appointment-list')
        self.appointment_detail_url = reverse('appointment-detail', args=[self.appointment.id])
        self.appointment_upcoming_url = reverse('appointment-upcoming')
        
        # Autenticar como admin para todos los tests
        self.client.force_authenticate(user=self.admin)
    
    def test_get_appointment_list(self):
        """Prueba obtener la lista de citas"""
        response = self.client.get(self.appointment_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # La respuesta está paginada, por lo que necesitamos acceder a 'results'
        self.assertIn('results', response.data)
        results = response.data['results']
        
        # Verificar que al menos esté la cita creada en setUp
        self.assertGreaterEqual(len(results), 1)
        
        # Verificar que nuestra cita esté en la lista
        appointment_ids = [apt['id'] for apt in results]
        self.assertIn(self.appointment.id, appointment_ids)
    
    def test_get_appointment_detail(self):
        """Prueba obtener el detalle de una cita"""
        response = self.client.get(self.appointment_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.appointment.id)
        self.assertEqual(response.data['patient'], self.patient.id)
        self.assertEqual(response.data['doctor'], self.doctor.id)
    
    def test_create_appointment(self):
        """Prueba crear una nueva cita"""
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'appointment_date': (date.today() + timedelta(days=2)).isoformat(),  # Pasado mañana
            'appointment_time': '11:00:00',
            'duration': 30,
            'reason': 'Nueva consulta',
            'notes': 'Paciente con dolor de cabeza'
        }
        response = self.client.post(self.appointment_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 2)
        
        # Verificar que la cita se creó correctamente
        appointment = Appointment.objects.get(id=response.data['id'])
        self.assertEqual(appointment.patient, self.patient)
        self.assertEqual(appointment.doctor, self.doctor)
        self.assertEqual(appointment.reason, 'Nueva consulta')
    
    def test_update_appointment(self):
        """Prueba actualizar una cita existente"""
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'appointment_date': self.appointment.appointment_date.isoformat(),
            'appointment_time': self.appointment.appointment_time.isoformat(),
            'duration': 45,  # Cambiar duración
            'status': 'confirmed',  # Cambiar estado
            'reason': self.appointment.reason,
            'notes': 'Notas actualizadas'  # Cambiar notas
        }
        response = self.client.put(self.appointment_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que la cita se actualizó correctamente
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.duration, 45)
        self.assertEqual(self.appointment.status, 'confirmed')
        self.assertEqual(self.appointment.notes, 'Notas actualizadas')
    
    def test_partial_update_appointment(self):
        """Prueba actualizar parcialmente una cita"""
        data = {
            'status': 'confirmed',
            'notes': 'Notas actualizadas'
        }
        response = self.client.patch(self.appointment_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que la cita se actualizó correctamente
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'confirmed')
        self.assertEqual(self.appointment.notes, 'Notas actualizadas')
    
    def test_delete_appointment(self):
        """Prueba eliminar una cita"""
        response = self.client.delete(self.appointment_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Appointment.objects.count(), 0)
    
    def test_get_upcoming_appointments(self):
        """Prueba obtener las citas próximas"""
        # Cambiar el estado de la cita a confirmed
        self.appointment.status = 'confirmed'
        self.appointment.save()
        
        response = self.client.get(self.appointment_upcoming_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Crear una cita pasada (no debería aparecer en upcoming)
        past_appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=date.today() - timedelta(days=1),  # Ayer
            appointment_time=time(10, 0),
            duration=30,
            status='confirmed',
            reason='Consulta pasada'
        )
        
        response = self.client.get(self.appointment_upcoming_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Sigue habiendo solo 1 cita próxima
    
    def test_patient_can_only_see_their_appointments(self):
        """Prueba que un paciente solo pueda ver sus propias citas"""
        # Autenticar como paciente
        self.client.force_authenticate(user=self.patient)
        
        # Crear una cita para otro paciente
        other_patient = User.objects.create_user(email='other@example.com',
            password='otherpassword',
            first_name='Other',
            last_name='Patient'
        )
        other_appointment = Appointment.objects.create(
            patient=other_patient,
            doctor=self.doctor,
            specialty=self.specialty,
            appointment_date=date.today() + timedelta(days=3),
            appointment_time=time(14, 0),
            duration=30,
            status='scheduled',
            reason='Consulta otro paciente'
        )
        
        # Verificar que el paciente actual no puede ver la cita del otro paciente
        response = self.client.get(reverse('appointment-detail', args=[other_appointment.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verificar que el paciente puede ver su propia cita
        response = self.client.get(self.appointment_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)