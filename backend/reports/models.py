from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import FileExtensionValidator
import uuid
import json

User = get_user_model()


class ReportTemplate(models.Model):
    """Plantillas de reportes configurables"""
    REPORT_TYPES = [
        ('appointments', 'Reporte de Citas'),
        ('patients', 'Reporte de Pacientes'),
        ('medications', 'Reporte de Medicamentos'),
        ('financial', 'Reporte Financiero'),
        ('emergency', 'Reporte de Emergencias'),
        ('occupancy', 'Reporte de Ocupación'),
        ('lab_tests', 'Reporte de Exámenes'),
        ('custom', 'Reporte Personalizado'),
    ]
    
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    description = models.TextField(blank=True)
    query_config = models.JSONField(
        default=dict,
        help_text="Configuración de consultas SQL o filtros"
    )
    columns_config = models.JSONField(
        default=list,
        help_text="Configuración de columnas a mostrar"
    )
    filters_config = models.JSONField(
        default=dict,
        help_text="Filtros disponibles para el reporte"
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_report_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Plantilla de Reporte'
        verbose_name_plural = 'Plantillas de Reportes'
        ordering = ['report_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"


class GeneratedReport(models.Model):
    """Reportes generados y almacenados"""
    FORMATS = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
        ('json', 'JSON'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    report_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_reports'
    )
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=ReportTemplate.REPORT_TYPES)
    format = models.CharField(max_length=10, choices=FORMATS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Parámetros del reporte
    parameters = models.JSONField(
        default=dict,
        help_text="Parámetros utilizados para generar el reporte"
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # Resultados
    file = models.FileField(
        upload_to='reports/%Y/%m/%d/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['pdf', 'xlsx', 'csv', 'json'])]
    )
    file_size = models.PositiveIntegerField(null=True, blank=True)
    row_count = models.PositiveIntegerField(null=True, blank=True)
    
    # Metadatos
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports'
    )
    generation_time = models.FloatField(
        null=True,
        blank=True,
        help_text="Tiempo de generación en segundos"
    )
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha de expiración del archivo"
    )
    
    class Meta:
        verbose_name = 'Reporte Generado'
        verbose_name_plural = 'Reportes Generados'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['report_type', 'created_at']),
            models.Index(fields=['generated_by', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


class ScheduledReport(models.Model):
    """Reportes programados para generación automática"""
    FREQUENCY_CHOICES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('quarterly', 'Trimestral'),
        ('yearly', 'Anual'),
    ]
    
    WEEKDAY_CHOICES = [
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]
    
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.CASCADE,
        related_name='scheduled_reports'
    )
    name = models.CharField(max_length=200)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    
    # Configuración de frecuencia
    time_of_day = models.TimeField(
        default='08:00',
        help_text="Hora del día para generar el reporte"
    )
    day_of_week = models.IntegerField(
        choices=WEEKDAY_CHOICES,
        null=True,
        blank=True,
        help_text="Para reportes semanales"
    )
    day_of_month = models.IntegerField(
        null=True,
        blank=True,
        help_text="Para reportes mensuales (1-31)"
    )
    
    # Configuración de envío
    format = models.CharField(max_length=10, choices=GeneratedReport.FORMATS, default='pdf')
    recipients = models.JSONField(
        default=list,
        help_text="Lista de emails para enviar el reporte"
    )
    include_in_email = models.BooleanField(
        default=True,
        help_text="Incluir el reporte como adjunto en el email"
    )
    
    # Estado
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    
    # Metadatos
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='scheduled_reports'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Reporte Programado'
        verbose_name_plural = 'Reportes Programados'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"
    
    def calculate_next_run(self):
        """Calcula la próxima fecha de ejecución"""
        from datetime import datetime, timedelta
        import calendar
        
        now = timezone.now()
        next_run = now.replace(
            hour=self.time_of_day.hour,
            minute=self.time_of_day.minute,
            second=0,
            microsecond=0
        )
        
        if self.frequency == 'daily':
            if next_run <= now:
                next_run += timedelta(days=1)
        
        elif self.frequency == 'weekly' and self.day_of_week is not None:
            days_ahead = self.day_of_week - next_run.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run += timedelta(days=days_ahead)
        
        elif self.frequency == 'monthly' and self.day_of_month:
            # Manejar meses con menos días
            max_day = calendar.monthrange(next_run.year, next_run.month)[1]
            day = min(self.day_of_month, max_day)
            next_run = next_run.replace(day=day)
            if next_run <= now:
                # Avanzar al siguiente mes
                if next_run.month == 12:
                    next_run = next_run.replace(year=next_run.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=next_run.month + 1)
        
        self.next_run = next_run
        return next_run


class ReportAudit(models.Model):
    """Auditoría de acceso a reportes"""
    ACTION_CHOICES = [
        ('generated', 'Generado'),
        ('viewed', 'Visto'),
        ('downloaded', 'Descargado'),
        ('emailed', 'Enviado por Email'),
        ('deleted', 'Eliminado'),
    ]
    
    report = models.ForeignKey(
        GeneratedReport,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='report_audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(
        default=dict,
        help_text="Información adicional sobre la acción"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Auditoría de Reporte'
        verbose_name_plural = 'Auditorías de Reportes'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['report', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.get_action_display()} - {self.report.name}"
