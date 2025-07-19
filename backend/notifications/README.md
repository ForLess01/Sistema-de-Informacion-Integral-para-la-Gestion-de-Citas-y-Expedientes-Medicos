# Sistema Administrador-SIIGCEM🩺 - Medical System

## Descripción

El Sistema Administrador-SIIGCEM🩺 es un módulo integral que permite enviar comunicaciones automáticas a usuarios del sistema médico a través de múltiples canales: email, SMS, notificaciones push y notificaciones in-app.

## Características Principales

### 🔔 Múltiples Canales de Notificación
- **Email**: Envío de emails con soporte para HTML
- **SMS**: Mensajes de texto via API externa
- **Push Notifications**: Notificaciones push usando Firebase
- **In-App**: Notificaciones dentro de la aplicación

### 📋 Tipos de Notificaciones
- Recordatorios de citas (24h y 2h antes)
- Confirmaciones de citas
- Cancelaciones y reprogramaciones
- Resultados de exámenes médicos
- Notificaciones de farmacia
- Alertas de emergencia
- Notificaciones del sistema
- Bienvenida a nuevos usuarios

### ⚙️ Gestión Avanzada
- **Plantillas personalizables** con variables dinámicas
- **Preferencias por usuario** (canales, tipos, horarios)
- **Horas silenciosas** configurables
- **Prioridades** (baja, normal, alta, urgente)
- **Reintentos automáticos** para notificaciones fallidas
- **Procesamiento asíncrono** con Celery
- **Auditoría completa** con logs detallados

## Arquitectura

```
notifications/
├── models.py              # Modelos de datos
├── services.py           # Lógica de negocio
├── tasks.py              # Tareas asíncronas (Celery)
├── signals.py            # Señales automáticas
├── serializers.py        # Serializers para API
├── views.py              # Vistas de la API REST
├── admin.py              # Interface administrativa
├── urls.py               # URLs de la API
├── tests.py              # Tests unitarios
└── management/commands/  # Comandos de Django
    └── send_notifications.py
```

## Modelos de Datos

### NotificationTemplate
Plantillas reutilizables para diferentes tipos de notificaciones.

```python
# Ejemplo de plantilla
NotificationTemplate.objects.create(
    name='Recordatorio de Cita Email',
    notification_type='appointment_reminder',
    channel='email',
    subject_template='Recordatorio: Cita con {{doctor_name}}',
    body_template='Hola {{patient_name}}, tienes una cita el {{appointment_date}} a las {{appointment_time}}.'
)
```

### Notification
Notificaciones individuales con seguimiento completo.

### NotificationPreference
Preferencias de notificación por usuario (canales habilitados, horas silenciosas, etc.).

### PushDevice
Dispositivos registrados para notificaciones push.

### NotificationLog
Auditoría completa de todas las acciones de notificaciones.

## API REST

### Endpoints Principales

```
GET    /api/v1/notifications/                    # Listar notificaciones
GET    /api/v1/notifications/<uuid>/             # Detalle de notificación
GET    /api/v1/notifications/user/               # Notificaciones del usuario
POST   /api/v1/notifications/user/mark-read/     # Marcar como leídas

GET    /api/v1/notifications/templates/          # Plantillas
POST   /api/v1/notifications/templates/          # Crear plantilla

GET    /api/v1/notifications/preferences/        # Preferencias del usuario
PUT    /api/v1/notifications/preferences/        # Actualizar preferencias

POST   /api/v1/notifications/create/             # Crear notificación
POST   /api/v1/notifications/send/               # Enviar notificación
POST   /api/v1/notifications/bulk/               # Envío masivo
POST   /api/v1/notifications/test/               # Probar notificaciones

GET    /api/v1/notifications/stats/              # Estadísticas (admin)
GET    /api/v1/notifications/dashboard/          # Dashboard (admin)
GET    /api/v1/notifications/logs/               # Logs de auditoría
```

### Ejemplos de Uso

#### Crear una notificación
```python
POST /api/v1/notifications/create/
{
    "recipient_id": 123,
    "notification_type": "appointment_reminder",
    "context_data": {
        "patient_name": "Juan Pérez",
        "doctor_name": "Dr. García",
        "appointment_date": "25/07/2025",
        "appointment_time": "10:00"
    },
    "priority": "high",
    "channels": ["email", "push"]
}
```

#### Actualizar preferencias
```python
PUT /api/v1/notifications/preferences/
{
    "email_enabled": true,
    "sms_enabled": false,
    "push_enabled": true,
    "appointment_reminders": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00"
}
```

## Uso Programático

### Crear notificaciones desde código

```python
from notifications.services import notification_service

# Crear recordatorio de cita
notifications = notification_service.create_appointment_reminder(appointment)

# Crear notificación personalizada
notifications = notification_service.create_notification(
    recipient=user,
    notification_type='exam_results',
    context_data={'patient_name': user.get_full_name()},
    priority='normal'
)
```

### Envío asíncrono con Celery

