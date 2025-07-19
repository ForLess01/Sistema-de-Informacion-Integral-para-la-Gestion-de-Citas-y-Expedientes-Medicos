from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import uuid
from decimal import Decimal
from datetime import date, timedelta
from authentication.models import User


class Medication(models.Model):
    """Modelo para medicamentos en el inventario de la farmacia"""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    dosage_form = models.CharField(max_length=100, help_text='Forma farmacéutica')
    strength = models.CharField(max_length=50, help_text='Concentración')
    quantity_in_stock = models.PositiveIntegerField(default=0)
    reordering_threshold = models.PositiveIntegerField(default=10, help_text='Cantidad mínima para reordenar')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Medicamento'
        verbose_name_plural = 'Medicamentos'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} - {self.strength}"
    
    @property
    def needs_reorder(self):
        """Verifica si el medicamento necesita ser reordenado"""
        return self.quantity_in_stock <= self.reordering_threshold
    
    def update_stock(self, quantity, operation='subtract'):
        """Actualiza el stock del medicamento"""
        if operation == 'add':
            self.quantity_in_stock += quantity
        elif operation == 'subtract':
            if self.quantity_in_stock >= quantity:
                self.quantity_in_stock -= quantity
            else:
                raise ValidationError(f"Stock insuficiente. Disponible: {self.quantity_in_stock}")
        self.save()


class Dispensation(models.Model):
    """Registro de dispensación de medicamentos"""
    medication = models.ForeignKey(Medication, on_delete=models.PROTECT, related_name='dispensations')
    quantity = models.PositiveIntegerField()
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='dispensed_medications',
        limit_choices_to={'role': 'patient'}
    )
    pharmacist = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pharmacy_dispensations',
        limit_choices_to={'role': 'pharmacist'}
    )
    dispensed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Dispensación'
        verbose_name_plural = 'Dispensaciones'
        ordering = ['-dispensed_at']

    def __str__(self):
        return f"Dispensación de {self.medication.name} para {self.patient.get_full_name()}"
    
    def save(self, *args, **kwargs):
        """Actualiza el stock al guardar una dispensación"""
        if not self.pk:  # Solo en creación
            self.medication.update_stock(self.quantity, operation='subtract')
        super().save(*args, **kwargs)


