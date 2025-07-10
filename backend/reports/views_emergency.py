from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.db.models import Count, Avg, Sum, Q, F, Min, Max, Case, When, Value
from django.db.models.functions import TruncDate, TruncHour, ExtractHour, ExtractWeekDay, Extract
from django.utils import timezone
from datetime import datetime, timedelta
import logging

from emergency.models import EmergencyCase, TriageAssessment, EmergencyTreatment
from authentication.models import User
from .generators import EmergencyReportGenerator
from .swagger_docs import (
    emergency_case_summary_docs, emergency_triage_analysis_docs,
    emergency_response_times_docs
)

logger = logging.getLogger(__name__)


class EmergencyReportViewSet(viewsets.ViewSet):
    """ViewSet para reportes del módulo de emergencias"""
    permission_classes = [IsAuthenticated]
    
    def get_date_range(self, request):
        """Obtener rango de fechas de los parámetros"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date() - timedelta(days=30)
            
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
            
        return start_date, end_date
    
    @emergency_case_summary_docs
    @action(detail=False, methods=['get'])
    def case_summary(self, request):
        """Resumen general de casos de emergencia"""
        start_date, end_date = self.get_date_range(request)
        
        # Total de casos por estado
        cases_by_status = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Total de casos por prioridad
        cases_by_priority = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).values('priority').annotate(
            count=Count('id'),
            avg_wait_time=Avg(
                F('triage_time') - F('arrival_time'),
                output_field=models.DurationField()
            )
        ).order_by('priority')
        
        # Estadísticas generales
        total_stats = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).aggregate(
            total_cases=Count('id'),
            critical_cases=Count('id', filter=Q(priority='critical')),
            urgent_cases=Count('id', filter=Q(priority='urgent')),
            standard_cases=Count('id', filter=Q(priority='standard')),
            completed_cases=Count('id', filter=Q(status='discharged')),
            admitted_cases=Count('id', filter=Q(status='admitted'))
        )
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'cases_by_status': list(cases_by_status),
            'cases_by_priority': list(cases_by_priority),
            'statistics': total_stats
        })
    
    @emergency_triage_analysis_docs
    @action(detail=False, methods=['get'])
    def triage_analysis(self, request):
        """Análisis del proceso de triaje"""
        start_date, end_date = self.get_date_range(request)
        
        # Distribución de niveles de triaje
        triage_distribution = TriageAssessment.objects.filter(
            assessment_time__date__range=[start_date, end_date]
        ).values('triage_level').annotate(
            count=Count('id'),
            percentage=Count('id') * 100.0 / Count('id', filter=Q())
        ).order_by('triage_level')
        
        # Tiempo promedio de triaje por nivel
        triage_times = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date],
            triage_time__isnull=False
        ).values('priority').annotate(
            avg_triage_time=Avg(
                F('triage_time') - F('arrival_time'),
                output_field=models.DurationField()
            ),
            min_triage_time=Min(
                F('triage_time') - F('arrival_time'),
                output_field=models.DurationField()
            ),
            max_triage_time=Max(
                F('triage_time') - F('arrival_time'),
                output_field=models.DurationField()
            )
        )
        
        # Eficiencia del triaje por enfermero
        nurse_efficiency = TriageAssessment.objects.filter(
            assessment_time__date__range=[start_date, end_date]
        ).values(
            'nurse__first_name',
            'nurse__last_name'
        ).annotate(
            assessments_count=Count('id'),
            avg_assessment_duration=Avg('assessment_duration')
        ).order_by('-assessments_count')[:10]
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'triage_distribution': list(triage_distribution),
            'triage_times': list(triage_times),
            'nurse_efficiency': list(nurse_efficiency)
        })
    
    @emergency_response_times_docs
    @action(detail=False, methods=['get'])
    def response_times(self, request):
        """Análisis de tiempos de respuesta"""
        start_date, end_date = self.get_date_range(request)
        
        # Tiempos promedio por etapa del proceso
        response_metrics = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).aggregate(
            # Tiempo hasta triaje
            avg_time_to_triage=Avg(
                F('triage_time') - F('arrival_time'),
                output_field=models.DurationField(),
                filter=Q(triage_time__isnull=False)
            ),
            # Tiempo hasta tratamiento
            avg_time_to_treatment=Avg(
                F('treatment_start_time') - F('arrival_time'),
                output_field=models.DurationField(),
                filter=Q(treatment_start_time__isnull=False)
            ),
            # Duración total en emergencias
            avg_total_duration=Avg(
                F('discharge_time') - F('arrival_time'),
                output_field=models.DurationField(),
                filter=Q(discharge_time__isnull=False)
            )
        )
        
        # Tiempos de respuesta por prioridad
        response_by_priority = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date],
            treatment_start_time__isnull=False
        ).values('priority').annotate(
            avg_response_time=Avg(
                F('treatment_start_time') - F('arrival_time'),
                output_field=models.DurationField()
            ),
            cases_count=Count('id')
        ).order_by('priority')
        
        # Cumplimiento de estándares de tiempo
        standards_compliance = {
            'critical': {
                'target_minutes': 5,
                'cases_meeting_target': EmergencyCase.objects.filter(
                    arrival_time__date__range=[start_date, end_date],
                    priority='critical',
                    treatment_start_time__isnull=False
                ).annotate(
                    response_minutes=Extract(
                        F('treatment_start_time') - F('arrival_time'),
                        'epoch'
                    ) / 60
                ).filter(response_minutes__lte=5).count(),
                'total_cases': EmergencyCase.objects.filter(
                    arrival_time__date__range=[start_date, end_date],
                    priority='critical'
                ).count()
            },
            'urgent': {
                'target_minutes': 15,
                'cases_meeting_target': EmergencyCase.objects.filter(
                    arrival_time__date__range=[start_date, end_date],
                    priority='urgent',
                    treatment_start_time__isnull=False
                ).annotate(
                    response_minutes=Extract(
                        F('treatment_start_time') - F('arrival_time'),
                        'epoch'
                    ) / 60
                ).filter(response_minutes__lte=15).count(),
                'total_cases': EmergencyCase.objects.filter(
                    arrival_time__date__range=[start_date, end_date],
                    priority='urgent'
                ).count()
            }
        }
        
        # Calcular porcentajes de cumplimiento
        for priority, data in standards_compliance.items():
            if data['total_cases'] > 0:
                data['compliance_percentage'] = (
                    data['cases_meeting_target'] / data['total_cases'] * 100
                )
            else:
                data['compliance_percentage'] = 0
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'response_metrics': response_metrics,
            'response_by_priority': list(response_by_priority),
            'standards_compliance': standards_compliance
        })
    
    @action(detail=False, methods=['get'])
    def peak_hours_analysis(self, request):
        """Análisis de horas pico en emergencias"""
        start_date, end_date = self.get_date_range(request)
        
        # Casos por hora del día
        cases_by_hour = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).annotate(
            hour=ExtractHour('arrival_time')
        ).values('hour').annotate(
            cases_count=Count('id'),
            avg_wait_time=Avg(
                F('triage_time') - F('arrival_time'),
                output_field=models.DurationField()
            )
        ).order_by('hour')
        
        # Casos por día de la semana
        cases_by_weekday = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).annotate(
            weekday=ExtractWeekDay('arrival_time')
        ).values('weekday').annotate(
            cases_count=Count('id'),
            critical_cases=Count('id', filter=Q(priority='critical'))
        ).order_by('weekday')
        
        # Identificar horas pico (top 5 horas con más casos)
        peak_hours = list(cases_by_hour.order_by('-cases_count')[:5])
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'cases_by_hour': list(cases_by_hour),
            'cases_by_weekday': list(cases_by_weekday),
            'peak_hours': peak_hours
        })
    
    @action(detail=False, methods=['get'])
    def treatment_analysis(self, request):
        """Análisis de tratamientos en emergencias"""
        start_date, end_date = self.get_date_range(request)
        
        # Tratamientos más comunes
        common_treatments = EmergencyTreatment.objects.filter(
            start_time__date__range=[start_date, end_date]
        ).values('treatment_type').annotate(
            count=Count('id'),
            avg_duration=Avg(
                F('end_time') - F('start_time'),
                output_field=models.DurationField()
            )
        ).order_by('-count')[:10]
        
        # Medicamentos más utilizados en emergencias
        emergency_medications = EmergencyTreatment.objects.filter(
            start_time__date__range=[start_date, end_date],
            medications_given__isnull=False
        ).values('medications_given').annotate(
            usage_count=Count('id')
        ).order_by('-usage_count')[:10]
        
        # Doctores con más casos atendidos
        doctor_caseload = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date],
            attending_doctor__isnull=False
        ).values(
            'attending_doctor__first_name',
            'attending_doctor__last_name',
            'attending_doctor__id'
        ).annotate(
            cases_handled=Count('id'),
            critical_cases=Count('id', filter=Q(priority='critical')),
            avg_treatment_time=Avg(
                F('discharge_time') - F('treatment_start_time'),
                output_field=models.DurationField(),
                filter=Q(discharge_time__isnull=False)
            )
        ).order_by('-cases_handled')[:10]
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'common_treatments': list(common_treatments),
            'emergency_medications': list(emergency_medications),
            'doctor_caseload': list(doctor_caseload)
        })
    
    @action(detail=False, methods=['get'])
    def outcome_analysis(self, request):
        """Análisis de resultados de casos de emergencia"""
        start_date, end_date = self.get_date_range(request)
        
        # Distribución de resultados
        outcomes_distribution = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date],
            status__in=['discharged', 'admitted', 'transferred', 'deceased']
        ).values('status').annotate(
            count=Count('id'),
            percentage=Count('id') * 100.0 / Count('id', filter=Q())
        )
        
        # Resultados por prioridad inicial
        outcomes_by_priority = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date],
            status__in=['discharged', 'admitted', 'transferred', 'deceased']
        ).values('priority', 'status').annotate(
            count=Count('id')
        ).order_by('priority', 'status')
        
        # Tasa de admisión por categoría de triaje
        admission_rate = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).values('priority').annotate(
            total_cases=Count('id'),
            admitted_cases=Count('id', filter=Q(status='admitted')),
            admission_rate=Count('id', filter=Q(status='admitted')) * 100.0 / Count('id')
        )
        
        # Casos que requirieron traslado
        transfer_analysis = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date],
            status='transferred'
        ).values('transfer_reason').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'outcomes_distribution': list(outcomes_distribution),
            'outcomes_by_priority': list(outcomes_by_priority),
            'admission_rate': list(admission_rate),
            'transfer_analysis': list(transfer_analysis)
        })
    
    @action(detail=False, methods=['get'])
    def resource_utilization(self, request):
        """Análisis de utilización de recursos en emergencias"""
        start_date, end_date = self.get_date_range(request)
        
        # Ocupación de camas por día
        daily_occupancy = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).annotate(
            date=TruncDate('arrival_time')
        ).values('date').annotate(
            cases_count=Count('id'),
            avg_stay_duration=Avg(
                F('discharge_time') - F('arrival_time'),
                output_field=models.DurationField(),
                filter=Q(discharge_time__isnull=False)
            )
        ).order_by('date')
        
        # Utilización de personal médico
        staff_utilization = {
            'doctors': User.objects.filter(
                role='doctor',
                emergency_cases_attending__arrival_time__date__range=[start_date, end_date]
            ).annotate(
                cases_handled=Count('emergency_cases_attending'),
                avg_case_duration=Avg(
                    F('emergency_cases_attending__discharge_time') - 
                    F('emergency_cases_attending__treatment_start_time'),
                    output_field=models.DurationField()
                )
            ).count(),
            'nurses': User.objects.filter(
                role='nurse',
                triage_assessments__assessment_time__date__range=[start_date, end_date]
            ).annotate(
                assessments_done=Count('triage_assessments')
            ).count()
        }
        
        # Utilización de recursos por turno
        shift_analysis = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).annotate(
            hour=ExtractHour('arrival_time')
        ).annotate(
            shift=Case(
                When(hour__gte=7, hour__lt=15, then=Value('morning')),
                When(hour__gte=15, hour__lt=23, then=Value('evening')),
                default=Value('night'),
                output_field=models.CharField()
            )
        ).values('shift').annotate(
            cases_count=Count('id'),
            critical_cases=Count('id', filter=Q(priority='critical'))
        )
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'daily_occupancy': list(daily_occupancy),
            'staff_utilization': staff_utilization,
            'shift_analysis': list(shift_analysis)
        })
    
    @action(detail=False, methods=['get'])
    def trends_analysis(self, request):
        """Análisis de tendencias en emergencias"""
        start_date, end_date = self.get_date_range(request)
        
        # Tendencia diaria de casos
        daily_trends = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).annotate(
            date=TruncDate('arrival_time')
        ).values('date').annotate(
            total_cases=Count('id'),
            critical_cases=Count('id', filter=Q(priority='critical')),
            urgent_cases=Count('id', filter=Q(priority='urgent')),
            standard_cases=Count('id', filter=Q(priority='standard'))
        ).order_by('date')
        
        # Comparación con período anterior
        previous_start = start_date - (end_date - start_date)
        previous_end = start_date - timedelta(days=1)
        
        current_period_stats = EmergencyCase.objects.filter(
            arrival_time__date__range=[start_date, end_date]
        ).aggregate(
            total_cases=Count('id'),
            avg_daily_cases=Count('id') / ((end_date - start_date).days + 1),
            critical_rate=Count('id', filter=Q(priority='critical')) * 100.0 / Count('id')
        )
        
        previous_period_stats = EmergencyCase.objects.filter(
            arrival_time__date__range=[previous_start, previous_end]
        ).aggregate(
            total_cases=Count('id'),
            avg_daily_cases=Count('id') / ((previous_end - previous_start).days + 1),
            critical_rate=Count('id', filter=Q(priority='critical')) * 100.0 / Count('id')
        )
        
        # Calcular cambios porcentuales
        comparison = {}
        for key in ['total_cases', 'avg_daily_cases', 'critical_rate']:
            if previous_period_stats[key] and previous_period_stats[key] > 0:
                change = ((current_period_stats[key] - previous_period_stats[key]) / 
                         previous_period_stats[key] * 100)
                comparison[f'{key}_change'] = round(change, 2)
            else:
                comparison[f'{key}_change'] = None
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'daily_trends': list(daily_trends),
            'current_period': current_period_stats,
            'previous_period': previous_period_stats,
            'comparison': comparison
        })
    
    @action(detail=False, methods=['post'])
    def generate_emergency_report(self, request):
        """Generar reporte completo de emergencias"""
        serializer_data = {
            'report_type': 'emergency',
            'format': request.data.get('format', 'pdf'),
            'parameters': request.data.get('parameters', {}),
            'start_date': request.data.get('start_date'),
            'end_date': request.data.get('end_date')
        }
        
        # Usar el generador de reportes existente
        from .views import GeneratedReportViewSet
        viewset = GeneratedReportViewSet()
        viewset.request = request
        
        # Simular request.data
        request._full_data = serializer_data
        
        return viewset.generate(request)
