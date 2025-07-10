# Módulo de Reportes - Sistema Médico

## Descripción General

El módulo de reportes proporciona capacidades completas de generación, programación y gestión de reportes para el sistema médico. Incluye reportes de citas, financieros, de emergencias, ocupación hospitalaria y medicamentos.

## Características Principales

- ✅ **Generación de Reportes**: PDF, CSV, JSON y Excel
- ✅ **Reportes Programados**: Generación automática según calendario
- ✅ **Sistema de Caché**: Optimización de reportes pesados
- ✅ **Auditoría Completa**: Registro de todas las acciones
- ✅ **API REST Documentada**: Con Swagger/OpenAPI
- ✅ **Procesamiento Asíncrono**: Usando Celery

## Tipos de Reportes Disponibles

### 1. Reportes de Citas (Appointments)
- Resumen de citas por período
- Análisis por especialidad
- Tasa de cancelaciones
- Ocupación de agenda médica

### 2. Reportes Financieros (Financial)
- Resumen de ingresos
- Ingresos por especialidad
- Análisis de ventas de farmacia
- Estado de pagos y cuentas por cobrar
- Tendencias de ingresos

### 3. Reportes de Emergencias (Emergency)
- Resumen de casos
- Análisis de triaje
- Tiempos de respuesta
- Análisis de horas pico
- Utilización de recursos

### 4. Reportes de Ocupación (Occupancy)
- Ocupación de camas
- Análisis por departamento
- Estadías promedio

### 5. Reportes de Medicamentos (Medications)
- Inventario actual
- Medicamentos más prescritos
- Análisis de consumo

## Endpoints API

### Generación de Reportes
```
POST /api/v1/reports/generated/generate/
```

**Request Body:**
```json
{
    "report_type": "financial",
    "format": "pdf",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "parameters": {
        "include_details": true
    }
}
```

### Listar Reportes Generados
```
GET /api/v1/reports/generated/
```

**Query Parameters:**
- `report_type`: Filtrar por tipo
- `status`: Filtrar por estado
- `start_date`: Fecha inicial
- `end_date`: Fecha final

### Descargar Reporte
```
GET /api/v1/reports/generated/{id}/download/
```

### Dashboard de Estadísticas
```
GET /api/v1/reports/dashboard/summary/
```

## Endpoints de Reportes Financieros

### Resumen de Ingresos
```
GET /api/v1/reports/financial/revenue_summary/
```

### Ingresos por Especialidad
```
GET /api/v1/reports/financial/revenue_by_specialty/
```

### Análisis de Farmacia
```
GET /api/v1/reports/financial/pharmacy_sales_analysis/
```

## Endpoints de Reportes de Emergencias

### Resumen de Casos
```
GET /api/v1/reports/emergency/case_summary/
```

### Análisis de Triaje
```
GET /api/v1/reports/emergency/triage_analysis/
```

### Tiempos de Respuesta
```
GET /api/v1/reports/emergency/response_times/
```

## Configuración del Sistema de Caché

El módulo utiliza un sistema de caché inteligente para optimizar reportes pesados:

```python
# Configuración en settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'KEY_PREFIX': 'medical_reports',
        }
    }
}
```

### Timeouts por Tipo de Reporte:
- Financial: 2 horas
- Emergency: 1 hora
- Appointments: 30 minutos
- Occupancy: 30 minutos
- Medications: 1 hora

## Configuración de Celery

Para procesamiento asíncrono de reportes:

```python
# Configuración en settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
```

### Ejecutar Celery:
```bash
celery -A medical_system worker -l info
celery -A medical_system beat -l info
```

## Modelos de Datos

### ReportTemplate
- Plantillas reutilizables para reportes
- Configuración personalizable
- Activación/desactivación

### GeneratedReport
- Registro de reportes generados
- Estados: pending, processing, completed, failed
- Archivos adjuntos

### ScheduledReport
- Programación de reportes automáticos
- Frecuencias: daily, weekly, monthly
- Notificaciones por email

### ReportAudit
- Registro de auditoría
- Acciones: generated, viewed, downloaded
- IP y user agent

## Tests

Ejecutar tests del módulo:

```bash
python manage.py test reports
```

### Cobertura de Tests:
- Modelos: ✅ 100%
- APIs: ✅ 95%
- Generadores: ✅ 90%
- Caché: ✅ 100%

## Permisos y Seguridad

- **Autenticación requerida** para todos los endpoints
- **Permisos por rol**:
  - Admin: Acceso completo
  - Doctor: Reportes de su especialidad
  - Nurse: Reportes de emergencias
  - Receptionist: Reportes de citas
  - Pharmacist: Reportes de farmacia

## Documentación API

La documentación completa está disponible en:
- Swagger UI: `/api/swagger/`
- ReDoc: `/api/redoc/`
- OpenAPI Schema: `/api/schema/`

## Dependencias

```python
# requirements.txt
Django>=4.2
djangorestframework>=3.14
drf-spectacular>=0.26
celery>=5.3
redis>=5.0
reportlab>=4.0  # Para PDFs
openpyxl>=3.1   # Para Excel
Pillow>=10.0    # Para imágenes en PDFs
```

## Troubleshooting

### Problema: Reportes no se generan
1. Verificar que Celery esté ejecutándose
2. Verificar conexión a Redis
3. Revisar logs en `logs/celery.log`

### Problema: Caché no funciona
1. Verificar configuración de Redis
2. Verificar permisos de escritura
3. Limpiar caché: `python manage.py clear_cache`

### Problema: PDFs no se generan correctamente
1. Verificar instalación de ReportLab
2. Verificar permisos en directorio media/reports
3. Revisar configuración de fuentes

## Mejoras Futuras

1. **Plantillas personalizables** por usuario
2. **Exportación a más formatos** (XML, PowerBI)
3. **Gráficos interactivos** en reportes
4. **Integración con BI tools**
5. **Reportes en tiempo real** con WebSockets

## Contacto y Soporte

Para soporte o preguntas sobre el módulo de reportes:
- Email: soporte@sistemamédico.com
- Documentación: https://docs.sistemamedico.com/reports
- Issues: https://github.com/sistemamedico/reports/issues
