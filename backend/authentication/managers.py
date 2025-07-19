from django.db import models
from django.db.models import F
from .fields import PGPSymDecrypt


class EncryptedFieldManager(models.Manager):
    """Manager personalizado para manejar queries con campos encriptados"""
    
    def __init__(self, encrypted_fields=None):
        super().__init__()
        self.encrypted_fields = encrypted_fields or []
    
    def get_queryset(self):
        """Sobrescribe el queryset para desencriptar automáticamente los campos"""
        qs = super().get_queryset()
        
        # Aplicar desencriptación a los campos especificados
        annotations = {}
        for field_name in self.encrypted_fields:
            if hasattr(self.model, field_name):
                # Crear una anotación que desencripta el campo
                annotations[f'{field_name}_decrypted'] = PGPSymDecrypt(F(field_name))
        
        if annotations:
            qs = qs.annotate(**annotations)
            
        return qs
    
    def filter_encrypted(self, field_name, value):
        """
        Método helper para filtrar por campos encriptados
        Nota: Esto puede ser lento porque requiere desencriptar todos los registros
        """
        # Para búsquedas en campos encriptados, es mejor usar índices funcionales
        # o almacenar un hash del valor para búsquedas exactas
        queryset = self.get_queryset()
        
        # Usar anotación temporal para filtrar
        temp_annotation = f'{field_name}_search'
        queryset = queryset.annotate(**{temp_annotation: PGPSymDecrypt(F(field_name))})
        
        return queryset.filter(**{f'{temp_annotation}': value})
    
    def search_encrypted(self, field_name, search_term):
        """
        Búsqueda parcial en campos encriptados
        ADVERTENCIA: Esto es muy lento ya que requiere desencriptar todos los registros
        """
        queryset = self.get_queryset()
        
        # Usar anotación temporal para búsqueda
        temp_annotation = f'{field_name}_search'
        queryset = queryset.annotate(**{temp_annotation: PGPSymDecrypt(F(field_name))})
        
        return queryset.filter(**{f'{temp_annotation}__icontains': search_term})


class UserEncryptedManager(EncryptedFieldManager):
    """Manager específico para el modelo User con campos encriptados"""
    
    def __init__(self):
        # Especificar qué campos están encriptados en el modelo User
        encrypted_fields = ['dni', 'identification_number']
        super().__init__(encrypted_fields=encrypted_fields)
    
    def get_by_dni(self, dni):
        """Buscar usuario por DNI encriptado"""
        return self.filter_encrypted('dni', dni).first()
    
    def get_by_identification(self, identification_number):
        """Buscar usuario por número de identificación encriptado"""
        return self.filter_encrypted('identification_number', identification_number).first()
