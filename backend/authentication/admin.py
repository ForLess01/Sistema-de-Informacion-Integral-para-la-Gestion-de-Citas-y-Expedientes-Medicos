from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from appointments.models import MedicalSchedule, Specialty

User = get_user_model()


class MedicalScheduleInline(admin.TabularInline):
    """Inline para gestionar horarios médicos desde el perfil del doctor"""
    model = MedicalSchedule
    extra = 1
    fields = ['specialty', 'weekday', 'start_time', 'end_time', 'slot_duration', 'is_active']
    verbose_name = "Horario Médico"
    verbose_name_plural = "Horarios Médicos"
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('specialty')


# Registrar nuestro UserAdmin personalizado
@admin.register(User)
class DoctorUserAdmin(UserAdmin):
    """Admin personalizado para usuarios con funcionalidades médicas"""
    
    # Campos adicionales en la lista
    list_display = UserAdmin.list_display + ('get_specialties_display', 'get_schedule_count')
    
    # Filtros mejorados
    list_filter = UserAdmin.list_filter + ('medical_schedules__specialty',)
    
    # Búsquedas mejoradas
    search_fields = UserAdmin.search_fields + ('medical_schedules__specialty__name',)
    
    # Incluir horarios médicos como inline
    inlines = [MedicalScheduleInline]
    
    # Acciones personalizadas
    actions = list(UserAdmin.actions or []) + ['activate_doctors', 'deactivate_doctors', 'mark_as_medical_staff']
    
    def get_specialties_display(self, obj):
        """Mostrar especialidades del doctor"""
        specialties = obj.medical_schedules.values_list('specialty__name', flat=True).distinct()
        if specialties:
            specialty_list = list(set(specialties))  # Eliminar duplicados
            if len(specialty_list) > 2:
                return f"{', '.join(specialty_list[:2])}... (+{len(specialty_list)-2})"
            return ', '.join(specialty_list)
        return format_html('<span style="color: #999; font-style: italic;">Sin especialidad</span>')
    get_specialties_display.short_description = 'Especialidades'
    get_specialties_display.admin_order_field = 'medical_schedules__specialty__name'
    
    def get_schedule_count(self, obj):
        """Mostrar cantidad de horarios activos del doctor"""
        count = obj.medical_schedules.filter(is_active=True).count()
        if count > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ {} horarios</span>', 
                count
            )
        return format_html('<span style="color: #999; font-style: italic;">Sin horarios</span>')
    get_schedule_count.short_description = 'Horarios Activos'
    
    # Acciones masivas personalizadas
    def activate_doctors(self, request, queryset):
        """Activar doctores seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request, 
            f'{updated} doctor(es) activado(s) exitosamente.'
        )
    activate_doctors.short_description = '✓ Activar doctores seleccionados'
    
    def deactivate_doctors(self, request, queryset):
        """Desactivar doctores seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request, 
            f'{updated} doctor(es) desactivado(s) exitosamente.'
        )
    deactivate_doctors.short_description = '✗ Desactivar doctores seleccionados'
    
    def mark_as_medical_staff(self, request, queryset):
        """Marcar usuarios como personal médico (acceso al admin)"""
        updated = queryset.update(is_staff=True)
        self.message_user(
            request, 
            f'{updated} usuario(s) marcado(s) como personal médico con acceso al admin.'
        )
    mark_as_medical_staff.short_description = '👩‍⚕️ Marcar como personal médico'
    
    def get_queryset(self, request):
        """Optimizar consultas para mejorar rendimiento"""
        queryset = super().get_queryset(request)
        return queryset.prefetch_related('medical_schedules__specialty')
    
    def get_fieldsets(self, request, obj=None):
        """Personalizar fieldsets según el contexto"""
        fieldsets = super().get_fieldsets(request, obj)
        
        # Añadir sección de información médica si tiene horarios
        if obj and obj.medical_schedules.exists():
            medical_info = (
                'Información Médica', {
                    'description': 'Los horarios médicos se gestionan en la sección de abajo.',
                    'fields': (),
                }
            )
            return fieldsets + (medical_info,)
        
        return fieldsets
