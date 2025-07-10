from celery import shared_task
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


@shared_task
def generate_report_task(report_id):
    """Tarea para generar un reporte de manera asíncrona"""
    from .models import GeneratedReport
    from .generators import (
        AppointmentReportGenerator, MedicationReportGenerator,
        EmergencyReportGenerator, FinancialReportGenerator,
        OccupancyReportGenerator
    )
    
    try:
        report = GeneratedReport.objects.get(id=report_id)
        
        # Seleccionar el generador correcto según el tipo de reporte
        generators = {
            'appointments': AppointmentReportGenerator,
            'medications': MedicationReportGenerator,
            'emergency': EmergencyReportGenerator,
            'financial': FinancialReportGenerator,
            'occupancy': OccupancyReportGenerator,
        }
        
        generator_class = generators.get(report.report_type)
        if not generator_class:
            # Para otros tipos, usar un generador genérico
            from .generators import BaseReportGenerator
            generator_class = BaseReportGenerator
        
        # Generar el reporte
        generator = generator_class(report)
        generator.generate()
        
        # Enviar notificación por email si está configurado
        if report.generated_by.email:
            send_report_notification.delay(report_id)
        
        logger.info(f"Reporte {report_id} generado exitosamente")
        
    except Exception as e:
        logger.error(f"Error generando reporte {report_id}: {str(e)}")
        raise


@shared_task
def send_report_notification(report_id):
    """Enviar notificación por email cuando un reporte está listo"""
    from .models import GeneratedReport
    
    try:
        report = GeneratedReport.objects.get(id=report_id)
        
        if report.status != 'completed':
            return
        
        # Preparar email
        subject = f"Tu reporte está listo: {report.name}"
        
        context = {
            'report': report,
            'download_url': f"{settings.FRONTEND_WEB_URL}/reports/{report.report_id}/download"
        }
        
        html_message = render_to_string('emails/report_ready.html', context)
        text_message = f"""
        Hola {report.generated_by.first_name},
        
        Tu reporte "{report.name}" está listo para descargar.
        
        Puedes descargarlo desde el siguiente enlace:
        {context['download_url']}
        
        El reporte estará disponible hasta el {report.expires_at.strftime('%d/%m/%Y')}.
        
        Saludos,
        Sistema Médico
        """
        
        email = EmailMessage(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[report.generated_by.email],
        )
        email.content_subtype = "html"
        email.body = html_message
        
        email.send()
        
        logger.info(f"Notificación enviada para reporte {report_id}")
        
    except Exception as e:
        logger.error(f"Error enviando notificación para reporte {report_id}: {str(e)}")


@shared_task
def process_scheduled_reports():
    """Procesar reportes programados que deben ejecutarse"""
    from .models import ScheduledReport, GeneratedReport
    from django.utils import timezone
    
    now = timezone.now()
    
    # Buscar reportes programados que deben ejecutarse
    scheduled_reports = ScheduledReport.objects.filter(
        is_active=True,
        next_run__lte=now
    )
    
    for scheduled in scheduled_reports:
        try:
            # Crear reporte
            report = GeneratedReport.objects.create(
                template=scheduled.template,
                name=f"{scheduled.name} - {now.strftime('%Y-%m-%d')}",
                report_type=scheduled.template.report_type,
                format=scheduled.format,
                parameters={},
                generated_by=scheduled.created_by,
                status='pending'
            )
            
            # Generar reporte
            generate_report_task.delay(report.id)
            
            # Actualizar próxima ejecución
            scheduled.last_run = now
            scheduled.calculate_next_run()
            scheduled.save()
            
            # Enviar por email si está configurado
            if scheduled.recipients and scheduled.include_in_email:
                send_scheduled_report_email.delay(report.id, scheduled.id)
            
            logger.info(f"Reporte programado {scheduled.id} procesado")
            
        except Exception as e:
            logger.error(f"Error procesando reporte programado {scheduled.id}: {str(e)}")


@shared_task
def send_scheduled_report_email(report_id, scheduled_id):
    """Enviar reporte programado por email a los destinatarios"""
    from .models import GeneratedReport, ScheduledReport
    
    try:
        report = GeneratedReport.objects.get(id=report_id)
        scheduled = ScheduledReport.objects.get(id=scheduled_id)
        
        if report.status != 'completed' or not report.file:
            # Reintentar más tarde si el reporte no está listo
            send_scheduled_report_email.apply_async(
                args=[report_id, scheduled_id],
                countdown=300  # Reintentar en 5 minutos
            )
            return
        
        # Preparar email
        subject = f"Reporte Programado: {scheduled.name}"
        
        context = {
            'scheduled': scheduled,
            'report': report,
        }
        
        html_message = render_to_string('emails/scheduled_report.html', context)
        text_message = f"""
        Reporte Programado: {scheduled.name}
        
        Se adjunta el reporte programado correspondiente al período {report.start_date} - {report.end_date}.
        
        Este es un reporte automático generado por el sistema.
        
        Saludos,
        Sistema Médico
        """
        
        email = EmailMessage(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=scheduled.recipients,
        )
        email.content_subtype = "html"
        email.body = html_message
        
        # Adjuntar archivo
        if scheduled.include_in_email:
            email.attach_file(report.file.path)
        
        email.send()
        
        logger.info(f"Reporte programado {scheduled_id} enviado por email")
        
    except Exception as e:
        logger.error(f"Error enviando reporte programado {scheduled_id}: {str(e)}")


@shared_task
def cleanup_expired_reports():
    """Limpiar reportes expirados"""
    from .models import GeneratedReport
    from django.utils import timezone
    
    # Buscar reportes expirados
    expired_reports = GeneratedReport.objects.filter(
        expires_at__lt=timezone.now(),
        status='completed'
    )
    
    count = 0
    for report in expired_reports:
        try:
            # Eliminar archivo
            if report.file:
                report.file.delete()
            
            # Marcar como expirado
            report.status = 'expired'
            report.save()
            
            count += 1
            
        except Exception as e:
            logger.error(f"Error limpiando reporte {report.id}: {str(e)}")
    
    logger.info(f"Se limpiaron {count} reportes expirados")
    
    return count
