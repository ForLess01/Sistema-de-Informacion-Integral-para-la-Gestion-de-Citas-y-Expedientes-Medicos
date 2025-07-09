from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from authentication.models import User


class EmergencyCase(models.Model):
    """Casos de emergencia con sistema de triaje"""
    TRIAGE_LEVELS = [
        (1, 'Resucitación - Riesgo vital inmediato'),
        (2, 'Emergencia - Riesgo vital potencial'),
        (3, 'Urgencia - Situación urgente'),
        (4, 'Menos urgente - Situación menos urgente'),
        (5, 'No urgente - Situación no urgente'),
    ]
    
    STATUS_CHOICES = [
        ('waiting', 'En espera'),
        ('in_triage', 'En triaje'),
        ('in_treatment', 'En tratamiento'),
        ('observation', 'En observación'),
        ('discharged', 'Alta'),
        ('admitted', 'Hospitalizado'),
        ('transferred', 'Transferido'),
        ('deceased', 'Fallecido'),
    ]
    
    case_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='emergency_cases',
        limit_choices_to={'role': 'patient'}
    )
    
    # Información de llegada
    arrival_time = models.DateTimeField(default=timezone.now)
    arrival_mode = models.CharField(
        max_length=50,
        choices=[
            ('walk_in', 'Caminando'),
            ('ambulance', 'Ambulancia'),
            ('private_vehicle', 'Vehículo privado'),
            ('police', 'Policía'),
            ('other', 'Otro'),
        ]
    )
    chief_complaint = models.TextField(help_text='Motivo principal de consulta')
    
    # Triaje
    triage_level = models.IntegerField(choices=TRIAGE_LEVELS, null=True, blank=True)
    triage_time = models.DateTimeField(null=True, blank=True)
    triage_nurse = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triaged_cases',
        limit_choices_to={'role': 'nurse'}
    )
    
    # Estado y tratamiento
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    attending_doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='emergency_patients',
        limit_choices_to={'role': 'doctor'}
    )
    treatment_start_time = models.DateTimeField(null=True, blank=True)
    treatment_end_time = models.DateTimeField(null=True, blank=True)
    
    # Alta o disposición
    discharge_time = models.DateTimeField(null=True, blank=True)
    discharge_diagnosis = models.TextField(blank=True)
    discharge_instructions = models.TextField(blank=True)
    follow_up_required = models.BooleanField(default=False)
    
    # Notas y observaciones
    notes = models.TextField(blank=True)
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Caso de Emergencia'
        verbose_name_plural = 'Casos de Emergencia'
        ordering = ['-arrival_time', 'triage_level']
        indexes = [
            models.Index(fields=['status', 'triage_level']),
            models.Index(fields=['arrival_time']),
        ]
    
    @property
    def waiting_time(self):
        """Tiempo de espera en minutos"""
        if self.treatment_start_time:
            delta = self.treatment_start_time - self.arrival_time
            return int(delta.total_seconds() / 60)
        elif self.status == 'waiting':
            delta = timezone.now() - self.arrival_time
            return int(delta.total_seconds() / 60)
        return None
    
    @property
    def total_time(self):
        """Tiempo total en emergencias en minutos"""
        end_time = self.discharge_time or timezone.now()
        delta = end_time - self.arrival_time
        return int(delta.total_seconds() / 60)
    
    def __str__(self):
        return f"Emergencia {self.case_id} - {self.patient.get_full_name()}"


class EmergencyVitalSigns(models.Model):
    """Signos vitales específicos para emergencias"""
    emergency_case = models.ForeignKey(
        EmergencyCase,
        on_delete=models.CASCADE,
        related_name='vital_signs'
    )
    
    # Signos vitales
    blood_pressure_systolic = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(300)],
        null=True, blank=True
    )
    blood_pressure_diastolic = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(200)],
        null=True, blank=True
    )
    heart_rate = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(300)],
        null=True, blank=True
    )
    respiratory_rate = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(60)],
        null=True, blank=True
    )
    temperature = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(30.0), MaxValueValidator(45.0)],
        null=True, blank=True
    )
    oxygen_saturation = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True, blank=True
    )
    pain_scale = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True,
        help_text='Escala de dolor 0-10'
    )
    glasgow_coma_scale = models.IntegerField(
        validators=[MinValueValidator(3), MaxValueValidator(15)],
        null=True, blank=True,
        help_text='Escala de coma de Glasgow'
    )
    
    # Metadatos
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='emergency_vital_signs_recorded'
    )
    recorded_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Signos Vitales de Emergencia'
        verbose_name_plural = 'Signos Vitales de Emergencia'
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"Signos vitales - {self.emergency_case} - {self.recorded_at}"


