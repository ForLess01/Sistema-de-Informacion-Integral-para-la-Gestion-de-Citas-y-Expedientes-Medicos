# Documentación Detallada: Backend (Django)

## 1. Introducción y Propósito

El backend es el núcleo del Sistema de Información Integral. Construido con Python y el framework Django, actúa como un servidor central que gestiona toda la lógica de negocio, la persistencia de datos, la seguridad y la comunicación con los diferentes clientes (frontend web y frontend desktop) a través de una API RESTful.

**Responsabilidades Principales:**
-   **Gestión de Datos:** Provee una capa de abstracción para interactuar con la base de datos (PostgreSQL) a través del ORM de Django.
-   **Lógica de Negocio:** Implementa todas las reglas y flujos de trabajo del sistema, como la programación de citas, la gestión de expedientes y el sistema de triaje de emergencias.
-   **API RESTful:** Expone los datos y funcionalidades de manera segura y estandarizada para que los frontends puedan consumirlos.
-   **Autenticación y Autorización:** Maneja el registro, inicio de sesión y los permisos de los diferentes roles de usuario (pacientes, doctores, administradores, etc.).
-   **Tareas Asíncronas:** Gestiona operaciones que pueden tomar tiempo, como el envío de notificaciones por correo electrónico, a través de Celery y Redis.

---

## 2. Tecnologías y Dependencias Clave

| Tecnología/Librería     | Versión (Aprox.) | Propósito                                      |
| ----------------------- | ---------------- | ---------------------------------------------- |
| Python                  | 3.9+             | Lenguaje de programación principal.            |
| Django                  | 5.2.3            | Framework principal para el desarrollo web.    |
| Django REST Framework   | 3.16.0           | Creación de la API RESTful.                    |
| PostgreSQL (psycopg2)   | 2.9.9            | Driver para la base de datos PostgreSQL.       |
| Gunicorn                | 21.2.0           | Servidor de aplicación WSGI para producción.   |
| Celery                  | 5.5.3            | Sistema de colas para tareas asíncronas.       |
| Redis                   | 6.2.0            | Broker para Celery y sistema de caché.         |
| drf-spectacular         | -                | Generación de esquemas OpenAPI y docs de API.  |
| Pytest                  | -                | Framework para la ejecución de pruebas.        |
| Tox                     | -                | Herramienta de automatización de pruebas.      |

---

## 3. Estructura del Proyecto

```
backend/
├── api_external/         # App para la integración con sistemas externos
├── appointments/         # App para la gestión de citas y horarios
├── authentication/       # App para la gestión de usuarios, roles y auth
├── dashboard/            # App para los endpoints del dashboard
├── emergency/            # App para la gestión de casos de emergencia
├── medical_records/      # App para la gestión de expedientes médicos
├── medical_system/       # App principal del proyecto, contiene la configuración
│   ├── settings/         # Módulo de configuración (local, testing, producción)
│   ├── urls.py           # Fichero de URLs principal
│   └── wsgi.py           # Configuración para servidores WSGI
├── notifications/        # App para el envío de notificaciones
├── pharmacy/             # App para la gestión de farmacia
├── reports/              # App para la generación de reportes
├── static/               # Ficheros estáticos globales
├── templates/            # Plantillas HTML globales
├── tests/                # Pruebas de integración y configuración de pytest
├── .coveragerc           # Configuración para el reporte de cobertura de pruebas
├── manage.py             # Utilidad de línea de comandos de Django
├── pytest.ini            # Fichero de configuración para Pytest
├── requirements.txt      # Fichero de dependencias
├── tox.ini               # Fichero de configuración para Tox
└── ... (otros scripts y ficheros de configuración)
```

---

## 4. Arquitectura y Diseño

### 4.1. Módulos Principales (Apps)
El backend está organizado en varias "apps" de Django, cada una con una responsabilidad única:

