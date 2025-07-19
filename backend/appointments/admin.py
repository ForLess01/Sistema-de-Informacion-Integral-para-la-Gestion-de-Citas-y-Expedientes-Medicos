from django.contrib import admin
from django.utils.html import format_html
from .models import Specialty, MedicalSchedule, Appointment, AppointmentReminder, TemporaryReservation


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_doctors_count', 'get_schedules_count', 'is_active', 'created_at']
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
    
    actions = ['activate_specialties', 'deactivate_specialties']
    
    def get_doctors_count(self, obj):
        """Mostrar cantidad de doctores en esta especialidad"""
        count = obj.schedules.values('doctor').distinct().count()
        if count > 0:
            return format_html(
                '<span style="color: blue; font-weight: bold;">{} doctores</span>', 
                count
            )
        return format_html('<span style="color: #999; font-style: italic;">Sin doctores</span>')
    get_doctors_count.short_description = 'Doctores'
    
    def get_schedules_count(self, obj):
        """Mostrar cantidad de horarios activos en esta especialidad"""
        count = obj.schedules.filter(is_active=True).count()
        if count > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{} horarios</span>', 
                count
            )
        return format_html('<span style="color: #999; font-style: italic;">Sin horarios</span>')
    get_schedules_count.short_description = 'Horarios Activos'
    
    def activate_specialties(self, request, queryset):
        """Activar especialidades seleccionadas"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} especialidad(es) activada(s) exitosamente.')
    activate_specialties.short_description = '✓ Activar especialidades seleccionadas'
    
    def deactivate_specialties(self, request, queryset):
        """Desactivar especialidades seleccionadas"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} especialidad(es) desactivada(s) exitosamente.')
    deactivate_specialties.short_description = '✗ Desactivar especialidades seleccionadas'


@admin.register(MedicalSchedule)
class MedicalScheduleAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'specialty', 'weekday', 'start_time', 'end_time', 'is_active']
    list_filter = ['weekday', 'is_active', 'specialty']
    search_fields = ['doctor__first_name', 'doctor__last_name', 'specialty__name']
    ordering = ['doctor', 'weekday', 'start_time']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['doctor', 'specialty']
    
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
    
    actions = ['activate_schedules', 'deactivate_schedules', 'clone_schedule_to_all_weekdays']
    
    def activate_schedules(self, request, queryset):
        """Activar horarios seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} horarios activados exitosamente.')
    activate_schedules.short_description = '✓ Activar horarios seleccionados'
    
    def deactivate_schedules(self, request, queryset):
        """Desactivar horarios seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} horarios desactivados exitosamente.')
    deactivate_schedules.short_description = '✗ Desactivar horarios seleccionados'
    
    def clone_schedule_to_all_weekdays(self, request, queryset):
        """Clonar horario a todos los días de la semana"""
        cloned_count = 0
        for schedule in queryset:
            for weekday in range(5):  # Lunes a viernes (0-4)
                if not MedicalSchedule.objects.filter(
                    doctor=schedule.doctor,
                    specialty=schedule.specialty,
                    weekday=weekday,
                    start_time=schedule.start_time,
                    end_time=schedule.end_time
                ).exists():
                    MedicalSchedule.objects.create(
                        doctor=schedule.doctor,
                        specialty=schedule.specialty,
                        weekday=weekday,
                        start_time=schedule.start_time,
                        end_time=schedule.end_time,
                        slot_duration=schedule.slot_duration,
                        is_active=schedule.is_active
                    )
                    cloned_count += 1
        self.message_user(request, f'{cloned_count} horarios clonados para toda la semana.')
    clone_schedule_to_all_weekdays.short_description = '📅 Clonar horario a todos los días laborables'


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


@admin.register(TemporaryReservation)
class TemporaryReservationAdmin(admin.ModelAdmin):
    list_display = ['user', 'doctor', 'specialty', 'appointment_date', 'appointment_time', 'expires_at', 'is_active', 'get_status']
    list_filter = ['is_active', 'specialty', 'appointment_date', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'doctor__first_name', 'doctor__last_name']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    date_hierarchy = 'appointment_date'
    
    fieldsets = (
        ('Usuario y Reserva', {
            'fields': ('user', 'doctor', 'specialty')
        }),
        ('Fecha y Hora', {
            'fields': ('appointment_date', 'appointment_time')
        }),
        ('Control de Tiempo', {
            'fields': ('expires_at', 'is_active')
        }),
        ('Metadatos', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['cancel_expired_reservations', 'extend_reservations']
    
    def get_status(self, obj):
        """Mostrar el estado de la reserva"""
        if not obj.is_active:
            return format_html('<span style="color: red; font-weight: bold;">Cancelada</span>')
        elif obj.is_expired():
            return format_html('<span style="color: orange; font-weight: bold;">Expirada</span>')
        else:
            return format_html('<span style="color: green; font-weight: bold;">Activa</span>')
    get_status.short_description = 'Estado'
    
    def cancel_expired_reservations(self, request, queryset):
        """Cancelar reservas expiradas"""
        from django.utils import timezone
        now = timezone.now()
        expired_reservations = queryset.filter(expires_at__lt=now, is_active=True)
        updated = expired_reservations.update(is_active=False)
        self.message_user(request, f'{updated} reservas expiradas canceladas.')
    cancel_expired_reservations.short_description = '⏰ Cancelar reservas expiradas'
    
    def extend_reservations(self, request, queryset):
        """Extender reservas activas por 5 minutos más"""
        from django.utils import timezone
        from datetime import timedelta
        
        updated = 0
        for reservation in queryset.filter(is_active=True):
            reservation.expires_at += timedelta(minutes=5)
            reservation.save()
            updated += 1
        
        self.message_user(request, f'{updated} reservas extendidas por 5 minutos.')
    extend_reservations.short_description = '⏰ Extender reservas por 5 min'
