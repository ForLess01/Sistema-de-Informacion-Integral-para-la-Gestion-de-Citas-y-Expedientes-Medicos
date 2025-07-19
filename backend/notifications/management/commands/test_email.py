from django.core.management.base import BaseCommand
from notifications.services import test_email_service, send_notification_email


class Command(BaseCommand):
    help = 'Prueba el servicio de email configurado'

    def add_arguments(self, parser):
        parser.add_argument(
            '--send-test',
            action='store_true',
            help='Envía un email de prueba',
        )
        parser.add_argument(
            '--to-email',
            type=str,
            default='test@example.com',
            help='Email de destino para la prueba',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO('🔄 Probando servicio de email...'))
        
        try:
            # Probar conexión
            result = test_email_service()
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ {result["message"]}')
                )
                self.stdout.write(f'   Proveedor: {result["provider"]}')
                
                if 'details' in result and result['details']:
                    for key, value in result['details'].items():
                        self.stdout.write(f'   {key}: {value}')
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ {result["message"]}')
                )
                return
            
            # Enviar email de prueba si se solicita
            if options['send_test']:
                self.stdout.write(self.style.HTTP_INFO('\n📧 Enviando email de prueba...'))
                
                to_email = options['to_email']
                subject = 'Prueba de Email - Sistema Médico'
                message = '''
¡Hola!

Este es un email de prueba del Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos.

Si recibes este mensaje, significa que el servicio de email está funcionando correctamente.

Saludos,
Sistema Médico Integral
                '''.strip()
                
                success = send_notification_email(
                    to_emails=[to_email],
                    subject=subject,
                    message=message
                )
                
                if success:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Email de prueba enviado a {to_email}')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error enviando email de prueba a {to_email}')
                    )
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error probando servicio de email: {e}')
            )
