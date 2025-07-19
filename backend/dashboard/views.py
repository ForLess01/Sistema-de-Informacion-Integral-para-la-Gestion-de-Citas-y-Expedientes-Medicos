from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from datetime import datetime, time
from appointments.models import Appointment
from authentication.models import User
from emergency.models import EmergencyCase


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
