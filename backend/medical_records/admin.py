from django.contrib import admin
from .models import MedicalRecord, MedicalDocument, VitalSigns, Prescription, PrescriptionItem, LabTest, Allergy


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'doctor', 'record_date', 'created_at']
    list_filter = ['record_date', 'created_at']
    search_fields = ['patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name', 'diagnosis', 'description']
    date_hierarchy = 'record_date'
    ordering = ['-record_date', '-created_at']
    
    fieldsets = (
        ('Información del Paciente', {
            'fields': ('patient', 'doctor', 'record_date')
        }),
        ('Detalles Médicos', {
            'fields': ('description', 'diagnosis', 'treatment', 'notes')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'record', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['document_name', 'record__patient__first_name', 'record__patient__last_name']
    date_hierarchy = 'uploaded_at'
    ordering = ['-uploaded_at']


@admin.register(VitalSigns)
class VitalSignsAdmin(admin.ModelAdmin):
    list_display = ['patient', 'recorded_at', 'blood_pressure', 'heart_rate', 'temperature', 'bmi']
    list_filter = ['recorded_at']
    search_fields = ['patient__first_name', 'patient__last_name']
    date_hierarchy = 'recorded_at'
    ordering = ['-recorded_at']
    
    fieldsets = (
        ('Información del Paciente', {
            'fields': ('patient', 'appointment', 'recorded_by')
        }),
        ('Signos Vitales', {
            'fields': (
                ('blood_pressure_systolic', 'blood_pressure_diastolic'),
                'heart_rate',
                'respiratory_rate',
                'temperature',
                'oxygen_saturation',
                ('weight', 'height'),
            )
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
    )
    readonly_fields = ['recorded_at']


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ['prescription_id', 'patient', 'doctor', 'issue_date', 'valid_until', 'is_active']
    list_filter = ['is_active', 'issue_date', 'valid_until']
    search_fields = ['prescription_id', 'patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name']
    date_hierarchy = 'issue_date'
    ordering = ['-issue_date']
    readonly_fields = ['prescription_id', 'created_at', 'updated_at']


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1
    fields = ['medication', 'dosage', 'frequency', 'duration', 'quantity', 'instructions', 'is_dispensed']
    readonly_fields = ['dispensed_at', 'dispensed_by']


# Añadir inline a PrescriptionAdmin
PrescriptionAdmin.inlines = [PrescriptionItemInline]


@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ['test_name', 'patient', 'ordered_by', 'status', 'priority', 'ordered_date', 'result_date']
    list_filter = ['status', 'priority', 'ordered_date', 'result_date']
    search_fields = ['test_name', 'test_code', 'patient__first_name', 'patient__last_name']
    date_hierarchy = 'ordered_date'
    ordering = ['-ordered_date']
    
    fieldsets = (
        ('Información del Examen', {
            'fields': ('patient', 'ordered_by', 'appointment', 'medical_record')
        }),
        ('Detalles del Examen', {
            'fields': ('test_name', 'test_code', 'description', 'status', 'priority')
        }),
        ('Fechas', {
            'fields': ('ordered_date', 'collection_date', 'result_date')
        }),
        ('Resultados', {
            'fields': ('results', 'normal_range', 'result_file', 'notes')
        }),
    )
    readonly_fields = ['ordered_date', 'created_at', 'updated_at']


@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = ['patient', 'allergen', 'allergen_type', 'severity', 'is_active', 'created_at']
    list_filter = ['allergen_type', 'severity', 'is_active']
    search_fields = ['patient__first_name', 'patient__last_name', 'allergen']
    ordering = ['patient', '-severity']
    readonly_fields = ['created_at', 'updated_at']
