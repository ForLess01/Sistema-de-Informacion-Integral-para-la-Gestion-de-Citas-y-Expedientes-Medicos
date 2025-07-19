from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.utils import timezone
from .fields import EncryptedCharField
from .managers import UserEncryptedManager
import uuid


class UserManager(BaseUserManager):
    """Manager personalizado para el modelo User"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        
        email = self.normalize_email(email)
        # Si no se proporciona username, usar la parte antes del @ del email
        if 'username' not in extra_fields:
            extra_fields['username'] = email.split('@')[0]
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Modelo de usuario personalizado"""
    ROLE_CHOICES = [
        ('patient', 'Paciente'),
        ('doctor', 'Doctor'),
        ('nurse', 'Enfermero/a'),
        ('receptionist', 'Recepcionista'),
        ('admin', 'Administrador'),
        ('pharmacist', 'Farmaceutico'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    
    # Campos básicos
    user_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    
    # Información personal
    dni = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[0-9]+$', 'Solo se permiten números')],
        verbose_name='DNI'
    )
    identification_number = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[0-9]+$', 'Solo se permiten números')],
        verbose_name='Número de identificación'
    )
    birth_date = models.DateField(null=True, blank=True, verbose_name='Fecha de nacimiento')
    date_of_birth = models.DateField(null=True, blank=True, verbose_name='Fecha de nacimiento')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, verbose_name='Género')
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(r'^[+]?[0-9]+$', 'Ingrese un número válido')],
        verbose_name='Teléfono'
    )
    emergency_phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r'^[+]?[0-9]+$', 'Ingrese un número válido')],
        verbose_name='Teléfono de emergencia'
    )
    emergency_contact_name = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name='Nombre de contacto de emergencia'
    )
    emergency_contact_phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r'^[+]?[0-9]+$', 'Ingrese un número válido')],
        verbose_name='Teléfono de contacto de emergencia'
    )
    
    # Dirección
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=10, blank=True)
    
    # Información del sistema
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Foto de perfil
    profile_picture = models.ImageField(
        upload_to='profile_pictures/%Y/%m/%d/',
        blank=True,
        null=True
    )
    
    # 2FA Fields
    two_factor_enabled = models.BooleanField(default=False, verbose_name='2FA Habilitado')
    two_factor_secret = models.CharField(max_length=32, blank=True, verbose_name='Secreto 2FA')
    backup_tokens = models.JSONField(default=list, blank=True, verbose_name='Tokens de respaldo')
    
    # Manager
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'dni']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['last_name', 'first_name']
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_short_name(self):
        return self.first_name
    
    def __str__(self):
        return self.get_full_name()
    
    @property
    def age(self):
        """Calcula la edad del usuario basado en su fecha de nacimiento"""
        if not self.date_of_birth and not self.birth_date:
            return None
        
        dob = self.date_of_birth or self.birth_date
        from datetime import datetime
        today = datetime.now().date()
        age = today.year - dob.year
        
        # Verificar si ya pasó el cumpleaños este año
        if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
            age -= 1
            
        return age
    
    def delete(self, *args, **kwargs):
        """Implementa borrado suave marcando como inactivo en lugar de eliminar"""
        # Verificar si es borrado permanente
        permanent = kwargs.pop('permanent', False)
        
        if permanent:
            # Borrado real en la base de datos
            return super().delete(*args, **kwargs)
        else:
            # Borrado suave - solo marcar como inactivo
            self.is_active = False
            self.save()
            return (1, {'authentication.User': 1})


class DoctorProfile(models.Model):
    """Perfil adicional para doctores"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='doctor_profile',
        limit_choices_to={'role': 'doctor'}
    )
    license_number = models.CharField(
        max_length=50,
        unique=True,
        help_text='Número de cédula profesional'
    )
    specialties = models.ManyToManyField(
        'appointments.Specialty',
        related_name='doctors'
    )
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Costo de consulta'
    )
    bio = models.TextField(blank=True, help_text='Biografía profesional')
    years_of_experience = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Doctor'
        verbose_name_plural = 'Perfiles de Doctores'
    
    def __str__(self):
        return f"Dr. {self.user.get_full_name()}"


class PatientProfile(models.Model):
    """Perfil adicional para pacientes"""
    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        limit_choices_to={'role': 'patient'}
    )
    blood_type = models.CharField(
        max_length=3,
        choices=BLOOD_TYPE_CHOICES,
        blank=True
    )
    allergies = models.TextField(blank=True, help_text='Lista de alergias conocidas')
    chronic_conditions = models.TextField(blank=True, help_text='Condiciones crónicas')
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)
    insurance_provider = models.CharField(max_length=100, blank=True)
    insurance_policy_number = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Paciente'
        verbose_name_plural = 'Perfiles de Pacientes'
    
    def __str__(self):
        return f"Paciente: {self.user.get_full_name()}"


class LoginAttempt(models.Model):
    """Registro de intentos de login"""
    email = models.EmailField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    success = models.BooleanField(default=False)
    attempted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Intento de Login'
        verbose_name_plural = 'Intentos de Login'
        ordering = ['-attempted_at']
    
    def __str__(self):
        status = 'Exitoso' if self.success else 'Fallido'
        return f"{self.email} - {status} - {self.attempted_at}"
