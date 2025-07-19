from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import logging

from appointments.models import Appointment
from authentication.models import User
from .services import notification_service
from .models import NotificationPreference

logger = logging.getLogger(__name__)

User = get_user_model()


@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """
    Crea preferencias de notificación por defecto para usuarios nuevos
    """
    if created:
        try:
            NotificationPreference.objects.create(user=instance)
            logger.info(f"Created notification preferences for user {instance.id}")
        except Exception as e:
            logger.error(f"Error creating notification preferences for user {instance.id}: {str(e)}")


@receiver(post_save, sender=Appointment)
def handle_appointment_created(sender, instance, created, **kwargs):
    """
    Maneja las notificaciones cuando se crea o actualiza una cita
    """
    if created:
        # Cita creada - enviar confirmación
        try:
            notifications = notification_service.create_appointment_confirmation(instance)
            logger.info(f"Created {len(notifications)} confirmation notifications for appointment {instance.appointment_id}")
            
            # Crear recordatorio automático (24 horas antes)
            reminder_notifications = notification_service.create_appointment_reminder(instance)
            logger.info(f"Created {len(reminder_notifications)} reminder notifications for appointment {instance.appointment_id}")
            
        except Exception as e:
            logger.error(f"Error creating notifications for appointment {instance.appointment_id}: {str(e)}")
    
    else:
        # Cita actualizada - verificar cambios de estado
        try:
            # Obtener la instancia anterior para comparar cambios
            original_instance = Appointment.objects.get(pk=instance.pk)
            
            # Verificar si el estado cambió a 'confirmed'
            if (hasattr(instance, '_state') and 
                instance.status == 'confirmed' and 
                original_instance.status != 'confirmed'):
                
                # Enviar notificación de confirmación
                notifications = notification_service.create_appointment_confirmation(instance)
                logger.info(f"Created {len(notifications)} confirmation notifications for appointment {instance.appointment_id}")
            
            # Verificar si el estado cambió a 'cancelled'
            elif (hasattr(instance, '_state') and 
                  instance.status == 'cancelled' and 
                  original_instance.status != 'cancelled'):
                
                # Enviar notificación de cancelación
                notifications = notification_service.create_appointment_cancellation(instance)
                logger.info(f"Created {len(notifications)} cancellation notifications for appointment {instance.appointment_id}")
            
            # Verificar si cambió la fecha/hora (reprogramación)
            elif (original_instance.appointment_date != instance.appointment_date or 
                  original_instance.appointment_time != instance.appointment_time):
                
                # Enviar notificación de reprogramación
                context_data = {
                    'patient_name': instance.patient.get_full_name(),
                    'doctor_name': instance.doctor.get_full_name(),
                    'old_date': original_instance.appointment_date.strftime('%d/%m/%Y'),
                    'old_time': original_instance.appointment_time.strftime('%H:%M'),
                    'new_date': instance.appointment_date.strftime('%d/%m/%Y'),
                    'new_time': instance.appointment_time.strftime('%H:%M'),
                    'specialty': instance.specialty.name if instance.specialty else '',
                    'reason': instance.reason,
                    'appointment_id': str(instance.appointment_id),
                }
                
                notifications = notification_service.create_notification(
                    recipient=instance.patient,
                    notification_type='appointment_reschedule',
                    context_data=context_data,
                    related_object=instance,
                    priority='high'
                )
                logger.info(f"Created {len(notifications)} reschedule notifications for appointment {instance.appointment_id}")
                
                # Crear nuevo recordatorio para la nueva fecha
                reminder_notifications = notification_service.create_appointment_reminder(instance)
                logger.info(f"Created {len(reminder_notifications)} reminder notifications for rescheduled appointment {instance.appointment_id}")
        
        except Exception as e:
            logger.error(f"Error handling appointment update for {instance.appointment_id}: {str(e)}")


@receiver(post_save, sender=Appointment)
def create_appointment_reminder_signal(sender, instance, created, **kwargs):
    """
    Crea recordatorios automáticos para citas (separado del handler principal)
    """
    if created and instance.status == 'scheduled':
        try:
            # Asegurarse de que appointment_datetime sea timezone-aware
            appointment_datetime = instance.appointment_datetime
            if timezone.is_naive(appointment_datetime):
                appointment_datetime = timezone.make_aware(appointment_datetime)
            
            # Crear recordatorio 24 horas antes
            reminder_24h = timezone.now() + timedelta(hours=24)
            if appointment_datetime > reminder_24h:
                notification_service.create_appointment_reminder(
                    instance, 
                    reminder_time=appointment_datetime - timedelta(hours=24)
                )
            
            # Crear recordatorio 2 horas antes (solo para citas importantes)
            if hasattr(instance, 'priority') and instance.priority in ['high', 'urgent']:
                reminder_2h = timezone.now() + timedelta(hours=2)
                if appointment_datetime > reminder_2h:
                    notification_service.create_appointment_reminder(
                        instance, 
                        reminder_time=appointment_datetime - timedelta(hours=2)
                    )
            
        except Exception as e:
            logger.error(f"Error creating appointment reminders for {instance.appointment_id}: {str(e)}")


# Señales para otros módulos (para futuras implementaciones)

