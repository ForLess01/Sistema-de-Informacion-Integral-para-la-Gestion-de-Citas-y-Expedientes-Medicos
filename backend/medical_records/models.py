from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.utils import timezone
import uuid

User = get_user_model()


class MedicalRecord(models.Model):
    """Modelo para almacenar registros médicos de pacientes"""
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='medical_records',
        limit_choices_to={'role': 'patient'}
    )
    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_by',
        limit_choices_to={'role': 'doctor'}
    )
    record_date = models.DateField(default=timezone.now)
    description = models.TextField()
    diagnosis = models.TextField()
    treatment = models.TextField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Registro Médico'
        verbose_name_plural = 'Registros Médicos'
        ordering = ['-record_date', '-created_at']

    def __str__(self):
        return f"Registro de {self.patient.get_full_name()} - {self.record_date}"


class Prescription(models.Model):
    """Modelo para gestionar recetas médicas"""
    prescription_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='medical_prescriptions',
        limit_choices_to={'role': 'patient'}
    )
    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='medical_issued_prescriptions',
        limit_choices_to={'role': 'doctor'}
    )
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        null=True,
        blank=True
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='prescriptions',
        null=True,
        blank=True
    )
    issue_date = models.DateTimeField(default=timezone.now)
    valid_until = models.DateField()
    diagnosis = models.TextField()
    instructions = models.TextField(help_text="Instrucciones generales para el paciente")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Receta Médica'
        verbose_name_plural = 'Recetas Médicas'
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['patient', 'is_active']),
            models.Index(fields=['doctor', 'issue_date']),
        ]

    def __str__(self):
        return f"Receta {self.prescription_id} - {self.patient.get_full_name()}"

    @property
    def is_expired(self):
        return timezone.now().date() > self.valid_until


class PrescriptionItem(models.Model):
    """Modelo para los items individuales de una receta"""
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name='items'
    )
    medication = models.ForeignKey(
        'pharmacy.Medication',
        on_delete=models.PROTECT
    )
    dosage = models.CharField(max_length=100, help_text="Ej: 500mg")
    frequency = models.CharField(max_length=100, help_text="Ej: Cada 8 horas")
    duration = models.CharField(max_length=100, help_text="Ej: Por 7 días")
    quantity = models.PositiveIntegerField(help_text="Cantidad total a dispensar")
    instructions = models.TextField(
        blank=True,
        help_text="Instrucciones específicas para este medicamento"
    )
    is_dispensed = models.BooleanField(default=False)
    dispensed_at = models.DateTimeField(null=True, blank=True)
    dispensed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dispensed_items',
        limit_choices_to={'role': 'pharmacist'}
    )

    class Meta:
        verbose_name = 'Item de Receta'
        verbose_name_plural = 'Items de Receta'
        ordering = ['id']

    def __str__(self):
        return f"{self.medication.name} - {self.dosage}"

    def mark_as_dispensed(self, pharmacist):
        """Marca el item como dispensado"""
        self.is_dispensed = True
        self.dispensed_at = timezone.now()
        self.dispensed_by = pharmacist
        self.save()


class VitalSigns(models.Model):
    """Modelo para registrar signos vitales"""
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='vital_signs',
        limit_choices_to={'role': 'patient'}
    )
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_vital_signs'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='vital_signs',
        null=True,
        blank=True
    )
    
    # Signos vitales
    blood_pressure_systolic = models.IntegerField(
        validators=[MinValueValidator(60), MaxValueValidator(250)],
        help_text="Presión sistólica en mmHg"
    )
    blood_pressure_diastolic = models.IntegerField(
        validators=[MinValueValidator(40), MaxValueValidator(150)],
        help_text="Presión diastólica en mmHg"
    )
    heart_rate = models.IntegerField(
        validators=[MinValueValidator(30), MaxValueValidator(250)],
        help_text="Frecuencia cardíaca en latidos por minuto"
    )
    respiratory_rate = models.IntegerField(
        validators=[MinValueValidator(8), MaxValueValidator(60)],
        help_text="Frecuencia respiratoria por minuto"
    )
    temperature = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(35.0), MaxValueValidator(42.0)],
        help_text="Temperatura en grados Celsius"
    )
    oxygen_saturation = models.IntegerField(
        validators=[MinValueValidator(70), MaxValueValidator(100)],
        help_text="Saturación de oxígeno en porcentaje"
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.5), MaxValueValidator(500)],
        help_text="Peso en kilogramos"
    )
    height = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(30), MaxValueValidator(250)],
        help_text="Altura en centímetros"
    )
    
    recorded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Signos Vitales'
        verbose_name_plural = 'Signos Vitales'
        ordering = ['-recorded_at']

    def __str__(self):
        return f"Signos vitales de {self.patient.get_full_name()} - {self.recorded_at}"

    @property
    def bmi(self):
        """Calcula el índice de masa corporal"""
        if self.weight and self.height:
            height_m = float(self.height) / 100
            return round(float(self.weight) / (height_m ** 2), 2)
        return None

    @property
    def blood_pressure(self):
        """Retorna la presión arterial como string"""
        return f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}"


