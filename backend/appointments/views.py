from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Appointment
from .serializers import AppointmentSerializer
from datetime import datetime, timedelta
from django.utils import timezone


class AppointmentViewSet(viewsets.ModelViewSet):
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
    
    def get_object(self):
        """Obtener objeto asegurando permisos correctos"""
        # Primero obtener el objeto usando el queryset filtrado
        queryset = self.get_queryset()
        # Filtrar por pk
        obj = get_object_or_404(queryset, pk=self.kwargs.get('pk'))
        # Verificar permisos del objeto
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
        # Datos de ejemplo
        specialties = [
            {'id': 1, 'name': 'Cardiología', 'doctor_count': 5},
            {'id': 2, 'name': 'Dermatología', 'doctor_count': 3},
            {'id': 3, 'name': 'Pediatría', 'doctor_count': 8},
        ]
        return Response(specialties)

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Obtener horarios disponibles"""
        # Datos de ejemplo
        slots = [
            {'time': '09:00', 'available': True},
            {'time': '10:00', 'available': False},
            {'time': '11:00', 'available': True},
            {'time': '14:00', 'available': True},
            {'time': '15:00', 'available': True},
        ]
        return Response(slots)
