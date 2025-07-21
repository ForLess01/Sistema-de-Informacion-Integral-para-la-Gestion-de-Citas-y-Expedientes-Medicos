"""
Vistas para reportes de ocupación hospitalaria
"""
from django.db.models import Count, Q, Avg, Sum, F
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework import views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from emergency.models import EmergencyRoom, EmergencyAdmission
from medical_records.models import MedicalRecord, Hospitalization
from authentication.permissions import IsAdmin, IsDoctor, IsNurse


class HospitalOccupancyView(views.APIView):
    """Vista para reportes de ocupación hospitalaria"""
    permission_classes = [IsAuthenticated, IsAdmin | IsDoctor | IsNurse]
    
    @extend_schema(
        summary="Obtener estadísticas de ocupación hospitalaria",
        description="Obtiene métricas de ocupación de camas y recursos hospitalarios"
    )
    def get(self, request):
        # Obtener fecha actual
        current_date = timezone.now()
        
        # Estadísticas de emergencia
        emergency_rooms = EmergencyRoom.objects.all()
        emergency_stats = []
        
        for room in emergency_rooms:
            active_admissions = EmergencyAdmission.objects.filter(
                room=room,
                status__in=['waiting', 'in_attention']
            ).count()
            
            occupancy_rate = (active_admissions / room.capacity * 100) if room.capacity > 0 else 0
            
            emergency_stats.append({
                'room': {
                    'id': room.id,
                    'name': room.name,
                    'room_type': room.room_type,
                    'capacity': room.capacity
                },
                'current_occupancy': active_admissions,
                'occupancy_rate': round(occupancy_rate, 2),
                'available_beds': room.capacity - active_admissions
            })
        
        # Estadísticas de hospitalización
        active_hospitalizations = Hospitalization.objects.filter(
            is_active=True
        )
        
        total_beds = 200  # Este valor debería venir de la configuración del hospital
        occupied_beds = active_hospitalizations.count()
        available_beds = total_beds - occupied_beds
        hospital_occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
        
        # Estadísticas por departamento/área
        department_stats = active_hospitalizations.values(
            'ward'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Promedio de días de estancia
        avg_stay = active_hospitalizations.aggregate(
            avg_days=Avg(
                (current_date - F('admission_date')).days
            )
        )['avg_days'] or 0
        
        # Tendencia de ocupación (últimos 7 días)
        occupancy_trend = []
        for i in range(7):
            date = current_date - timedelta(days=i)
            day_hospitalizations = Hospitalization.objects.filter(
                admission_date__lte=date
            ).filter(
                Q(discharge_date__gte=date) | Q(discharge_date__isnull=True)
            ).count()
            
            occupancy_trend.append({
                'date': date.strftime('%Y-%m-%d'),
                'occupied_beds': day_hospitalizations,
                'occupancy_rate': round((day_hospitalizations / total_beds * 100), 2)
            })
        
        occupancy_trend.reverse()
        
        return Response({
            'timestamp': current_date,
            'hospital_occupancy': {
                'total_beds': total_beds,
                'occupied_beds': occupied_beds,
                'available_beds': available_beds,
                'occupancy_rate': round(hospital_occupancy_rate, 2),
                'average_stay_days': round(avg_stay, 1)
            },
            'emergency_occupancy': {
                'rooms': emergency_stats,
                'total_capacity': sum(room['room']['capacity'] for room in emergency_stats),
                'total_occupied': sum(room['current_occupancy'] for room in emergency_stats),
                'average_occupancy_rate': round(
                    sum(room['occupancy_rate'] for room in emergency_stats) / len(emergency_stats), 2
                ) if emergency_stats else 0
            },
            'department_distribution': department_stats,
            'occupancy_trend': occupancy_trend
        })


class BedManagementReportView(views.APIView):
    """Vista para reportes de gestión de camas"""
    permission_classes = [IsAuthenticated, IsAdmin | IsNurse]
    
    @extend_schema(
        summary="Obtener reporte de gestión de camas",
        description="Obtiene información detallada sobre la gestión y rotación de camas"
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not end_date:
            end_date = timezone.now().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
        if not start_date:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        # Obtener hospitalizaciones en el período
        hospitalizations = Hospitalization.objects.filter(
            Q(admission_date__range=[start_date, end_date]) |
            Q(discharge_date__range=[start_date, end_date])
        )
        
        # Calcular métricas
        total_admissions = hospitalizations.filter(
            admission_date__range=[start_date, end_date]
        ).count()
        
        total_discharges = hospitalizations.filter(
            discharge_date__range=[start_date, end_date]
        ).count()
        
        # Tiempo promedio de estancia
        completed_stays = hospitalizations.filter(
            discharge_date__isnull=False
        )
        
        if completed_stays.exists():
            avg_length_of_stay = completed_stays.aggregate(
                avg_days=Avg(
                    (F('discharge_date') - F('admission_date')).days
                )
            )['avg_days']
        else:
            avg_length_of_stay = 0
        
        # Tasa de rotación de camas
        total_beds = 200  # Configuración del hospital
        days_in_period = (end_date - start_date).days + 1
        bed_turnover_rate = (total_discharges / (total_beds * days_in_period / 30)) if total_beds > 0 else 0
        
        # Distribución por tipo de alta
        discharge_types = hospitalizations.filter(
            discharge_date__range=[start_date, end_date]
        ).values('discharge_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Readmisiones (pacientes readmitidos dentro de 30 días)
        readmissions = 0
        for hosp in completed_stays:
            if Hospitalization.objects.filter(
                patient=hosp.patient,
                admission_date__gt=hosp.discharge_date,
                admission_date__lte=hosp.discharge_date + timedelta(days=30)
            ).exists():
                readmissions += 1
        
        readmission_rate = (readmissions / total_discharges * 100) if total_discharges > 0 else 0
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'days': days_in_period
            },
            'bed_metrics': {
                'total_beds': total_beds,
                'total_admissions': total_admissions,
                'total_discharges': total_discharges,
                'average_length_of_stay': round(avg_length_of_stay, 1),
                'bed_turnover_rate': round(bed_turnover_rate, 2),
                'readmission_rate': round(readmission_rate, 2),
                'readmissions': readmissions
            },
            'discharge_distribution': discharge_types,
            'efficiency_indicators': {
                'bed_occupancy_days': total_beds * days_in_period,
                'patient_days': hospitalizations.filter(
                    admission_date__lte=end_date
                ).filter(
                    Q(discharge_date__gte=start_date) | Q(discharge_date__isnull=True)
                ).count() * avg_length_of_stay if avg_length_of_stay > 0 else 0,
                'average_daily_admissions': round(total_admissions / days_in_period, 2),
                'average_daily_discharges': round(total_discharges / days_in_period, 2)
            }
        })