-   **`authentication`**: Maneja todo lo relacionado con el usuario: registro, login (con JWT), perfiles, roles, permisos y autenticación de dos factores (2FA).
-   **`appointments`**: Contiene la lógica para la gestión de citas, incluyendo la definición de especialidades, horarios de doctores, agendamiento, cancelación y recordatorios.
-   **`medical_records`**: Es una de las apps más complejas. Gestiona los expedientes médicos, recetas, signos vitales, alergias, resultados de laboratorio y cualquier otro documento clínico.
-   **`emergency`**: Implementa la funcionalidad para el área de emergencias, con un sistema de triaje para priorizar pacientes y modelos para registrar los eventos de la emergencia.
-   **`pharmacy`**: Diseñada para gestionar el inventario de medicamentos y la dispensación de recetas.
-   **`api_external`**: Provee endpoints específicos y seguros para la integración con otros sistemas de información.
-   **`medical_system`**: Es el corazón del proyecto Django, donde reside la configuración principal (`settings.py`) y las URLs raíz (`urls.py`).

### 4.2. Esquema de la Base de Datos (Modelos)
(Esta sección es un resumen. Para ver todos los campos, consultar los ficheros `models.py` de cada app).

-   **`authentication.User`**: Modelo de usuario personalizable que hereda de Django. Es el centro del sistema y se relaciona con casi todos los demás modelos.
-   **`appointments.Appointment`**: Modela una cita. Se relaciona con dos `User` (paciente y doctor) y con una `Specialty`.
-   **`medical_records.MedicalRecord`**: Es el contenedor principal para el historial de un paciente. Se relaciona con un `User` (paciente) y tiene relaciones con `Prescription`, `LabTest`, `VitalSigns`, etc.
-   **`emergency.EmergencyCase`**: Representa una visita a emergencias. Se relaciona con un `User` (paciente) y tiene un `triage_level` para indicar la prioridad.

### 4.3. API Endpoints (URLs)
La API está versionada bajo `/api/v1/`. Las URLs están organizadas por recurso, siguiendo las mejores prácticas de REST.

-   `/api/v1/auth/`: Endpoints para autenticación y gestión de usuarios.
-   `/api/v1/appointments/`: Endpoints para el CRUD de citas y funcionalidades relacionadas.
-   `/api/v1/medical-records/`: Endpoints para el CRUD de expedientes médicos.
-   `/api/v1/emergency/`: Endpoints para el CRUD de casos de emergencia.

### 4.4. Pruebas y Calidad de Código
El proyecto está configurado para usar `pytest` para las pruebas y `tox` para automatizar la ejecución de tests en diferentes entornos.

-   **`pytest.ini`**: Configura `pytest` para que funcione con Django, define la ubicación de las pruebas, establece marcadores personalizados (`api`, `slow`, `security`) y configura el reporte de cobertura.
-   **`tox.ini`**: Define múltiples entornos de prueba para asegurar la compatibilidad con diferentes versiones de Python y Django. También integra herramientas de calidad de código como `flake8` (linting), `mypy` (type checking), `black` (formateo) y `safety` (análisis de vulnerabilidades).

---

## 5. Análisis y Recomendaciones

Durante el análisis automatizado del código, se han identificado varias áreas con potencial de mejora que podrían incrementar la mantenibilidad, robustez y seguridad del backend.

### 5.1. Gestión de Dependencias
-   **Observación:** El fichero `requirements.txt` es extremadamente grande y parece ser el resultado de un `pip freeze` de un entorno de desarrollo completo (posiblemente Anaconda), en lugar de una lista curada de las dependencias directas del proyecto.
-   **Riesgo:** Esto dificulta la reproducibilidad del entorno, aumenta el tamaño de los despliegues, y puede introducir vulnerabilidades de seguridad a través de paquetes no necesarios.
-   **Recomendación:**
    1.  Crear un fichero `requirements.in` con las dependencias de alto nivel (ej. `django`, `djangorestframework`, `celery`).
    2.  Utilizar la herramienta `pip-tools` (`pip-compile`) para generar un fichero `requirements.txt` limpio y bloqueado a versiones específicas.
    3.  Mantener separados los requisitos de producción (`requirements.txt`) y los de desarrollo (`requirements-dev.txt`, que incluiría `pytest`, `tox`, etc.).

