from django.db import models
from django.contrib.auth import get_user_model
import secrets
import string

User = get_user_model()


class ExternalAPIClient(models.Model):
    """Cliente externo con acceso a la API"""
    name = models.CharField(max_length=255, verbose_name="Nombre del cliente")
    description = models.TextField(blank=True, verbose_name="Descripción")
    api_key = models.CharField(max_length=64, unique=True, verbose_name="API Key")
    api_secret = models.CharField(max_length=128, verbose_name="API Secret")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='api_clients')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Permisos específicos
    can_read_patients = models.BooleanField(default=False, verbose_name="Puede leer pacientes")
    can_write_patients = models.BooleanField(default=False, verbose_name="Puede escribir pacientes")
    can_read_appointments = models.BooleanField(default=False, verbose_name="Puede leer citas")
    can_write_appointments = models.BooleanField(default=False, verbose_name="Puede escribir citas")
    can_read_medical_records = models.BooleanField(default=False, verbose_name="Puede leer expedientes")
    can_write_medical_records = models.BooleanField(default=False, verbose_name="Puede escribir expedientes")
    can_read_pharmacy = models.BooleanField(default=False, verbose_name="Puede leer farmacia")
    can_write_pharmacy = models.BooleanField(default=False, verbose_name="Puede escribir farmacia")
    
    # Límites de uso
    daily_request_limit = models.IntegerField(default=10000, verbose_name="Límite diario de peticiones")
    rate_limit_per_minute = models.IntegerField(default=60, verbose_name="Límite por minuto")
    
    class Meta:
        verbose_name = "Cliente API Externa"
        verbose_name_plural = "Clientes API Externa"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.api_key:
            self.api_key = self.generate_api_key()
        if not self.api_secret:
            self.api_secret = self.generate_api_secret()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_api_key():
        """Genera una API key única"""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    @staticmethod
    def generate_api_secret():
        """Genera un API secret seguro"""
        return secrets.token_urlsafe(64)


class APIAccessLog(models.Model):
    """Registro de accesos a la API externa"""
    client = models.ForeignKey(ExternalAPIClient, on_delete=models.CASCADE, related_name='access_logs')
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    request_body = models.TextField(blank=True)
    response_status = models.IntegerField()
    response_time_ms = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Log de Acceso API"
        verbose_name_plural = "Logs de Acceso API"
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.client.name} - {self.endpoint} - {self.timestamp}"


class APIRateLimit(models.Model):
    """Control de límite de peticiones"""
    client = models.ForeignKey(ExternalAPIClient, on_delete=models.CASCADE, related_name='rate_limits')
    date = models.DateField(auto_now_add=True)
    hour = models.IntegerField()
    minute = models.IntegerField()
    request_count = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['client', 'date', 'hour', 'minute']
        verbose_name = "Límite de Tasa API"
        verbose_name_plural = "Límites de Tasa API"
    
    def __str__(self):
        return f"{self.client.name} - {self.date} {self.hour}:{self.minute}"


class APIWebhook(models.Model):
    """Webhooks para notificar a sistemas externos"""
    EVENTS = [
        ('appointment.created', 'Cita Creada'),
        ('appointment.updated', 'Cita Actualizada'),
        ('appointment.cancelled', 'Cita Cancelada'),
        ('patient.created', 'Paciente Creado'),
        ('patient.updated', 'Paciente Actualizado'),
        ('prescription.created', 'Receta Creada'),
        ('lab_result.ready', 'Resultado de Lab Listo'),
        ('emergency.admission', 'Admisión de Emergencia'),
    ]
    
    client = models.ForeignKey(ExternalAPIClient, on_delete=models.CASCADE, related_name='webhooks')
    event = models.CharField(max_length=50, choices=EVENTS)
    url = models.URLField()
    secret = models.CharField(max_length=255, help_text="Secret para validar requests")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    
    # Estadísticas
    success_count = models.IntegerField(default=0)
    failure_count = models.IntegerField(default=0)
    last_error = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.client.name} - {self.event} -> {self.url}"
    
    class Meta:
        verbose_name = "Webhook API"
        verbose_name_plural = "Webhooks API"
        unique_together = ['client', 'event', 'url']
