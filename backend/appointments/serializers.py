from rest_framework import serializers
from .models import Specialty, MedicalSchedule, Appointment, AppointmentReminder, TemporaryReservation
from django.contrib.auth import get_user_model

User = get_user_model()


class SpecialtySerializer(serializers.ModelSerializer):
    doctor_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Specialty
        fields = ['id', 'name', 'description', 'is_active', 'doctor_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_doctor_count(self, obj):
        """Cuenta el número de doctores activos en esta especialidad"""
        return MedicalSchedule.objects.filter(
            specialty=obj,
            is_active=True
        ).values('doctor').distinct().count()


class DoctorSerializer(serializers.ModelSerializer):
    specialty = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'specialty']
    
    def get_specialty(self, obj):
        """Obtiene las especialidades del doctor"""
        specialties = Specialty.objects.filter(
            schedules__doctor=obj,
            schedules__is_active=True
        ).distinct()
        return SpecialtySerializer(specialties, many=True).data


class MedicalScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    
    class Meta:
        model = MedicalSchedule
        fields = ['id', 'doctor', 'doctor_name', 'specialty', 'specialty_name',
                  'weekday', 'weekday_display', 'start_time', 'end_time',
                  'slot_duration', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    appointment_datetime = serializers.DateTimeField(read_only=True)
    date_time = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'appointment_id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                  'specialty', 'specialty_name', 'appointment_date', 'appointment_time',
                  'appointment_datetime', 'date_time', 'duration', 'status', 'status_display',
                  'reason', 'notes', 'cancelled_at', 'cancellation_reason',
                  'created_at', 'updated_at']
        read_only_fields = ['appointment_id', 'created_at', 'updated_at', 'cancelled_at']
    
    def get_date_time(self, obj):
        """Combina fecha y hora en un datetime para el frontend"""
        from datetime import datetime
        if obj.appointment_date and obj.appointment_time:
            return datetime.combine(obj.appointment_date, obj.appointment_time).isoformat()
        return None
    
    def validate(self, data):
        """Valida los datos de la cita"""
        # Validar que la fecha de la cita no sea en el pasado
        from datetime import datetime, date
        if 'appointment_date' in data and data['appointment_date'] < date.today():
            raise serializers.ValidationError("La fecha de la cita no puede ser en el pasado.")
        
        # Para la Fase 1, usamos validación simplificada con horarios predefinidos
        if 'doctor' in data and 'appointment_date' in data and 'appointment_time' in data:
            # Horarios disponibles básicos para la Fase 1 (todos los días)
            available_hours = {
                8: [0, 30],    # 08:00, 08:30
                9: [0, 30],    # 09:00, 09:30  
                10: [0, 30],   # 10:00, 10:30
                11: [0, 30],   # 11:00, 11:30
                14: [0, 30],   # 14:00, 14:30
                15: [0, 30],   # 15:00, 15:30
                16: [0, 30],   # 16:00, 16:30
                17: [0, 30],   # 17:00, 17:30
            }
            
            appointment_hour = data['appointment_time'].hour
            appointment_minute = data['appointment_time'].minute
            
            # Verificar si la hora está en el rango permitido
            if (appointment_hour not in available_hours or 
                appointment_minute not in available_hours[appointment_hour]):
                raise serializers.ValidationError(
                    "Hora no disponible. Los horarios disponibles son: 08:00-11:30 y 14:00-17:30 (cada 30 minutos)."
                )
            
            # Validación adicional: verificar disponibilidad real del doctor
            # (En fases posteriores esto consultará el horario real del doctor)
            weekday = data['appointment_date'].weekday()
            
            # Para fines de semana, agregar una nota pero permitir la cita
            if weekday >= 5:  # 5=sábado, 6=domingo
                # En lugar de error, agregar una advertencia en los metadatos
                # La cita se creará pero quedará como "pendiente de confirmación"
                pass  # Permitir la creación
            
            # Verificar que no haya conflicto con otras citas del mismo doctor
            existing_appointment = Appointment.objects.filter(
                doctor=data['doctor'],
                appointment_date=data['appointment_date'],
                appointment_time=data['appointment_time'],
                status__in=['scheduled', 'confirmed']
            ).exists()
            
            if existing_appointment:
                raise serializers.ValidationError(
                    "El doctor ya tiene una cita programada en esa fecha y hora."
                )
        
        return data


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear citas con validación adicional"""
    class Meta:
        model = Appointment
        fields = ['patient', 'doctor', 'specialty', 'appointment_date', 
                  'appointment_time', 'duration', 'reason', 'notes']
    
    def create(self, validated_data):
        appointment = super().create(validated_data)
        # Crear recordatorio automático
        from datetime import datetime, timedelta
        reminder_time = datetime.combine(
            appointment.appointment_date,
            appointment.appointment_time
        ) - timedelta(hours=24)
        
        AppointmentReminder.objects.create(
            appointment=appointment,
            reminder_type='email',
            scheduled_for=reminder_time
        )
        return appointment


class AppointmentReminderSerializer(serializers.ModelSerializer):
    appointment_info = serializers.SerializerMethodField()
    reminder_type_display = serializers.CharField(source='get_reminder_type_display', read_only=True)
    
    class Meta:
        model = AppointmentReminder
        fields = ['id', 'appointment', 'appointment_info', 'reminder_type',
                  'reminder_type_display', 'scheduled_for', 'sent_at',
                  'is_sent', 'error_message', 'created_at']
        read_only_fields = ['created_at', 'sent_at']
    
    def get_appointment_info(self, obj):
        """Obtiene información resumida de la cita"""
        return {
            'appointment_id': str(obj.appointment.appointment_id),
            'patient': obj.appointment.patient.get_full_name(),
            'doctor': obj.appointment.doctor.get_full_name(),
            'date': obj.appointment.appointment_date.isoformat(),
            'time': obj.appointment.appointment_time.isoformat()
        }


class TemporaryReservationSerializer(serializers.ModelSerializer):
    """Serializer para reservas temporales"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    time_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    def validate(self, data):
        """Validaciones personalizadas"""
        print(f"🔍 SERIALIZER DEBUG - Datos a validar: {data}")
        
        # Verificar que el doctor existe
        if 'doctor' in data:
            # Si ya es un objeto User, obtener su ID
            if isinstance(data['doctor'], User):
                doctor = data['doctor']
                print(f"✅ Doctor ya es objeto: {doctor.get_full_name()} (ID: {doctor.id})")
            else:
                # Si es un ID, buscar el objeto
                try:
                    doctor = User.objects.get(id=data['doctor'])
                    print(f"✅ Doctor encontrado: {doctor.get_full_name()} (ID: {doctor.id})")
                except User.DoesNotExist:
                    print(f"❌ Doctor no encontrado: {data['doctor']}")
                    raise serializers.ValidationError({"doctor": "Doctor no encontrado"})
        
        # Verificar que la especialidad existe
        if 'specialty' in data:
            # Si ya es un objeto Specialty, obtener su ID
            if isinstance(data['specialty'], Specialty):
                specialty = data['specialty']
                print(f"✅ Especialidad ya es objeto: {specialty.name} (ID: {specialty.id})")
            else:
                # Si es un ID, buscar el objeto
                try:
                    specialty = Specialty.objects.get(id=data['specialty'])
                    print(f"✅ Especialidad encontrada: {specialty.name} (ID: {specialty.id})")
                except Specialty.DoesNotExist:
                    print(f"❌ Especialidad no encontrada: {data['specialty']}")
                    raise serializers.ValidationError({"specialty": "Especialidad no encontrada"})
        
        return data
    
    class Meta:
        model = TemporaryReservation
        fields = ['id', 'user', 'user_name', 'doctor', 'doctor_name', 'specialty', 
                 'specialty_name', 'appointment_date', 'appointment_time', 'expires_at',
                 'time_remaining', 'is_expired', 'is_active', 'created_at']
        read_only_fields = ['created_at', 'user', 'expires_at', 'user_name']
    
    def get_time_remaining(self, obj):
        """Calcula el tiempo restante en segundos"""
        from django.utils import timezone
        if not obj.is_active:
            return 0
        
        now = timezone.now()
        if now >= obj.expires_at:
            return 0
        
        delta = obj.expires_at - now
        return int(delta.total_seconds())
    
    def get_is_expired(self, obj):
        """Verifica si la reserva ha expirado"""
        return obj.is_expired()


class AvailableSlotSerializer(serializers.Serializer):
    """Serializer para mostrar horarios disponibles"""
    time = serializers.TimeField()
    available = serializers.BooleanField()
    doctor_id = serializers.IntegerField(required=False)
    doctor_name = serializers.CharField(required=False)
