from django.core.management.base import BaseCommand
from notifications.services import test_email_service, test_geolocation_service
import json


class Command(BaseCommand):
    help = 'Prueba todas las integraciones externas (email y geolocalización)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--json',
            action='store_true',
            help='Devuelve el resultado en formato JSON',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.HTTP_INFO('🚀 Probando todas las integraciones externas...')
        )
        
        results = {
            'email': {'success': False, 'error': None},
            'geolocation': {'success': False, 'error': None},
            'overall_success': False
        }
        
        # Probar servicio de email
        self.stdout.write('\n1. 📧 Probando servicio de email...')
        try:
            email_result = test_email_service()
            results['email'] = email_result
            
            if email_result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f'   ✅ Email: {email_result["message"]}')
                )
                self.stdout.write(f'      Proveedor: {email_result["provider"]}')
            else:
                self.stdout.write(
                    self.style.ERROR(f'   ❌ Email: {email_result["message"]}')
                )
                
        except Exception as e:
            results['email']['error'] = str(e)
            self.stdout.write(
                self.style.ERROR(f'   ❌ Email: Error - {e}')
            )
        
        # Probar servicio de geolocalización
        self.stdout.write('\n2. 🗺️  Probando servicio de geolocalización...')
        try:
            geo_result = test_geolocation_service()
            results['geolocation'] = geo_result
            
            if geo_result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f'   ✅ Geolocalización: {geo_result["message"]}')
                )
                if 'details' in geo_result:
                    details = geo_result['details']
                    self.stdout.write(f'      Coordenadas de prueba: {details.get("latitude", "N/A")}, {details.get("longitude", "N/A")}')
            else:
                self.stdout.write(
                    self.style.ERROR(f'   ❌ Geolocalización: {geo_result["message"]}')
                )
                
        except Exception as e:
            results['geolocation']['error'] = str(e)
            self.stdout.write(
                self.style.ERROR(f'   ❌ Geolocalización: Error - {e}')
            )
        
        # Determinar resultado general
        email_ok = results['email']['success']
        geo_ok = results['geolocation']['success']
        results['overall_success'] = email_ok and geo_ok
        
        # Mostrar resumen
        self.stdout.write('\n' + '='*50)
        self.stdout.write('📋 RESUMEN DE INTEGRACIONES EXTERNAS')
        self.stdout.write('='*50)
        
        if results['overall_success']:
            self.stdout.write(
                self.style.SUCCESS('🎉 ¡Todas las integraciones funcionan correctamente!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️  Algunas integraciones tienen problemas:')
            )
            
            if not email_ok:
                self.stdout.write('   • Email: No configurado o con errores')
            if not geo_ok:
                self.stdout.write('   • Geolocalización: No configurado o con errores')
        
        # Mostrar instrucciones de configuración
        if not email_ok:
            self.stdout.write('\n📧 Para configurar EMAIL:')
            self.stdout.write('   Opción 1 - Django SMTP:')
            self.stdout.write('     EMAIL_HOST=smtp.gmail.com')
            self.stdout.write('     EMAIL_PORT=587')
            self.stdout.write('     EMAIL_USE_TLS=true')
            self.stdout.write('     EMAIL_HOST_USER=tu-email@gmail.com')
            self.stdout.write('     EMAIL_HOST_PASSWORD=tu-password')
            self.stdout.write('   Opción 2 - SendGrid:')
            self.stdout.write('     EMAIL_PROVIDER=sendgrid')
            self.stdout.write('     SENDGRID_API_KEY=tu-sendgrid-api-key')
        
        if not geo_ok:
            self.stdout.write('\n🗺️  Para configurar GEOLOCALIZACIÓN:')
            self.stdout.write('   GOOGLE_MAPS_API_KEY=tu-google-maps-api-key')
            self.stdout.write('   (Obtén tu clave en: https://developers.google.com/maps/documentation/geocoding/get-api-key)')
        
        # Salida JSON si se solicita
        if options['json']:
            self.stdout.write('\n' + json.dumps(results, indent=2))
        
        self.stdout.write('\n✅ Prueba de integraciones completada.')
        
        # Código de salida según el resultado
        if not results['overall_success']:
            exit(1)  # Error si alguna integración falla
