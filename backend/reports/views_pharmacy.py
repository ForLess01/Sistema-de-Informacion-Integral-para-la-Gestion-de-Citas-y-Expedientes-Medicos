"""
Vistas para reportes de medicamentos y farmacia
"""
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework import views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from pharmacy.models import Medication, Prescription, Inventory, InventoryMovement
from authentication.permissions import IsAdmin, IsPharmacist, IsDoctor


class MedicationUsageReportView(views.APIView):
    """Vista para reportes de uso de medicamentos"""
    permission_classes = [IsAuthenticated, IsAdmin | IsPharmacist | IsDoctor]
    
    @extend_schema(
        summary="Obtener reporte de medicamentos más prescritos",
        description="Obtiene estadísticas sobre los medicamentos más prescritos y su uso"
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        top_n = int(request.query_params.get('top_n', 20))
        
        if not end_date:
            end_date = timezone.now().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
        if not start_date:
            start_date = end_date - timedelta(days=90)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        # Medicamentos más prescritos
        prescriptions = Prescription.objects.filter(
            created_at__date__range=[start_date, end_date]
        )
        
        # Top medicamentos por cantidad de prescripciones
        top_medications = prescriptions.values(
            'medication__id',
            'medication__name',
            'medication__generic_name',
            'medication__presentation',
            'medication__category'
        ).annotate(
            prescription_count=Count('id'),
            total_quantity=Sum('quantity'),
            unique_patients=Count('patient', distinct=True),
            unique_doctors=Count('doctor', distinct=True)
        ).order_by('-prescription_count')[:top_n]
        
        # Categorías más prescritas
        category_stats = prescriptions.values(
            'medication__category'
        ).annotate(
            count=Count('id'),
            total_quantity=Sum('quantity')
        ).order_by('-count')
        
        # Tendencia mensual de prescripciones
        monthly_trend = []
        current_date = start_date
        
        while current_date <= end_date:
            month_start = current_date.replace(day=1)
            if current_date.month == 12:
                month_end = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = current_date.replace(month=current_date.month + 1, day=1) - timedelta(days=1)
            
            month_prescriptions = prescriptions.filter(
                created_at__date__range=[month_start, month_end]
            )
            
            monthly_trend.append({
                'month': month_start.strftime('%Y-%m'),
                'prescription_count': month_prescriptions.count(),
                'unique_medications': month_prescriptions.values('medication').distinct().count()
            })
            
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Estadísticas generales
        total_prescriptions = prescriptions.count()
        unique_medications = prescriptions.values('medication').distinct().count()
        unique_patients = prescriptions.values('patient').distinct().count()
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'summary': {
                'total_prescriptions': total_prescriptions,
                'unique_medications': unique_medications,
                'unique_patients': unique_patients,
                'average_prescriptions_per_day': round(
                    total_prescriptions / ((end_date - start_date).days + 1), 2
                )
            },
            'top_medications': list(top_medications),
            'category_distribution': list(category_stats),
            'monthly_trend': monthly_trend
        })


class InventoryStatusReportView(views.APIView):
    """Vista para reportes de estado del inventario"""
    permission_classes = [IsAuthenticated, IsAdmin | IsPharmacist]
    
    @extend_schema(
        summary="Obtener reporte de estado del inventario",
        description="Obtiene información sobre el estado actual del inventario de medicamentos"
    )
    def get(self, request):
        # Obtener inventario actual
        inventory_items = Inventory.objects.select_related('medication').all()
        
        # Estadísticas generales
        total_items = inventory_items.count()
        total_value = sum(
            item.quantity * item.unit_price for item in inventory_items
        )
        
        # Medicamentos con stock bajo
        low_stock_items = inventory_items.filter(
            quantity__lte=F('minimum_stock')
        ).values(
            'medication__name',
            'medication__generic_name',
            'quantity',
            'minimum_stock',
            'maximum_stock'
        ).order_by('quantity')
        
        # Medicamentos sin stock
        out_of_stock = inventory_items.filter(quantity=0).count()
        
        # Medicamentos próximos a vencer (30 días)
        expiring_soon = inventory_items.filter(
            expiration_date__lte=timezone.now().date() + timedelta(days=30),
            expiration_date__gt=timezone.now().date()
        ).values(
            'medication__name',
            'lot_number',
            'quantity',
            'expiration_date'
        ).order_by('expiration_date')
        
        # Medicamentos vencidos
        expired_items = inventory_items.filter(
            expiration_date__lt=timezone.now().date()
        ).values(
            'medication__name',
            'lot_number',
            'quantity',
            'expiration_date'
        )
        
        # Distribución por categoría
        category_distribution = inventory_items.values(
            'medication__category'
        ).annotate(
            count=Count('id'),
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('unit_price'))
        ).order_by('-total_value')
        
        # Movimientos recientes (últimos 7 días)
        recent_movements = InventoryMovement.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).values(
            'movement_type'
        ).annotate(
            count=Count('id'),
            total_quantity=Sum('quantity')
        )
        
        return Response({
            'timestamp': timezone.now(),
            'summary': {
                'total_items': total_items,
                'total_value': float(total_value),
                'low_stock_count': len(low_stock_items),
                'out_of_stock_count': out_of_stock,
                'expiring_soon_count': len(expiring_soon),
                'expired_count': len(expired_items)
            },
            'alerts': {
                'low_stock_items': list(low_stock_items)[:10],
                'expiring_soon': list(expiring_soon)[:10],
                'expired_items': list(expired_items)
            },
            'category_distribution': list(category_distribution),
            'recent_movements': list(recent_movements)
        })