class MedicationCategory(models.Model):
    """Categorías de medicamentos"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Categoría de Medicamento'
        verbose_name_plural = 'Categorías de Medicamentos'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class MedicationBatch(models.Model):
    """Lotes de medicamentos para control de inventario"""
    batch_number = models.CharField(max_length=100, unique=True)
    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        related_name='batches'
    )
    quantity = models.PositiveIntegerField()
    manufacturing_date = models.DateField()
    expiry_date = models.DateField()
    supplier = models.CharField(max_length=200)
    cost_per_unit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    received_date = models.DateTimeField(default=timezone.now)
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_batches'
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Lote de Medicamento'
        verbose_name_plural = 'Lotes de Medicamentos'
        ordering = ['-received_date']
        indexes = [
            models.Index(fields=['batch_number']),
            models.Index(fields=['expiry_date']),
        ]
    
    def clean(self):
        if self.expiry_date <= self.manufacturing_date:
            raise ValidationError('La fecha de expiración debe ser posterior a la fecha de fabricación')
    
    @property
    def is_expired(self):
        """Verifica si el lote está vencido"""
        return self.expiry_date < timezone.now().date()
    
    @property
    def days_until_expiry(self):
        """Días hasta la fecha de vencimiento"""
        delta = self.expiry_date - timezone.now().date()
        return delta.days
    
    def __str__(self):
        return f"Lote {self.batch_number} - {self.medication.name}"


class StockMovement(models.Model):
    """Movimientos de stock de medicamentos"""
    MOVEMENT_TYPES = [
        ('in', 'Entrada'),
        ('out', 'Salida'),
        ('adjustment', 'Ajuste'),
        ('return', 'Devolución'),
        ('expired', 'Vencido'),
    ]
    
    movement_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        related_name='stock_movements'
    )
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    batch = models.ForeignKey(
        MedicationBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movements'
    )
    reason = models.TextField()
    reference_number = models.CharField(max_length=100, blank=True)
    
    # Campos de auditoría
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='stock_movements'
    )
    performed_at = models.DateTimeField(default=timezone.now)
    
    # Stock antes y después del movimiento
    stock_before = models.IntegerField()
    stock_after = models.IntegerField()
    
    class Meta:
        verbose_name = 'Movimiento de Stock'
        verbose_name_plural = 'Movimientos de Stock'
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['medication', 'performed_at']),
            models.Index(fields=['movement_type']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.pk:
            self.stock_before = self.medication.quantity_in_stock
            if self.movement_type in ['in', 'return']:
                self.stock_after = self.stock_before + abs(self.quantity)
            else:
                self.stock_after = self.stock_before - abs(self.quantity)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.medication.name} - {self.quantity}"


class Inventory(models.Model):
    """Inventario de medicamentos"""
    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        related_name='inventory_records'
    )
    quantity = models.PositiveIntegerField()
    batch_number = models.CharField(max_length=100, unique=True)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiration_date = models.DateField()
    supplier = models.CharField(max_length=200, blank=True)
    purchase_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        null=True,
        blank=True
    )
    location = models.CharField(max_length=50, blank=True)
    minimum_stock = models.PositiveIntegerField(default=10)
    maximum_stock = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Inventario'
        verbose_name_plural = 'Inventarios'
        ordering = ['medication__name', 'expiration_date']
    
    def __str__(self):
        return f"{self.medication.name} - Lote: {self.batch_number}"
    
    def clean(self):
        if self.manufacturing_date and self.expiration_date <= self.manufacturing_date:
            raise ValidationError('La fecha de expiración debe ser posterior a la fecha de fabricación')
    
    @property
    def is_expired(self):
        """Verifica si el medicamento está vencido"""
        return self.expiration_date < date.today()
    
    @property
    def days_until_expiration(self):
        """Calcula los días restantes hasta la expiración"""
        delta = self.expiration_date - date.today()
        return delta.days
    
    def is_low_stock(self):
        """Verifica si el stock está por debajo del mínimo"""
        return self.quantity < self.minimum_stock
    
    def is_expiring_soon(self, days=30):
        """Verifica si el medicamento está próximo a vencer"""
        return 0 < self.days_until_expiration <= days
    
    @property
    def reorder_quantity(self):
        """Calcula la cantidad a reordenar para llegar al stock máximo"""
        return self.maximum_stock - self.quantity
    
    def reduce_stock(self, quantity, reason):
        """Reduce el stock del inventario"""
        if quantity > self.quantity:
            raise ValidationError(f"No hay suficiente stock. Disponible: {self.quantity}")
        self.quantity -= quantity
        self.save()
        # Registrar movimiento
        StockMovement.objects.create(
            medication=self.medication,
            movement_type='out',
            quantity=quantity,
            batch=self,
            reason=reason,
            stock_before=self.quantity + quantity,
            stock_after=self.quantity
        )
        return self.quantity
    
    def increase_stock(self, quantity, reason):
        """Aumenta el stock del inventario"""
        self.quantity += quantity
        self.save()
        # Registrar movimiento
        StockMovement.objects.create(
            medication=self.medication,
            movement_type='in',
            quantity=quantity,
            batch=self,
            reason=reason,
            stock_before=self.quantity - quantity,
            stock_after=self.quantity
        )
        return self.quantity


class Prescription(models.Model):
    """Modelo para prescripciones médicas"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('dispensed', 'Dispensado'),
        ('partially_dispensed', 'Parcialmente Dispensado'),
        ('cancelled', 'Cancelado'),
        ('expired', 'Expirado'),
    ]
    
    prescription_number = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='pharmacy_prescriptions',
        limit_choices_to={'role': 'patient'}
    )
    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='pharmacy_issued_prescriptions',
        limit_choices_to={'role': 'doctor'}
    )
    diagnosis = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    dispensed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    valid_days = models.PositiveIntegerField(default=30, help_text='Días de validez')
    
    class Meta:
        verbose_name = 'Prescripción'
        verbose_name_plural = 'Prescripciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Prescripción #{self.prescription_number} - {self.patient.get_full_name()}"
    
    def save(self, *args, **kwargs):
        # Generar número de prescripción automáticamente
        if not self.prescription_number:
            prefix = 'RX'
            date_str = timezone.now().strftime('%y%m%d')
            last_rx = Prescription.objects.filter(
                prescription_number__startswith=f"{prefix}{date_str}"
            ).order_by('prescription_number').last()
            
            if last_rx:
                last_num = int(last_rx.prescription_number[8:])
                self.prescription_number = f"{prefix}{date_str}{last_num+1:04d}"
            else:
                self.prescription_number = f"{prefix}{date_str}0001"
        
        super().save(*args, **kwargs)
    
    def clean(self):
        # Validar que no se puede dispensar una prescripción sin items
        if self.status == 'dispensed' and not self.items.exists():
            raise ValidationError('No se puede dispensar una prescripción sin medicamentos')
    
    @property
    def is_expired(self):
        """Verifica si la prescripción ha expirado"""
        expiry_date = self.created_at + timedelta(days=self.valid_days)
        return timezone.now() > expiry_date
    
    @property
    def total_amount(self):
        """Calcula el monto total de la prescripción"""
        total = Decimal('0.00')
        for item in self.items.all():
            total += item.medication.unit_price * item.quantity
        return total