@receiver(post_save, sender='medical_records.MedicalRecord')
def handle_medical_record_created(sender, instance, created, **kwargs):
    """
    Maneja notificaciones cuando se crea un expediente médico
    """
    if created:
        try:
            # Notificar al paciente sobre nuevo expediente
            context_data = {
                'patient_name': instance.patient.get_full_name(),
                'doctor_name': instance.doctor.get_full_name(),
                'date': instance.created_at.strftime('%d/%m/%Y'),
                'diagnosis': instance.diagnosis[:100] + '...' if len(instance.diagnosis) > 100 else instance.diagnosis,
            }
            
            notifications = notification_service.create_notification(
                recipient=instance.patient,
                notification_type='exam_results',
                context_data=context_data,
                related_object=instance,
                priority='normal'
            )
            logger.info(f"Created {len(notifications)} medical record notifications for patient {instance.patient.id}")
            
        except Exception as e:
            logger.error(f"Error creating medical record notification: {str(e)}")


@receiver(post_save, sender='pharmacy.Dispensation')
def handle_dispensation_ready(sender, instance, created, **kwargs):
    """
    Maneja notificaciones cuando se dispensa un medicamento
    """
    if created:
        try:
            context_data = {
                'patient_name': instance.patient.get_full_name(),
                'pharmacy_name': 'Farmacia del Hospital',
                'dispensation_id': str(instance.id),
                'medication': instance.medication.name,
                'quantity': instance.quantity,
                'dispensed_date': instance.dispensed_at.strftime('%d/%m/%Y'),
            }
            
            notifications = notification_service.create_notification(
                recipient=instance.patient,
                notification_type='prescription_ready',
                context_data=context_data,
                related_object=instance,
                priority='normal'
            )
            logger.info(f"Created {len(notifications)} prescription ready notifications for patient {instance.patient.id}")
            
        except Exception as e:
            logger.error(f"Error creating prescription ready notification: {str(e)}")


@receiver(post_save, sender='emergency.EmergencyCase')
def handle_emergency_alert(sender, instance, created, **kwargs):
    """
    Maneja alertas de emergencia
    """
    if created and instance.triage_level in [1, 2]:  # Niveles críticos de triaje
        try:
            # Notificar a todos los doctores de emergencia
            emergency_doctors = User.objects.filter(
                role='doctor',
                is_active=True,
                # Asumiendo que hay un campo para doctores de emergencia
                # departments__name='Emergency'
            )
            
            context_data = {
                'patient_name': instance.patient.get_full_name(),
                'triage_level': instance.get_triage_level_display() if instance.triage_level else 'Sin evaluar',
                'chief_complaint': instance.chief_complaint[:100] + '...' if len(instance.chief_complaint) > 100 else instance.chief_complaint,
                'arrival_time': instance.arrival_time.strftime('%H:%M'),
                'case_id': str(instance.case_id),
            }
            
            for doctor in emergency_doctors:
                notifications = notification_service.create_notification(
                    recipient=doctor,
                    notification_type='emergency_alert',
                    context_data=context_data,
                    related_object=instance,
                    priority='urgent'
                )
                logger.info(f"Created emergency alert notification for doctor {doctor.id}")
            
        except Exception as e:
            logger.error(f"Error creating emergency alert notifications: {str(e)}")


# Señales para mantenimiento del sistema

@receiver(post_save, sender=User)
def send_welcome_notification(sender, instance, created, **kwargs):
    """
    Envía notificación de bienvenida a usuarios nuevos
    """
    if created and instance.role == 'patient':
        try:
            context_data = {
                'patient_name': instance.get_full_name(),
                'system_name': 'Sistema Médico Integral',
                'support_email': 'soporte@medicalsystem.com',
                'login_url': 'https://medicalsystem.com/login',
            }
            
            notifications = notification_service.create_notification(
                recipient=instance,
                notification_type='welcome',
                context_data=context_data,
                related_object=instance,
                priority='low'
            )
            logger.info(f"Created welcome notification for new patient {instance.id}")
            
        except Exception as e:
            logger.error(f"Error creating welcome notification for user {instance.id}: {str(e)}")


# Función para limpiar notificaciones antiguas (para ser llamada por un cron job)
def cleanup_old_notifications():
    """
    Limpia notificaciones antiguas (más de 30 días)
    """
    try:
        from .models import Notification, NotificationLog
        
        cutoff_date = timezone.now() - timedelta(days=30)
        
        # Eliminar notificaciones antiguas
        old_notifications = Notification.objects.filter(
            created_at__lt=cutoff_date,
            status__in=['sent', 'delivered', 'failed']
        )
        
        count = old_notifications.count()
        old_notifications.delete()
        
        logger.info(f"Cleaned up {count} old notifications")
        
        # Eliminar logs antiguos (más de 90 días)
        old_logs_cutoff = timezone.now() - timedelta(days=90)
        old_logs = NotificationLog.objects.filter(timestamp__lt=old_logs_cutoff)
        
        log_count = old_logs.count()
        old_logs.delete()
        
        logger.info(f"Cleaned up {log_count} old notification logs")
        
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {str(e)}")


# Función para estadísticas de notificaciones
def get_notification_stats():
    """
    Obtiene estadísticas de notificaciones
    """
    try:
        from .models import Notification
        from django.db.models import Count, Q
        
        stats = Notification.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            sent=Count('id', filter=Q(status='sent')),
            delivered=Count('id', filter=Q(status='delivered')),
            failed=Count('id', filter=Q(status='failed')),
            email=Count('id', filter=Q(channel='email')),
            sms=Count('id', filter=Q(channel='sms')),
            push=Count('id', filter=Q(channel='push')),
            in_app=Count('id', filter=Q(channel='in_app')),
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {str(e)}")
        return {}
