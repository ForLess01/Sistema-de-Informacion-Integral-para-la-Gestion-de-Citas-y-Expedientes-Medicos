from rest_framework import serializers
from authentication.models import Patient
from appointments.models import Appointment, Specialty
from medical_records.models import MedicalRecord, Diagnosis, Prescription
from pharmacy.models import Medicine, DispensedMedicine
from emergency.models import EmergencyPatient
from .models import ExternalAPIClient, APIWebhook


class PatientPublicSerializer(serializers.ModelSerializer):
    """Serializer público para pacientes - datos limitados"""
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'medical_record_number', 'first_name', 'last_name', 
            'date_of_birth', 'gender', 'blood_type', 'age'
        ]
        read_only_fields = ['id', 'medical_record_number']
    
    def get_age(self, obj):
        return obj.calculate_age()


class SpecialtyPublicSerializer(serializers.ModelSerializer):
    """Serializer público para especialidades"""
    available_doctors_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Specialty
        fields = ['id', 'name', 'description', 'available_doctors_count']


class AppointmentPublicSerializer(serializers.ModelSerializer):
    """Serializer público para citas"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_date', 'appointment_time', 'status',
            'patient', 'patient_name', 'doctor', 'doctor_name',
            'specialty', 'specialty_name', 'reason', 'notes'
        ]
        read_only_fields = ['id', 'patient_name', 'doctor_name', 'specialty_name']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear citas vía API externa"""
    patient_medical_record = serializers.CharField(write_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'patient_medical_record', 'specialty', 'appointment_date',
            'appointment_time', 'reason', 'notes'
        ]
    
    def validate_patient_medical_record(self, value):
        try:
            patient = Patient.objects.get(medical_record_number=value)
            self.context['patient'] = patient
            return value
        except Patient.DoesNotExist:
            raise serializers.ValidationError("Paciente no encontrado")
    
    def create(self, validated_data):
        validated_data.pop('patient_medical_record')
        validated_data['patient'] = self.context['patient']
        return super().create(validated_data)


class DiagnosisPublicSerializer(serializers.ModelSerializer):
    """Serializer público para diagnósticos"""
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    
    class Meta:
        model = Diagnosis
        fields = [
            'id', 'diagnosis_date', 'diagnosis_code', 'diagnosis_description',
            'severity', 'doctor', 'doctor_name', 'notes'
        ]
        read_only_fields = ['id', 'doctor_name']


class PrescriptionPublicSerializer(serializers.ModelSerializer):
    """Serializer público para recetas"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    medications = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'prescription_date', 'patient', 'patient_name',
            'doctor', 'doctor_name', 'status', 'medications', 'notes'
        ]
        read_only_fields = ['id', 'patient_name', 'doctor_name']
    
    def get_medications(self, obj):
        # Aquí deberías obtener los medicamentos de la receta
        return []


class MedicalRecordPublicSerializer(serializers.ModelSerializer):
    """Serializer público para expedientes médicos - información limitada"""
    patient = PatientPublicSerializer(read_only=True)
    recent_diagnoses = serializers.SerializerMethodField()
    active_prescriptions = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'created_date', 'last_updated',
            'recent_diagnoses', 'active_prescriptions'
        ]
        read_only_fields = ['id', 'created_date', 'last_updated']
    
    def get_recent_diagnoses(self, obj):
        diagnoses = obj.diagnoses.all()[:5]
        return DiagnosisPublicSerializer(diagnoses, many=True).data
    
    def get_active_prescriptions(self, obj):
        prescriptions = obj.prescriptions.filter(status='active')[:5]
        return PrescriptionPublicSerializer(prescriptions, many=True).data


class EmergencyPatientPublicSerializer(serializers.ModelSerializer):
    """Serializer público para pacientes de emergencia"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    triage_category_display = serializers.CharField(source='get_triage_category_display', read_only=True)
    
    class Meta:
        model = EmergencyPatient
        fields = [
            'id', 'patient', 'patient_name', 'arrival_time',
            'triage_category', 'triage_category_display',
            'chief_complaint', 'status'
        ]
        read_only_fields = ['id', 'patient_name', 'triage_category_display']


class APIClientSerializer(serializers.ModelSerializer):
    """Serializer para clientes API"""
    class Meta:
        model = ExternalAPIClient
        fields = [
            'id', 'name', 'description', 'api_key', 'is_active',
            'created_at', 'updated_at', 'daily_request_limit',
            'rate_limit_per_minute'
        ]
        read_only_fields = ['id', 'api_key', 'created_at', 'updated_at']


class WebhookSerializer(serializers.ModelSerializer):
    """Serializer para webhooks"""
    class Meta:
        model = APIWebhook
        fields = [
            'id', 'event', 'url', 'is_active', 'created_at',
            'last_triggered_at', 'success_count', 'failure_count'
        ]
        read_only_fields = [
            'id', 'created_at', 'last_triggered_at',
            'success_count', 'failure_count'
        ]
