from django.core.mail import send_mail, EmailMultiAlternatives
from django.template import Template, Context
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from datetime import timedelta
import logging
import json
import requests
from typing import Dict, Any, Optional, List
from .models import (
    Notification, 
    NotificationTemplate, 
    NotificationPreference,
    NotificationLog,
    PushDevice
)

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """Servicio principal para manejo de notificaciones"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.sms_service = SMSService()
        self.push_service = PushService()
        self.in_app_service = InAppService()
    
    def create_notification(
        self,
        recipient: User,
        notification_type: str,
        context_data: Dict[str, Any] = None,
        related_object: Any = None,
        priority: str = 'normal',
        scheduled_for: timezone.datetime = None,
        channels: List[str] = None
    ) -> List[Notification]:
        """
        Crea una o más notificaciones para un usuario
        
        Args:
            recipient: Usuario destinatario
            notification_type: Tipo de notificación
            context_data: Datos para renderizar la plantilla
            related_object: Objeto relacionado (cita, examen, etc.)
            priority: Prioridad de la notificación
            scheduled_for: Cuándo enviar la notificación
            channels: Canales específicos, si no se especifica usa las preferencias del usuario
        
        Returns:
            Lista de notificaciones creadas
        """
        try:
            # Obtener preferencias del usuario
            preferences = self._get_user_preferences(recipient)
            
            # Determinar canales a usar
            if channels is None:
                channels = self._get_enabled_channels(preferences, notification_type)
            
            # Obtener plantillas para cada canal
            templates = NotificationTemplate.objects.filter(
                notification_type=notification_type,
                channel__in=channels,
                is_active=True
            )
            
            notifications = []
            
            for template in templates:
                # Verificar si el canal está habilitado para el usuario
                if not preferences.is_channel_enabled(template.channel):
                    continue
                
                # Verificar si el tipo de notificación está habilitado
                if not preferences.is_notification_type_enabled(notification_type):
                    continue
                
                # Crear la notificación
                notification = self._create_notification_instance(
                    recipient=recipient,
                    template=template,
                    context_data=context_data or {},
                    related_object=related_object,
                    priority=priority,
                    scheduled_for=scheduled_for
                )
                
                notifications.append(notification)
                
                # Crear log
                NotificationLog.objects.create(
                    notification=notification,
                    action='created',
                    details=f'Notification created for {recipient.get_full_name()}'
                )
            
            return notifications
            
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            raise
    
    def send_notification(self, notification: Notification) -> bool:
        """
        Envía una notificación individual
        
        Args:
            notification: Instancia de notificación
            
        Returns:
            True si se envió exitosamente, False en caso contrario
        """
        try:
            # Verificar si la notificación está lista para enviar
            if not notification.is_ready_to_send():
                return False
            
            # Seleccionar servicio según el canal
            service_map = {
                'email': self.email_service,
                'sms': self.sms_service,
                'push': self.push_service,
                'in_app': self.in_app_service,
            }
            
            service = service_map.get(notification.channel)
            if not service:
                raise ValueError(f"Unsupported channel: {notification.channel}")
            
            # Enviar notificación
            success = service.send(notification)
            
            if success:
                notification.mark_as_sent()
                NotificationLog.objects.create(
                    notification=notification,
                    action='sent',
                    details=f'Notification sent via {notification.channel}'
                )
            else:
                notification.mark_as_failed('Failed to send notification')
                NotificationLog.objects.create(
                    notification=notification,
                    action='failed',
                    details=f'Failed to send notification via {notification.channel}'
                )
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending notification {notification.notification_id}: {str(e)}")
            notification.mark_as_failed(str(e))
            return False
    
    def send_pending_notifications(self) -> Dict[str, int]:
        """
        Envía todas las notificaciones pendientes
        
        Returns:
            Diccionario con estadísticas del envío
        """
        stats = {
            'sent': 0,
            'failed': 0,
            'skipped': 0
        }
        
        # Obtener notificaciones pendientes
        pending_notifications = Notification.objects.filter(
            status='pending',
            scheduled_for__lte=timezone.now()
        ).order_by('priority', 'scheduled_for')
        
        for notification in pending_notifications:
            # Verificar horas silenciosas
            preferences = self._get_user_preferences(notification.recipient)
            if preferences.is_quiet_hours() and notification.priority not in ['high', 'urgent']:
                stats['skipped'] += 1
                continue
            
            success = self.send_notification(notification)
            if success:
                stats['sent'] += 1
            else:
                stats['failed'] += 1
        
        return stats
    
    def retry_failed_notifications(self) -> Dict[str, int]:
        """
        Reintenta enviar notificaciones fallidas
        
        Returns:
            Diccionario con estadísticas del reintento
        """
        stats = {
            'retried': 0,
            'sent': 0,
            'failed': 0
        }
        
        # Obtener notificaciones fallidas que pueden reintentarse
        failed_notifications = Notification.objects.filter(
            status='failed',
            attempts__lt=models.F('max_attempts')
        )
        
        for notification in failed_notifications:
            if notification.can_retry():
                stats['retried'] += 1
                success = self.send_notification(notification)
                
                NotificationLog.objects.create(
                    notification=notification,
                    action='retry',
                    details=f'Retry attempt {notification.attempts}'
                )
                
                if success:
                    stats['sent'] += 1
                else:
                    stats['failed'] += 1
        
        return stats
    
    def create_appointment_reminder(
        self,
        appointment,
        reminder_time: timezone.datetime = None
    ) -> List[Notification]:
        """
        Crea recordatorios para una cita
        
        Args:
            appointment: Instancia de cita
            reminder_time: Cuándo enviar el recordatorio
            
        Returns:
            Lista de notificaciones creadas
        """
        if reminder_time is None:
            # Recordatorio 24 horas antes
            reminder_time = appointment.appointment_datetime - timedelta(hours=24)
        
        context_data = {
            'patient_name': appointment.patient.get_full_name(),
            'doctor_name': appointment.doctor.get_full_name(),
            'appointment_date': appointment.appointment_date.strftime('%d/%m/%Y'),
            'appointment_time': appointment.appointment_time.strftime('%H:%M'),
            'specialty': appointment.specialty.name if appointment.specialty else '',
            'reason': appointment.reason,
            'appointment_id': str(appointment.appointment_id),
        }
        
        return self.create_notification(
            recipient=appointment.patient,
            notification_type='appointment_reminder',
            context_data=context_data,
            related_object=appointment,
            priority='high',
            scheduled_for=reminder_time
        )
    
    def create_appointment_confirmation(self, appointment) -> List[Notification]:
        """Crea confirmación de cita"""
        context_data = {
            'patient_name': appointment.patient.get_full_name(),
            'doctor_name': appointment.doctor.get_full_name(),
            'appointment_date': appointment.appointment_date.strftime('%d/%m/%Y'),
            'appointment_time': appointment.appointment_time.strftime('%H:%M'),
            'specialty': appointment.specialty.name if appointment.specialty else '',
            'reason': appointment.reason,
            'appointment_id': str(appointment.appointment_id),
        }
        
        return self.create_notification(
            recipient=appointment.patient,
            notification_type='appointment_confirmation',
            context_data=context_data,
            related_object=appointment,
            priority='normal'
        )
    
    def create_appointment_cancellation(self, appointment) -> List[Notification]:
        """Crea notificación de cancelación de cita"""
        context_data = {
            'patient_name': appointment.patient.get_full_name(),
            'doctor_name': appointment.doctor.get_full_name(),
            'appointment_date': appointment.appointment_date.strftime('%d/%m/%Y'),
            'appointment_time': appointment.appointment_time.strftime('%H:%M'),
            'specialty': appointment.specialty.name if appointment.specialty else '',
            'cancellation_reason': appointment.cancellation_reason,
            'appointment_id': str(appointment.appointment_id),
        }
        
        return self.create_notification(
            recipient=appointment.patient,
            notification_type='appointment_cancellation',
            context_data=context_data,
            related_object=appointment,
            priority='high'
        )
    
    def _get_user_preferences(self, user: User) -> NotificationPreference:
        """Obtiene las preferencias de notificación del usuario"""
        preferences, created = NotificationPreference.objects.get_or_create(user=user)
        return preferences
    
    def _get_enabled_channels(self, preferences: NotificationPreference, notification_type: str) -> List[str]:
        """Obtiene los canales habilitados para un tipo de notificación"""
        channels = []
        
        if preferences.is_notification_type_enabled(notification_type):
            if preferences.email_enabled:
                channels.append('email')
            if preferences.sms_enabled:
                channels.append('sms')
            if preferences.push_enabled:
                channels.append('push')
            if preferences.in_app_enabled:
                channels.append('in_app')
        
        return channels
    
    def _create_notification_instance(
        self,
        recipient: User,
        template: NotificationTemplate,
        context_data: Dict[str, Any],
        related_object: Any,
        priority: str,
        scheduled_for: timezone.datetime
    ) -> Notification:
        """Crea una instancia de notificación"""
        
        # Renderizar plantillas
        subject = self._render_template(template.subject_template, context_data)
        message = self._render_template(template.body_template, context_data)
        
        # Obtener información del objeto relacionado
        content_type = None
        object_id = None
        if related_object:
            content_type = ContentType.objects.get_for_model(related_object)
            object_id = related_object.pk
        
        # Obtener información de contacto
        recipient_email = recipient.email if hasattr(recipient, 'email') else ''
        recipient_phone = getattr(recipient, 'phone', '') or getattr(recipient, 'phone_number', '')
        
        # Crear notificación
        notification = Notification.objects.create(
            recipient=recipient,
            template=template,
            content_type=content_type,
            object_id=object_id,
            subject=subject,
            message=message,
            context_data=context_data,
            channel=template.channel,
            priority=priority,
            scheduled_for=scheduled_for or timezone.now(),
            recipient_email=recipient_email,
            recipient_phone=recipient_phone
        )
        
        return notification
    
    def _render_template(self, template_string: str, context_data: Dict[str, Any]) -> str:
        """Renderiza una plantilla con datos de contexto"""
        if not template_string:
            return ''
        
        template = Template(template_string)
        context = Context(context_data)
        return template.render(context)


class EmailService:
    """Servicio para envío de emails"""
    
    def send(self, notification: Notification) -> bool:
        """Envía un email"""
        try:
            if not notification.recipient_email:
                logger.warning(f"No email address for notification {notification.notification_id}")
                return False
            
            # Crear email
            if notification.template.is_html:
                email = EmailMultiAlternatives(
                    subject=notification.subject,
                    body=notification.message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[notification.recipient_email]
                )
                email.attach_alternative(notification.message, "text/html")
            else:
                success = send_mail(
                    subject=notification.subject,
                    message=notification.message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[notification.recipient_email],
                    fail_silently=False
                )
                return success == 1
            
            email.send()
            return True
            
        except Exception as e:
            logger.error(f"Error sending email for notification {notification.notification_id}: {str(e)}")
            return False


class SMSService:
    """Servicio para envío de SMS"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'SMS_API_KEY', '')
        self.api_url = getattr(settings, 'SMS_API_URL', '')
        self.enabled = bool(self.api_key and self.api_url)
    
    def send(self, notification: Notification) -> bool:
        """Envía un SMS"""
        try:
            if not self.enabled:
                logger.warning("SMS service not configured")
                return False
            
            if not notification.recipient_phone:
                logger.warning(f"No phone number for notification {notification.notification_id}")
                return False
            
            # Preparar datos para API
            data = {
                'to': notification.recipient_phone,
                'message': notification.message,
                'from': getattr(settings, 'SMS_FROM_NUMBER', 'Medical System')
            }
            
            # Enviar SMS via API
            response = requests.post(
                self.api_url,
                json=data,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return True
            else:
                logger.error(f"SMS API error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending SMS for notification {notification.notification_id}: {str(e)}")
            return False


class PushService:
    """Servicio para notificaciones push"""
    
    def __init__(self):
        self.firebase_key = getattr(settings, 'FIREBASE_SERVER_KEY', '')
        self.firebase_url = 'https://fcm.googleapis.com/fcm/send'
        self.enabled = bool(self.firebase_key)
    
    def send(self, notification: Notification) -> bool:
        """Envía una notificación push"""
        try:
            if not self.enabled:
                logger.warning("Push service not configured")
                return False
            
            # Obtener dispositivos del usuario
            devices = PushDevice.objects.filter(
                user=notification.recipient,
                is_active=True
            )
            
            if not devices.exists():
                logger.warning(f"No push devices for user {notification.recipient.id}")
                return False
            
            success_count = 0
            
            for device in devices:
                success = self._send_to_device(notification, device)
                if success:
                    success_count += 1
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error sending push notification {notification.notification_id}: {str(e)}")
            return False
    
    def _send_to_device(self, notification: Notification, device: PushDevice) -> bool:
        """Envía notificación a un dispositivo específico"""
        try:
            headers = {
                'Authorization': f'key={self.firebase_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'to': device.device_token,
                'notification': {
                    'title': notification.subject,
                    'body': notification.message,
                    'sound': 'default',
                    'priority': 'high' if notification.priority in ['high', 'urgent'] else 'normal'
                },
                'data': {
                    'notification_id': str(notification.notification_id),
                    'type': notification.template.notification_type,
                    'priority': notification.priority
                }
            }
            
            response = requests.post(
                self.firebase_url,
                json=data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success', 0) > 0:
                    return True
                else:
                    # Token inválido, desactivar dispositivo
                    if 'InvalidRegistration' in str(result.get('results', [])):
                        device.is_active = False
                        device.save()
                    return False
            else:
                logger.error(f"Push API error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending push to device {device.id}: {str(e)}")
            return False


class InAppService:
    """Servicio para notificaciones in-app"""
    
    def send(self, notification: Notification) -> bool:
        """
        Para notificaciones in-app, simplemente marcamos como enviada
        ya que se almacenan en la base de datos y se muestran en la interfaz
        """
        try:
            # Las notificaciones in-app se almacenan en la base de datos
            # y se marcan como enviadas automáticamente
            return True
            
        except Exception as e:
            logger.error(f"Error processing in-app notification {notification.notification_id}: {str(e)}")
            return False


# Instancia global del servicio
notification_service = NotificationService()
