from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ReportTemplate, GeneratedReport, ScheduledReport, ReportAudit

User = get_user_model()


class ReportTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'report_type', 'report_type_display',
            'description', 'query_config', 'columns_config',
            'filters_config', 'is_active', 'created_by',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class GeneratedReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'report_id', 'template', 'template_name', 'name',
            'report_type', 'report_type_display', 'format', 'format_display',
            'status', 'status_display', 'parameters', 'start_date', 'end_date',
            'file', 'file_url', 'file_size', 'row_count', 'generated_by',
            'generated_by_name', 'generation_time', 'error_message',
            'created_at', 'completed_at', 'expires_at', 'is_expired'
        ]
        read_only_fields = [
            'report_id', 'file', 'file_size', 'row_count',
            'generation_time', 'error_message', 'created_at',
            'completed_at', 'is_expired'
        ]
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class GeneratedReportListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'report_id', 'name', 'report_type', 'report_type_display',
            'format', 'status', 'status_display', 'file_size',
            'generated_by_name', 'created_at', 'is_expired'
        ]


class ScheduledReportSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    
    class Meta:
        model = ScheduledReport
        fields = [
            'id', 'template', 'template_name', 'name', 'frequency',
            'frequency_display', 'time_of_day', 'day_of_week', 'day_of_month',
            'format', 'format_display', 'recipients', 'include_in_email',
            'is_active', 'last_run', 'next_run', 'created_by',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'last_run', 'next_run', 'created_at', 'updated_at']
    
    def validate(self, data):
        frequency = data.get('frequency', self.instance.frequency if self.instance else None)
        
        if frequency == 'weekly' and data.get('day_of_week') is None:
            raise serializers.ValidationError({
                'day_of_week': 'Este campo es requerido para reportes semanales.'
            })
        
        if frequency == 'monthly' and data.get('day_of_month') is None:
            raise serializers.ValidationError({
                'day_of_month': 'Este campo es requerido para reportes mensuales.'
            })
        
        return data


class ReportAuditSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    report_name = serializers.CharField(source='report.name', read_only=True)
    
    class Meta:
        model = ReportAudit
        fields = [
            'id', 'report', 'report_name', 'user', 'user_name',
            'action', 'action_display', 'ip_address', 'user_agent',
            'metadata', 'timestamp'
        ]
        read_only_fields = ['timestamp']


# Serializers para solicitud de generación de reportes
class GenerateReportSerializer(serializers.Serializer):
    """Serializer para solicitar la generación de un reporte"""
    template_id = serializers.IntegerField(required=False)
    report_type = serializers.ChoiceField(
        choices=ReportTemplate.REPORT_TYPES,
        required=True
    )
    name = serializers.CharField(max_length=200, required=False)
    format = serializers.ChoiceField(
        choices=GeneratedReport.FORMATS,
        default='pdf'
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    parameters = serializers.JSONField(default=dict)
    
    def validate(self, data):
        if not data.get('template_id') and not data.get('name'):
            raise serializers.ValidationError(
                'Debe proporcionar template_id o name para el reporte.'
            )
        
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError(
                    'La fecha de inicio no puede ser posterior a la fecha de fin.'
                )
        
        return data


# Serializers para reportes específicos
class AppointmentReportSerializer(serializers.Serializer):
    """Datos para reporte de citas"""
    appointment_date = serializers.DateField()
    appointment_time = serializers.TimeField()
    patient_name = serializers.CharField()
    patient_dni = serializers.CharField()
    doctor_name = serializers.CharField()
    specialty = serializers.CharField()
    status = serializers.CharField()
    duration = serializers.IntegerField()
    notes = serializers.CharField(allow_blank=True)


class MedicationReportSerializer(serializers.Serializer):
    """Datos para reporte de medicamentos"""
    medication_name = serializers.CharField()
    dosage_form = serializers.CharField()
    strength = serializers.CharField()
    quantity_dispensed = serializers.IntegerField()
    patient_name = serializers.CharField()
    doctor_name = serializers.CharField()
    dispensed_date = serializers.DateTimeField()
    pharmacist_name = serializers.CharField()


class EmergencyReportSerializer(serializers.Serializer):
    """Datos para reporte de emergencias"""
    case_id = serializers.UUIDField()
    patient_name = serializers.CharField()
    arrival_time = serializers.DateTimeField()
    triage_level = serializers.IntegerField()
    chief_complaint = serializers.CharField()
    attending_doctor = serializers.CharField(allow_blank=True)
    status = serializers.CharField()
    total_time_minutes = serializers.IntegerField()
    discharge_diagnosis = serializers.CharField(allow_blank=True)
