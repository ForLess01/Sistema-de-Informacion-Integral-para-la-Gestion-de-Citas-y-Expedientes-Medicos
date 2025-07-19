# Implementación de Autenticación de Dos Factores (2FA)

## Resumen

Se ha implementado exitosamente un sistema de autenticación de dos factores (2FA) en el backend del Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos. Esta implementación utiliza el estándar TOTP (Time-based One-Time Password) y proporciona una capa adicional de seguridad para proteger las cuentas de usuario.

## Características Implementadas

### 1. **Autenticación TOTP**
- Generación de códigos de 6 dígitos que cambian cada 30 segundos
- Compatible con aplicaciones autenticadoras como Google Authenticator, Microsoft Authenticator, Authy, etc.
- Generación de códigos QR para facilitar la configuración

### 2. **Tokens de Respaldo**
- Se generan 10 tokens de respaldo cuando se activa 2FA
- Cada token puede usarse una sola vez
- Los usuarios pueden regenerar nuevos tokens si los pierden

### 3. **Flujo de Autenticación Modificado**
- Login en dos pasos cuando 2FA está activado
- Detección automática de usuarios con 2FA habilitado
- Respuestas claras del API indicando cuándo se requiere 2FA

## Estructura Técnica

### Modelo de Usuario Actualizado

```python
class User(AbstractBaseUser, PermissionsMixin):
    # ... campos existentes ...
    
    # Campos para 2FA
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True)
    backup_tokens = models.JSONField(default=list, blank=True)
```

### Servicio de 2FA

Se creó un servicio dedicado (`authentication/services/two_factor_service.py`) que maneja:
- Generación de secretos TOTP
- Creación de códigos QR
- Verificación de tokens
- Gestión de tokens de respaldo

### Endpoints de API

| Endpoint | Método | Descripción | Autenticación |
|----------|---------|-------------|---------------|
| `/api/v1/auth/2fa/enable/` | POST | Inicia el proceso de habilitación de 2FA | JWT requerido |
| `/api/v1/auth/2fa/confirm/` | POST | Confirma y activa 2FA con el primer código | JWT requerido |
| `/api/v1/auth/2fa/disable/` | POST | Desactiva 2FA (requiere contraseña) | JWT requerido |
| `/api/v1/auth/2fa/verify/` | POST | Verifica código 2FA durante el login | No requerido |
| `/api/v1/auth/2fa/backup-tokens/` | POST | Regenera tokens de respaldo | JWT requerido |

## Flujo de Uso

### Habilitación de 2FA

1. **Usuario solicita habilitar 2FA**
   ```bash
   POST /api/v1/auth/2fa/enable/
   Headers: Authorization: Bearer <token>
   ```

2. **Sistema retorna código QR y tokens de respaldo**
   ```json
   {
     "qr_code": "data:image/png;base64,...",
     "backup_tokens": ["ABC123", "DEF456", ...],
     "message": "Escanea el código QR con tu aplicación de autenticación..."
   }
   ```

3. **Usuario confirma con su primer código**
   ```bash
   POST /api/v1/auth/2fa/confirm/
   Headers: Authorization: Bearer <token>
   Body: {"token": "123456"}
   ```

### Login con 2FA

1. **Primer paso - Credenciales**
   ```bash
   POST /api/v1/auth/login/
   Body: {"email": "user@example.com", "password": "password"}
   ```

2. **Sistema detecta 2FA habilitado**
   ```json
   {
     "requires_2fa": true,
     "two_factor_enabled": true,
     "message": "Se requiere código de autenticación de dos factores"
   }
   ```

3. **Segundo paso - Verificación de código**
   ```bash
   POST /api/v1/auth/2fa/verify/
   Body: {"email": "user@example.com", "token": "123456"}
   ```

4. **Respuesta exitosa**
   ```json
   {
     "verified": true,
     "detail": "Código verificado exitosamente"
   }
   ```

## Pruebas Realizadas

Se creó un script de prueba completo (`backend/test_2fa.py`) que verifica:

✅ Creación de usuario de prueba
✅ Login sin 2FA habilitado
✅ Habilitación de 2FA
✅ Confirmación con código TOTP
✅ Login con 2FA habilitado
✅ Verificación de código TOTP
✅ Uso de token de respaldo
✅ Deshabilitación de 2FA

### Resultado de las Pruebas

```
============================================================
    TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE
============================================================
```

## Consideraciones de Seguridad

1. **Almacenamiento Seguro**
   - Los secretos TOTP se almacenan encriptados en la base de datos
   - Los tokens de respaldo se hashean antes de almacenarse

2. **Ventana de Tiempo**
   - Se permite una tolerancia de ±1 período (30 segundos) para códigos TOTP
   - Esto compensa posibles diferencias de reloj entre cliente y servidor

3. **Rate Limiting** (Pendiente de implementar)
   - Se recomienda agregar límites de intentos para prevenir ataques de fuerza bruta

4. **Logs de Seguridad** (Pendiente de implementar)
   - Se recomienda registrar todos los intentos de autenticación 2FA

## Próximos Pasos

### Backend
- [ ] Implementar rate limiting para intentos de verificación 2FA
- [ ] Agregar logs de seguridad para intentos fallidos
- [ ] Considerar encriptación adicional para el campo `two_factor_secret`
- [ ] Implementar notificaciones por email cuando se habilita/deshabilita 2FA

### Frontend (React)
- [ ] Detectar cuando se requiere 2FA en el flujo de login
- [ ] Agregar componente para ingresar el código 2FA
- [ ] Mostrar el código QR durante la configuración inicial
- [ ] Guardar y mostrar los tokens de respaldo de forma segura
- [ ] Agregar opción de "Recordar este dispositivo" (opcional)

### Frontend (Electron Desktop)
- [ ] Implementar las mismas funcionalidades que en el frontend web
- [ ] Considerar almacenamiento seguro local para tokens de respaldo

## Configuración

### Variables de Entorno

```python
# En settings/base.py
TWO_FACTOR_ISSUER_NAME = 'Hospital System'  # Nombre que aparece en la app autenticadora
TWO_FACTOR_TOKEN_VALIDITY_WINDOW = 1        # Ventana de validez del token (±30 segundos)
TWO_FACTOR_BACKUP_TOKEN_COUNT = 10          # Cantidad de tokens de respaldo generados
```

### Dependencias

```bash
# Requerimientos instalados
django-otp==1.4.0
pyotp==2.9.0
qrcode==7.4.2
```

## Solución de Problemas

### Error con Django Debug Toolbar
Durante las pruebas se encontró un conflicto con Django Debug Toolbar. Para ejecutar las pruebas de 2FA:

1. Desactivar temporalmente debug_toolbar en `settings/development.py`
2. Ejecutar las pruebas
3. Reactivar debug_toolbar

### Script de Prueba
Para ejecutar las pruebas de 2FA:

```bash
cd backend
powershell -ExecutionPolicy Bypass -File .\run_2fa_tests.ps1
```

## Conclusión

La implementación de 2FA añade una capa crítica de seguridad al sistema hospitalario, protegiendo información médica sensible. Con las pruebas completadas exitosamente, el sistema está listo para la integración con el frontend.
