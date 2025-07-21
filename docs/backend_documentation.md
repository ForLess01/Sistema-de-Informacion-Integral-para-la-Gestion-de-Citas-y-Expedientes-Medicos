# Documentación del Backend

## Resumen del Proyecto
El backend del Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos está construido sobre el framework Django. Este sistema abarca componentes esenciales como la gestión de autenticación, expedientes médicos, citas, farmacia, emergencias, notificaciones y reportes. Utiliza APIs RESTful con autenticación JWT y se integra tanto con pacientes como con personal médico y administrativo.

## Estructura del Proyecto

### Autenticación (`authentication`)
- **Modelos**: `User`, `DoctorProfile`, `PatientProfile`, `LoginAttempt`
- **Vistas**: Manejo de registro, gestión de tokens JWT, seguridad con 2FA
- **Servicios**: `TwoFactorService` para gestionar autenticación de dos factores
- **Serializadores**: `UserSerializer`, `LoginSerializer`, `ChangePasswordSerializer`
- **URLs**: Autenticación y gestión de perfiles

### Citas Médicas (`appointments`)
- **Modelos**: `Specialty`, `MedicalSchedule`, `Appointment`, `TemporaryReservation`, `AppointmentReminder`
- **Vistas**: CRUD de citas, gestión de reservas temporales
- **Serializadores**: `AppointmentSerializer`, `TemporaryReservationSerializer`

### Registros Médicos (`medical_records`)
- **Modelos**: `MedicalRecord`, `Prescription`, `PrescriptionItem`, `VitalSigns`
- **Descripción**: Gestión integral de los registros médicos y recetas, manejo de pruebas de laboratorio

### Farmacia (`pharmacy`)
- **Modelos**: `Medication`, `Dispensation`, `MedicationBatch`, `StockMovement`, `Prescription`
- **Vistas**: Gestión de inventario, dispensación de medicamentos
- **Serializadores**: `MedicationSerializer`, `DispensationSerializer`

### Emergencias (`emergency`)
- **Modelos**: `EmergencyCase`, `EmergencyVitalSigns`, `EmergencyMedication`
- **Vistas**: Triaje, admisiones, transferencias
- **Serializadores**: `EmergencyCaseSerializer`, `EmergencyVitalSignsSerializer`

### Notificaciones (`notifications`)
- **Modelos**: `NotificationTemplate`, `Notification`, `NotificationLog`
- **Servicios**: `NotificationService` para envío de notificaciones por email, SMS, push
- **Descripción**: Preferencias de notificación, seguimiento de estados

### Reportes (`reports`)
- **Modelos**: `Report`, `ReportTemplate`, `GeneratedReport`
- **Generadores**: `BaseReportGenerator` para crear reportes en PDF, Excel, CSV, JSON

### API Externa (`api_external`)
- **Modelos**: `ExternalAPIClient`, `APIAccessLog`, `APIRateLimit`
- **Descripción**: Proporciona acceso seguro a sistemas externos por medio de API

## Seguridad y Configuración
- **Autenticación JWT**: Uso de JSON Web Tokens para autenticar y autorizar solicitudes
- **CORS**: Configuración de Same-Origin Policy para limitar el acceso a recursos del backend
- **HTTPS**: Recomendado el uso en producción para asegurar la transferencia segura de datos

## Integraciones Externas
- **Geolocalización**: Integrada con el servicio de Google Maps
- **Notificaciones**: Implementación con Firebase para notificaciones push

## Otras Consideraciones
- **Procesamiento Asíncrono con Celery**: Utilizado para tareas programadas y procesamiento en segundo plano
- **Base de Datos**: PostgreSQL configurado para manejo de transacciones complejas y encriptación de campos sensibles

---

Esta documentación cubre extensamente los componentes del backend, sus modelos y funcionalidades esenciales para integrar y gestionar la información médica dentro del sistema. Si necesitas detalles adicionales, no dudes en preguntar.
