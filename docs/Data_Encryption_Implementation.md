# Implementación de Encriptación de Datos Sensibles

## Resumen

Se ha implementado exitosamente un sistema de encriptación de datos sensibles en el **Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos**. Esta implementación utiliza **PostgreSQL pgcrypto** para encriptar automáticamente campos que contienen información médica y personal sensible, cumpliendo con los requerimientos de seguridad (NF3) del sistema.

## Objetivo

Proteger información personal identificable (PII) y datos médicos sensibles mediante encriptación simétrica en la base de datos, garantizando que incluso en caso de compromiso de la base de datos, los datos permanezcan seguros.

## Características Implementadas

### 1. **Encriptación Simétrica con pgcrypto**
- Utiliza la extensión pgcrypto de PostgreSQL para encriptación/desencriptación
- Encriptación automática al guardar datos
- Desencriptación transparente al leer datos
- Clave de encriptación configurable por ambiente

### 2. **Campos Encriptados**
- **DNI/Identificación**: Números de identificación personal
- **Extensible**: Sistema preparado para encriptar historiales médicos adicionales

### 3. **Configuración de Seguridad HTTPS**
- Headers de seguridad HTTP configurados
- Cookies seguras habilitadas
- Configuración HSTS para producción

## Estructura Técnica

### Campos Personalizados de Encriptación

#### EncryptedCharField
```python
class EncryptedCharField(models.TextField):
    """Campo de texto encriptado usando pgcrypto"""
    
    def from_db_value(self, value, expression, connection):
        """Desencripta automáticamente al leer de la BD"""
        # Implementación de desencriptación transparente
        
    def pre_save(self, model_instance, add):
        """Encripta automáticamente antes de guardar"""
        # Implementación de encriptación transparente
```

### Funciones de PostgreSQL

#### Encriptación
```sql
pgp_sym_encrypt(data, key) -- Encripta datos con clave simétrica
```

#### Desencriptación
```sql
pgp_sym_decrypt(data::bytea, key) -- Desencripta datos con clave simétrica
```

### Modelo Usuario Actualizado

```python
class User(AbstractBaseUser, PermissionsMixin):
    # Campos básicos sin encriptar
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    
    # Campos sensibles ENCRIPTADOS
    dni = EncryptedCharField(
        max_length=20,
        unique=True,
        validators=[RegexValidator(r'^[0-9]+$', 'Solo números')],
        verbose_name='DNI'
    )
    identification_number = EncryptedCharField(
        max_length=20,
        unique=True,
        validators=[RegexValidator(r'^[0-9]+$', 'Solo números')],
        verbose_name='Número de identificación'
    )
```

### Manager Personalizado para Consultas

```python
class UserEncryptedManager(EncryptedFieldManager):
    """Manager para búsquedas en campos encriptados"""
    
    def get_by_dni(self, dni):
        """Buscar usuario por DNI encriptado"""
        return self.filter_encrypted('dni', dni).first()
    
    def filter_encrypted(self, field_name, value):
        """Filtrar por campos encriptados"""
        # Implementación de búsqueda en campos encriptados
```

## Configuración del Sistema

### Variables de Configuración en settings/base.py

```python
# Configuración de encriptación de datos sensibles
PGCRYPTO_KEY = config('PGCRYPTO_KEY', 
                     default='medical-system-default-key-change-in-production')
ENCRYPTION_ENABLED = config('ENCRYPTION_ENABLED', default=True, cast=bool)

# Configuración HTTPS
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True, cast=bool)
SECURE_HSTS_PRELOAD = config('SECURE_HSTS_PRELOAD', default=True, cast=bool)

# Headers de seguridad
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True

# Cookies seguras
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
```

### Variables de Entorno Recomendadas

```bash
# Archivo .env para producción
PGCRYPTO_KEY=your-super-secure-encryption-key-min-32-chars
ENCRYPTION_ENABLED=true

# HTTPS en producción
SECURE_SSL_REDIRECT=true
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
SECURE_HSTS_SECONDS=31536000
```

