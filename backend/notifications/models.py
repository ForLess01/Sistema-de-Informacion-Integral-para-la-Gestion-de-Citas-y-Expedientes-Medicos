from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import uuid
import json

User = get_user_model()


class NotificationTemplate(models.Model):
    """Plantillas para notificaciones"""
    NOTIFICATION_TYPES = [
        ('appointment_reminder', 'Recordatorio de Cita'),
        ('appointment_confirmation', 'Confirmación de Cita'),
        ('appointment_cancellation', 'Cancelación de Cita'),
        ('appointment_reschedule', 'Reprogramación de Cita'),
        ('exam_results', 'Resultados de Exámenes'),
        ('prescription_ready', 'Receta Lista'),
        ('emergency_alert', 'Alerta de Emergencia'),
        ('welcome', 'Bienvenida'),
        ('password_reset', 'Restablecimiento de Contraseña'),
        ('payment_reminder', 'Recordatorio de Pago'),
        ('system_maintenance', 'Mantenimiento del Sistema'),
    ]
    
    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('in_app', 'In-App Notification'),
    ]
    
    name = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES,
        verbose_name='Tipo de Notificación'
    )
    channel = models.CharField(
        max_length=10,
        choices=CHANNEL_CHOICES,
        verbose_name='Canal'
    )
    subject_template = models.CharField(
        max_length=255,
        blank=True,
        help_text='Para emails y notificaciones push',
        verbose_name='Plantilla de Asunto'
    )
    body_template = models.TextField(
        help_text='Usar {{variable}} para variables dinámicas',
        verbose_name='Plantilla de Cuerpo'
    )
    is_html = models.BooleanField(
        default=False,
        help_text='Solo para emails',
        verbose_name='Es HTML'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activa')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Plantilla de Notificación'
        verbose_name_plural = 'Plantillas de Notificaciones'
        ordering = ['notification_type', 'channel']
        unique_together = ['notification_type', 'channel']
    
    def __str__(self):
        return f"{self.name} ({self.get_channel_display()})"


class Notification(models.Model):
    """Modelo para notificaciones individuales"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('sent', 'Enviada'),
        ('delivered', 'Entregada'),
        ('failed', 'Fallida'),
        ('cancelled', 'Cancelada'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('normal', 'Normal'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    notification_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name='ID de Notificación'
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_notifications',
        verbose_name='Destinatario'
    )
    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Plantilla'
    )
    
    # Relación genérica para vincular con cualquier modelo
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )
    object_id = models.PositiveIntegerField(blank=True, null=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    subject = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Asunto'
    )
    message = models.TextField(verbose_name='Mensaje')
    context_data = models.JSONField(
        default=dict,
        blank=True,
        help_text='Datos adicionales en formato JSON',
        verbose_name='Datos de Contexto'
    )
    
    channel = models.CharField(
        max_length=10,
        choices=NotificationTemplate.CHANNEL_CHOICES,
        verbose_name='Canal'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
        verbose_name='Prioridad'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Estado'
    )
    
    # Campos para programación
    scheduled_for = models.DateTimeField(
        default=timezone.now,
        verbose_name='Programada para'
    )
    sent_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Enviada en'
    )
    delivered_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Entregada en'
    )
    
    # Campos para tracking
    attempts = models.IntegerField(default=0, verbose_name='Intentos')
    max_attempts = models.IntegerField(default=3, verbose_name='Máximo Intentos')
    error_message = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error'
    )
    
    # Campos para emails
    recipient_email = models.EmailField(
        blank=True,
        verbose_name='Email del Destinatario'
    )
    
    # Campos para SMS
    recipient_phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono del Destinatario'
    )
    
    # Campos para notificaciones push
    push_token = models.TextField(
        blank=True,
        verbose_name='Token Push'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['scheduled_for', 'status']),
            models.Index(fields=['channel', 'status']),
            models.Index(fields=['priority', 'status']),
        ]
    
    def __str__(self):
        return f"Notificación {self.notification_id} - {self.recipient.get_full_name()}"
    
    def mark_as_sent(self):
        """Marca la notificación como enviada"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save()
    
    def mark_as_delivered(self):
        """Marca la notificación como entregada"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save()
    
    def mark_as_failed(self, error_message=''):
        """Marca la notificación como fallida"""
        self.status = 'failed'
        self.error_message = error_message
        self.attempts += 1
        self.save()
    
    def can_retry(self):
        """Determina si la notificación puede reintentarse"""
        return self.attempts < self.max_attempts and self.status == 'failed'
    
    def is_ready_to_send(self):
        """Determina si la notificación está lista para enviar"""
        return (
            self.status == 'pending' and 
            self.scheduled_for <= timezone.now()
        )


class NotificationPreference(models.Model):
    """Preferencias de notificación por usuario"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name='Usuario'
    )
    
    # Preferencias por canal
    email_enabled = models.BooleanField(default=True, verbose_name='Email Habilitado')
    sms_enabled = models.BooleanField(default=False, verbose_name='SMS Habilitado')
    push_enabled = models.BooleanField(default=True, verbose_name='Push Habilitado')
    in_app_enabled = models.BooleanField(default=True, verbose_name='In-App Habilitado')
    
    # Preferencias por tipo de notificación
    appointment_reminders = models.BooleanField(default=True, verbose_name='Recordatorios de Citas')
    appointment_confirmations = models.BooleanField(default=True, verbose_name='Confirmaciones de Citas')
    exam_results = models.BooleanField(default=True, verbose_name='Resultados de Exámenes')
    prescription_notifications = models.BooleanField(default=True, verbose_name='Notificaciones de Recetas')
    emergency_alerts = models.BooleanField(default=True, verbose_name='Alertas de Emergencia')
    system_notifications = models.BooleanField(default=True, verbose_name='Notificaciones del Sistema')
    
    # Configuración de horarios
    quiet_hours_start = models.TimeField(
        default='22:00',
        verbose_name='Inicio de Horas Silenciosas'
    )
    quiet_hours_end = models.TimeField(
        default='07:00',
        verbose_name='Fin de Horas Silenciosas'
    )
    
    # Configuración de idioma
    language = models.CharField(
        max_length=5,
        default='es',
        choices=[('es', 'Español'), ('en', 'English')],
        verbose_name='Idioma'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Preferencia de Notificación'
        verbose_name_plural = 'Preferencias de Notificaciones'
    
    def __str__(self):
        return f"Preferencias de {self.user.get_full_name()}"
    
    def is_channel_enabled(self, channel):
        """Verifica si un canal está habilitado"""
        channel_mapping = {
            'email': self.email_enabled,
            'sms': self.sms_enabled,
            'push': self.push_enabled,
            'in_app': self.in_app_enabled,
        }
        return channel_mapping.get(channel, False)
    
    def is_notification_type_enabled(self, notification_type):
        """Verifica si un tipo de notificación está habilitado"""
        type_mapping = {
            'appointment_reminder': self.appointment_reminders,
            'appointment_confirmation': self.appointment_confirmations,
            'appointment_cancellation': self.appointment_confirmations,
            'appointment_reschedule': self.appointment_confirmations,
            'exam_results': self.exam_results,
            'prescription_ready': self.prescription_notifications,
            'emergency_alert': self.emergency_alerts,
            'system_maintenance': self.system_notifications,
        }
        return type_mapping.get(notification_type, True)
    
    def is_quiet_hours(self, check_time=None):
        """Verifica si está en horas silenciosas"""
        if check_time is None:
            check_time = timezone.now().time()
        
        # Si las horas silenciosas cruzan medianoche
        if self.quiet_hours_start > self.quiet_hours_end:
            return check_time >= self.quiet_hours_start or check_time <= self.quiet_hours_end
        else:
            return self.quiet_hours_start <= check_time <= self.quiet_hours_end


class NotificationLog(models.Model):
    """Log de notificaciones para auditoría"""
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name='Notificación'
    )
    action = models.CharField(
        max_length=50,
        choices=[
            ('created', 'Creada'),
            ('sent', 'Enviada'),
            ('delivered', 'Entregada'),
            ('failed', 'Fallida'),
            ('cancelled', 'Cancelada'),
            ('retry', 'Reintento'),
        ],
        verbose_name='Acción'
    )
    details = models.TextField(
        blank=True,
        verbose_name='Detalles'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Log de Notificación'
        verbose_name_plural = 'Logs de Notificaciones'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Log {self.notification.notification_id} - {self.action}"


class PushDevice(models.Model):
    """Dispositivos registrados para push notifications"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='push_devices',
        verbose_name='Usuario'
    )
    device_token = models.TextField(unique=True, verbose_name='Token del Dispositivo')
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('ios', 'iOS'),
            ('android', 'Android'),
            ('web', 'Web'),
        ],
        verbose_name='Tipo de Dispositivo'
    )
    device_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Nombre del Dispositivo'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    last_used = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Dispositivo Push'
        verbose_name_plural = 'Dispositivos Push'
        ordering = ['-last_used']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.device_type}"
