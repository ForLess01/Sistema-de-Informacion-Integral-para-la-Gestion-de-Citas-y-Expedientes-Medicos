from rest_framework import serializers
from .models import (
    EmergencyCase, EmergencyVitalSigns, EmergencyMedication,
    EmergencyProcedure, EmergencyTransfer
)
from authentication.serializers import UserSerializer
from pharmacy.serializers import MedicationSerializer


class EmergencyVitalSignsSerializer(serializers.ModelSerializer):
    """Serializer para signos vitales de emergencia"""
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = EmergencyVitalSigns
        fields = '__all__'
        read_only_fields = ['recorded_at']


class EmergencyMedicationSerializer(serializers.ModelSerializer):
    """Serializer para medicamentos de emergencia"""
    medication_detail = MedicationSerializer(source='medication', read_only=True)
    administered_by_name = serializers.CharField(source='administered_by.get_full_name', read_only=True)
    
    class Meta:
        model = EmergencyMedication
        fields = '__all__'
        read_only_fields = ['administered_at']


class EmergencyProcedureSerializer(serializers.ModelSerializer):
    """Serializer para procedimientos de emergencia"""
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)
    
    class Meta:
        model = EmergencyProcedure
        fields = '__all__'
        read_only_fields = ['performed_at']


class EmergencyTransferSerializer(serializers.ModelSerializer):
    """Serializer para transferencias de emergencia"""
    transfer_type_display = serializers.CharField(source='get_transfer_type_display', read_only=True)
    transport_mode_display = serializers.CharField(source='get_transport_mode_display', read_only=True)
    
    class Meta:
        model = EmergencyTransfer
        fields = '__all__'
        read_only_fields = ['transfer_time']


class EmergencyCaseListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de casos de emergencia"""
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    triage_level_display = serializers.CharField(source='get_triage_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    waiting_time = serializers.ReadOnlyField()
    
    class Meta:
        model = EmergencyCase
        fields = [
            'id', 'case_id', 'patient_name', 'arrival_time', 'chief_complaint',
            'triage_level', 'triage_level_display', 'status', 'status_display',
            'waiting_time'
        ]


class EmergencyCaseDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para casos de emergencia"""
    patient = UserSerializer(read_only=True)
    triage_nurse = UserSerializer(read_only=True)
    attending_doctor = UserSerializer(read_only=True)
    vital_signs = EmergencyVitalSignsSerializer(many=True, read_only=True)
    medications = EmergencyMedicationSerializer(many=True, read_only=True)
    procedures = EmergencyProcedureSerializer(many=True, read_only=True)
    transfer = EmergencyTransferSerializer(read_only=True)
    waiting_time = serializers.ReadOnlyField()
    total_time = serializers.ReadOnlyField()
    
    class Meta:
        model = EmergencyCase
        fields = '__all__'
        read_only_fields = ['case_id', 'arrival_time', 'created_at', 'updated_at']


class EmergencyCaseCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear casos de emergencia"""
    patient_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = EmergencyCase
        fields = ['patient_id', 'arrival_mode', 'chief_complaint', 'notes']
    
    def create(self, validated_data):
        patient_id = validated_data.pop('patient_id')
        patient = User.objects.get(id=patient_id, role='patient')
        return EmergencyCase.objects.create(patient=patient, **validated_data)


class EmergencyTriageSerializer(serializers.Serializer):
    """Serializer para realizar triaje"""
    triage_level = serializers.IntegerField(min_value=1, max_value=5)
    vital_signs = EmergencyVitalSignsSerializer(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class EmergencyDashboardSerializer(serializers.Serializer):
    """Serializer para dashboard de emergencias"""
    total_cases_today = serializers.IntegerField()
    active_cases = serializers.IntegerField()
    waiting_cases = serializers.IntegerField()
    critical_cases = serializers.IntegerField()
    average_waiting_time = serializers.FloatField()
    cases_by_triage = serializers.DictField()
    cases_by_status = serializers.DictField()
