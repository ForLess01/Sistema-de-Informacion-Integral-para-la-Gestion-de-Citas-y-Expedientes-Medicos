from django.contrib import admin
from .models import Specialty, MedicalSchedule, Appointment, AppointmentReminder


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información General', {
            'fields': ('name', 'description')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MedicalSchedule)
class MedicalScheduleAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'specialty', 'weekday', 'start_time', 'end_time', 'is_active']
    list_filter = ['weekday', 'is_active', 'specialty']
    search_fields = ['doctor__first_name', 'doctor__last_name', 'specialty__name']
    ordering = ['doctor', 'weekday', 'start_time']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Doctor y Especialidad', {
            'fields': ('doctor', 'specialty')
        }),
        ('Horario', {
            'fields': ('weekday', 'start_time', 'end_time', 'slot_duration')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['appointment_id', 'patient', 'doctor', 'specialty', 'appointment_date', 'appointment_time', 'status', 'created_at']
    list_filter = ['status', 'appointment_date', 'specialty', 'doctor']
    search_fields = ['appointment_id', 'patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name', 'reason']
    date_hierarchy = 'appointment_date'
    readonly_fields = ['appointment_id', 'created_at', 'updated_at', 'cancelled_at']
    ordering = ['-appointment_date', '-appointment_time']
    
    fieldsets = (
        ('Información de la Cita', {
            'fields': ('appointment_id', 'patient', 'doctor', 'specialty')
        }),
        ('Fecha y Hora', {
            'fields': ('appointment_date', 'appointment_time', 'duration')
        }),
        ('Detalles', {
            'fields': ('status', 'reason', 'notes')
        }),
        ('Cancelación', {
            'fields': ('cancelled_at', 'cancellation_reason'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['confirm_appointments', 'cancel_appointments', 'mark_completed']
    
    def confirm_appointments(self, request, queryset):
        updated = queryset.filter(status='scheduled').update(status='confirmed')
        self.message_user(request, f'{updated} citas confirmadas.')
    confirm_appointments.short_description = 'Confirmar citas seleccionadas'
    
    def cancel_appointments(self, request, queryset):
        updated = 0
        for appointment in queryset:
            if appointment.status not in ['completed', 'cancelled']:
                appointment.cancel('Cancelado por administrador')
                updated += 1
        self.message_user(request, f'{updated} citas canceladas.')
    cancel_appointments.short_description = 'Cancelar citas seleccionadas'
    
    def mark_completed(self, request, queryset):
        updated = queryset.filter(status='confirmed').update(status='completed')
        self.message_user(request, f'{updated} citas marcadas como completadas.')
    mark_completed.short_description = 'Marcar como completadas'


@admin.register(AppointmentReminder)
class AppointmentReminderAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'reminder_type', 'scheduled_for', 'is_sent', 'sent_at']
    list_filter = ['reminder_type', 'is_sent', 'scheduled_for']
    search_fields = ['appointment__appointment_id', 'appointment__patient__first_name', 'appointment__patient__last_name']
    readonly_fields = ['created_at', 'sent_at']
    ordering = ['scheduled_for']
    
    fieldsets = (
        ('Cita', {
            'fields': ('appointment',)
        }),
        ('Recordatorio', {
            'fields': ('reminder_type', 'scheduled_for')
        }),
        ('Estado', {
            'fields': ('is_sent', 'sent_at', 'error_message')
        }),
        ('Metadatos', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_sent']
    
    def mark_as_sent(self, request, queryset):
        updated = 0
        for reminder in queryset.filter(is_sent=False):
            reminder.mark_as_sent()
            updated += 1
        self.message_user(request, f'{updated} recordatorios marcados como enviados.')
    mark_as_sent.short_description = 'Marcar como enviados'
