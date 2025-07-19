from rest_framework import serializers
from .models import (
    MedicalRecord, Allergy, Prescription, PrescriptionItem,
    LabTest, VitalSigns, MedicalDocument
)
from django.contrib.auth import get_user_model

User = get_user_model()


class AllergySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    allergen_type_display = serializers.CharField(source='get_allergen_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = Allergy
        fields = ['id', 'patient', 'patient_name', 'allergen', 'allergen_type', 
                  'allergen_type_display', 'severity', 'severity_display', 'reaction',
                  'first_observed', 'is_active', 'created_by', 'created_by_name',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    dispensed_by_name = serializers.CharField(source='dispensed_by.get_full_name', read_only=True)
    
    class Meta:
        model = PrescriptionItem
        fields = ['id', 'medication', 'medication_name', 'dosage', 'frequency',
                  'duration', 'quantity', 'instructions', 'is_dispensed',
                  'dispensed_at', 'dispensed_by', 'dispensed_by_name']
        read_only_fields = ['dispensed_at']


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    items = PrescriptionItemSerializer(many=True, read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Prescription
        fields = ['id', 'prescription_id', 'patient', 'patient_name', 'doctor', 
                  'doctor_name', 'medical_record', 'appointment', 'issue_date',
                  'valid_until', 'diagnosis', 'instructions', 'is_active',
                  'is_expired', 'items', 'created_at', 'updated_at']
        read_only_fields = ['prescription_id', 'created_at', 'updated_at']


class LabTestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    ordered_by_name = serializers.CharField(source='ordered_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = LabTest
        fields = ['id', 'patient', 'patient_name', 'ordered_by', 'ordered_by_name',
                  'medical_record', 'appointment', 'test_name', 'test_code',
                  'description', 'status', 'status_display', 'priority',
                  'priority_display', 'ordered_date', 'collection_date',
                  'result_date', 'results', 'normal_range', 'result_file',
                  'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class VitalSignsSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    bmi = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    blood_pressure = serializers.CharField(read_only=True)
    
    class Meta:
        model = VitalSigns
        fields = ['id', 'patient', 'patient_name', 'recorded_by', 'recorded_by_name',
                  'appointment', 'blood_pressure_systolic', 'blood_pressure_diastolic',
                  'blood_pressure', 'heart_rate', 'respiratory_rate', 'temperature',
                  'oxygen_saturation', 'weight', 'height', 'bmi', 'recorded_at', 'notes']
        read_only_fields = ['recorded_at']


class MedicalDocumentSerializer(serializers.ModelSerializer):
    record_patient_name = serializers.CharField(source='record.patient.get_full_name', read_only=True)
    
    class Meta:
        model = MedicalDocument
        fields = ['id', 'record', 'record_patient_name', 'document_name',
                  'document_file', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    documents = MedicalDocumentSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    lab_tests = LabTestSerializer(many=True, read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                  'record_date', 'description', 'diagnosis', 'treatment',
                  'notes', 'documents', 'prescriptions', 'lab_tests',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class RecentVitalSignsSerializer(serializers.Serializer):
    """Serializer simple para signos vitales recientes sin dependencias de modelo"""
    blood_pressure = serializers.CharField(allow_null=True, required=False)
    heart_rate = serializers.IntegerField(allow_null=True, required=False)
    temperature = serializers.FloatField(allow_null=True, required=False)
    weight = serializers.FloatField(allow_null=True, required=False)
    height = serializers.IntegerField(allow_null=True, required=False)


class MedicalSummarySerializer(serializers.Serializer):
    """Serializer para el resumen del expediente médico"""
    patient_name = serializers.CharField()
    blood_type = serializers.CharField()
    age = serializers.IntegerField()
    allergies_count = serializers.IntegerField()
    active_prescriptions = serializers.IntegerField()
    pending_lab_results = serializers.IntegerField()
    last_visit = serializers.DateTimeField(allow_null=True)
    total_visits = serializers.IntegerField()
    total_records = serializers.IntegerField()
    recent_vital_signs = RecentVitalSignsSerializer(allow_null=True)
