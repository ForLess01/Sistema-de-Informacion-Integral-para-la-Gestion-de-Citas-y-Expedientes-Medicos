from django.contrib import admin
from .models import (
    EmergencyCase, EmergencyVitalSigns, EmergencyMedication
)

@admin.register(EmergencyCase)
class EmergencyCaseAdmin(admin.ModelAdmin):
    list_display = ['case_id', 'patient', 'arrival_time', 'triage_level', 'status', 'attending_doctor']
    list_filter = ['status', 'triage_level', 'arrival_mode', 'arrival_time']
    search_fields = ['patient__first_name', 'patient__last_name', 'chief_complaint', 'case_id']
    date_hierarchy = 'arrival_time'
    readonly_fields = ['case_id', 'created_at', 'updated_at', 'waiting_time', 'total_time']
    
    fieldsets = (
        ('Información del Paciente', {
            'fields': ('patient', 'case_id')
        }),
        ('Llegada', {
            'fields': ('arrival_time', 'arrival_mode', 'chief_complaint')
        }),
        ('Triaje', {
            'fields': ('triage_level', 'triage_time', 'triage_nurse')
        }),
        ('Tratamiento', {
            'fields': ('status', 'attending_doctor', 'treatment_start_time', 'treatment_end_time')
        }),
        ('Alta', {
            'fields': ('discharge_time', 'discharge_diagnosis', 'discharge_instructions', 'follow_up_required')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Información del Sistema', {
            'fields': ('waiting_time', 'total_time', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(EmergencyVitalSigns)
class EmergencyVitalSignsAdmin(admin.ModelAdmin):
    list_display = ['emergency_case', 'recorded_at', 'blood_pressure_display', 'heart_rate', 'temperature', 'recorded_by']
    list_filter = ['recorded_at']
    search_fields = ['emergency_case__patient__first_name', 'emergency_case__patient__last_name']
    date_hierarchy = 'recorded_at'
    readonly_fields = ['recorded_at']
    
    def blood_pressure_display(self, obj):
        if obj.blood_pressure_systolic and obj.blood_pressure_diastolic:
            return f"{obj.blood_pressure_systolic}/{obj.blood_pressure_diastolic}"
        return "-"
    blood_pressure_display.short_description = "Presión Arterial"

@admin.register(EmergencyMedication)
class EmergencyMedicationAdmin(admin.ModelAdmin):
    list_display = ['emergency_case', 'medication', 'dose', 'route', 'administered_at', 'administered_by']
    list_filter = ['administered_at', 'route']
    search_fields = ['emergency_case__patient__first_name', 'emergency_case__patient__last_name', 'medication__name']
    date_hierarchy = 'administered_at'
    readonly_fields = ['administered_at']