### 5.2. Estructura de Configuración (Settings)
-   **Observación:** La configuración de `pytest` hace referencia a `medical_system.settings.testing.testing.testing.testing`. Esta estructura de directorios anidada para la configuración es inusual y confusa.
-   **Riesgo:** Dificulta la localización y modificación de la configuración, y puede llevar a errores.
-   **Recomendación:** Reestructurar el módulo de `settings` a un formato más estándar, como una carpeta `settings` con ficheros base, de desarrollo y de producción:
    ```
    medical_system/
    ├── settings/
    │   ├── __init__.py
    │   ├── base.py
    │   ├── development.py
    │   └── production.py
    ```

### 5.3. Organización de Scripts
-   **Observación:** Existen múltiples scripts de Python (`fix_*.py`, `test_*.py`, `populate_*.py`) en el directorio raíz del backend.
-   **Riesgo:** El directorio raíz se desordena y no queda clara la finalidad de cada script.
-   **Recomendación:** Agrupar estos scripts en un directorio `scripts/` o, preferiblemente, refactorizarlos como **comandos de gestión de Django**. Esto los integra con `manage.py` y permite una mejor documentación y reutilización.

### 5.4. Diseño de Endpoints (URLs)
-   **Observación:** En `appointments/urls.py`, se han creado vistas separadas basadas en funciones para exponer acciones de un `ViewSet` (como `available_slots`), con el comentario "avoid router conflicts".
-   **Riesgo:** Este es un anti-patrón en Django REST Framework. La forma idiomática de añadir endpoints personalizados a un `ViewSet` es con el decorador `@action`.
-   **Recomendación:** Refactorizar estas vistas personalizadas y mover su lógica dentro del `AppointmentViewSet` utilizando el decorador `@action(detail=False, methods=['get'])`. Esto simplificará el fichero `urls.py` y mantendrá la lógica agrupada en la clase correspondiente.

### 5.5. Modelo de Datos
-   **Observación:** Se han detectado redundancias en los modelos:
    1.  El modelo `User` contiene dos campos para la fecha de nacimiento: `birth_date` y `date_of_birth`.
    2.  El modelo `User` tiene campos para contacto de emergencia, que también existen en `PatientProfile`.
-   **Riesgo:** La duplicación de campos puede llevar a inconsistencias en los datos y a confusión sobre cuál es la fuente de verdad.
-   **Recomendación:**
    1.  Eliminar uno de los campos de fecha de nacimiento y migrar los datos al campo que se conserve.
    2.  Centralizar toda la información específica del paciente (incluyendo contactos de emergencia y datos médicos como tipo de sangre) en el `PatientProfile`, manteniendo el modelo `User` enfocado únicamente en la autenticación y la información básica.

---

## 6. Guía de Puesta en Marcha (Desarrollo)

1.  **Clonar el repositorio:** `git clone <URL_DEL_REPOSITORIO>`
2.  **Navegar al directorio:** `cd backend`
3.  **Crear un entorno virtual:** `python -m venv venv`
4.  **Activar el entorno:**
    -   Windows: `venv\Scripts\activate`
    -   macOS/Linux: `source venv/bin/activate`
5.  **Instalar dependencias:** `pip install -r requirements-dev.txt`
6.  **Configurar variables de entorno:** Crear un fichero `.env` en el directorio `backend` y configurar `SECRET_KEY` y `DATABASE_URL`.
7.  **Aplicar migraciones:** `python manage.py migrate`
8.  **Crear un superusuario:** `python manage.py createsuperuser`
9.  **Ejecutar el servidor de desarrollo:** `python manage.py runserver`
10. **Acceder a la API:** La API estará disponible en `http://127.0.0.1:8000/`.