class PrescriptionItem(models.Model):
    """Items individuales de una prescripción"""
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name='items'
    )
    medication = models.ForeignKey(
        Medication,
        on_delete=models.PROTECT,
        related_name='prescription_items'
    )
    quantity = models.PositiveIntegerField()
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration_days = models.PositiveIntegerField(null=True, blank=True)
    instructions = models.TextField(blank=True)
    dispensed = models.BooleanField(default=False)
    dispensed_quantity = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = 'Item de Prescripción'
        verbose_name_plural = 'Items de Prescripción'
    
    def __str__(self):
        return f"{self.medication.name} - {self.dosage}"
    
    @property
    def total_doses(self):
        """Calcula el número total de dosis basado en frecuencia y duración"""
        if not self.duration_days:
            return None
            
        # Interpretar frecuencia
        if 'cada 8 horas' in self.frequency.lower() or '8h' in self.frequency.lower():
            doses_per_day = 3
        elif 'cada 12 horas' in self.frequency.lower() or '12h' in self.frequency.lower():
            doses_per_day = 2
        elif 'cada 24 horas' in self.frequency.lower() or 'diario' in self.frequency.lower():
            doses_per_day = 1
        elif 'cada 6 horas' in self.frequency.lower() or '6h' in self.frequency.lower():
            doses_per_day = 4
        else:
            # Por defecto, asumimos una dosis diaria
            doses_per_day = 1
            
        return doses_per_day * self.duration_days


class PharmacyReport(models.Model):
    """Reportes de farmacia"""
    REPORT_TYPES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('inventory', 'Inventario'),
        ('expiry', 'Próximos a vencer'),
    ]
    
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    generated_date = models.DateTimeField(default=timezone.now)
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pharmacy_reports'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    report_data = models.JSONField(default=dict)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Reporte de Farmacia'
        verbose_name_plural = 'Reportes de Farmacia'
        ordering = ['-generated_date']
    
    def __str__(self):
        return f"Reporte {self.get_report_type_display()} - {self.generated_date.strftime('%Y-%m-%d')}"