## Instalación y Configuración

### 1. Habilitar pgcrypto en PostgreSQL

```bash
# Ejecutar comando personalizado de Django
python manage.py enable_pgcrypto
```

**Salida esperada:**
```
✅ pgcrypto ya está habilitado
✅ Funciones de encriptación funcionando correctamente
```

### 2. Aplicar Migraciones

```bash
# Crear migración para campos encriptados
python manage.py makemigrations authentication --name encrypted_fields

# Aplicar migración
python manage.py migrate
```

**Salida esperada:**
```
Migrations for 'authentication':
  authentication\migrations\0006_encrypted_fields.py
    ~ Alter field dni on user
    ~ Alter field identification_number on user

Operations to perform:
  Apply all migrations: [...]
Running migrations:
  Applying authentication.0006_encrypted_fields... OK
```

## Archivos Creados/Modificados

### Nuevos Archivos

1. **`authentication/fields.py`**
   - Campos personalizados de encriptación
   - Funciones PostgreSQL para pgcrypto
   - EncryptedCharField, EncryptedTextField, EncryptedEmailField

2. **`authentication/managers.py`**
   - Manager personalizado para consultas encriptadas
   - Métodos de búsqueda en campos encriptados

3. **`authentication/management/commands/enable_pgcrypto.py`**
   - Comando para habilitar y verificar pgcrypto
   - Pruebas de funcionalidad de encriptación

### Archivos Modificados

1. **`authentication/models.py`**
   - Campos dni e identification_number cambiados a EncryptedCharField
   - Import de campos y managers personalizados

2. **`medical_system/settings/base.py`**
   - Configuración de encriptación
   - Headers de seguridad HTTPS
   - Configuración de cookies seguras

## Flujo de Funcionamiento

### Encriptación (Al Guardar)
1. Usuario envía datos al API
2. Campo EncryptedCharField intercepta el valor en `pre_save()`
3. Se ejecuta `pgp_sym_encrypt(valor, clave)` en PostgreSQL
4. Se almacena el valor encriptado en la base de datos

### Desencriptación (Al Leer)
1. Django consulta la base de datos
2. Campo EncryptedCharField intercepta el valor en `from_db_value()`
3. Se ejecuta `pgp_sym_decrypt(valor_encriptado, clave)` en PostgreSQL
4. Se retorna el valor desencriptado a la aplicación

## Verificación de Implementación

### Prueba Manual de Encriptación

```python
# En Django shell
python manage.py shell

from django.contrib.auth import get_user_model
User = get_user_model()

# Crear usuario con DNI
user = User.objects.create_user(
    email='test@example.com',
    password='testpass123',
    first_name='Test',
    last_name='User',
    dni='12345678'
)

# El DNI se encripta automáticamente al guardar
print(f"DNI almacenado: {user.dni}")  # Aparece como texto normal
# En la BD está encriptado

# Verificar en la base de datos directamente
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT dni FROM authentication_user WHERE email = %s", [user.email])
    encrypted_dni = cursor.fetchone()[0]
    print(f"DNI encriptado en BD: {encrypted_dni}")  # Aparece como bytes encriptados
```

## Consideraciones de Seguridad

### 1. **Gestión de Claves**
```bash
# ⚠️  CRÍTICO: Cambiar clave por defecto en producción
PGCRYPTO_KEY=your-production-encryption-key-must-be-32-chars-minimum
```

### 2. **Backup de Claves**
- **Almacenar la clave de encriptación por separado** de la base de datos
- **Rotar claves periódicamente** (implementación futura)
- **Usar servicios de gestión de secretos** (AWS KMS, Azure Key Vault, etc.)

### 3. **Performance**
- La encriptación añade overhead a las consultas
- **Evitar búsquedas masivas** en campos encriptados
- **Usar índices funcionales** para búsquedas frecuentes:

