from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, retry_backoff=True, max_retries=3)
def send_notification_task(self, notification_id):
    """
    Tarea asíncrona para enviar una notificación individual
    
    Args:
        notification_id: ID de la notificación a enviar
    """
    try:
        from .models import Notification
        from .services import notification_service
        
        notification = Notification.objects.get(id=notification_id)
        
        # Verificar si la notificación ya fue enviada
        if notification.status != 'pending':
            logger.info(f"Notification {notification_id} already processed with status {notification.status}")
            return f"Notification {notification_id} already processed"
        
        # Enviar notificación
        success = notification_service.send_notification(notification)
        
        if success:
            logger.info(f"Successfully sent notification {notification_id}")
            return f"Successfully sent notification {notification_id}"
        else:
            logger.error(f"Failed to send notification {notification_id}")
            # Reintentar si es posible
            if notification.can_retry():
                raise Exception(f"Failed to send notification {notification_id}")
            else:
                return f"Failed to send notification {notification_id} - max retries exceeded"
                
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return f"Notification {notification_id} not found"
    
    except Exception as e:
        logger.error(f"Error sending notification {notification_id}: {str(e)}")
        # Reintentar con backoff exponencial
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task
def send_pending_notifications():
    """
    Tarea para enviar todas las notificaciones pendientes
    """
    try:
        from .services import notification_service
        
        stats = notification_service.send_pending_notifications()
        
        logger.info(f"Processed pending notifications: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error processing pending notifications: {str(e)}")
        raise


@shared_task
def retry_failed_notifications():
    """
    Tarea para reintentar notificaciones fallidas
    """
    try:
        from .services import notification_service
        
        stats = notification_service.retry_failed_notifications()
        
        logger.info(f"Retried failed notifications: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error retrying failed notifications: {str(e)}")
        raise


@shared_task
def send_appointment_reminders():
    """
    Tarea para enviar recordatorios de citas programadas
    """
    try:
        from .models import Notification
        from .services import notification_service
        
        # Obtener recordatorios de citas que deben enviarse
        now = timezone.now()
        reminders = Notification.objects.filter(
            template__notification_type='appointment_reminder',
            status='pending',
            scheduled_for__lte=now
        )
        
        stats = {
            'sent': 0,
            'failed': 0,
            'total': reminders.count()
        }
        
        for reminder in reminders:
            success = notification_service.send_notification(reminder)
            if success:
                stats['sent'] += 1
            else:
                stats['failed'] += 1
        
        logger.info(f"Sent appointment reminders: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error sending appointment reminders: {str(e)}")
        raise


@shared_task
def cleanup_old_notifications():
    """
    Tarea para limpiar notificaciones antiguas
    """
    try:
        from .signals import cleanup_old_notifications
        
        cleanup_old_notifications()
        logger.info("Cleaned up old notifications")
        return "Cleanup completed"
        
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {str(e)}")
        raise


@shared_task
def send_daily_digest():
    """
    Tarea para enviar resumen diario a usuarios que lo tengan habilitado
    """
    try:
        from django.contrib.auth import get_user_model
        from .models import NotificationPreference
        from .services import notification_service
        from appointments.models import Appointment
        from datetime import date
        
        User = get_user_model()
        
        # Obtener usuarios con digest habilitado
        users_with_digest = User.objects.filter(
            notification_preferences__email_enabled=True,
            notification_preferences__system_notifications=True,
            role='patient'
        )
        
        stats = {
            'sent': 0,
            'failed': 0,
            'total': users_with_digest.count()
        }
        
        for user in users_with_digest:
            try:
                # Obtener citas del usuario para mañana
                tomorrow = date.today() + timedelta(days=1)
                upcoming_appointments = Appointment.objects.filter(
                    patient=user,
                    appointment_date=tomorrow,
                    status__in=['scheduled', 'confirmed']
                )
                
                if upcoming_appointments.exists():
                    context_data = {
                        'patient_name': user.get_full_name(),
                        'date': tomorrow.strftime('%d/%m/%Y'),
                        'appointments': [
                            {
                                'time': apt.appointment_time.strftime('%H:%M'),
                                'doctor': apt.doctor.get_full_name(),
                                'specialty': apt.specialty.name if apt.specialty else 'Consulta General'
                            }
                            for apt in upcoming_appointments
                        ]
                    }
                    
                    notifications = notification_service.create_notification(
                        recipient=user,
                        notification_type='appointment_reminder',
                        context_data=context_data,
                        priority='normal',
                        channels=['email']
                    )
                    
                    if notifications:
                        stats['sent'] += 1
                    else:
                        stats['failed'] += 1
                        
            except Exception as e:
                logger.error(f"Error creating daily digest for user {user.id}: {str(e)}")
                stats['failed'] += 1
        
        logger.info(f"Sent daily digest: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error sending daily digest: {str(e)}")
        raise


@shared_task
def send_notification_batch(notification_ids):
    """
    Tarea para enviar un lote de notificaciones
    
    Args:
        notification_ids: Lista de IDs de notificaciones a enviar
    """
    try:
        from .models import Notification
        from .services import notification_service
        
        stats = {
            'sent': 0,
            'failed': 0,
            'total': len(notification_ids)
        }
        
        notifications = Notification.objects.filter(id__in=notification_ids, status='pending')
        
        for notification in notifications:
            success = notification_service.send_notification(notification)
            if success:
                stats['sent'] += 1
            else:
                stats['failed'] += 1
        
        logger.info(f"Sent notification batch: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error sending notification batch: {str(e)}")
        raise


