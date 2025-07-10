from django.core.cache import cache
from django.conf import settings
from datetime import datetime, timedelta
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class ReportCache:
    """Manejador de caché para reportes pesados"""
    
    CACHE_PREFIX = 'report_cache'
    DEFAULT_TIMEOUT = 3600  # 1 hora por defecto
    
    # Timeouts específicos por tipo de reporte
    CACHE_TIMEOUTS = {
        'financial': 7200,      # 2 horas
        'emergency': 3600,      # 1 hora
        'appointments': 1800,   # 30 minutos
        'occupancy': 1800,      # 30 minutos
        'medications': 3600,    # 1 hora
    }
    
    @classmethod
    def _generate_cache_key(cls, report_type, parameters):
        """Generar clave única para el caché basada en tipo y parámetros"""
        # Ordenar parámetros para consistencia
        sorted_params = json.dumps(parameters, sort_keys=True)
        
        # Crear hash de los parámetros
        param_hash = hashlib.md5(sorted_params.encode()).hexdigest()
        
        # Construir clave
        return f"{cls.CACHE_PREFIX}:{report_type}:{param_hash}"
    
    @classmethod
    def get(cls, report_type, parameters):
        """Obtener reporte del caché si existe"""
        cache_key = cls._generate_cache_key(report_type, parameters)
        
        try:
            cached_data = cache.get(cache_key)
            if cached_data:
                logger.info(f"Cache hit for report type: {report_type}")
                return cached_data
            else:
                logger.info(f"Cache miss for report type: {report_type}")
                return None
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None
    
    @classmethod
    def set(cls, report_type, parameters, data):
        """Guardar reporte en caché"""
        cache_key = cls._generate_cache_key(report_type, parameters)
        timeout = cls.CACHE_TIMEOUTS.get(report_type, cls.DEFAULT_TIMEOUT)
        
        try:
            cache.set(cache_key, data, timeout)
            logger.info(f"Cached report type: {report_type} for {timeout} seconds")
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {str(e)}")
            return False
    
    @classmethod
    def delete(cls, report_type, parameters):
        """Eliminar reporte específico del caché"""
        cache_key = cls._generate_cache_key(report_type, parameters)
        
        try:
            cache.delete(cache_key)
            logger.info(f"Deleted cache for report type: {report_type}")
            return True
        except Exception as e:
            logger.error(f"Error deleting cache: {str(e)}")
            return False
    
    @classmethod
    def clear_report_type(cls, report_type):
        """Limpiar todos los reportes de un tipo específico"""
        pattern = f"{cls.CACHE_PREFIX}:{report_type}:*"
        
        try:
            # Si usamos Redis como backend
            if hasattr(cache, '_cache'):
                backend = cache._cache
                if hasattr(backend, 'delete_pattern'):
                    deleted = backend.delete_pattern(pattern)
                    logger.info(f"Cleared {deleted} cached reports of type: {report_type}")
                    return True
            
            # Fallback: no hay forma directa de eliminar por patrón
            logger.warning("Cache backend doesn't support pattern deletion")
            return False
        except Exception as e:
            logger.error(f"Error clearing cache by type: {str(e)}")
            return False
    
    @classmethod
    def clear_all(cls):
        """Limpiar todo el caché de reportes"""
        pattern = f"{cls.CACHE_PREFIX}:*"
        
        try:
            if hasattr(cache, '_cache'):
                backend = cache._cache
                if hasattr(backend, 'delete_pattern'):
                    deleted = backend.delete_pattern(pattern)
                    logger.info(f"Cleared all {deleted} cached reports")
                    return True
            
            # Fallback
            cache.clear()
            logger.info("Cleared entire cache")
            return True
        except Exception as e:
            logger.error(f"Error clearing all cache: {str(e)}")
            return False
    
    @classmethod
    def get_cache_info(cls, report_type=None):
        """Obtener información sobre el caché"""
        info = {
            'backend': settings.CACHES['default']['BACKEND'],
            'timeouts': cls.CACHE_TIMEOUTS,
            'default_timeout': cls.DEFAULT_TIMEOUT
        }
        
        if report_type:
            info['report_type'] = report_type
            info['timeout'] = cls.CACHE_TIMEOUTS.get(report_type, cls.DEFAULT_TIMEOUT)
        
        return info


class CachedReportMixin:
    """Mixin para agregar capacidades de caché a las vistas de reportes"""
    
    cache_enabled = True
    cache_key_prefix = None
    
    def get_cache_parameters(self, request):
        """Obtener parámetros relevantes para el caché"""
        params = {
            'user_id': request.user.id,
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'filters': dict(request.query_params)
        }
        
        # Remover parámetros no relevantes para el caché
        params['filters'].pop('format', None)
        params['filters'].pop('download', None)
        
        return params
    
    def get_cached_response(self, request, report_type):
        """Intentar obtener respuesta del caché"""
        if not self.cache_enabled:
            return None
        
        parameters = self.get_cache_parameters(request)
        return ReportCache.get(report_type, parameters)
    
    def cache_response(self, request, report_type, data):
        """Guardar respuesta en caché"""
        if not self.cache_enabled:
            return
        
        parameters = self.get_cache_parameters(request)
        ReportCache.set(report_type, parameters, data)


def invalidate_report_cache(report_type=None):
    """Decorador para invalidar caché cuando se modifican datos"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalidar caché después de la operación
            if report_type:
                ReportCache.clear_report_type(report_type)
            else:
                ReportCache.clear_all()
            
            return result
        return wrapper
    return decorator


# Configuración de caché para Django settings
REPORT_CACHE_CONFIG = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'KEY_PREFIX': 'medical_reports',
            'TIMEOUT': 3600,  # 1 hora por defecto
        }
    }
}

# Alternativa con caché en memoria para desarrollo
REPORT_CACHE_CONFIG_DEV = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'medical-reports-cache',
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
            'CULL_FREQUENCY': 3
        }
    }
}
