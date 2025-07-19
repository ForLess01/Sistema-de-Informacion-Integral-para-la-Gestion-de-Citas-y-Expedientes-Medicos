from django.core.management.base import BaseCommand
from notifications.services import test_geolocation_service, GeolocationService


class Command(BaseCommand):
    help = 'Prueba el servicio de geolocalización configurado'

    def add_arguments(self, parser):
        parser.add_argument(
            '--address',
            type=str,
            default='Plaza de Armas, Lima, Perú',
            help='Dirección para probar la geolocalización',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO('🔄 Probando servicio de geolocalización...'))
        
        try:
            # Probar conexión básica
            result = test_geolocation_service()
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ {result["message"]}')
                )
                
                if 'details' in result and result['details']:
                    details = result['details']
                    self.stdout.write(f'   Coordenadas de prueba:')
                    self.stdout.write(f'     Latitud: {details.get("latitude", "N/A")}')
                    self.stdout.write(f'     Longitud: {details.get("longitude", "N/A")}')
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ {result["message"]}')
                )
                return
            
            # Probar con dirección personalizada
            address = options['address']
            if address:
                self.stdout.write(self.style.HTTP_INFO(f'\n🗺️  Probando geolocalización para: "{address}"'))
                
                try:
                    geo_service = GeolocationService()
                    coords = geo_service.get_coordinates(address)
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Coordenadas encontradas:')
                    )
                    self.stdout.write(f'   Latitud: {coords["latitude"]}')
                    self.stdout.write(f'   Longitud: {coords["longitude"]}')
                    
                    # URL de Google Maps para verificar
                    maps_url = f"https://www.google.com/maps?q={coords['latitude']},{coords['longitude']}"
                    self.stdout.write(f'   Google Maps: {maps_url}')
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error obteniendo coordenadas para "{address}": {e}')
                    )
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error probando servicio de geolocalización: {e}')
            )
