from rest_framework import serializers
from .models import (
    Medication, Dispensation, MedicationCategory,
    MedicationBatch, StockMovement, PharmacyReport
)
from authentication.serializers import UserSerializer
from authentication.models import User


class MedicationSerializer(serializers.ModelSerializer):
    """Serializer para medicamentos"""
    needs_reorder = serializers.ReadOnlyField()
    
    class Meta:
        model = Medication
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DispensationSerializer(serializers.ModelSerializer):
    """Serializer para dispensaciones"""
    patient = UserSerializer(read_only=True)
    pharmacist = UserSerializer(read_only=True)
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    
    # Campos para aceptar IDs al crear/actualizar
    patient_id = serializers.PrimaryKeyRelatedField(
        source='patient', 
        queryset=User.objects.filter(role='patient'), 
        write_only=True,
        required=False
    )
    pharmacist_id = serializers.PrimaryKeyRelatedField(
        source='pharmacist', 
        queryset=User.objects.filter(role='pharmacist'), 
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Dispensation
        fields = ['id', 'medication', 'quantity', 'patient', 'patient_id', 
                  'pharmacist', 'pharmacist_id', 'dispensed_at', 'notes', 
                  'medication_name']
        read_only_fields = ['dispensed_at', 'pharmacist']


class MedicationCategorySerializer(serializers.ModelSerializer):
    """Serializer para categorías de medicamentos"""
    
    class Meta:
        model = MedicationCategory
        fields = '__all__'


class MedicationBatchSerializer(serializers.ModelSerializer):
    """Serializer para lotes de medicamentos"""
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    is_expired = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    
    class Meta:
        model = MedicationBatch
        fields = '__all__'
        read_only_fields = ['received_date']


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer para movimientos de stock"""
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['movement_id', 'performed_at', 'stock_before', 'stock_after']


class PharmacyReportSerializer(serializers.ModelSerializer):
    """Serializer para reportes de farmacia"""
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    
    class Meta:
        model = PharmacyReport
        fields = '__all__'
        read_only_fields = ['generated_date']


class MedicationInventorySerializer(serializers.Serializer):
    """Serializer para vista de inventario"""
    medication = MedicationSerializer()
    total_stock = serializers.IntegerField()
    batches_count = serializers.IntegerField()
    expired_batches = serializers.IntegerField()
    expiring_soon = serializers.IntegerField()
    needs_reorder = serializers.BooleanField()
    last_dispensed = serializers.DateTimeField(allow_null=True)