class ResourceUtilizationView(views.APIView):
    """Vista para reportes de utilización de recursos"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @extend_schema(
        summary="Obtener reporte de utilización de recursos",
        description="Obtiene métricas sobre la utilización de recursos hospitalarios"
    )
    def get(self, request):
        # Período de análisis (último mes)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # Utilización de salas de emergencia
        emergency_utilization = []
        emergency_rooms = EmergencyRoom.objects.all()
        
        for room in emergency_rooms:
            admissions = EmergencyAdmission.objects.filter(
                room=room,
                admission_date__range=[start_date, end_date]
            )
            
            total_patients = admissions.count()
            avg_wait_time = admissions.aggregate(
                avg_wait=Avg(
                    (F('attention_start_time') - F('admission_date')).seconds / 60
                )
            )['avg_wait'] or 0
            
            # Distribución por nivel de triaje
            triage_distribution = admissions.values('triage_level').annotate(
                count=Count('id')
            ).order_by('triage_level')
            
            emergency_utilization.append({
                'room': {
                    'id': room.id,
                    'name': room.name,
                    'type': room.room_type
                },
                'metrics': {
                    'total_patients': total_patients,
                    'average_wait_time_minutes': round(avg_wait_time, 2),
                    'patients_per_day': round(total_patients / 30, 2),
                    'triage_distribution': list(triage_distribution)
                }
            })
        
        # Utilización por especialidad
        from appointments.models import Appointment
        specialty_utilization = Appointment.objects.filter(
            date__range=[start_date, end_date]
        ).values(
            'doctor__specialty__name'
        ).annotate(
            total_appointments=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            utilization_rate=Count('id', filter=Q(status='completed')) * 100.0 / Count('id')
        ).order_by('-total_appointments')
        
        # Horas pico de utilización
        hourly_distribution = EmergencyAdmission.objects.filter(
            admission_date__range=[start_date, end_date]
        ).extra(
            select={'hour': 'EXTRACT(hour FROM admission_date)'}
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'emergency_utilization': emergency_utilization,
            'specialty_utilization': list(specialty_utilization),
            'hourly_distribution': list(hourly_distribution),
            'summary': {
                'total_emergency_patients': sum(
                    room['metrics']['total_patients'] for room in emergency_utilization
                ),
                'average_emergency_wait_time': round(
                    sum(room['metrics']['average_wait_time_minutes'] for room in emergency_utilization) / 
                    len(emergency_utilization), 2
                ) if emergency_utilization else 0,
                'busiest_hours': self._get_busiest_hours(hourly_distribution)
            }
        })
    
    def _get_busiest_hours(self, hourly_distribution):
        """Obtener las 3 horas más ocupadas"""
        sorted_hours = sorted(hourly_distribution, key=lambda x: x['count'], reverse=True)[:3]
        return [{'hour': h['hour'], 'patient_count': h['count']} for h in sorted_hours]
