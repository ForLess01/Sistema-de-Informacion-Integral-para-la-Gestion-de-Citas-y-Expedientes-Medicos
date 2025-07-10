"""
Vistas específicas para reportes de citas médicas
"""
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from datetime import timedelta
from rest_framework import views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from appointments.models import Appointment
from authentication.models import User
from authentication.permissions import IsAdmin, IsDoctor


class AppointmentStatisticsView(views.APIView):
    """Vista para estadísticas de citas"""
    permission_classes = [IsAuthenticated, IsAdmin | IsDoctor]
    
    @extend_schema(
        summary="Obtener estadísticas de citas",
        description="Obtiene estadísticas detalladas de citas por período",
        parameters=[
            {
                'name': 'period',
                'in': 'query',
                'description': 'Período de tiempo (daily, weekly, monthly, yearly)',
                'schema': {'type': 'string', 'enum': ['daily', 'weekly', 'monthly', 'yearly']}
            },
            {
                'name': 'start_date',
                'in': 'query',
                'description': 'Fecha de inicio (YYYY-MM-DD)',
                'schema': {'type': 'string', 'format': 'date'}
            },
            {
                'name': 'end_date',
                'in': 'query',
                'description': 'Fecha de fin (YYYY-MM-DD)',
                'schema': {'type': 'string', 'format': 'date'}
            }
        ]
    )
    def get(self, request):
        period = request.query_params.get('period', 'monthly')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Configurar fechas por defecto
        if not end_date:
            end_date = timezone.now().date()
        else:
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            
        if not start_date:
            if period == 'daily':
                start_date = end_date - timedelta(days=30)
            elif period == 'weekly':
                start_date = end_date - timedelta(weeks=12)
            elif period == 'monthly':
                start_date = end_date - timedelta(days=365)
            else:  # yearly
                start_date = end_date - timedelta(days=365*5)
        else:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
        
        # Obtener estadísticas generales
        appointments = Appointment.objects.filter(
            date__range=[start_date, end_date]
        )
        
        total_appointments = appointments.count()
        
        # Estadísticas por estado
        status_stats = appointments.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Estadísticas por especialidad
        specialty_stats = appointments.values(
            'doctor__specialty__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Estadísticas por doctor
        doctor_stats = appointments.values(
            'doctor__user__first_name',
            'doctor__user__last_name',
            'doctor__specialty__name'
        ).annotate(
            count=Count('id'),
            avg_duration=Avg(F('end_time') - F('start_time'))
        ).order_by('-count')[:10]
        
        # Tasa de cancelación
        cancelled_count = appointments.filter(status='cancelled').count()
        cancellation_rate = (cancelled_count / total_appointments * 100) if total_appointments > 0 else 0
        
        # Tasa de no-show
        no_show_count = appointments.filter(status='no_show').count()
        no_show_rate = (no_show_count / total_appointments * 100) if total_appointments > 0 else 0
        
        # Tiempo promedio de espera (solo citas completadas)
        completed_appointments = appointments.filter(status='completed')
        
        return Response({
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'summary': {
                'total_appointments': total_appointments,
                'completed': completed_appointments.count(),
                'cancelled': cancelled_count,
                'no_show': no_show_count,
                'cancellation_rate': round(cancellation_rate, 2),
                'no_show_rate': round(no_show_rate, 2)
            },
            'by_status': status_stats,
            'by_specialty': specialty_stats,
            'by_doctor': doctor_stats
        })


class AppointmentTrendsView(views.APIView):
    """Vista para tendencias de citas"""
    permission_classes = [IsAuthenticated, IsAdmin | IsDoctor]
    
    @extend_schema(
        summary="Obtener tendencias de citas",
        description="Obtiene tendencias de citas a lo largo del tiempo"
    )
    def get(self, request):
        # Obtener datos de los últimos 12 meses
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365)
        
        appointments = Appointment.objects.filter(
            date__range=[start_date, end_date]
        )
        
        # Agrupar por mes
        monthly_trends = []
        current_date = start_date
        
        while current_date <= end_date:
            month_start = current_date.replace(day=1)
            if current_date.month == 12:
                month_end = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = current_date.replace(month=current_date.month + 1, day=1) - timedelta(days=1)
            
            month_appointments = appointments.filter(
                date__range=[month_start, month_end]
            )
            
            monthly_trends.append({
                'month': month_start.strftime('%Y-%m'),
                'total': month_appointments.count(),
                'completed': month_appointments.filter(status='completed').count(),
                'cancelled': month_appointments.filter(status='cancelled').count(),
                'no_show': month_appointments.filter(status='no_show').count()
            })
            
            # Avanzar al siguiente mes
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Calcular promedios
        total_months = len(monthly_trends)
        if total_months > 0:
            avg_monthly = sum(m['total'] for m in monthly_trends) / total_months
            avg_completed = sum(m['completed'] for m in monthly_trends) / total_months
            avg_cancelled = sum(m['cancelled'] for m in monthly_trends) / total_months
        else:
            avg_monthly = avg_completed = avg_cancelled = 0
        
        return Response({
            'trends': monthly_trends,
            'averages': {
                'monthly_appointments': round(avg_monthly, 2),
                'monthly_completed': round(avg_completed, 2),
                'monthly_cancelled': round(avg_cancelled, 2)
            },
            'period': {
                'start_date': start_date,
                'end_date': end_date
            }
        })


class DoctorPerformanceReportView(views.APIView):
    """Vista para reportes de desempeño de doctores"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @extend_schema(
        summary="Obtener reporte de desempeño de doctores",
        description="Obtiene métricas de desempeño para todos los doctores"
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not end_date:
            end_date = timezone.now().date()
        else:
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            
        if not start_date:
            start_date = end_date - timedelta(days=90)  # Últimos 3 meses
        else:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
        
        # Obtener todos los doctores
        doctors = User.objects.filter(role='doctor', is_active=True)
        
        performance_data = []
        
        for doctor in doctors:
            doctor_appointments = Appointment.objects.filter(
                doctor=doctor.doctor_profile,
                date__range=[start_date, end_date]
            )
            
            total = doctor_appointments.count()
            completed = doctor_appointments.filter(status='completed').count()
            cancelled = doctor_appointments.filter(status='cancelled').count()
            no_show = doctor_appointments.filter(status='no_show').count()
            
            # Calcular tasa de completitud
            completion_rate = (completed / total * 100) if total > 0 else 0
            
            # Calcular pacientes únicos
            unique_patients = doctor_appointments.values('patient').distinct().count()
            
            performance_data.append({
                'doctor': {
                    'id': doctor.id,
                    'name': f"{doctor.first_name} {doctor.last_name}",
                    'specialty': doctor.doctor_profile.specialty.name if doctor.doctor_profile.specialty else 'N/A'
                },
                'metrics': {
                    'total_appointments': total,
                    'completed': completed,
                    'cancelled': cancelled,
                    'no_show': no_show,
                    'completion_rate': round(completion_rate, 2),
                    'unique_patients': unique_patients
                }
            })
        
        # Ordenar por total de citas
        performance_data.sort(key=lambda x: x['metrics']['total_appointments'], reverse=True)
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'doctor_performance': performance_data,
            'summary': {
                'total_doctors': len(performance_data),
                'total_appointments': sum(d['metrics']['total_appointments'] for d in performance_data),
                'average_completion_rate': round(
                    sum(d['metrics']['completion_rate'] for d in performance_data) / len(performance_data), 2
                ) if performance_data else 0
            }
        })
