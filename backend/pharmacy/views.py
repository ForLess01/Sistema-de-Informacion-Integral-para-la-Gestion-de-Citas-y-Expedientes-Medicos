from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from datetime import datetime, timedelta
from .models import (
    Medication, Dispensation, MedicationCategory,
    MedicationBatch, StockMovement, PharmacyReport
)
from .serializers import (
    MedicationSerializer, DispensationSerializer,
    MedicationCategorySerializer, MedicationBatchSerializer,
    StockMovementSerializer, PharmacyReportSerializer,
    MedicationInventorySerializer
)


class MedicationViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de medicamentos"""
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['dosage_form']
    search_fields = ['name', 'description']
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Obtener medicamentos con stock bajo"""
        medications = self.queryset.filter(
            quantity_in_stock__lte=F('reordering_threshold')
        )
        serializer = self.get_serializer(medications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def inventory_summary(self, request):
        """Resumen del inventario"""
        inventory_data = []
        
        for medication in self.queryset:
            batches = medication.batches.all()
            expired_batches = batches.filter(expiry_date__lt=timezone.now().date()).count()
            expiring_soon = batches.filter(
                expiry_date__lt=timezone.now().date() + timedelta(days=90),
                expiry_date__gte=timezone.now().date()
            ).count()
            
            last_dispensation = medication.dispensations.order_by('-dispensed_at').first()
            
            inventory_data.append({
                'medication': medication,
                'total_stock': medication.quantity_in_stock,
                'batches_count': batches.count(),
                'expired_batches': expired_batches,
                'expiring_soon': expiring_soon,
                'needs_reorder': medication.needs_reorder,
                'last_dispensed': last_dispensation.dispensed_at if last_dispensation else None
            })
        
        serializer = MedicationInventorySerializer(inventory_data, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """Actualizar stock de medicamento"""
        medication = self.get_object()
        quantity = request.data.get('quantity')
        operation = request.data.get('operation', 'add')
        reason = request.data.get('reason', '')
        
        if not quantity:
            return Response(
                {'error': 'Cantidad requerida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            medication.update_stock(int(quantity), operation)
            
            # Registrar movimiento
            movement_type = 'in' if operation == 'add' else 'out'
            StockMovement.objects.create(
                medication=medication,
                movement_type=movement_type,
                quantity=quantity,
                reason=reason,
                performed_by=request.user,
                stock_before=medication.quantity_in_stock - quantity if operation == 'add' else medication.quantity_in_stock + quantity,
                stock_after=medication.quantity_in_stock
            )
            
            serializer = self.get_serializer(medication)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class DispensationViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de dispensaciones"""
    queryset = Dispensation.objects.all()
    serializer_class = DispensationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'medication', 'pharmacist']
    
    def perform_create(self, serializer):
        serializer.save(pharmacist=self.request.user)


class MedicationCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet para categorías de medicamentos"""
    queryset = MedicationCategory.objects.all()
    serializer_class = MedicationCategorySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name']


class MedicationBatchViewSet(viewsets.ModelViewSet):
    """ViewSet para lotes de medicamentos"""
    queryset = MedicationBatch.objects.all()
    serializer_class = MedicationBatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['medication', 'is_expired']
    
    def perform_create(self, serializer):
        batch = serializer.save(received_by=self.request.user)
        # Actualizar stock del medicamento
        batch.medication.update_stock(batch.quantity, 'add')
        
        # Registrar movimiento
        StockMovement.objects.create(
            medication=batch.medication,
            movement_type='in',
            quantity=batch.quantity,
            batch=batch,
            reason=f"Recepción de lote {batch.batch_number}",
            performed_by=self.request.user,
            stock_before=batch.medication.quantity_in_stock - batch.quantity,
            stock_after=batch.medication.quantity_in_stock
        )
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Obtener lotes próximos a vencer (90 días)"""
        expiry_date = timezone.now().date() + timedelta(days=90)
        batches = self.queryset.filter(
            expiry_date__lte=expiry_date,
            expiry_date__gte=timezone.now().date()
        ).order_by('expiry_date')
        
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Obtener lotes vencidos"""
        batches = self.queryset.filter(
            expiry_date__lt=timezone.now().date()
        ).order_by('-expiry_date')
        
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para movimientos de stock (solo lectura)"""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['medication', 'movement_type', 'performed_by']
    ordering = ['-performed_at']


class PharmacyReportViewSet(viewsets.ModelViewSet):
    """ViewSet para reportes de farmacia"""
    queryset = PharmacyReport.objects.all()
    serializer_class = PharmacyReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['report_type']
    
    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate_inventory_report(self, request):
        """Generar reporte de inventario"""
        # Recopilar datos del inventario
        report_data = {
            'total_medications': Medication.objects.count(),
            'low_stock_items': Medication.objects.filter(
                quantity_in_stock__lte=F('reordering_threshold')
            ).count(),
            'total_value': 0,  # Calcular según costos
            'expired_batches': MedicationBatch.objects.filter(
                expiry_date__lt=timezone.now().date()
            ).count(),
            'medications': []
        }
        
        for medication in Medication.objects.all():
            report_data['medications'].append({
                'name': medication.name,
                'stock': medication.quantity_in_stock,
                'needs_reorder': medication.needs_reorder
            })
        
        report = PharmacyReport.objects.create(
            report_type='inventory',
            generated_by=request.user,
            start_date=timezone.now().date(),
            end_date=timezone.now().date(),
            report_data=report_data
        )
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)
