from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Avg
from datetime import datetime
from .models import EmergencyCase, EmergencyVitalSigns, EmergencyMedication, EmergencyProcedure, EmergencyTransfer
from .serializers import (
    EmergencyCaseListSerializer, EmergencyCaseDetailSerializer,
    EmergencyCaseCreateSerializer, EmergencyVitalSignsSerializer,
    EmergencyMedicationSerializer, EmergencyProcedureSerializer,
    EmergencyTransferSerializer, EmergencyTriageSerializer,
    EmergencyDashboardSerializer
)
from authentication.models import User


class EmergencyCaseViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de casos de emergencia"""
    queryset = EmergencyCase.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'triage_level', 'arrival_mode']
    search_fields = ['patient__first_name', 'patient__last_name', 'chief_complaint']
    ordering = ['-arrival_time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmergencyCaseListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EmergencyCaseCreateSerializer
        return EmergencyCaseDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filtrar por rol de usuario
        if user.role == 'patient':
            queryset = queryset.filter(patient=user)
        elif user.role == 'doctor':
            queryset = queryset.filter(attending_doctor=user)
        elif user.role == 'nurse':
            queryset = queryset.filter(triage_nurse=user)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def triage(self, request, pk=None):
        """Realizar triaje en un caso de emergencia"""
        emergency_case = self.get_object()
        serializer = EmergencyTriageSerializer(data=request.data)
        
        if serializer.is_valid():
            emergency_case.triage_level = serializer.validated_data['triage_level']
            emergency_case.triage_time = timezone.now()
            emergency_case.triage_nurse = request.user
            emergency_case.status = 'in_triage'
            emergency_case.save()
            
            # Si incluye signos vitales, guardarlos
            if 'vital_signs' in serializer.validated_data:
                vital_signs_data = serializer.validated_data['vital_signs']
                EmergencyVitalSigns.objects.create(
                    emergency_case=emergency_case,
                    recorded_by=request.user,
                    **vital_signs_data
                )
            
            return Response(
                self.get_serializer(emergency_case).data
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def discharge(self, request, pk=None):
        """Dar de alta a un paciente de emergencia"""
        emergency_case = self.get_object()
        emergency_case.status = 'discharged'
        emergency_case.discharge_time = timezone.now()
        emergency_case.discharge_diagnosis = request.data.get('discharge_diagnosis', '')
        emergency_case.discharge_instructions = request.data.get('discharge_instructions', '')
        emergency_case.save()
        
        return Response(
            self.get_serializer(emergency_case).data
        )
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Obtener estadísticas del dashboard de emergencias"""
        today = timezone.now().date()
        total_cases_today = EmergencyCase.objects.filter(arrival_time__date=today).count()
        active_cases = EmergencyCase.objects.filter(status__in=['waiting', 'in_triage', 'in_treatment', 'observation']).count()
        waiting_cases = EmergencyCase.objects.filter(status='waiting').count()
        critical_cases = EmergencyCase.objects.filter(triage_level=1).count()
        average_waiting_time = EmergencyCase.objects.filter(
            treatment_start_time__isnull=False
        ).aggregate(avg_waiting=Avg('waiting_time'))['avg_waiting'] or 0
        
        cases_by_triage = EmergencyCase.objects.values('triage_level').annotate(count=Count('triage_level'))
        cases_by_status = EmergencyCase.objects.values('status').annotate(count=Count('status'))
        
        data = {
            'total_cases_today': total_cases_today,
            'active_cases': active_cases,
            'waiting_cases': waiting_cases,
            'critical_cases': critical_cases,
            'average_waiting_time': average_waiting_time,
            'cases_by_triage': {entry['triage_level']: entry['count'] for entry in cases_by_triage},
            'cases_by_status': {entry['status']: entry['count'] for entry in cases_by_status}
        }
        
        serializer = EmergencyDashboardSerializer(data)
        return Response(serializer.data)


class EmergencyMedicationViewSet(viewsets.ModelViewSet):
    """ViewSet para medicamentos de emergencia"""
    queryset = EmergencyMedication.objects.all()
    serializer_class = EmergencyMedicationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['emergency_case', 'medication', 'administered_by']
    
    def perform_create(self, serializer):
        serializer.save(administered_by=self.request.user)


class EmergencyProcedureViewSet(viewsets.ModelViewSet):
    """ViewSet para procedimientos de emergencia"""
    queryset = EmergencyProcedure.objects.all()
    serializer_class = EmergencyProcedureSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['emergency_case', 'performed_by']
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)


class EmergencyTransferViewSet(viewsets.ModelViewSet):
    """ViewSet para transferencias de emergencia"""
    queryset = EmergencyTransfer.objects.all()
    serializer_class = EmergencyTransferSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['emergency_case', 'arranged_by']
    
    def perform_create(self, serializer):
        serializer.save(arranged_by=self.request.user)
