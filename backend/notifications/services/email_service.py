import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import requests
import json

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Excepción personalizada para errores del servicio de email"""
    pass


class EmailService:
    """
    Servicio centralizado para envío de emails con soporte para múltiples proveedores
    Soporta: Django SMTP, SendGrid API, Gmail SMTP
    """
    
    def __init__(self):
        self.provider = getattr(settings, 'EMAIL_PROVIDER', 'django')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@medicalsystem.com')
        
        # Configuración específica por proveedor
        if self.provider == 'sendgrid':
            self.api_key = getattr(settings, 'SENDGRID_API_KEY', '')
            if not self.api_key:
                logger.warning("SendGrid API key not configured, falling back to Django SMTP")
                self.provider = 'django'
    
    def send_email(
        self, 
        to_emails: List[str], 
        subject: str, 
        message: str, 
        html_message: Optional[str] = None,
        from_email: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Envía un email usando el proveedor configurado
        
        Args:
            to_emails: Lista de emails destino
            subject: Asunto del email
            message: Contenido en texto plano
            html_message: Contenido HTML (opcional)
            from_email: Email remitente (opcional, usa DEFAULT_FROM_EMAIL por defecto)
            attachments: Lista de archivos adjuntos (opcional)
            
        Returns:
            bool: True si se envió exitosamente, False en caso contrario
        """
        try:
            from_email = from_email or self.from_email
            
            if self.provider == 'sendgrid':
                return self._send_with_sendgrid(to_emails, subject, message, html_message, from_email, attachments)
            else:
                return self._send_with_django(to_emails, subject, message, html_message, from_email, attachments)
                
        except Exception as e:
            logger.error(f"Error enviando email: {e}")
            raise EmailServiceError(f"Failed to send email: {str(e)}")
    
    def _send_with_django(
        self, 
        to_emails: List[str], 
        subject: str, 
        message: str, 
        html_message: Optional[str],
        from_email: str,
        attachments: Optional[List[Dict[str, Any]]]
    ) -> bool:
        """Envía email usando Django SMTP"""
        try:
            if html_message or attachments:
                # Usar EmailMultiAlternatives para HTML y adjuntos
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=message,
                    from_email=from_email,
                    to=to_emails
                )
                
                if html_message:
                    email.attach_alternative(html_message, "text/html")
                
                if attachments:
                    for attachment in attachments:
                        email.attach(
                            attachment['filename'],
                            attachment['content'],
                            attachment.get('mimetype', 'application/octet-stream')
                        )
                
                email.send()
            else:
                # Usar send_mail simple para texto plano
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email,
                    recipient_list=to_emails,
                    fail_silently=False
                )
            
            logger.info(f"Email enviado exitosamente a {', '.join(to_emails)} usando Django SMTP")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando email con Django SMTP: {e}")
            return False
    
    def _send_with_sendgrid(
        self, 
        to_emails: List[str], 
        subject: str, 
        message: str, 
        html_message: Optional[str],
        from_email: str,
        attachments: Optional[List[Dict[str, Any]]]
    ) -> bool:
        """Envía email usando SendGrid API"""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
            
            sg = sendgrid.SendGridAPIClient(api_key=self.api_key)
            
            # Crear el mensaje
            mail = Mail(
                from_email=from_email,
                to_emails=to_emails,
                subject=subject,
                plain_text_content=message,
                html_content=html_message
            )
            
            # Agregar adjuntos si existen
            if attachments:
                for attachment in attachments:
                    encoded_content = encoders.encode_base64(attachment['content']).decode()
                    attached_file = Attachment(
                        FileContent(encoded_content),
                        FileName(attachment['filename']),
                        FileType(attachment.get('mimetype', 'application/octet-stream')),
                        Disposition('attachment')
                    )
                    mail.attachment = attached_file
            
            response = sg.send(mail)
            
            if response.status_code in [200, 202]:
                logger.info(f"Email enviado exitosamente a {', '.join(to_emails)} usando SendGrid")
                return True
            else:
                logger.error(f"Error enviando email con SendGrid: {response.body}")
                return False
                
        except ImportError:
            logger.error("SendGrid library not installed. Install with: pip install sendgrid")
            return False
        except Exception as e:
            logger.error(f"Error enviando email con SendGrid: {e}")
            return False
    
    def send_template_email(
        self, 
        to_emails: List[str], 
        template_name: str, 
        context: Dict[str, Any],
        subject: str,
        from_email: Optional[str] = None
    ) -> bool:
        """
        Envía un email usando un template HTML
        
        Args:
            to_emails: Lista de emails destino
            template_name: Nombre del template (sin extensión)
            context: Variables para el template
            subject: Asunto del email
            from_email: Email remitente (opcional)
            
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            # Renderizar template HTML
            html_message = render_to_string(f'emails/{template_name}.html', context)
            
            # Crear versión texto plano del HTML
            plain_message = strip_tags(html_message)
            
            return self.send_email(
                to_emails=to_emails,
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=from_email
            )
            
        except Exception as e:
            logger.error(f"Error enviando email con template {template_name}: {e}")
            raise EmailServiceError(f"Failed to send template email: {str(e)}")
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Prueba la conexión del servicio de email
        
        Returns:
            Dict con el resultado de la prueba
        """
        try:
            test_result = {
                'provider': self.provider,
                'success': False,
                'message': '',
                'details': {}
            }
            
            if self.provider == 'sendgrid':
                # Probar SendGrid API
                if not self.api_key:
                    test_result['message'] = 'SendGrid API key not configured'
                    return test_result
                
                # Hacer una petición de prueba a SendGrid
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                }
                
                response = requests.get(
                    'https://api.sendgrid.com/v3/user/account',
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    test_result['success'] = True
                    test_result['message'] = 'SendGrid connection successful'
                    test_result['details'] = {'account': response.json()}
                else:
                    test_result['message'] = f'SendGrid API error: {response.status_code}'
                    test_result['details'] = {'error': response.text}
                    
            else:
                # Probar configuración Django SMTP
                backend_class = getattr(settings, 'EMAIL_BACKEND', '')
                
                if 'console' in backend_class.lower():
                    # Console backend siempre funciona
                    test_result['success'] = True
                    test_result['message'] = 'Django Console Email Backend (development mode)'
                    test_result['details'] = {
                        'backend': backend_class,
                        'mode': 'console',
                        'note': 'Emails se muestran en la consola para desarrollo'
                    }
                else:
                    # Probar conexión SMTP real
                    from django.core.mail import get_connection
                    
                    connection = get_connection(fail_silently=False)
                    connection.open()
                    
                    if hasattr(connection, 'connection') and connection.connection is not None:
                        test_result['success'] = True
                        test_result['message'] = 'Django SMTP connection successful'
                        test_result['details'] = {
                            'host': getattr(settings, 'EMAIL_HOST', ''),
                            'port': getattr(settings, 'EMAIL_PORT', ''),
                            'use_tls': getattr(settings, 'EMAIL_USE_TLS', False),
                            'use_ssl': getattr(settings, 'EMAIL_USE_SSL', False)
                        }
                    else:
                        test_result['message'] = 'Failed to establish SMTP connection'
                    
                    connection.close()
            
            return test_result
            
        except Exception as e:
            return {
                'provider': self.provider,
                'success': False,
                'message': f'Connection test failed: {str(e)}',
                'details': {'error': str(e)}
            }


# Funciones de conveniencia
def send_notification_email(to_emails: List[str], subject: str, message: str, **kwargs) -> bool:
    """Función de conveniencia para enviar emails de notificación"""
    service = EmailService()
    return service.send_email(to_emails, subject, message, **kwargs)


def send_appointment_reminder(patient_email: str, appointment_data: Dict[str, Any]) -> bool:
    """Envía recordatorio de cita médica"""
    service = EmailService()
    
    subject = f"Recordatorio: Cita médica el {appointment_data.get('date', 'N/A')}"
    
    context = {
        'patient_name': appointment_data.get('patient_name', ''),
        'doctor_name': appointment_data.get('doctor_name', ''),
        'specialty': appointment_data.get('specialty', ''),
        'date': appointment_data.get('date', ''),
        'time': appointment_data.get('time', ''),
        'location': appointment_data.get('location', ''),
        'instructions': appointment_data.get('instructions', '')
    }
    
    return service.send_template_email(
        to_emails=[patient_email],
        template_name='appointment_reminder',
        context=context,
        subject=subject
    )


def send_appointment_confirmation(patient_email: str, appointment_data: Dict[str, Any]) -> bool:
    """Envía confirmación de cita agendada"""
    service = EmailService()
    
    subject = f"Confirmación: Cita médica agendada para el {appointment_data.get('date', 'N/A')}"
    
    context = {
        'patient_name': appointment_data.get('patient_name', ''),
        'doctor_name': appointment_data.get('doctor_name', ''),
        'specialty': appointment_data.get('specialty', ''),
        'date': appointment_data.get('date', ''),
        'time': appointment_data.get('time', ''),
        'location': appointment_data.get('location', ''),
        'confirmation_code': appointment_data.get('confirmation_code', '')
    }
    
    return service.send_template_email(
        to_emails=[patient_email],
        template_name='appointment_confirmation',
        context=context,
        subject=subject
    )


def test_email_service() -> Dict[str, Any]:
    """Prueba el servicio de email"""
    service = EmailService()
    return service.test_connection()
