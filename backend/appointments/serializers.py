from rest_framework import serializers
from .models import Specialty, MedicalSchedule, Appointment, AppointmentReminder
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
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'appointment_id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                  'specialty', 'specialty_name', 'appointment_date', 'appointment_time',
                  'appointment_datetime', 'duration', 'status', 'status_display',
                  'reason', 'notes', 'cancelled_at', 'cancellation_reason',
                  'created_at', 'updated_at']
        read_only_fields = ['appointment_id', 'created_at', 'updated_at', 'cancelled_at']
    
    def validate(self, data):
        """Valida los datos de la cita"""
        # Validar que la fecha de la cita no sea en el pasado
        from datetime import datetime, date
        if 'appointment_date' in data and data['appointment_date'] < date.today():
            raise serializers.ValidationError("La fecha de la cita no puede ser en el pasado.")
        
        # Validar que el doctor tenga horario disponible
        if 'doctor' in data and 'appointment_date' in data and 'appointment_time' in data:
            weekday = data['appointment_date'].weekday()
            schedule = MedicalSchedule.objects.filter(
                doctor=data['doctor'],
                weekday=weekday,
                start_time__lte=data['appointment_time'],
                end_time__gte=data['appointment_time'],
                is_active=True
            ).exists()
            
            if not schedule:
                raise serializers.ValidationError(
                    "El doctor no tiene horario disponible en esa fecha y hora."
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
            'date': obj.appointment.appointment_date,
            'time': obj.appointment.appointment_time
        }


class AvailableSlotSerializer(serializers.Serializer):
    """Serializer para mostrar horarios disponibles"""
    time = serializers.TimeField()
    available = serializers.BooleanField()
    doctor_id = serializers.IntegerField(required=False)
    doctor_name = serializers.CharField(required=False)
