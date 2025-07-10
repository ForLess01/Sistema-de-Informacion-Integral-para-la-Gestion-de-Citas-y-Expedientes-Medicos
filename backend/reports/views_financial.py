from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from appointments.models import Appointment
from medical_records.models import Prescription, MedicalExam
from pharmacy.models import Sale, SaleItem, Medication
from authentication.models import User
from .generators import FinancialReportGenerator
from .cache import CachedReportMixin
from .swagger_docs import (
    financial_revenue_summary_docs, financial_revenue_by_specialty_docs,
    financial_pharmacy_analysis_docs
)

logger = logging.getLogger(__name__)


class FinancialReportViewSet(CachedReportMixin, viewsets.ViewSet):
    """ViewSet para reportes financieros del sistema"""
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
    
    @financial_revenue_summary_docs
    @action(detail=False, methods=['get'])
    def revenue_summary(self, request):
        """Resumen de ingresos por diferentes conceptos"""
        # Intentar obtener del caché
        cached_data = self.get_cached_response(request, 'financial_revenue_summary')
        if cached_data:
            return Response(cached_data)
        
        start_date, end_date = self.get_date_range(request)
        
        # Ingresos por consultas
        appointment_revenue = Appointment.objects.filter(
            appointment_date__range=[start_date, end_date],
            status='completed',
            payment_status='paid'
        ).aggregate(
            total=Sum('consultation_fee'),
            count=Count('id'),
            average=Avg('consultation_fee')
        )
        
        # Ingresos por ventas de farmacia
        pharmacy_revenue = Sale.objects.filter(
            sale_date__range=[start_date, end_date],
            status='completed'
        ).aggregate(
            total=Sum('total'),
            count=Count('id'),
            average=Avg('total')
        )
        
        # Ingresos por exámenes médicos
        exam_revenue = MedicalExam.objects.filter(
            created_at__date__range=[start_date, end_date],
            status='completed',
            payment_status='paid'
        ).aggregate(
            total=Sum('cost'),
            count=Count('id'),
            average=Avg('cost')
        )
        
        # Total general
        total_revenue = Decimal('0')
        if appointment_revenue['total']:
            total_revenue += appointment_revenue['total']
        if pharmacy_revenue['total']:
            total_revenue += pharmacy_revenue['total']
        if exam_revenue['total']:
            total_revenue += exam_revenue['total']
        
        response_data = {
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'appointments': {
                'total': appointment_revenue['total'] or 0,
                'count': appointment_revenue['count'] or 0,
                'average': float(appointment_revenue['average'] or 0)
            },
            'pharmacy': {
                'total': pharmacy_revenue['total'] or 0,
                'count': pharmacy_revenue['count'] or 0,
                'average': float(pharmacy_revenue['average'] or 0)
            },
            'exams': {
                'total': exam_revenue['total'] or 0,
                'count': exam_revenue['count'] or 0,
                'average': float(exam_revenue['average'] or 0)
            },
            'total_revenue': float(total_revenue)
        }
        
        # Guardar en caché
        self.cache_response(request, 'financial_revenue_summary', response_data)
        
        return Response(response_data)
    
    @financial_revenue_by_specialty_docs
    @action(detail=False, methods=['get'])
    def revenue_by_specialty(self, request):
        """Ingresos agrupados por especialidad médica"""
        start_date, end_date = self.get_date_range(request)
        
        revenue_data = Appointment.objects.filter(
            appointment_date__range=[start_date, end_date],
            status='completed',
            payment_status='paid'
        ).values(
            'doctor__specialties__name'
        ).annotate(
            total_revenue=Sum('consultation_fee'),
            appointment_count=Count('id'),
            average_fee=Avg('consultation_fee')
        ).order_by('-total_revenue')
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'specialties': list(revenue_data)
        })
    
    @action(detail=False, methods=['get'])
    def revenue_by_doctor(self, request):
        """Ingresos generados por doctor"""
        start_date, end_date = self.get_date_range(request)
        limit = int(request.query_params.get('limit', 10))
        
        doctor_revenue = Appointment.objects.filter(
            appointment_date__range=[start_date, end_date],
            status='completed',
            payment_status='paid'
        ).values(
            'doctor__id',
            'doctor__first_name',
            'doctor__last_name'
        ).annotate(
            total_revenue=Sum('consultation_fee'),
            appointment_count=Count('id'),
            average_fee=Avg('consultation_fee'),
            patients_seen=Count('patient', distinct=True)
        ).order_by('-total_revenue')[:limit]
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'doctors': list(doctor_revenue)
        })
    
    @financial_pharmacy_analysis_docs
    @action(detail=False, methods=['get'])
    def pharmacy_sales_analysis(self, request):
        """Análisis detallado de ventas de farmacia"""
        start_date, end_date = self.get_date_range(request)
        
        # Ventas por categoría de medicamento
        sales_by_category = SaleItem.objects.filter(
            sale__sale_date__range=[start_date, end_date],
            sale__status='completed'
        ).values(
            'medication__category'
        ).annotate(
            total_revenue=Sum(F('quantity') * F('price')),
            units_sold=Sum('quantity'),
            transactions=Count('sale', distinct=True)
        ).order_by('-total_revenue')
        
        # Medicamentos más vendidos
        top_medications = SaleItem.objects.filter(
            sale__sale_date__range=[start_date, end_date],
            sale__status='completed'
        ).values(
            'medication__name',
            'medication__id'
        ).annotate(
            units_sold=Sum('quantity'),
            total_revenue=Sum(F('quantity') * F('price')),
            transactions=Count('sale')
        ).order_by('-units_sold')[:10]
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'sales_by_category': list(sales_by_category),
            'top_medications': list(top_medications)
        })
    
    @action(detail=False, methods=['get'])
    def payment_status_analysis(self, request):
        """Análisis del estado de pagos"""
        start_date, end_date = self.get_date_range(request)
        
        # Estado de pagos de consultas
        appointment_payments = Appointment.objects.filter(
            appointment_date__range=[start_date, end_date]
        ).values('payment_status').annotate(
            count=Count('id'),
            total_amount=Sum('consultation_fee')
        )
        
        # Estado de pagos de exámenes
        exam_payments = MedicalExam.objects.filter(
            created_at__date__range=[start_date, end_date]
        ).values('payment_status').annotate(
            count=Count('id'),
            total_amount=Sum('cost')
        )
        
        # Cálculo de cuentas por cobrar
        pending_appointments = Appointment.objects.filter(
            appointment_date__range=[start_date, end_date],
            payment_status__in=['pending', 'partial']
        ).aggregate(
            total=Sum('consultation_fee'),
            count=Count('id')
        )
        
        pending_exams = MedicalExam.objects.filter(
            created_at__date__range=[start_date, end_date],
            payment_status__in=['pending', 'partial']
        ).aggregate(
            total=Sum('cost'),
            count=Count('id')
        )
        
        total_receivable = Decimal('0')
        if pending_appointments['total']:
            total_receivable += pending_appointments['total']
        if pending_exams['total']:
            total_receivable += pending_exams['total']
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'appointments': {
                'payment_status': list(appointment_payments),
                'pending': {
                    'count': pending_appointments['count'] or 0,
                    'amount': float(pending_appointments['total'] or 0)
                }
            },
            'exams': {
                'payment_status': list(exam_payments),
                'pending': {
                    'count': pending_exams['count'] or 0,
                    'amount': float(pending_exams['total'] or 0)
                }
            },
            'total_receivable': float(total_receivable)
        })
    
    @action(detail=False, methods=['get'])
    def revenue_trends(self, request):
        """Tendencias de ingresos por período"""
        start_date, end_date = self.get_date_range(request)
        group_by = request.query_params.get('group_by', 'day')
        
        # Determinar función de agrupación
        if group_by == 'month':
            trunc_func = TruncMonth
        elif group_by == 'year':
            trunc_func = TruncYear
        else:
            trunc_func = TruncDate
        
        # Tendencia de consultas
        appointment_trends = Appointment.objects.filter(
            appointment_date__range=[start_date, end_date],
            status='completed',
            payment_status='paid'
        ).annotate(
            period=trunc_func('appointment_date')
        ).values('period').annotate(
            revenue=Sum('consultation_fee'),
            count=Count('id')
        ).order_by('period')
        
        # Tendencia de ventas de farmacia
        pharmacy_trends = Sale.objects.filter(
            sale_date__range=[start_date, end_date],
            status='completed'
        ).annotate(
            period=trunc_func('sale_date')
        ).values('period').annotate(
            revenue=Sum('total'),
            count=Count('id')
        ).order_by('period')
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'group_by': group_by
            },
            'appointments': list(appointment_trends),
            'pharmacy': list(pharmacy_trends)
        })
    
    @action(detail=False, methods=['get'])
    def insurance_analysis(self, request):
        """Análisis de ingresos por aseguradoras"""
        start_date, end_date = self.get_date_range(request)
        
        insurance_data = Appointment.objects.filter(
            appointment_date__range=[start_date, end_date],
            status='completed',
            insurance_claim__isnull=False
        ).values(
            'insurance_claim__insurance_provider'
        ).annotate(
            total_claimed=Sum('insurance_claim__amount_claimed'),
            total_approved=Sum('insurance_claim__amount_approved'),
            claim_count=Count('insurance_claim'),
            approval_rate=Count(
                'insurance_claim',
                filter=Q(insurance_claim__status='approved')
            ) * 100.0 / Count('insurance_claim')
        ).order_by('-total_claimed')
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'insurance_providers': list(insurance_data)
        })
    
    @action(detail=False, methods=['post'])
    def generate_financial_report(self, request):
        """Generar reporte financiero completo"""
        serializer_data = {
            'report_type': 'financial',
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
    
    @action(detail=False, methods=['get'])
    def expense_analysis(self, request):
        """Análisis de gastos (medicamentos comprados para inventario)"""
        start_date, end_date = self.get_date_range(request)
        
        # Análisis de compras de medicamentos
        medication_purchases = Medication.objects.filter(
            created_at__date__range=[start_date, end_date]
        ).aggregate(
            total_cost=Sum(F('purchase_price') * F('stock')),
            items_purchased=Sum('stock'),
            unique_medications=Count('id')
        )
        
        # Compras por categoría
        purchases_by_category = Medication.objects.filter(
            created_at__date__range=[start_date, end_date]
        ).values('category').annotate(
            total_cost=Sum(F('purchase_price') * F('stock')),
            items_count=Count('id')
        ).order_by('-total_cost')
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'total_expenses': {
                'medication_purchases': float(medication_purchases['total_cost'] or 0),
                'items_purchased': medication_purchases['items_purchased'] or 0,
                'unique_medications': medication_purchases['unique_medications'] or 0
            },
            'expenses_by_category': list(purchases_by_category)
        })
