from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Appointment
from .serializers import AppointmentSerializer
from datetime import datetime, timedelta
from django.utils import timezone


class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet para citas médicas"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Obtener citas próximas"""
        appointments = Appointment.objects.filter(
            appointment_date__gte=timezone.now(),
            status='confirmed'
        ).order_by('appointment_date')[:5]
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