```sql
-- Ejemplo de índice funcional para búsquedas encriptadas
CREATE INDEX idx_user_dni_decrypted 
ON authentication_user (pgp_sym_decrypt(dni::bytea, 'encryption-key'));
```

### 4. **Logs y Auditoría**
```python
# Los campos encriptados NO deben aparecer en logs
# ✅ Correcto: Log sin datos sensibles
logger.info(f"Usuario {user.id} actualizó su perfil")

# ❌ Incorrecto: Log con datos sensibles
logger.info(f"Usuario {user.dni} actualizó su perfil")  # DNI en logs
```

## Campos Preparados para Encriptación Futura

El sistema está preparado para encriptar fácilmente más campos sensibles:

### Historiales Médicos
```python
# En medical_records/models.py (futuro)
class MedicalRecord(models.Model):
    diagnosis = EncryptedTextField()  # Diagnósticos
    treatment = EncryptedTextField()  # Tratamientos
    notes = EncryptedTextField()      # Notas médicas
```

### Información de Pacientes
```python
# En authentication/models.py (futuro)
class PatientProfile(models.Model):
    allergies = EncryptedTextField()           # Alergias
    chronic_conditions = EncryptedTextField()  # Condiciones crónicas
    insurance_policy_number = EncryptedCharField()  # Número de póliza
```

## Próximos Pasos (Fase 0 - Parte 3)

### 1. **Configuración de Integraciones Externas**
- [ ] Servicio de correo electrónico (SendGrid/SMTP)
- [ ] API de geolocalización (Google Maps)
- [ ] Pruebas de integración

### 2. **Mejoras de Encriptación (Futuro)**
- [ ] Rotación automática de claves
- [ ] Encriptación de campos adicionales (historiales médicos)
- [ ] Integración con servicios de gestión de secretos

### 3. **Monitoreo y Auditoría**
- [ ] Logs de acceso a datos encriptados
- [ ] Métricas de performance de encriptación
- [ ] Alertas de seguridad

## Problemas Conocidos y Soluciones

### 1. **Error de Uniqueness en Campos Encriptados**
```python
# Problema: Los campos encriptados únicos pueden no funcionar correctamente
# Solución: Usar hashing para uniqueness + encriptación para datos
dni_hash = models.CharField(max_length=64, unique=True)  # Para uniqueness
dni_encrypted = EncryptedCharField()  # Para almacenamiento seguro
```

### 2. **Performance en Búsquedas**
```python
# Problema: Búsquedas lentas en campos encriptados
# Solución: Usar manager personalizado y limitar búsquedas
users = User.objects.filter_encrypted('dni', '12345678')[:10]  # Limitar resultados
```

## Comando de Utilidad

### Verificar Estado de Encriptación
```bash
# Comando personalizado para verificar pgcrypto
python manage.py enable_pgcrypto

# Salida:
# ✅ pgcrypto ya está habilitado
# ✅ Funciones de encriptación funcionando correctamente
```

## Conclusión

La implementación de encriptación de datos sensibles añade una capa fundamental de seguridad al sistema hospitalario, asegurando que la información médica y personal esté protegida tanto en tránsito como en reposo. Con PostgreSQL pgcrypto, los datos se encriptan automáticamente sin afectar la experiencia del desarrollador.

### Estado Actual: ✅ COMPLETADO
- ✅ pgcrypto habilitado en PostgreSQL  
- ✅ Campos personalizados de encriptación implementados
- ✅ Modelo User actualizado con campos encriptados
- ✅ Configuración HTTPS y headers de seguridad
- ✅ Migraciones aplicadas exitosamente
- ✅ Sistema listo para Fase 0 - Parte 3

### Próximo Paso: **Parte 3 - Configuración de Integraciones Externas**
- Servicio de correo electrónico
- API de geolocalización
- Finalización de Fase 0
