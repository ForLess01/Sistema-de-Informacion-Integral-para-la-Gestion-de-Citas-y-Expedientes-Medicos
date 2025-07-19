from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import (
    NotificationTemplate,
    Notification,
    NotificationPreference,
    NotificationLog,
    PushDevice
)


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Admin para plantillas de notificaciones"""
    
    list_display = [
        'name', 'notification_type', 'channel', 'is_html', 
        'is_active', 'usage_count', 'created_at'
    ]
    list_filter = ['notification_type', 'channel', 'is_html', 'is_active']
    search_fields = ['name', 'body_template']
    readonly_fields = ['created_at', 'updated_at', 'usage_count']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'notification_type', 'channel', 'is_active')
        }),
        ('Plantillas', {
            'fields': ('subject_template', 'body_template', 'is_html'),
            'classes': ('wide',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at', 'usage_count'),
            'classes': ('collapse',)
        }),
    )
    
    def usage_count(self, obj):
        """Mostrar cuántas notificaciones han usado esta plantilla"""
        count = obj.notifications.count()
        return format_html(
            '<a href="{}?template__id__exact={}">{} notificaciones</a>',
            reverse('admin:notifications_notification_changelist'),
            obj.id,
            count
        )
    usage_count.short_description = 'Uso'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(
            notification_count=Count('notifications')
        )


class NotificationLogInline(admin.TabularInline):
    """Inline para logs de notificaciones"""
    
    model = NotificationLog
    extra = 0
    readonly_fields = ['action', 'details', 'timestamp']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin para notificaciones"""
    
    list_display = [
        'notification_id_short', 'recipient_name', 'notification_type',
        'channel', 'priority', 'status', 'scheduled_for', 'created_at'
    ]
    list_filter = [
        'status', 'channel', 'priority', 'template__notification_type',
        'created_at', 'scheduled_for'
    ]
    search_fields = [
        'notification_id', 'recipient__first_name', 'recipient__last_name',
        'recipient__email', 'subject', 'message'
    ]
    readonly_fields = [
        'notification_id', 'sent_at', 'delivered_at', 'created_at', 
        'updated_at', 'attempts'
    ]
    date_hierarchy = 'created_at'
    inlines = [NotificationLogInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'notification_id', 'recipient', 'template', 
                'channel', 'priority', 'status'
            )
        }),
        ('Contenido', {
            'fields': ('subject', 'message', 'context_data'),
            'classes': ('wide',)
        }),
        ('Programación', {
            'fields': ('scheduled_for', 'sent_at', 'delivered_at')
        }),
        ('Contacto', {
            'fields': ('recipient_email', 'recipient_phone', 'push_token'),
            'classes': ('collapse',)
        }),
        ('Seguimiento', {
            'fields': ('attempts', 'max_attempts', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def notification_id_short(self, obj):
        """Mostrar versión corta del ID"""
        return str(obj.notification_id)[:8] + '...'
    notification_id_short.short_description = 'ID'
    
    def recipient_name(self, obj):
        """Mostrar nombre del destinatario"""
        return obj.recipient.get_full_name()
    recipient_name.short_description = 'Destinatario'
    
    def notification_type(self, obj):
        """Mostrar tipo de notificación"""
        return obj.template.get_notification_type_display()
    notification_type.short_description = 'Tipo'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('recipient', 'template')
    
    actions = ['mark_as_pending', 'mark_as_cancelled', 'retry_failed']
    
    def mark_as_pending(self, request, queryset):
        """Acción para marcar como pendiente"""
        updated = queryset.filter(status__in=['failed', 'cancelled']).update(status='pending')
        self.message_user(request, f'{updated} notificaciones marcadas como pendientes.')
    mark_as_pending.short_description = 'Marcar como pendientes'
    
    def mark_as_cancelled(self, request, queryset):
        """Acción para cancelar notificaciones"""
        updated = queryset.filter(status='pending').update(status='cancelled')
        self.message_user(request, f'{updated} notificaciones canceladas.')
    mark_as_cancelled.short_description = 'Cancelar notificaciones'
    
    def retry_failed(self, request, queryset):
        """Acción para reintentar notificaciones fallidas"""
        from .tasks import send_notification_task
        
        failed_notifications = queryset.filter(status='failed')
        count = 0
        
        for notification in failed_notifications:
            if notification.can_retry():
                notification.status = 'pending'
                notification.save()
                send_notification_task.delay(notification.id)
                count += 1
        
        self.message_user(request, f'{count} notificaciones enviadas para reintento.')
    retry_failed.short_description = 'Reintentar fallidas'


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Admin para preferencias de notificaciones"""
    
    list_display = [
        'user_name', 'email_enabled', 'sms_enabled', 
        'push_enabled', 'in_app_enabled', 'language'
    ]
    list_filter = [
        'email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled',
        'language', 'appointment_reminders', 'emergency_alerts'
    ]
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Canales Habilitados', {
            'fields': (
                'email_enabled', 'sms_enabled', 
                'push_enabled', 'in_app_enabled'
            )
        }),
        ('Tipos de Notificaciones', {
            'fields': (
                'appointment_reminders', 'appointment_confirmations',
                'exam_results', 'prescription_notifications',
                'emergency_alerts', 'system_notifications'
            )
        }),
        ('Configuración', {
            'fields': (
                'quiet_hours_start', 'quiet_hours_end', 'language'
            )
        }),
    )
    
    def user_name(self, obj):
        """Mostrar nombre del usuario"""
        return obj.user.get_full_name()
    user_name.short_description = 'Usuario'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('user')


@admin.register(PushDevice)
class PushDeviceAdmin(admin.ModelAdmin):
    """Admin para dispositivos push"""
    
    list_display = [
        'user_name', 'device_type', 'device_name', 
        'is_active', 'last_used', 'created_at'
    ]
    list_filter = ['device_type', 'is_active', 'last_used']
    search_fields = ['user__first_name', 'user__last_name', 'device_name']
    readonly_fields = ['device_token', 'last_used', 'created_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('user', 'device_type', 'device_name', 'is_active')
        }),
        ('Token', {
            'fields': ('device_token',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('last_used', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_name(self, obj):
        """Mostrar nombre del usuario"""
        return obj.user.get_full_name()
    user_name.short_description = 'Usuario'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('user')
    
    actions = ['activate_devices', 'deactivate_devices']
    
    def activate_devices(self, request, queryset):
        """Activar dispositivos seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} dispositivos activados.')
    activate_devices.short_description = 'Activar dispositivos'
    
    def deactivate_devices(self, request, queryset):
        """Desactivar dispositivos seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} dispositivos desactivados.')
    deactivate_devices.short_description = 'Desactivar dispositivos'


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """Admin para logs de notificaciones"""
    
    list_display = [
        'notification_id_short', 'action', 'timestamp', 'details_short'
    ]
    list_filter = ['action', 'timestamp']
    search_fields = ['notification__notification_id', 'details']
    readonly_fields = ['notification', 'action', 'details', 'timestamp']
    date_hierarchy = 'timestamp'
    
    def notification_id_short(self, obj):
        """Mostrar versión corta del ID de notificación"""
        return str(obj.notification.notification_id)[:8] + '...'
    notification_id_short.short_description = 'Notificación'
    
    def details_short(self, obj):
        """Mostrar versión corta de los detalles"""
        if len(obj.details) > 50:
            return obj.details[:50] + '...'
        return obj.details
    details_short.short_description = 'Detalles'
    
    def has_add_permission(self, request):
        """No permitir agregar logs manualmente"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """No permitir editar logs"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Solo permitir eliminar logs antiguos"""
        return request.user.is_superuser


# Configuración del sitio admin
admin.site.site_header = "Sistema Administrador-SIIGCEM🩺"
admin.site.site_title = "Notificaciones Admin-SIIGCEM🩺"
admin.site.index_title = "Administración de Notificaciones-SIIGCEM🩺"