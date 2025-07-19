import logging
from django.conf import settings
import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

class GeolocationServiceError(Exception):
    """Excepción personalizada para errores del servicio de geolocalización"""
    pass


class GeolocationService:
    """
    Servicio centralizado para geolocalización usando Google Maps API
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
        self.base_url = 'https://maps.googleapis.com/maps/api/geocode/json'
        
        if not self.api_key:
            logger.error("Google Maps API key not configured")
            raise GeolocationServiceError("Google Maps API key is required")
    
    def get_coordinates(self, address: str) -> dict:
        """
        Obtiene coordenadas para una dirección dada
        
        Args:
            address: Dirección a buscar
            
        Returns:
            Diccionario con latitud y longitud
        
        Raises:
            GeolocationServiceError si la llamada falla
        """
        try:
            params = {
                'address': address,
                'key': self.api_key
            }
            
            # Verificar caché antes de realizar la solicitud
            cache_key = f'geolocation:{address}'
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"Coordenadas obtenidas de caché para {address}: {cached_result}")
                return cached_result
            
            response = requests.get(self.base_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'OK' and data['results']:
                    location = data['results'][0]['geometry']['location']
                    result = {'latitude': location['lat'], 'longitude': location['lng']}
                    
                    # Almacenar en caché
                    cache.set(cache_key, result, timeout=86400)  # 1 día
                    logger.info(f"Coordenadas para {address}: {result}")
                    return result
                raise GeolocationServiceError(f"Geocoding API error: {data['status']}")
            raise GeolocationServiceError(f"HTTP error {response.status_code} from Geocoding API")
        except requests.RequestException as e:
            logger.error(f"Error en solicitud de geolocalización: {e}")
            raise GeolocationServiceError(f"Request failed: {str(e)}")

    def test_connection(self) -> dict:
        """
        Prueba la conexión con la API de Google Maps
        
        Returns:
            Diccionario con el estado de la prueba
        """
        try:
            test_address = '1600 Amphitheatre Parkway, Mountain View, CA'
            result = self.get_coordinates(test_address)
            logger.info(f"Conexión exitosa a la API de Google Maps con resultado: {result}")
            return {
                'success': True,
                'message': 'Google Maps API connection successful',
                'details': result
            }
        except GeolocationServiceError as e:
            return {
                'success': False,
                'message': f'Geolocation test failed: {str(e)}'
            }


def test_geolocation_service() -> dict:
    """Prueba el servicio de geolocalización"""
    service = GeolocationService()
    return service.test_connection()