class EmergencyMedication(models.Model):
    """Medicamentos administrados en emergencias"""
    emergency_case = models.ForeignKey(
        EmergencyCase,
        on_delete=models.CASCADE,
        related_name='medications'
    )
    medication = models.ForeignKey(
        'pharmacy.Medication',
        on_delete=models.PROTECT
    )
    
    # Detalles de administración
    dose = models.CharField(max_length=100)
    route = models.CharField(
        max_length=50,
        choices=[
            ('oral', 'Oral'),
            ('iv', 'Intravenosa'),
            ('im', 'Intramuscular'),
            ('sc', 'Subcutánea'),
            ('topical', 'Tópica'),
            ('inhalation', 'Inhalación'),
            ('other', 'Otra'),
        ]
    )
    administered_at = models.DateTimeField(default=timezone.now)
    administered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='emergency_medications_administered'
    )
    
    # Respuesta y observaciones
    response = models.TextField(blank=True, help_text='Respuesta del paciente al medicamento')
    adverse_reaction = models.BooleanField(default=False)
    adverse_reaction_details = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Medicamento de Emergencia'
        verbose_name_plural = 'Medicamentos de Emergencia'
        ordering = ['-administered_at']
    
    def __str__(self):
        return f"{self.medication.name} - {self.emergency_case}"


class EmergencyProcedure(models.Model):
    """Procedimientos realizados en emergencias"""
    emergency_case = models.ForeignKey(
        EmergencyCase,
        on_delete=models.CASCADE,
        related_name='procedures'
    )
    
    # Información del procedimiento
    procedure_name = models.CharField(max_length=200)
    procedure_code = models.CharField(max_length=50, blank=True)
    description = models.TextField()
    
    # Ejecución
    performed_at = models.DateTimeField(default=timezone.now)
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='emergency_procedures_performed'
    )
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Resultados
    outcome = models.CharField(
        max_length=50,
        choices=[
            ('successful', 'Exitoso'),
            ('partial', 'Parcialmente exitoso'),
            ('failed', 'Fallido'),
            ('aborted', 'Abortado'),
        ]
    )
    complications = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Procedimiento de Emergencia'
        verbose_name_plural = 'Procedimientos de Emergencia'
        ordering = ['-performed_at']
    
    def __str__(self):
        return f"{self.procedure_name} - {self.emergency_case}"


class EmergencyTransfer(models.Model):
    """Transferencias desde emergencias"""
    emergency_case = models.OneToOneField(
        EmergencyCase,
        on_delete=models.CASCADE,
        related_name='transfer'
    )
    
    # Destino
    transfer_type = models.CharField(
        max_length=50,
        choices=[
            ('ward', 'Sala general'),
            ('icu', 'UCI'),
            ('surgery', 'Quirófano'),
            ('other_hospital', 'Otro hospital'),
            ('specialist', 'Especialista'),
        ]
    )
    destination = models.CharField(max_length=200)
    reason = models.TextField()
    
    # Información de transferencia
    transfer_time = models.DateTimeField(default=timezone.now)
    arranged_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='emergency_transfers_arranged'
    )
    transport_mode = models.CharField(
        max_length=50,
        choices=[
            ('stretcher', 'Camilla'),
            ('wheelchair', 'Silla de ruedas'),
            ('ambulance', 'Ambulancia'),
            ('walking', 'Caminando'),
        ]
    )
    
    # Documentación
    transfer_notes = models.TextField()
    receiving_doctor = models.CharField(max_length=200, blank=True)
    
    class Meta:
        verbose_name = 'Transferencia de Emergencia'
        verbose_name_plural = 'Transferencias de Emergencia'
        ordering = ['-transfer_time']
    
    def __str__(self):
        return f"Transferencia {self.emergency_case} a {self.destination}"
