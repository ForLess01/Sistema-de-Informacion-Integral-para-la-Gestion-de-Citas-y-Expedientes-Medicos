from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.db import models
from .models import Appointment, TemporaryReservation, Specialty
from authentication.models import User
from .serializers import AppointmentSerializer, TemporaryReservationSerializer
from datetime import datetime, timedelta
from django.utils import timezone


class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes_by_action = {'create_temporary_reservation': [IsAuthenticated],
                                    'list_temporary_reservations': [IsAuthenticatedOrReadOnly]}
    """ViewSet para citas médicas"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar citas según el rol del usuario"""
        user = self.request.user
        # Si el usuario no está autenticado, retornar queryset vacío
        if not user.is_authenticated:
            return self.queryset.none()
            
        if hasattr(user, 'role') and user.role == 'patient':
            # Los pacientes solo ven sus propias citas
            return self.queryset.filter(patient=user)
        elif hasattr(user, 'role') and user.role == 'doctor':
            # Los doctores ven sus citas
            return self.queryset.filter(doctor=user)
        # Admin y otros roles ven todas las citas
        return self.queryset
    
    def create(self, request, *args, **kwargs):
        """Crear nueva cita médica"""
        # Para la Fase 1, necesitamos mapear los datos para que funcionen con User ficticios
        from authentication.models import User
        from datetime import datetime
        
        # Asegurarse de que tenemos los campos necesarios
        data = request.data.copy()
        
        # El doctor se mapea desde el doctor_id
        doctor_id = data.get('doctor', 1)  # Usar campo 'doctor' del script
        
        # Como estamos en Fase 1 sin doctores reales, usar el admin como doctor temporal
        try:
            doctor_user = User.objects.get(id=doctor_id)
        except User.DoesNotExist:
            # Si no existe, usar el admin como fallback
            doctor_user = User.objects.filter(is_superuser=True).first()
            if not doctor_user:
                return Response(
                    {'error': 'No se encontró un doctor válido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        data['doctor'] = doctor_user.id
        data['patient'] = request.user.id  # Asignar el paciente actual
        
        # Manejar specialty - por ahora es opcional en Fase 1
        if 'specialty' not in data:
            data['specialty'] = None
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # Crear la cita
        appointment = serializer.save()
        
        # Preparar respuesta con información adicional
        response_data = self.get_serializer(appointment).data
        
        # Añadir información adicional para la Fase 1
        specialty_names = {
            1: 'Atención Prenatal',
            2: 'Medicina General', 
            3: 'Odontología'
        }
        
        doctor_names = {
            1: 'Dr. María González', 2: 'Dr. Carmen Rodríguez', 3: 'Dr. Ana Flores',
            4: 'Dr. Juan Pérez', 5: 'Dr. Luis Mendoza', 6: 'Dr. Roberto Silva', 
            7: 'Dr. Carlos Vega', 8: 'Dr. Miguel Torres', 9: 'Dr. Patricia Morales',
            10: 'Dr. David Herrera', 11: 'Dr. Elena Castro', 12: 'Dr. Fernando Ruiz'
        }
        
        response_data.update({
            'specialty_name': specialty_names.get(appointment.specialty_id, 'Especialidad') if appointment.specialty_id else 'General',
            'doctor_name': doctor_names.get(doctor_id, f'Doctor {doctor_id}'),
            'status': 'scheduled'
        })
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    def get_object(self):
        """Obtener objeto asegurando permisos correctos"""
        # Primero obtener el objeto usando el queryset filtrado
        queryset = self.get_queryset()
        # Filtrar por pk
        obj = get_object_or_404(queryset, pk=self.kwargs.get('pk'))
# Verificar permisos del objeto

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_temporary_reservation(self, request):
        """Crear una nueva reserva temporal"""
        serializer = TemporaryReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        temporary_reservation = serializer.save(user=request.user)
        return Response(
            TemporaryReservationSerializer(temporary_reservation).data,
            status=status.HTTP_201_CREATED
        )
 
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def list_temporary_reservations(self, request):
        """Listar reservas temporales activas y no expiradas"""
        now = timezone.now()
        reservations = TemporaryReservation.objects.filter(
            expires_at__gt=now,
            is_active=True
        ).select_related('user', 'doctor', 'specialty')
        return Response(
            TemporaryReservationSerializer(reservations, many=True).data
        )

    def get_permissions(self):
        try:
            # Return permission_classes depending on `action`
            return [permission() for permission in self.permission_classes_by_action[self.action]]
        except KeyError:
            # Return default permission_classes if `action` is not set
            return [permission() for permission in self.permission_classes]
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Obtener citas próximas"""
        from datetime import date
        # Usar el queryset filtrado por usuario
        appointments = self.get_queryset().filter(
            appointment_date__gte=date.today(),
            status='confirmed'
        ).order_by('appointment_date', 'appointment_time')[:5]
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def specialties(self, request):
        """Obtener especialidades disponibles"""
        from .models import Specialty
        from django.db.models import Count
        
        specialties = Specialty.objects.filter(is_active=True).annotate(
            doctor_count=Count('schedules__doctor', distinct=True)
        ).values('id', 'name', 'description', 'doctor_count')
        
        if not specialties:
            specialties = [
                {
                    'id': 1, 
                    'name': 'Atención Prenatal', 
                    'description': 'Control y seguimiento del embarazo',
                    'doctor_count': 3
                },
                {
                    'id': 2, 
                    'name': 'Medicina General', 
                    'description': 'Consultas médicas generales y chequeos preventivos',
                    'doctor_count': 5
                },
                {
                    'id': 3, 
                    'name': 'Odontología', 
                    'description': 'Cuidado dental y salud oral',
                    'doctor_count': 4
                },
            ]
        
        return Response(specialties)

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Obtener horarios disponibles"""
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        
        if not doctor_id or not date_str:
            return Response(
                {'error': 'Se requieren doctor_id y date'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from datetime import datetime
        try:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            weekday = selected_date.weekday()
            
            # Horarios base para todos los días
            base_slots = [
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
                '16:00', '16:30', '17:00', '17:30'
            ]
            
            # Verificar citas ya programadas para este doctor en esta fecha
            existing_appointments = Appointment.objects.filter(
                doctor_id=doctor_id,
                appointment_date=selected_date,
                status__in=['scheduled', 'confirmed']
            ).values_list('appointment_time', flat=True)
            
            # Convertir a formato string para comparación
            occupied_slots = [time.strftime('%H:%M') for time in existing_appointments]
            
            # Para fines de semana, simular menos disponibilidad
            if weekday >= 5:  # Fin de semana (sábado y domingo)
                # Simular que en fin de semana hay horarios de emergencia o menos disponibilidad
                weekend_occupied = ['09:00', '14:00', '16:00']
                occupied_slots.extend(weekend_occupied)
            else:  # Días laborables (lunes a viernes)
                # Simular algunas citas ya ocupadas en días laborables
                weekday_occupied = ['10:00', '15:00']
                occupied_slots.extend(weekday_occupied)
            
            # Filtrar slots disponibles
            available_slots = [slot for slot in base_slots if slot not in occupied_slots]
            
            return Response(available_slots)
            
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def doctors_by_specialty(self, request, specialty_id=None):
        """Obtener doctores por especialidad desde la base de datos"""
        from authentication.models import User
        from .models import MedicalSchedule, Specialty
        from django.db.models import Count, Avg
        
        # Si no se proporciona specialty_id, obtenerlo de query params
        if not specialty_id:
            specialty_id = request.query_params.get('specialty_id')
        
        if not specialty_id:
            return Response(
                {'error': 'Se requiere specialty_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verificar que la especialidad existe
            specialty = Specialty.objects.get(id=specialty_id, is_active=True)
            
            # Obtener doctores que tienen horarios activos en esta especialidad
            doctors = User.objects.filter(
                medical_schedules__specialty_id=specialty_id,
                medical_schedules__is_active=True,
                is_active=True
            ).distinct().annotate(
                schedule_count=Count('medical_schedules', filter=models.Q(medical_schedules__is_active=True))
            )
            
            doctors_list = []
            for doctor in doctors:
                # Intentar obtener el doctor profile si existe
                doctor_profile = None
                if hasattr(doctor, 'doctor_profile'):
                    doctor_profile = doctor.doctor_profile
                
                # Calcular años de experiencia basado en date_joined como fallback
                from datetime import datetime
                experience_years = 5  # Valor por defecto
                if doctor_profile and hasattr(doctor_profile, 'years_of_experience'):
                    experience_years = doctor_profile.years_of_experience
                elif doctor.date_joined:
                    years_since_joined = (datetime.now().date() - doctor.date_joined.date()).days // 365
                    experience_years = max(1, years_since_joined)  # Mínimo 1 año
                
                doctors_list.append({
                    'id': doctor.id,
                    'name': doctor.get_full_name(),
                    'specialization': specialty.name,
                    'experience_years': experience_years,
                    'rating': 4.5,  # Valor por defecto hasta implementar sistema de ratings
                    'schedule_count': doctor.schedule_count,
                    'email': doctor.email if request.user.is_staff else None,  # Solo para admins
                })
            
            # Si no hay doctores en la base de datos, usar datos de fallback
            if not doctors_list:
                fallback_doctors = self._get_fallback_doctors_by_specialty(specialty_id)
                if fallback_doctors:
                    return Response(fallback_doctors)
                else:
                    return Response([])
            
            return Response(doctors_list)
            
        except Specialty.DoesNotExist:
            return Response(
                {'error': 'Especialidad no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            # En caso de error, usar datos de fallback
            fallback_doctors = self._get_fallback_doctors_by_specialty(specialty_id)
            return Response(fallback_doctors if fallback_doctors else [])
    
    def _get_fallback_doctors_by_specialty(self, specialty_id):
        """Datos de fallback para doctores cuando no hay datos en la BD"""
        doctors_data = {
            '1': [
                {
                    'id': 1, 
                    'name': 'María González', 
                    'specialization': 'Ginecología y Obstetricia',
                    'experience_years': 15,
                    'rating': 4.8
                },
                {
                    'id': 2, 
                    'name': 'Carmen Rodríguez', 
                    'specialization': 'Medicina Materno-Fetal',
                    'experience_years': 12,
                    'rating': 4.9
                },
            ],
            '2': [
                {
                    'id': 4, 
                    'name': 'Juan Pérez', 
                    'specialization': 'Medicina Interna',
                    'experience_years': 20,
                    'rating': 4.6
                },
                {
                    'id': 5, 
                    'name': 'Luis Mendoza', 
                    'specialization': 'Medicina Familiar',
                    'experience_years': 8,
                    'rating': 4.5
                },
            ],
            '3': [
                {
                    'id': 9, 
                    'name': 'Patricia Morales', 
                    'specialization': 'Odontología General',
                    'experience_years': 12,
                    'rating': 4.9
                },
                {
                    'id': 10, 
                    'name': 'David Herrera', 
                    'specialization': 'Endodoncia',
                    'experience_years': 15,
                    'rating': 4.8
                },
            ]
        }
        
        return doctors_data.get(str(specialty_id), [])
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar cita médica"""
        appointment = self.get_object()
        
        if appointment.status == 'cancelled':
            return Response(
                {'error': 'La cita ya está cancelada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'Cancelado por el paciente')
        appointment.cancel(reason)
        
        # Intentar enviar notificación por email
        try:
            from notifications.services import EmailService
            email_service = EmailService()
            email_service.send_appointment_cancellation(
                appointment.patient.email,
                {
                    'patient_name': appointment.patient.get_full_name(),
                    'doctor_name': 'Doctor Asignado',
                    'appointment_date': appointment.appointment_date,
                    'appointment_time': appointment.appointment_time,
                    'specialty': 'Especialidad',
                    'reason': reason
                }
            )
        except Exception as e:
            print(f"Error enviando email de cancelación: {e}")
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmar asistencia a cita"""
        appointment = self.get_object()
        
        if appointment.status != 'scheduled':
            return Response(
                {'error': 'Solo se pueden confirmar citas programadas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.confirm()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
