from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import date, datetime
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from django.utils import timezone

# Importar modelos relacionados
from appointments.models import Appointment
from medical_records.models import MedicalRecord

# Importar modelo de emergencias (si existe)
try:
    from emergency.models import EmergencyCase
except ImportError:
    # Si no existe el modelo EmergencyCase, crear una clase mock
    class EmergencyCase:
        @classmethod
        def objects(cls):
            return MockQuerySet()
    
    class MockQuerySet:
        def filter(self, **kwargs):
            return self
        def count(self):
            return 0
        def select_related(self, *args):
            return self
        def order_by(self, *args):
            return []

User = get_user_model()


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener estadísticas generales del dashboard
        """
        try:
            today = timezone.now().date()
            
            # Citas de hoy
            appointments_today = Appointment.objects.filter(
                appointment_date=today
            ).count()
            
            # Pacientes activos (usuarios con rol paciente)
            active_patients = User.objects.filter(
                role='patient',
                is_active=True
            ).count()
            
            # Emergencias activas
            emergency_count = EmergencyCase.objects.filter(
                status__in=['waiting', 'in_triage', 'in_treatment']
            ).count()
            
            # Ocupación de camas (simulado)
            bed_occupancy = 75  # Porcentaje simulado
            beds_available = 25  # Camas disponibles simuladas
            
            # Cambios porcentuales (simulados para demo)
            appointments_change = "+12%"
            patients_change = "+5%"
            
            return Response({
                'appointments_today': appointments_today,
                'active_patients': active_patients,
                'emergency_count': emergency_count,
                'bed_occupancy': bed_occupancy,
                'beds_available': f"{beds_available} disponibles",
                'appointments_change': appointments_change,
                'patients_change': patients_change
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener estadísticas del dashboard',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TodayAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener citas del día actual
        """
        try:
            today = timezone.now().date()
            
            appointments = Appointment.objects.filter(
                appointment_date=today
            ).select_related('patient', 'doctor').order_by('appointment_time')
            
            appointment_data = []
            for appointment in appointments:
                appointment_data.append({
                    'id': appointment.id,
                    'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
                    'time': appointment.appointment_time.strftime('%H:%M'),
                    'specialty': getattr(appointment.doctor.doctor_profile, 'specialty', 'General') if hasattr(appointment.doctor, 'doctor_profile') else 'General',
                    'status': appointment.status,
                    'doctor_name': f"Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}"
                })
            
            return Response(appointment_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener citas de hoy',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmergencyPatientsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener pacientes en emergencia
        """
        try:
            emergency_patients = EmergencyCase.objects.filter(
                status__in=['waiting', 'in_triage', 'in_treatment']
            ).select_related('patient').order_by('-arrival_time')
            
            emergency_data = []
            for emergency in emergency_patients:
                emergency_data.append({
                    'id': emergency.id,
                    'patient_name': f"{emergency.patient.first_name} {emergency.patient.last_name}",
                    'arrival_time': emergency.arrival_time.strftime('%H:%M'),
                    'priority': emergency.triage_level or 'Sin triaje',
                    'status': emergency.status,
                    'chief_complaint': emergency.chief_complaint
                })
            
            return Response(emergency_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener pacientes en emergencia',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================
# VISTAS ESPECÍFICAS PARA ODONTÓLOGO
# =====================================================

class OdontologoStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Estadísticas específicas para odontólogo
        """
        try:
            today = timezone.now().date()
            
            # Filtrar solo citas del odontólogo actual o especialidad odontológica
            odontologo_appointments = Appointment.objects.filter(
                doctor=request.user,
                appointment_date=today
            ).count() if request.user.role == 'doctor' else 0
            
            # Pacientes del odontólogo (históricos)
            my_patients = Appointment.objects.filter(
                doctor=request.user
            ).values('patient').distinct().count() if request.user.role == 'doctor' else 0
            
            # Tratamientos activos (simulado)
            active_treatments = 8  # Número simulado de tratamientos activos
            
            # Citas pendientes esta semana
            from datetime import timedelta
            week_end = today + timedelta(days=6)
            pending_appointments = Appointment.objects.filter(
                doctor=request.user,
                appointment_date__range=(today, week_end),
                status='scheduled'
            ).count() if request.user.role == 'doctor' else 0
            
            return Response({
                'appointments_today': odontologo_appointments,
                'total_patients': my_patients,
                'active_treatments': active_treatments,
                'pending_appointments': pending_appointments,
                'appointments_change': "+8%",
                'treatments_change': "+15%"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener estadísticas del odontólogo',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OdontologoAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Citas específicas del odontólogo para hoy
        """
        try:
            today = timezone.now().date()
            
            appointments = Appointment.objects.filter(
                doctor=request.user,
                appointment_date=today
            ).select_related('patient').order_by('appointment_time')
            
            appointment_data = []
            for appointment in appointments:
                appointment_data.append({
                    'id': appointment.id,
                    'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
                    'time': appointment.appointment_time.strftime('%H:%M'),
                    'treatment_type': appointment.notes or 'Consulta general',
                    'status': appointment.status,
                    'patient_id': appointment.patient.id
                })
            
            return Response(appointment_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener citas del odontólogo',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OdontologoActiveTreatmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Tratamientos activos del odontólogo
        """
        try:
            # Obtener expedientes médicos relacionados con el doctor
            active_treatments = MedicalRecord.objects.filter(
                doctor=request.user,
                is_active=True
            ).select_related('patient').order_by('-created_at')[:10]
            
            treatment_data = []
            for record in active_treatments:
                treatment_data.append({
                    'id': record.id,
                    'patient_name': f"{record.patient.first_name} {record.patient.last_name}",
                    'treatment': record.diagnosis or 'Tratamiento en curso',
                    'start_date': record.created_at.strftime('%Y-%m-%d'),
                    'status': 'En curso',
                    'next_appointment': 'Por programar'  # Esto se puede calcular consultando próximas citas
                })
            
            return Response(treatment_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener tratamientos activos',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================
# VISTAS ESPECÍFICAS PARA DOCTOR GENERAL
# =====================================================

class DoctorStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Estadísticas específicas para doctor general
        """
        try:
            today = timezone.now().date()
            
            # Citas del doctor para hoy
            doctor_appointments = Appointment.objects.filter(
                doctor=request.user,
                appointment_date=today
            ).count() if request.user.role == 'doctor' else 0
            
            # Total de pacientes atendidos
            total_patients = Appointment.objects.filter(
                doctor=request.user
            ).values('patient').distinct().count() if request.user.role == 'doctor' else 0
            
            # Consultas de emergencia (si el doctor atiende emergencias)
            emergency_consultations = EmergencyCase.objects.filter(
                assigned_doctor=request.user,
                status='in_treatment'
            ).count() if hasattr(EmergencyCase, 'assigned_doctor') else 0
            
            # Derivaciones realizadas (simulado)
            referrals_made = 5
            
            return Response({
                'appointments_today': doctor_appointments,
                'total_patients': total_patients,
                'emergency_consultations': emergency_consultations,
                'referrals_made': referrals_made,
                'appointments_change': "+10%",
                'patients_change': "+7%"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener estadísticas del doctor',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DoctorAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Citas del doctor para hoy
        """
        try:
            today = timezone.now().date()
            
            appointments = Appointment.objects.filter(
                doctor=request.user,
                appointment_date=today
            ).select_related('patient').order_by('appointment_time')
            
            appointment_data = []
            for appointment in appointments:
                appointment_data.append({
                    'id': appointment.id,
                    'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
                    'time': appointment.appointment_time.strftime('%H:%M'),
                    'consultation_type': appointment.notes or 'Consulta general',
                    'status': appointment.status,
                    'duration': '30 min'  # Duración estimada
                })
            
            return Response(appointment_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener citas del doctor',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DoctorPatientsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Pacientes recientes del doctor
        """
        try:
            # Obtener los pacientes más recientes del doctor
            recent_appointments = Appointment.objects.filter(
                doctor=request.user
            ).select_related('patient').order_by('-appointment_date')[:10]
            
            patient_data = []
            for appointment in recent_appointments:
                patient_data.append({
                    'id': appointment.patient.id,
                    'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
                    'last_visit': appointment.appointment_date.strftime('%Y-%m-%d'),
                    'age': getattr(appointment.patient.patient_profile, 'age', 'N/A') if hasattr(appointment.patient, 'patient_profile') else 'N/A',
                    'phone': appointment.patient.phone or 'No registrado',
                    'status': 'Activo'
                })
            
            return Response(patient_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener pacientes del doctor',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================
# VISTAS ESPECÍFICAS PARA ENFERMERO/A
# =====================================================

class NurseStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Estadísticas específicas para enfermero/a
        """
        try:
            today = timezone.now().date()
            
            # Pacientes asignados para cuidados de enfermería
            assigned_patients = 15  # Simulado
            
            # Tareas completadas hoy
            completed_tasks = 8  # Simulado
            
            # Emergencias atendidas
            emergencies_handled = EmergencyCase.objects.filter(
                status='in_triage',
                created_at__date=today
            ).count()
            
            # Medicamentos administrados
            medications_given = 12  # Simulado
            
            return Response({
                'assigned_patients': assigned_patients,
                'completed_tasks': completed_tasks,
                'emergencies_handled': emergencies_handled,
                'medications_given': medications_given,
                'tasks_change': "+5%",
                'patients_change': "+3%"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener estadísticas de enfermería',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NurseTasksView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Tareas pendientes de enfermería
        """
        try:
            # Simulación de tareas de enfermería
            tasks_data = [
                {
                    'id': 1,
                    'patient_name': 'María González',
                    'task': 'Administrar medicación',
                    'time': '09:00',
                    'priority': 'Alta',
                    'status': 'Pendiente'
                },
                {
                    'id': 2,
                    'patient_name': 'Juan Pérez',
                    'task': 'Toma de signos vitales',
                    'time': '10:30',
                    'priority': 'Media',
                    'status': 'En proceso'
                },
                {
                    'id': 3,
                    'patient_name': 'Ana Torres',
                    'task': 'Curación de herida',
                    'time': '11:15',
                    'priority': 'Alta',
                    'status': 'Pendiente'
                },
                {
                    'id': 4,
                    'patient_name': 'Carlos López',
                    'task': 'Preparación pre-quirúrgica',
                    'time': '14:00',
                    'priority': 'Crítica',
                    'status': 'Programado'
                }
            ]
            
            return Response(tasks_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener tareas de enfermería',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NursePatientsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Pacientes bajo cuidado de enfermería
        """
        try:
            # Obtener pacientes que han tenido citas recientes (simulando pacientes hospitalizados)
            recent_patients = User.objects.filter(
                role='patient',
                patient_appointments__appointment_date__gte=timezone.now().date() - timezone.timedelta(days=7)
            ).distinct()[:10]
            
            patient_data = []
            for patient in recent_patients:
                patient_data.append({
                    'id': patient.id,
                    'patient_name': f"{patient.first_name} {patient.last_name}",
                    'room': f'Habitación {patient.id % 10 + 100}',  # Simulado
                    'condition': 'Estable',  # Simulado
                    'last_check': '08:00',  # Simulado
                    'next_medication': '12:00'  # Simulado
                })
            
            return Response(patient_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener pacientes de enfermería',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NurseAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Citas asignadas a enfermería para apoyo y seguimiento
        """
        try:
            today = timezone.now().date()
            
            # Obtener citas de hoy que requieren apoyo de enfermería
            # En un sistema real, esto podría ser citas marcadas específicamente para enfermería
            appointments = Appointment.objects.filter(
                appointment_date=today,
                status__in=['scheduled', 'in_progress']
            ).select_related('patient', 'doctor').order_by('appointment_time')[:10]
            
            appointment_data = []
            for appointment in appointments:
                appointment_data.append({
                    'id': appointment.id,
                    'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
                    'time': appointment.appointment_time.strftime('%H:%M'),
                    'doctor_name': f"Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}",
                    'support_type': 'Preparación y seguimiento',  # Simulado
                    'status': appointment.status,
                    'notes': appointment.notes or 'Apoyo general de enfermería'
                })
            
            return Response(appointment_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener citas de enfermería',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