@shared_task
def update_notification_stats():
    """
    Tarea para actualizar estadísticas de notificaciones
    """
    try:
        from .signals import get_notification_stats
        from django.core.cache import cache
        
        stats = get_notification_stats()
        
        # Guardar estadísticas en caché por 1 hora
        cache.set('notification_stats', stats, 3600)
        
        logger.info(f"Updated notification stats: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error updating notification stats: {str(e)}")
        raise


@shared_task
def send_emergency_notification(case_id):
    """
    Tarea de alta prioridad para enviar notificaciones de emergencia
    
    Args:
        case_id: ID del caso de emergencia
    """
    try:
        from emergency.models import EmergencyCase
        from django.contrib.auth import get_user_model
        from .services import notification_service
        
        User = get_user_model()
        
        case = EmergencyCase.objects.get(id=case_id)
        
        # Obtener todos los doctores de emergencia disponibles
        emergency_doctors = User.objects.filter(
            role='doctor',
            is_active=True,
            # Filtrar por departamento si está disponible
        )
        
        notifications_sent = 0
        
        for doctor in emergency_doctors:
            context_data = {
                'doctor_name': doctor.get_full_name(),
                'patient_name': case.patient.get_full_name(),
                'priority': case.get_priority_display(),
                'triage_level': case.triage_level,
                'symptoms': case.symptoms[:200],
                'arrival_time': case.arrival_time.strftime('%H:%M'),
                'case_id': str(case.id),
            }
            
            notifications = notification_service.create_notification(
                recipient=doctor,
                notification_type='emergency_alert',
                context_data=context_data,
                related_object=case,
                priority='urgent'
            )
            
            # Enviar inmediatamente
            for notification in notifications:
                notification_service.send_notification(notification)
                notifications_sent += 1
        
        logger.info(f"Sent {notifications_sent} emergency notifications for case {case_id}")
        return f"Sent {notifications_sent} emergency notifications"
        
    except Exception as e:
        logger.error(f"Error sending emergency notification for case {case_id}: {str(e)}")
        raise


@shared_task
def schedule_appointment_reminders(appointment_id):
    """
    Tarea para programar recordatorios de una cita específica
    
    Args:
        appointment_id: ID de la cita
    """
    try:
        from appointments.models import Appointment
        from .services import notification_service
        
        appointment = Appointment.objects.get(id=appointment_id)
        
        # Crear recordatorio 24 horas antes
        reminder_24h = appointment.appointment_datetime - timedelta(hours=24)
        if reminder_24h > timezone.now():
            notifications_24h = notification_service.create_appointment_reminder(
                appointment, 
                reminder_time=reminder_24h
            )
            logger.info(f"Scheduled 24h reminder for appointment {appointment_id}")
        
        # Crear recordatorio 2 horas antes para citas de alta prioridad
        if hasattr(appointment, 'priority') and appointment.priority in ['high', 'urgent']:
            reminder_2h = appointment.appointment_datetime - timedelta(hours=2)
            if reminder_2h > timezone.now():
                notifications_2h = notification_service.create_appointment_reminder(
                    appointment, 
                    reminder_time=reminder_2h
                )
                logger.info(f"Scheduled 2h reminder for high priority appointment {appointment_id}")
        
        return f"Scheduled reminders for appointment {appointment_id}"
        
    except Exception as e:
        logger.error(f"Error scheduling reminders for appointment {appointment_id}: {str(e)}")
        raise


@shared_task
def generate_notification_report():
    """
    Tarea para generar reporte de notificaciones
    """
    try:
        from .models import Notification, NotificationTemplate
        from django.db.models import Count, Q
        from datetime import date
        
        # Estadísticas del último mes
        last_month = timezone.now() - timedelta(days=30)
        
        # Resumen por estado
        status_stats = Notification.objects.filter(
            created_at__gte=last_month
        ).values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Resumen por canal
        channel_stats = Notification.objects.filter(
            created_at__gte=last_month
        ).values('channel').annotate(
            count=Count('id')
        ).order_by('channel')
        
        # Resumen por tipo
        type_stats = Notification.objects.filter(
            created_at__gte=last_month
        ).values('template__notification_type').annotate(
            count=Count('id')
        ).order_by('template__notification_type')
        
        # Tasa de éxito
        total_sent = Notification.objects.filter(
            created_at__gte=last_month,
            status__in=['sent', 'delivered']
        ).count()
        
        total_failed = Notification.objects.filter(
            created_at__gte=last_month,
            status='failed'
        ).count()
        
        success_rate = (total_sent / (total_sent + total_failed)) * 100 if (total_sent + total_failed) > 0 else 0
        
        report = {
            'period': f"Last 30 days (from {last_month.strftime('%Y-%m-%d')})",
            'total_notifications': total_sent + total_failed,
            'success_rate': round(success_rate, 2),
            'status_breakdown': list(status_stats),
            'channel_breakdown': list(channel_stats),
            'type_breakdown': list(type_stats),
            'generated_at': timezone.now().isoformat()
        }
        
        # Guardar en caché
        from django.core.cache import cache
        cache.set('notification_report', report, 86400)  # 24 horas
        
        logger.info(f"Generated notification report: {report}")
        return report
        
    except Exception as e:
        logger.error(f"Error generating notification report: {str(e)}")
        raise
