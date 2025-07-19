"""
Utilidades para la API externa
"""
import secrets
import hashlib
from django.utils import timezone


def generate_api_key():
    """
    Genera una API key segura
    """
    # Generar 32 bytes aleatorios
    random_bytes = secrets.token_bytes(32)
    
    # Crear un hash SHA256
    api_key = hashlib.sha256(random_bytes).hexdigest()
    
    return api_key


def validate_api_key_format(api_key):
    """
    Valida el formato de una API key
    """
    if not api_key:
        return False
    
    # Debe ser una cadena hexadecimal de 64 caracteres
    if len(api_key) != 64:
        return False
    
    try:
        int(api_key, 16)
        return True
    except ValueError:
        return False


def get_client_ip(request):
    """
    Obtiene la IP del cliente desde el request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_api_access(api_client, endpoint, method, status_code):
    """
    Registra el acceso a la API
    """
    from .models import APIAccessLog
    
    APIAccessLog.objects.create(
        api_client=api_client,
        endpoint=endpoint,
        method=method,
        status_code=status_code,
        timestamp=timezone.now()
    )
