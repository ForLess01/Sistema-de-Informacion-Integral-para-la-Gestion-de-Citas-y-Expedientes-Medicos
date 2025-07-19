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
    """Campo de texto encriptado usando pgcrypto"""
    
    description = "Campo de texto encriptado con pgcrypto"
    
    def __init__(self, *args, **kwargs):
        # Siempre usar TextField como base para almacenar datos encriptados
        kwargs['max_length'] = None
        super().__init__(*args, **kwargs)
    
    def from_db_value(self, value, expression, connection):
        """Desencripta el valor cuando se lee de la base de datos"""
        if value is None:
            return value
        
        # Si el valor ya está desencriptado (para compatibilidad)
        if not isinstance(value, (bytes, memoryview)):
            return value
            
        try:
            # Desencriptar usando SQL raw
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT pgp_sym_decrypt(%s::bytea, %s)",
                    [value, getattr(settings, 'PGCRYPTO_KEY', os.environ.get('PGCRYPTO_KEY', 'default-encryption-key'))]
                )
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception:
            # Si falla la desencriptación, devolver el valor original
            return value
    
    def get_prep_value(self, value):
        """Prepara el valor para ser guardado (sin encriptar aquí)"""
        if value is None:
            return value
        return str(value)
    
    def pre_save(self, model_instance, add):
        """Encripta el valor antes de guardarlo"""
        value = getattr(model_instance, self.attname)
        if value is None:
            return value
            
        # Encriptar usando SQL raw
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pgp_sym_encrypt(%s, %s)",
                [value, getattr(settings, 'PGCRYPTO_KEY', os.environ.get('PGCRYPTO_KEY', 'default-encryption-key'))]
            )
            result = cursor.fetchone()
            encrypted_value = result[0] if result else value
            
        setattr(model_instance, self.attname, encrypted_value)
        return encrypted_value


class EncryptedTextField(EncryptedCharField):
    """Campo de texto largo encriptado usando pgcrypto"""
    pass


class EncryptedEmailField(EncryptedCharField):
    """Campo de email encriptado usando pgcrypto"""
    
    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = None  # Los emails encriptados ocupan más espacio
        super().__init__(*args, **kwargs)
    
    def formfield(self, **kwargs):
        from django import forms
        defaults = {'form_class': forms.EmailField}
        defaults.update(kwargs)
        return super().formfield(**defaults)