class Allergy(models.Model):
    """Modelo para registrar alergias de pacientes"""
    ALLERGEN_TYPE_CHOICES = [
        ('medication', 'Medicamento'),
        ('food', 'Alimento'),
        ('environmental', 'Ambiental'),
        ('other', 'Otro'),
    ]
    
    SEVERITY_CHOICES = [
        ('mild', 'Leve'),
        ('moderate', 'Moderada'),
        ('severe', 'Severa'),
        ('life_threatening', 'Amenaza la vida'),
    ]
    
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='allergies',
        limit_choices_to={'role': 'patient'}
    )
    allergen = models.CharField(
        max_length=200,
        help_text="Sustancia que causa la alergia"
    )
    allergen_type = models.CharField(
        max_length=50,
        choices=ALLERGEN_TYPE_CHOICES
    )
    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES
    )
    reaction = models.TextField(
        help_text="Descripción de la reacción alérgica"
    )
    first_observed = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_allergies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Alergia'
        verbose_name_plural = 'Alergias'
        ordering = ['-severity', 'allergen']
        unique_together = ['patient', 'allergen']

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.allergen} ({self.get_severity_display()})"


class LabTest(models.Model):
    """Modelo para gestionar exámenes de laboratorio"""
    STATUS_CHOICES = [
        ('ordered', 'Ordenado'),
        ('sample_collected', 'Muestra Recolectada'),
        ('in_progress', 'En Proceso'),
        ('completed', 'Completado'),
        ('cancelled', 'Cancelado'),
    ]
    
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgente'),
    ]
    
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lab_tests',
        limit_choices_to={'role': 'patient'}
    )
    ordered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='ordered_lab_tests',
        limit_choices_to={'role': 'doctor'}
    )
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name='lab_tests',
        null=True,
        blank=True
    )
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='lab_tests',
        null=True,
        blank=True
    )
    
    test_name = models.CharField(max_length=200)
    test_code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ordered'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal'
    )
    
    ordered_date = models.DateTimeField(default=timezone.now)
    collection_date = models.DateTimeField(null=True, blank=True)
    result_date = models.DateTimeField(null=True, blank=True)
    
    results = models.TextField(blank=True)
    normal_range = models.CharField(max_length=100, blank=True)
    result_file = models.FileField(
        upload_to='lab_results/%Y/%m/%d/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['pdf', 'jpg', 'jpeg', 'png'])]
    )
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Examen de Laboratorio'
        verbose_name_plural = 'Exámenes de Laboratorio'
        ordering = ['-ordered_date']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['ordered_date']),
        ]

    def __str__(self):
        return f"{self.test_name} - {self.patient.get_full_name()} ({self.get_status_display()})"

    def update_status(self, new_status):
        """Actualiza el estado del examen"""
        self.status = new_status
        if new_status == 'sample_collected':
            self.collection_date = timezone.now()
        elif new_status == 'completed':
            self.result_date = timezone.now()
        self.save()


class MedicalDocument(models.Model):
    """Modelo para almacenar documentos médicos asociados a registros"""
    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_name = models.CharField(max_length=255)
    document_file = models.FileField(
        upload_to='medical_documents/%Y/%m/%d/',
        validators=[FileExtensionValidator(['pdf', 'jpg', 'jpeg', 'png'])]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Documento Médico'
        verbose_name_plural = 'Documentos Médicos'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.document_name} - {self.record.patient.get_full_name()}"
