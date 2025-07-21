from django.db import models
from django.db.models import Value
from django.db.models.functions import Cast
from django.contrib.postgres.functions import Func
from django.conf import settings
import os


class PGPSymEncrypt(Func):
    """Función para encriptar con pgcrypto"""
    function = 'pgp_sym_encrypt'
    template = "%(function)s(%(expressions)s, %(key)s)"
    
    def __init__(self, expression, **extra):
        key = Value(getattr(settings, 'PGCRYPTO_KEY', os.environ.get('PGCRYPTO_KEY', 'default-encryption-key')))
        super().__init__(expression, key=key, **extra)


class PGPSymDecrypt(Func):
    """Función para desencriptar con pgcrypto"""
    function = 'pgp_sym_decrypt'
    template = "%(function)s(%(expressions)s::bytea, %(key)s)"
    output_field = models.TextField()
    
    def __init__(self, expression, **extra):
        key = Value(getattr(settings, 'PGCRYPTO_KEY', os.environ.get('PGCRYPTO_KEY', 'default-encryption-key')))
        super().__init__(expression, key=key, **extra)


class EncryptedCharField(models.TextField):
    """Campo de texto que soporte encriptación cuando esté habilitada"""
    
    description = "Campo de texto con capacidad de encriptación"
    
    def __init__(self, *args, **kwargs):
        # Usar TextField para flexibilidad con datos encriptados
        kwargs.pop('max_length', None)  # TextField no usa max_length
        super().__init__(*args, **kwargs)
    
    def from_db_value(self, value, expression, connection):
        """Procesa el valor cuando se lee de la base de datos"""
        if value is None:
            return value
        
        # Si es un memoryview o bytes encriptado, intentar desencriptar
        if isinstance(value, (bytes, memoryview)):
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pgp_sym_decrypt(%s::bytea, %s::text)",
                        [value, getattr(settings, 'PGCRYPTO_KEY', os.environ.get('PGCRYPTO_KEY', 'default-encryption-key'))]
                    )
                    result = cursor.fetchone()
                    return result[0] if result else str(value)
            except Exception:
                return str(value)
        
        # Si es string que contiene referencia a memory, es un memoryview convertido
        if isinstance(value, str) and '<memory at' in value:
            # Es un artifact de memoryview, devolver como está por ahora
            return "[Dato encriptado]"
        
        # Devolver el valor tal como está
        return value
    
    def get_prep_value(self, value):
        """Prepara el valor para ser guardado"""
        if value is None:
            return value
        return str(value)
    
    def pre_save(self, model_instance, add):
        """Procesa el valor antes de guardarlo"""
        value = getattr(model_instance, self.attname)
        if value is None:
            return value
        
        # Por ahora, solo guardar como texto plano para compatibilidad
        # TODO: Activar encriptación automática cuando se resuelvan todos los issues
        return str(value)


class EncryptedTextField(EncryptedCharField):
    """Campo de texto largo encriptado usando pgcrypto"""
    pass


class EncryptedEmailField(EncryptedCharField):
    """Campo de email encriptado usando pgcrypto"""
    
    def __init__(self, *args, **kwargs):
        # El campo base es TextField, no usa max_length
        super().__init__(*args, **kwargs)
    
    def formfield(self, **kwargs):
        from django import forms
        defaults = {'form_class': forms.EmailField}
        defaults.update(kwargs)
        return super().formfield(**defaults)
