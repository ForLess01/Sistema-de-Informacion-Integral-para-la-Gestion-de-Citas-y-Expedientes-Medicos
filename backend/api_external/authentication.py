from rest_framework import authentication, exceptions, permissions
from django.core.cache import cache
from .models import ExternalAPIClient, APIAccessLog, APIRateLimit
from django.utils import timezone
from datetime import datetime
import hmac
import hashlib
import time


class ExternalAPIAuthentication(authentication.BaseAuthentication):
    """Autenticación personalizada para API externa usando API Key y Secret"""
    
    def authenticate(self, request):
        # Obtener headers de autenticación
        api_key = request.META.get('HTTP_X_API_KEY')
        api_signature = request.META.get('HTTP_X_API_SIGNATURE')
        timestamp = request.META.get('HTTP_X_TIMESTAMP')
        
        if not api_key or not api_signature or not timestamp:
            return None
        
        # Verificar timestamp (no más de 5 minutos de diferencia)
        try:
            request_time = float(timestamp)
            current_time = time.time()
            if abs(current_time - request_time) > 300:  # 5 minutos
                raise exceptions.AuthenticationFailed('Timestamp expirado')
        except (ValueError, TypeError):
            raise exceptions.AuthenticationFailed('Timestamp inválido')
        
        # Buscar cliente por API key (usar cache para mejorar rendimiento)
        cache_key = f'api_client_{api_key}'
        client = cache.get(cache_key)
        
        if not client:
            try:
                client = ExternalAPIClient.objects.get(api_key=api_key, is_active=True)
                cache.set(cache_key, client, 300)  # Cache por 5 minutos
            except ExternalAPIClient.DoesNotExist:
                raise exceptions.AuthenticationFailed('API Key inválida')
        
        # Verificar firma
        expected_signature = self.generate_signature(
            client.api_secret,
            request.method,
            request.path,
            timestamp,
            request.body.decode('utf-8') if request.body else ''
        )
        
        if not hmac.compare_digest(api_signature, expected_signature):
            raise exceptions.AuthenticationFailed('Firma inválida')
        
        # Verificar límites de tasa
        if not self.check_rate_limit(client):
            raise exceptions.Throttled('Límite de peticiones excedido')
        
        # Registrar acceso
        self.log_access(client, request)
        
        return (client, None)
    
    def generate_signature(self, secret, method, path, timestamp, body=''):
        """Genera la firma HMAC para la petición"""
        message = f"{method}\n{path}\n{timestamp}\n{body}"
        signature = hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def check_rate_limit(self, client):
        """Verifica los límites de tasa del cliente"""
        now = timezone.now()
        current_minute = now.minute
        current_hour = now.hour
        
        # Verificar límite por minuto
        cache_key = f'rate_limit_{client.id}_{current_hour}_{current_minute}'
        current_count = cache.get(cache_key, 0)
        
        if current_count >= client.rate_limit_per_minute:
            return False
        
        # Incrementar contador
        cache.set(cache_key, current_count + 1, 60)
        
        # Verificar límite diario (usar base de datos)
        daily_count = APIAccessLog.objects.filter(
            client=client,
            timestamp__date=now.date()
        ).count()
        
        if daily_count >= client.daily_request_limit:
            return False
        
        return True
    
    def log_access(self, client, request):
        """Registra el acceso en el log"""
        start_time = time.time()
        
        # Este método se ejecutará después de la respuesta
        def log_response(response):
            APIAccessLog.objects.create(
                client=client,
                endpoint=request.path,
                method=request.method,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                request_body=request.body.decode('utf-8')[:1000] if request.body else '',
                response_status=response.status_code,
                response_time_ms=int((time.time() - start_time) * 1000)
            )
        
        # Almacenar la función para ejecutarla después
        request._log_response = log_response
    
    def get_client_ip(self, request):
        """Obtiene la IP real del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ExternalAPIPermission(permissions.BasePermission):
    """Permisos basados en los permisos específicos del cliente API"""
    
    def has_permission(self, request, view):
        if not hasattr(request, 'user') or not isinstance(request.user, ExternalAPIClient):
            return False
        
        client = request.user
        path = request.path.lower()
        method = request.method
        
        # Verificar permisos según el endpoint
        if '/patients/' in path:
            if method in ['GET', 'HEAD', 'OPTIONS']:
                return client.can_read_patients
            else:
                return client.can_write_patients
        
        elif '/appointments/' in path:
            if method in ['GET', 'HEAD', 'OPTIONS']:
                return client.can_read_appointments
            else:
                return client.can_write_appointments
        
        elif '/medical-records/' in path:
            if method in ['GET', 'HEAD', 'OPTIONS']:
                return client.can_read_medical_records
            else:
                return client.can_write_medical_records
        
        elif '/pharmacy/' in path:
            if method in ['GET', 'HEAD', 'OPTIONS']:
                return client.can_read_pharmacy
            else:
                return client.can_write_pharmacy
        
        # Por defecto, denegar acceso
        return False
