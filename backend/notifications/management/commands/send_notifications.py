from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
import logging

from notifications.models import Notification
from notifications.services import notification_service

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Comando para enviar notificaciones pendientes
    
    Uso:
        python manage.py send_notifications
        python manage.py send_notifications --all
        python manage.py send_notifications --type appointment_reminder
        python manage.py send_notifications --priority high
    """
    
    help = 'Envía notificaciones pendientes'
    
    def add_arguments(self, parser):
        """Agregar argumentos al comando"""
        parser.add_argument(
            '--all',
            action='store_true',
            help='Enviar todas las notificaciones pendientes, incluso las futuras'
        )
        
        parser.add_argument(
            '--type',
            type=str,
            help='Filtrar por tipo de notificación'
        )
        
        parser.add_argument(
            '--priority',
            type=str,
            choices=['low', 'normal', 'high', 'urgent'],
            help='Filtrar por prioridad'
        )
        
        parser.add_argument(
            '--channel',
            type=str,
            choices=['email', 'sms', 'push', 'in_app'],
            help='Filtrar por canal'
        )
        
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Número máximo de notificaciones a procesar (default: 100)'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué notificaciones se enviarían sin enviarlas realmente'
        )
    
    def handle(self, *args, **options):
        """Ejecutar el comando"""
        
        # Construir queryset base
        queryset = Notification.objects.filter(status='pending')
        
        # Aplicar filtros
        if not options['all']:
            # Solo notificaciones que deben enviarse ahora
            queryset = queryset.filter(scheduled_for__lte=timezone.now())
        
        if options['type']:
            queryset = queryset.filter(template__notification_type=options['type'])
        
        if options['priority']:
            queryset = queryset.filter(priority=options['priority'])
        
        if options['channel']:
            queryset = queryset.filter(channel=options['channel'])
        
        # Ordenar por prioridad y fecha
        queryset = queryset.order_by(
            '-priority',  # urgente > high > normal > low
            'scheduled_for'
        )
        
        # Aplicar límite
        if options['limit']:
            queryset = queryset[:options['limit']]
        
        # Contar notificaciones
        total_count = queryset.count()
        
        if total_count == 0:
            self.stdout.write(
                self.style.WARNING('No hay notificaciones pendientes para enviar')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f'Encontradas {total_count} notificaciones para enviar')
        )
        
        if options['dry_run']:
            self.show_dry_run(queryset)
            return
        
        # Enviar notificaciones
        stats = {
            'sent': 0,
            'failed': 0,
            'skipped': 0
        }
        
        for notification in queryset:
            try:
                # Verificar horas silenciosas para notificaciones de baja prioridad
                preferences = notification.recipient.notification_preferences
                if (preferences.is_quiet_hours() and 
                    notification.priority in ['low', 'normal']):
                    stats['skipped'] += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'Saltando notificación {notification.notification_id} - horas silenciosas'
                        )
                    )
                    continue
                
                # Enviar notificación
                success = notification_service.send_notification(notification)
                
                if success:
                    stats['sent'] += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Enviada: {notification.notification_id} '
                            f'({notification.channel}) a {notification.recipient.get_full_name()}'
                        )
                    )
                else:
                    stats['failed'] += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f'✗ Falló: {notification.notification_id} '
                            f'({notification.channel}) - {notification.error_message}'
                        )
                    )
                    
            except Exception as e:
                stats['failed'] += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Error: {notification.notification_id} - {str(e)}'
                    )
                )
                logger.error(f'Error sending notification {notification.notification_id}: {str(e)}')
        
        # Mostrar resumen
        self.show_summary(stats)
    
    def show_dry_run(self, queryset):
        """Mostrar qué se haría en un dry run"""
        self.stdout.write(
            self.style.WARNING('DRY RUN - Las siguientes notificaciones se enviarían:')
        )
        
        for notification in queryset:
            self.stdout.write(
                f'  • {notification.notification_id} | '
                f'{notification.get_priority_display()} | '
                f'{notification.channel} | '
                f'{notification.recipient.get_full_name()} | '
                f'{notification.template.get_notification_type_display()} | '
                f'Programada: {notification.scheduled_for}'
            )
    
    def show_summary(self, stats):
        """Mostrar resumen de resultados"""
        total = stats['sent'] + stats['failed'] + stats['skipped']
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('RESUMEN DE ENVÍO'))
        self.stdout.write('='*50)
        
        self.stdout.write(f'Total procesadas: {total}')
        self.stdout.write(
            self.style.SUCCESS(f'Enviadas exitosamente: {stats["sent"]}')
        )
        
        if stats['failed'] > 0:
            self.stdout.write(
                self.style.ERROR(f'Fallidas: {stats["failed"]}')
            )
        
        if stats['skipped'] > 0:
            self.stdout.write(
                self.style.WARNING(f'Saltadas (horas silenciosas): {stats["skipped"]}')
            )
        
        # Calcular tasa de éxito
        if stats['sent'] + stats['failed'] > 0:
            success_rate = (stats['sent'] / (stats['sent'] + stats['failed'])) * 100
            self.stdout.write(f'Tasa de éxito: {success_rate:.1f}%')
        
        self.stdout.write('='*50)