```python
from notifications.tasks import send_notification_task

# Enviar una notificación específica
send_notification_task.delay(notification.id)

# Procesar notificaciones pendientes
from notifications.tasks import send_pending_notifications
send_pending_notifications.delay()
```

## Configuración

### Variables de Entorno

```env
# Email (Django settings)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@medicalsystem.com

# SMS
SMS_API_KEY=your-sms-api-key
SMS_API_URL=https://api.sms-provider.com/send
SMS_FROM_NUMBER=Medical System

# Firebase Push Notifications
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_SENDER_ID=your-sender-id

# Redis (para Celery y caché)
REDIS_URL=redis://localhost:6379

# Configuración de notificaciones
NOTIFICATION_QUIET_HOURS_START=22:00
NOTIFICATION_QUIET_HOURS_END=07:00
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_DELAY=300
```

### Configuración de Celery

```python
# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379'
CELERY_RESULT_BACKEND = 'redis://localhost:6379'

# Tareas periódicas
CELERY_BEAT_SCHEDULE = {
    'send-pending-notifications': {
        'task': 'notifications.tasks.send_pending_notifications',
        'schedule': 60.0,  # Cada minuto
    },
    'retry-failed-notifications': {
        'task': 'notifications.tasks.retry_failed_notifications',
        'schedule': 300.0,  # Cada 5 minutos
    },
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=2, minute=0),  # Diario a las 2 AM
    },
}
```

## Comandos de Gestión

### Enviar notificaciones pendientes
```bash
# Enviar todas las notificaciones pendientes
python manage.py send_notifications

# Enviar solo recordatorios de citas
python manage.py send_notifications --type appointment_reminder

# Enviar solo notificaciones de alta prioridad
python manage.py send_notifications --priority high

# Dry run (mostrar qué se enviaría sin enviar)
python manage.py send_notifications --dry-run

# Procesar hasta 50 notificaciones
python manage.py send_notifications --limit 50
```

## Señales Automáticas

El sistema incluye señales que crean notificaciones automáticamente:

- **Usuario creado**: Notificación de bienvenida
- **Cita creada**: Confirmación + recordatorio automático
- **Cita actualizada**: Notificaciones de cambios de estado
- **Expediente médico creado**: Notificación de resultados
- **Receta lista**: Notificación de farmacia
- **Emergencia**: Alertas a personal médico

## Tests

```bash
# Ejecutar todos los tests
python manage.py test notifications

# Ejecutar tests con cobertura
coverage run --source='.' manage.py test notifications
coverage report
coverage html
```

## Monitoreo y Estadísticas

### Dashboard de administración
- Estadísticas en tiempo real
- Gráficos de envío por día/canal/tipo
- Tasas de éxito/falla
- Logs de auditoría detallados

### Métricas importantes
- Total de notificaciones enviadas
- Tasa de éxito por canal
- Tiempo promedio de entrega
- Notificaciones fallidas por reintentar

## Escalabilidad

### Para entornos de alta carga:

1. **Múltiples workers de Celery**
   ```bash
   celery -A medical_system worker --loglevel=info --concurrency=4
   ```

2. **Redis Cluster** para mejor rendimiento de caché

3. **Rate limiting** configurado por API provider

4. **Particionamiento** de tablas de logs por fecha

5. **Archivado automático** de notificaciones antiguas

## Seguridad

- ✅ Validación de permisos por rol
- ✅ Rate limiting en APIs públicas
- ✅ Sanitización de datos de entrada
- ✅ Logs de auditoría completos
- ✅ Encriptación de tokens sensibles
- ✅ Validación de dispositivos push

## Troubleshooting

### Problemas comunes

1. **Notificaciones no se envían**
   - Verificar configuración de Celery
   - Revisar logs de errores
   - Comprobar configuración de providers (email/SMS/push)

2. **Emails no llegan**
   - Verificar configuración SMTP
   - Revisar spam/junk folders
   - Comprobar límites del proveedor

3. **Push notifications fallan**
   - Verificar Firebase configuration
   - Comprobar tokens de dispositivos
   - Revisar permisos de la app

4. **Alto consumo de memoria**
   - Implementar cleanup de logs antiguos
   - Optimizar queries de notificaciones
   - Configurar límites en Celery

### Logs útiles

```bash
# Ver logs de notificaciones
tail -f logs/notifications.log

# Ver logs de Celery
celery -A medical_system events

# Ver métricas de Redis
redis-cli monitor
```

## Roadmap

### Funcionalidades futuras
- [ ] Notificaciones por WhatsApp
- [ ] Templates con editor visual
- [ ] A/B testing de notificaciones
- [ ] Analytics avanzados
- [ ] Integración con calendar apps
- [ ] Notificaciones de voz
- [ ] Machine learning para optimización de horarios

---

## Contribución

Para contribuir al desarrollo del Sistema Administrador-SIIGCEM🩺:

1. Fork el repositorio
2. Crear una rama para tu feature
3. Escribir tests para nuevas funcionalidades
4. Asegurar que todos los tests pasen
5. Crear un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver LICENSE para más detalles.
