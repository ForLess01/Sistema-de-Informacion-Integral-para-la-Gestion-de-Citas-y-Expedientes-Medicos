from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

User = get_user_model()


class Specialty(models.Model):
    """Modelo para especialidades médicas"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Especialidad'
        verbose_name_plural = 'Especialidades'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class MedicalSchedule(models.Model):
    """Modelo para horarios médicos"""
    WEEKDAY_CHOICES = [
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]
    
    doctor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='medical_schedules',
        verbose_name='Doctor'
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.SET_NULL,
        null=True,
        related_name='schedules',
        verbose_name='Especialidad'
    )
    weekday = models.IntegerField(
        choices=WEEKDAY_CHOICES,
        verbose_name='Día de la semana'
    )
    start_time = models.TimeField(verbose_name='Hora de inicio')
    end_time = models.TimeField(verbose_name='Hora de fin')
    slot_duration = models.IntegerField(
        default=30,
        validators=[MinValueValidator(15), MaxValueValidator(120)],
        help_text='Duración de cada cita en minutos',
        verbose_name='Duración de cita'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Horario Médico'
        verbose_name_plural = 'Horarios Médicos'
        ordering = ['doctor', 'weekday', 'start_time']
        unique_together = ['doctor', 'weekday', 'start_time', 'end_time']
    
    def __str__(self):
        return f"{self.doctor.get_full_name()} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class Appointment(models.Model):
    """Modelo para citas médicas"""
    STATUS_CHOICES = [
        ('scheduled', 'Agendada'),
        ('confirmed', 'Confirmada'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
        ('no_show', 'No Asistió'),
    ]
    
    appointment_id = models.UUIDField(
        default=uuid.uuid4, 
        editable=False, 
        unique=True,
        verbose_name='ID de cita'
    )
    patient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='patient_appointments',
        verbose_name='Paciente'
    )
    doctor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='doctor_appointments',
        verbose_name='Doctor'
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name='Especialidad'
    )
    appointment_date = models.DateField(verbose_name='Fecha de cita')
    appointment_time = models.TimeField(verbose_name='Hora de cita')
    duration = models.IntegerField(
        default=30,
        validators=[MinValueValidator(15), MaxValueValidator(120)],
        help_text='Duración en minutos',
        verbose_name='Duración'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='scheduled',
        verbose_name='Estado'
    )
    reason = models.TextField(
        help_text='Motivo de la consulta',
        verbose_name='Motivo'
    )
    notes = models.TextField(
        blank=True, 
        help_text='Notas adicionales',
        verbose_name='Notas'
    )
    cancelled_at = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Cancelado en'
    )
    cancellation_reason = models.TextField(
        blank=True,
        verbose_name='Motivo de cancelación'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Cita Médica'
        verbose_name_plural = 'Citas Médicas'
        ordering = ['-appointment_date', '-appointment_time']
        unique_together = ['doctor', 'appointment_date', 'appointment_time']
    
    def __str__(self):
        return f"Cita {self.appointment_id} - {self.patient.get_full_name()} con {self.doctor.get_full_name()} el {self.appointment_date}"
    
    @property
    def appointment_datetime(self):
        """Combina fecha y hora de la cita"""
        from datetime import datetime
        return datetime.combine(self.appointment_date, self.appointment_time)
    
    def cancel(self, reason=''):
        """Cancela la cita"""
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.cancellation_reason = reason
        self.save()
    
    def confirm(self):
        """Confirma la cita"""
        self.status = 'confirmed'
        self.save()
    
    def complete(self):
        """Marca la cita como completada"""
        self.status = 'completed'
        self.save()
    
    def mark_no_show(self):
        """Marca la cita como no asistida"""
        self.status = 'no_show'
        self.save()


class TemporaryReservation(models.Model):
    """Modelo para reservas temporales de citas"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='temporary_reservations',
        verbose_name='Usuario'
    )
    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='temporary_doctor_reservations',
        verbose_name='Doctor'
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.CASCADE,
        related_name='temporary_reservations',
        verbose_name='Especialidad'
    )
    appointment_date = models.DateField(verbose_name='Fecha de cita')
    appointment_time = models.TimeField(verbose_name='Hora de cita')
    expires_at = models.DateTimeField(verbose_name='Expira en')
    is_active = models.BooleanField(default=True, verbose_name='Activa')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Reserva Temporal'
        verbose_name_plural = 'Reservas Temporales'
        ordering = ['-created_at']
        unique_together = ['doctor', 'appointment_date', 'appointment_time', 'is_active']
    
    def __str__(self):
        return f"Reserva temporal: {self.user.get_full_name()} - {self.appointment_date} {self.appointment_time}"
    
    def is_expired(self):
        """Verifica si la reserva ha expirado"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def cancel_reservation(self):
        """Cancela la reserva temporal"""
        self.is_active = False
        self.save()


class AppointmentReminder(models.Model):
    """Modelo para recordatorios de citas"""
    REMINDER_TYPE_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
    ]
    
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='reminders',
        verbose_name='Cita'
    )
    reminder_type = models.CharField(
        max_length=10,
        choices=REMINDER_TYPE_CHOICES,
        verbose_name='Tipo de recordatorio'
    )
    scheduled_for = models.DateTimeField(verbose_name='Programado para')
    sent_at = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Enviado en'
    )
    is_sent = models.BooleanField(default=False, verbose_name='Enviado')
    error_message = models.TextField(
        blank=True,
        verbose_name='Mensaje de error'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Recordatorio de Cita'
        verbose_name_plural = 'Recordatorios de Citas'
        ordering = ['scheduled_for']
    
    def __str__(self):
        return f"Recordatorio {self.reminder_type} para cita {self.appointment.appointment_id}"
    
    def mark_as_sent(self):
        """Marca el recordatorio como enviado"""
        self.is_sent = True
        self.sent_at = timezone.now()
        self.save()
    
    def mark_as_failed(self, error_message):
        """Marca el recordatorio como fallido"""
        self.error_message = error_message
        self.save()
