from django.contrib import admin
from .models import ReportTemplate, GeneratedReport, ScheduledReport, ReportAudit


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'is_active', 'created_by', 'created_at']
    list_filter = ['report_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Información General', {
            'fields': ['name', 'report_type', 'description', 'is_active']
        }),
        ('Configuración', {
            'fields': ['query_config', 'columns_config', 'filters_config'],
            'classes': ['collapse']
        }),
        ('Metadatos', {
            'fields': ['created_by', 'created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'format', 'status', 'generated_by', 'created_at']
    list_filter = ['report_type', 'format', 'status', 'created_at']
    search_fields = ['name', 'report_id']
    readonly_fields = [
        'report_id', 'file_size', 'row_count', 'generation_time',
        'created_at', 'completed_at', 'expires_at', 'is_expired'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = [
        ('Información General', {
            'fields': ['report_id', 'name', 'report_type', 'template']
        }),
        ('Configuración', {
            'fields': ['format', 'parameters', 'start_date', 'end_date']
        }),
        ('Estado', {
            'fields': ['status', 'error_message', 'file', 'file_size', 'row_count']
        }),
        ('Metadatos', {
            'fields': [
                'generated_by', 'generation_time', 'created_at',
                'completed_at', 'expires_at', 'is_expired'
            ]
        })
    ]
    
    def has_add_permission(self, request):
        return False  # Los reportes se generan desde la API


@admin.register(ScheduledReport)
class ScheduledReportAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'template', 'frequency', 'is_active',
        'last_run', 'next_run', 'created_by'
    ]
    list_filter = ['frequency', 'is_active', 'created_at']
    search_fields = ['name', 'template__name']
    readonly_fields = ['last_run', 'next_run', 'created_at', 'updated_at']
    
    fieldsets = [
        ('Información General', {
            'fields': ['name', 'template', 'is_active']
        }),
        ('Programación', {
            'fields': [
                'frequency', 'time_of_day', 'day_of_week',
                'day_of_month', 'last_run', 'next_run'
            ]
        }),
        ('Configuración de Envío', {
            'fields': ['format', 'recipients', 'include_in_email']
        }),
        ('Metadatos', {
            'fields': ['created_by', 'created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.calculate_next_run()
        super().save_model(request, obj, form, change)


@admin.register(ReportAudit)
class ReportAuditAdmin(admin.ModelAdmin):
    list_display = ['report', 'user', 'action', 'ip_address', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['report__name', 'user__email', 'ip_address']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