class PharmacyFinancialReportView(views.APIView):
    """Vista para reportes financieros de farmacia"""
    permission_classes = [IsAuthenticated, IsAdmin | IsPharmacist]
    
    @extend_schema(
        summary="Obtener reporte financiero de farmacia",
        description="Obtiene métricas financieras relacionadas con la farmacia"
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
        
        # Movimientos de inventario en el período
        movements = InventoryMovement.objects.filter(
            created_at__date__range=[start_date, end_date]
        )
        
        # Cálculo de costos y ventas
        purchases = movements.filter(movement_type='purchase').aggregate(
            total_cost=Sum(F('quantity') * F('unit_price')),
            total_units=Sum('quantity')
        )
        
        dispensed = movements.filter(movement_type='dispensed').aggregate(
            total_value=Sum(F('quantity') * F('unit_price')),
            total_units=Sum('quantity')
        )
        
        # Medicamentos más costosos
        expensive_meds = movements.filter(
            movement_type='purchase'
        ).values(
            'medication__name',
            'medication__generic_name'
        ).annotate(
            total_cost=Sum(F('quantity') * F('unit_price')),
            total_quantity=Sum('quantity'),
            avg_unit_price=Avg('unit_price')
        ).order_by('-total_cost')[:10]
        
        # Tendencia diaria de movimientos
        daily_trend = []
        current_date = start_date
        
        while current_date <= end_date:
            day_movements = movements.filter(created_at__date=current_date)
            
            daily_trend.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'purchases': day_movements.filter(movement_type='purchase').aggregate(
                    Sum('quantity'))['quantity__sum'] or 0,
                'dispensed': day_movements.filter(movement_type='dispensed').aggregate(
                    Sum('quantity'))['quantity__sum'] or 0,
                'adjustments': day_movements.filter(movement_type='adjustment').aggregate(
                    Sum('quantity'))['quantity__sum'] or 0
            })
            
            current_date += timedelta(days=1)
        
        # Proyección de agotamiento de stock
        # (medicamentos que se agotarán en los próximos días basado en el consumo promedio)
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'financial_summary': {
                'total_purchase_cost': float(purchases['total_cost'] or 0),
                'total_purchase_units': purchases['total_units'] or 0,
                'total_dispensed_value': float(dispensed['total_value'] or 0),
                'total_dispensed_units': dispensed['total_units'] or 0
            },
            'expensive_medications': list(expensive_meds),
            'daily_trend': daily_trend
        })


class MedicationPrescriptionPatternsView(views.APIView):
    """Vista para análisis de patrones de prescripción"""
    permission_classes = [IsAuthenticated, IsAdmin | IsDoctor]
    
    @extend_schema(
        summary="Obtener patrones de prescripción",
        description="Analiza patrones de prescripción por doctor y especialidad"
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not end_date:
            end_date = timezone.now().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
        if not start_date:
            start_date = end_date - timedelta(days=90)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        prescriptions = Prescription.objects.filter(
            created_at__date__range=[start_date, end_date]
        )
        
        # Patrones por especialidad
        specialty_patterns = prescriptions.values(
            'doctor__doctor_profile__specialty__name',
            'medication__category'
        ).annotate(
            count=Count('id'),
            avg_quantity=Avg('quantity')
        ).order_by('doctor__doctor_profile__specialty__name', '-count')
        
        # Top prescriptores
        top_prescribers = prescriptions.values(
            'doctor__first_name',
            'doctor__last_name',
            'doctor__doctor_profile__specialty__name'
        ).annotate(
            prescription_count=Count('id'),
            unique_medications=Count('medication', distinct=True),
            unique_patients=Count('patient', distinct=True)
        ).order_by('-prescription_count')[:20]
        
        # Combinaciones frecuentes de medicamentos
        # (pacientes con múltiples prescripciones el mismo día)
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'specialty_patterns': list(specialty_patterns),
            'top_prescribers': list(top_prescribers)
        })
