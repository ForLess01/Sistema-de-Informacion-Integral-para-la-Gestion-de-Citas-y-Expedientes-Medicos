from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from django.http import HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import io
import csv
import json
from datetime import datetime, timedelta
import logging

from .models import ReportTemplate, GeneratedReport, ScheduledReport, ReportAudit
from .serializers import (
    ReportTemplateSerializer, GeneratedReportSerializer,
    GeneratedReportListSerializer, ScheduledReportSerializer,
    ReportAuditSerializer, GenerateReportSerializer
)
from .tasks import generate_report_task
from .generators import (
    AppointmentReportGenerator, MedicationReportGenerator,
    EmergencyReportGenerator, FinancialReportGenerator,
    OccupancyReportGenerator
)
from .swagger_docs import (
    report_template_list_docs, generate_report_docs, download_report_docs,
    dashboard_summary_docs
)

logger = logging.getLogger(__name__)


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar plantillas de reportes"""
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        report_type = self.request.query_params.get('report_type')
        is_active = self.request.query_params.get('is_active')
        
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class GeneratedReportViewSet(viewsets.ModelViewSet):
    """ViewSet para reportes generados"""
    queryset = GeneratedReport.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return GeneratedReportListSerializer
        return GeneratedReportSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filtrar por usuario si no es admin
        if not user.is_staff:
            queryset = queryset.filter(generated_by=user)
        
        # Filtros adicionales
        report_type = self.request.query_params.get('report_type')
        status_filter = self.request.query_params.get('status')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset.order_by('-created_at')
    
    @generate_report_docs
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generar un nuevo reporte"""
        serializer = GenerateReportSerializer(data=request.data)
        if serializer.is_valid():
            # Crear registro del reporte
            report = GeneratedReport.objects.create(
                name=serializer.validated_data.get('name', f"Reporte {timezone.now().strftime('%Y%m%d_%H%M%S')}"),
                report_type=serializer.validated_data['report_type'],
                format=serializer.validated_data['format'],
                parameters=serializer.validated_data['parameters'],
                start_date=serializer.validated_data.get('start_date'),
                end_date=serializer.validated_data.get('end_date'),
                generated_by=request.user,
                status='pending'
            )
            
            # Registrar auditoría
            ReportAudit.objects.create(
                report=report,
                user=request.user,
                action='generated',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Enviar tarea asíncrona para generar el reporte
            generate_report_task.delay(report.id)
            
            return Response(
                GeneratedReportSerializer(report).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @download_report_docs
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Descargar un reporte generado"""
        report = self.get_object()
        
        if report.status != 'completed' or not report.file:
            return Response(
                {'error': 'El reporte no está disponible para descarga'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Registrar auditoría
        ReportAudit.objects.create(
            report=report,
            user=request.user,
            action='downloaded',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Servir el archivo
        return FileResponse(
            report.file,
            as_attachment=True,
            filename=f"{report.name}.{report.format}"
        )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Vista previa del reporte (solo para JSON y CSV)"""
        report = self.get_object()
        
        if report.status != 'completed':
            return Response(
                {'error': 'El reporte no está disponible'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if report.format not in ['json', 'csv']:
            return Response(
                {'error': 'Vista previa solo disponible para formatos JSON y CSV'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Registrar auditoría
        ReportAudit.objects.create(
            report=report,
            user=request.user,
            action='viewed',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Leer y devolver contenido
        if report.format == 'json':
            with report.file.open('r') as f:
                data = json.load(f)
            return Response(data)
        else:
            # Para CSV, devolver las primeras 100 filas
            with report.file.open('r') as f:
                reader = csv.DictReader(f)
                data = []
                for i, row in enumerate(reader):
                    if i >= 100:
                        break
                    data.append(row)
            return Response({'data': data, 'preview': True})


class ScheduledReportViewSet(viewsets.ModelViewSet):
    """ViewSet para reportes programados"""
    queryset = ScheduledReport.objects.all()
    serializer_class = ScheduledReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Solo admins pueden ver todos los reportes programados
        if not self.request.user.is_staff:
            queryset = queryset.filter(created_by=self.request.user)
        
        # Filtros
        is_active = self.request.query_params.get('is_active')
        frequency = self.request.query_params.get('frequency')
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if frequency:
            queryset = queryset.filter(frequency=frequency)
        
        return queryset
    
    def perform_create(self, serializer):
        scheduled_report = serializer.save(created_by=self.request.user)
        # Calcular próxima ejecución
        scheduled_report.calculate_next_run()
        scheduled_report.save()
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activar/desactivar un reporte programado"""
        scheduled_report = self.get_object()
        scheduled_report.is_active = not scheduled_report.is_active
        
        if scheduled_report.is_active:
            scheduled_report.calculate_next_run()
        
        scheduled_report.save()
        
        return Response({
            'is_active': scheduled_report.is_active,
            'next_run': scheduled_report.next_run
        })
    
    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        """Ejecutar un reporte programado inmediatamente"""
        scheduled_report = self.get_object()
        
        # Crear reporte
        report = GeneratedReport.objects.create(
            template=scheduled_report.template,
            name=f"{scheduled_report.name} - Manual",
            report_type=scheduled_report.template.report_type,
            format=scheduled_report.format,
            parameters={},
            generated_by=request.user,
            status='pending'
        )
        
        # Enviar tarea
        generate_report_task.delay(report.id)
        
        return Response(
            GeneratedReportSerializer(report).data,
            status=status.HTTP_201_CREATED
        )


class ReportAuditViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para auditoría de reportes (solo lectura)"""
    queryset = ReportAudit.objects.all()
    serializer_class = ReportAuditSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        report_id = self.request.query_params.get('report_id')
        user_id = self.request.query_params.get('user_id')
        action_filter = self.request.query_params.get('action')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        return queryset.order_by('-timestamp')


# Vistas para obtener estadísticas del dashboard
class DashboardStatsView(viewsets.ViewSet):
    """Vista para estadísticas del dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    @dashboard_summary_docs
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Resumen de estadísticas generales"""
        from appointments.models import Appointment
        from medical_records.models import MedicalRecord, Prescription
        from emergency.models import EmergencyCase
        from authentication.models import User
        
        today = timezone.now().date()
        
        # Estadísticas de citas
        appointments_today = Appointment.objects.filter(
            appointment_date=today
        ).count()
        
        appointments_pending = Appointment.objects.filter(
            appointment_date__gte=today,
            status='scheduled'
        ).count()
        
        # Estadísticas de pacientes
        total_patients = User.objects.filter(role='patient').count()
        new_patients_month = User.objects.filter(
            role='patient',
            date_joined__gte=today - timedelta(days=30)
        ).count()
        
        # Estadísticas de emergencias
        emergency_active = EmergencyCase.objects.filter(
            status__in=['waiting', 'in_triage', 'in_treatment']
        ).count()
        
        # Estadísticas de prescripciones
        active_prescriptions = Prescription.objects.filter(
            is_active=True,
            valid_until__gte=today
        ).count()
        
        return Response({
            'appointments': {
                'today': appointments_today,
                'pending': appointments_pending
            },
            'patients': {
                'total': total_patients,
                'new_this_month': new_patients_month
            },
            'emergency': {
                'active_cases': emergency_active
            },
            'prescriptions': {
                'active': active_prescriptions
            },
            'generated_at': timezone.now()
        })
