# Documentación Completa del Sistema Integral de Gestión de Citas y Expedientes Médicos

## Índice

1.  [Introducción](#introducción)
    *   [Propósito del Sistema](#propósito-del-sistema)
    *   [Alcance](#alcance)
2.  [Arquitectura General](#arquitectura-general)
    *   [Componentes Principales](#componentes-principales)
    *   [Diagrama de Arquitectura](#diagrama-de-arquitectura)
    *   [Tecnologías Utilizadas](#tecnologías-utilizadas)
3.  [Backend (Servidor Django)](#backend-servidor-django)
    *   [Configuración y Puesta en Marcha](#configuración-y-puesta-en-marcha-backend)
    *   [Estructura del Proyecto](#estructura-del-proyecto-backend)
    *   [Módulos Principales (Apps)](#módulos-principales-apps-backend)
        *   [Authentication](#authentication)
        *   [Appointments](#appointments)
        *   [Medical Records](#medical-records)
        *   [Emergency](#emergency)
        *   [Dashboard](#dashboard)
        *   [API External](#api-external)
    *   [Esquema de la Base de Datos](#esquema-de-la-base-de-datos)
    *   [API Endpoints](#api-endpoints)
    *   [Seguridad](#seguridad-backend)
4.  [Frontend Web](#frontend-web)
    *   [Configuración y Puesta en Marcha](#configuración-y-puesta-en-marcha-frontend-web)
    *   [Estructura del Proyecto](#estructura-del-proyecto-frontend-web)
    *   [Componentes y Vistas Principales](#componentes-y-vistas-principales-web)
    *   [Comunicación con el Backend](#comunicación-con-el-backend-web)
5.  [Frontend Desktop (Electron)](#frontend-desktop-electron)
    *   [Configuración y Puesta en Marcha](#configuración-y-puesta-en-marcha-frontend-desktop)
    *   [Estructura del Proyecto](#estructura-del-proyecto-frontend-desktop)
    *   [Componentes y Vistas Principales](#componentes-y-vistas-principales-desktop)
    *   [Comunicación con el Backend](#comunicación-con-el-backend-desktop)
### Diferencias con el Frontend Web

Aunque la base de código de la interfaz de usuario (React) es la misma, la versión de escritorio se beneficia de una integración más profunda con el sistema operativo, ofreciendo una experiencia de usuario más robusta y características que no son posibles en un navegador web estándar, como el menú de aplicación y el acceso directo al sistema de archivos.

---

## 6. Scripts y Herramientas de Desarrollo

El proyecto incluye varios scripts para automatizar tareas comunes de configuración, ejecución y limpieza, así como herramientas para asegurar la calidad y consistencia del código.

### Scripts de Automatización

-   **`setup_backend.bat`**: Configura el entorno del backend. Ejecuta las migraciones de la base de datos, crea un superusuario administrador y carga datos iniciales de prueba.
-   **`setup_frontend_web.bat`**: Instala las dependencias `npm` para el proyecto de React y crea un archivo de configuración `.env.local`.
-   **`setup_frontend_desktop.bat`**: Instala las dependencias `npm` para el proyecto de Electron, incluyendo el propio Electron, y crea un archivo de configuración `.env.local`.
-   **`start_system.bat`**: Inicia todos los componentes del sistema en el orden correcto: el backend de Django, el frontend web y la aplicación de escritorio de Electron.
-   **`clean-project.ps1`**: Script de PowerShell para limpiar el proyecto. Detiene los servidores en ejecución, elimina los archivos de caché de Python (`__pycache__`) y, opcionalmente, reinstala las dependencias de Node.js.

### Gestión de Dependencias

-   **Backend:** Las dependencias de Python se gestionan a través de archivos `requirements.txt`. Existen diferentes archivos para producción (`requirements-prod.txt`) y desarrollo (`requirements-dev.txt`).
-   **Frontend:** Las dependencias de JavaScript se gestionan con `npm` y se definen en los archivos `package.json` de cada proyecto frontend.

### Pruebas (Testing)

El backend utiliza un conjunto robusto de herramientas para garantizar la calidad del código:

-   **`pytest`**: Es el framework principal para la ejecución de pruebas. La configuración se encuentra en `pytest.ini`.
-   **`pytest.ini`**: Define la configuración de `pytest`, incluyendo:
    -   La configuración de Django a utilizar para las pruebas.
    -   Las rutas donde se encuentran los archivos de pruebas.
    -   Opciones para la generación de reportes de cobertura de código (`--cov`).
    -   Marcadores personalizados para categorizar pruebas (ej. `@pytest.mark.slow`, `@pytest.mark.api`).
-   **`tox`**: Es una herramienta de automatización de pruebas que permite ejecutar los tests en múltiples entornos de Python y con diferentes versiones de Django. El archivo `tox.ini` define los entornos para:
    -   Ejecutar `pytest`.
    -   Realizar análisis de estilo de código con `flake8`.
    -   Realizar chequeo de tipos estáticos con `mypy`.
    -   Verificar el formato del código con `black` y `isort`.
    -   Comprobar vulnerabilidades de seguridad con `safety` y `bandit`.

---

## 7. Guía de Despliegue

Esta guía describe los pasos recomendados para desplegar el sistema en un entorno de producción. Se asume un servidor Linux (ej. Ubuntu 22.04).

### Requisitos del Servidor

-   **Sistema Operativo:** Linux (Ubuntu 22.04 o similar recomendado).
-   **Servidor Web:** Nginx para actuar como proxy inverso y servir archivos estáticos.
-   **Servidor de Aplicación WSGI:** Gunicorn para ejecutar la aplicación Django.
-   **Base de Datos:** PostgreSQL (versión 14 o superior).
-   **Cache y Tareas Asíncronas:** Redis (versión 6 o superior).
-   **Entorno de Python:** Python 3.9+ y `venv` para el aislamiento de dependencias.
-   **Node.js:** Node.js (versión 18 o superior) y `npm` para construir el frontend.
-   **Certificado SSL:** Recomendado para habilitar HTTPS (ej. Let's Encrypt).

---

### Pasos para el Despliegue

#### 1. Configuración Inicial del Servidor

1.  **Actualizar el sistema:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Instalar dependencias:**
    ```bash
    sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib redis-server git
    ```
3.  **Configurar la base de datos PostgreSQL:**
    -   Crear un usuario y una base de datos para la aplicación.
4.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO> /var/www/medical-system
    cd /var/www/medical-system
    ```

#### 2. Despliegue del Backend (Django)

1.  **Crear y activar el entorno virtual:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
2.  **Instalar dependencias de Python:**
    ```bash
    pip install -r requirements-prod.txt
    ```
3.  **Configurar variables de entorno:**
    -   Crear un archivo `.env` en el directorio `backend`.
    -   Definir las siguientes variables:
        ```
        SECRET_KEY=<UNA_CLAVE_SECRETA_Y_SEGURA>
        DEBUG=False
        ALLOWED_HOSTS=your_domain.com,www.your_domain.com
        DATABASE_URL=postgres://user:password@localhost/dbname
        REDIS_URL=redis://localhost:6379/0
        ```
4.  **Preparar la aplicación Django:**
    ```bash
    cd backend
    python manage.py check --deploy
    python manage.py collectstatic --noinput
    python manage.py migrate
    # Crear un superusuario si es necesario
    python manage.py createsuperuser
    cd ..
    ```
5.  **Configurar Gunicorn con systemd:**
    -   Crear un archivo de servicio systemd en `/etc/systemd/system/gunicorn.service`:
        ```ini
        [Unit]
        Description=gunicorn daemon for medical-system
        After=network.target

        [Service]
        User=www-data
        Group=www-data
        WorkingDirectory=/var/www/medical-system/backend
        ExecStart=/var/www/medical-system/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/var/www/medical-system/gunicorn.sock medical_system.wsgi:application

        [Install]
        WantedBy=multi-user.target
        ```
    -   Iniciar y habilitar el servicio:
        ```bash
        sudo systemctl start gunicorn
        sudo systemctl enable gunicorn
        ```

#### 3. Despliegue del Frontend (Web)

1.  **Construir la aplicación React:**
    ```bash
    cd frontend-web
    npm install
    npm run build
    cd ..
    ```
    -   Los archivos estáticos se generarán en `frontend-web/dist`.

#### 4. Configuración de Nginx

1.  **Crear un archivo de configuración de Nginx** en `/etc/nginx/sites-available/medical-system`:
    ```nginx
    server {
        listen 80;
        server_name your_domain.com www.your_domain.com;

        # Redirigir HTTP a HTTPS (recomendado)
        # location / {
        #     return 301 https://$host$request_uri;
        # }

        location = /favicon.ico { access_log off; log_not_found off; }
        location /static/ {
            root /var/www/medical-system/backend;
        }

        location /media/ {
            root /var/www/medical-system/backend;
        }

        location /api/ {
            include proxy_params;
            proxy_pass http://unix:/var/www/medical-system/gunicorn.sock;
        }

        location / {
            root /var/www/medical-system/frontend-web/dist;
            try_files $uri /index.html;
        }
    }
    ```
2.  **Habilitar el sitio y reiniciar Nginx:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/medical-system /etc/nginx/sites-enabled
    sudo nginx -t # Testear la configuración
    sudo systemctl restart nginx
    ```
3.  **(Opcional pero recomendado) Configurar HTTPS con Let's Encrypt:**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your_domain.com -d www.your_domain.com
    ```

#### 5. Empaquetado del Frontend (Desktop)

La aplicación de escritorio no se "despliega" en un servidor, sino que se distribuye como un instalador para los sistemas operativos de los usuarios.

1.  **Navegar al directorio del frontend de escritorio:**
    ```bash
    cd frontend-desktop
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Construir los instaladores:**
    ```bash
    npm run dist
    ```
    -   Este comando utiliza `electron-builder` para crear los paquetes de instalación (ej. `.exe` para Windows, `.dmg` para macOS, `.deb`/`.AppImage` para Linux) en la carpeta `frontend-desktop/dist`.
    -   Estos archivos generados son los que se deben distribuir al personal de la clínica para su instalación.

---

## 1. Introducción

### Propósito del Sistema

El Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos es una solución completa diseñada para modernizar y automatizar la administración de clínicas y consultorios médicos. Su objetivo principal es optimizar la gestión de citas, centralizar los expedientes de los pacientes de forma segura y facilitar el acceso a la información tanto para el personal médico como para los pacientes a través de diferentes plataformas (web y de escritorio).

### Alcance

El sistema abarca las siguientes funcionalidades clave:

*   **Gestión de Citas:** Permite a los pacientes solicitar, consultar y cancelar citas médicas en línea. El personal administrativo puede gestionar los horarios de los doctores, confirmar citas y manejar la disponibilidad.
*   **Expedientes Médicos Electrónicos:** Almacena de forma segura y centralizada el historial médico de los pacientes, incluyendo diagnósticos, tratamientos, alergias, y resultados de laboratorio.
*   **Autenticación y Seguridad:** Implementa un sistema robusto de autenticación de usuarios con roles (administrador, doctor, paciente) y utiliza autenticación de dos factores (2FA) para mayor seguridad.
*   **Acceso Multiplataforma:** Ofrece una interfaz web para un acceso amplio y una aplicación de escritorio para un entorno de trabajo más robusto y dedicado al personal interno.
*   **Generación de Reportes:** Permite crear reportes y estadísticas sobre la operación de la clínica, como citas por período, carga de trabajo de los doctores, etc.

---

## 2. Arquitectura General

El sistema sigue una arquitectura cliente-servidor distribuida, compuesta por tres componentes principales que se comunican a través de una API REST.

### Componentes Principales

1.  **Backend (Servidor Django):** Es el núcleo del sistema. Construido con el framework Django, se encarga de toda la lógica de negocio, la gestión de la base de datos, la autenticación de usuarios y la exposición de los datos a través de una API RESTful.

2.  **Frontend Web:** Una aplicación de una sola página (SPA) desarrollada con React y Vite. Proporciona la interfaz de usuario para que los pacientes y el personal interactúen con el sistema a través de un navegador web. Es ideal para el acceso de pacientes y tareas administrativas ligeras.

3.  **Frontend Desktop:** Una aplicación de escritorio construida con Electron, que empaqueta la misma aplicación web de React. Ofrece una experiencia de usuario más integrada y potente para el personal administrativo y médico, permitiendo un acceso directo y persistente al sistema sin depender de un navegador.

### Diagrama de Arquitectura

(Se completará con un diagrama detallado...)

### Tecnologías Utilizadas

| Componente         | Tecnología/Librería         | Propósito                                        |
| ------------------ | --------------------------- | ------------------------------------------------ |
| **Backend**        | Python                      | Lenguaje de programación principal.              |
|                    | Django                      | Framework principal para el desarrollo web.      |
|                    | Django REST Framework       | Creación de la API RESTful.                      |
|                    | PostgreSQL (Recomendado)    | Sistema de gestión de base de datos.             |
|                    | Gunicorn                    | Servidor WSGI para producción.                   |
|                    | Celery & Redis              | Gestión de tareas asíncronas (ej. notificaciones).|
| **Frontend (Web)** | React                       | Librería para construir la interfaz de usuario.  |
|                    | Vite                        | Herramienta de construcción y desarrollo rápido. |
|                    | React Router                | Manejo de rutas en la SPA.                       |
|                    | Axios                       | Cliente HTTP para la comunicación con la API.    |
|                    | Tailwind CSS                | Framework de CSS para el diseño de la UI.        |
|                    | Chart.js / Recharts         | Creación de gráficos y visualizaciones.          |
| **Frontend (Desktop)** | Electron                  | Framework para crear apps de escritorio con JS.  |
|                    | Electron Builder            | Empaquetado y distribución de la aplicación.     |
|                    | (Mismas que Frontend Web)   | La base de la aplicación es la misma SPA de React.|
| **Desarrollo**     | Git                         | Sistema de control de versiones.                 |
|                    | Pytest                      | Framework de pruebas para el backend.            |
|                    | ESLint                      | Linter para el código JavaScript/React.          |

---

## 3. Backend (Servidor Django)

(Se completará...)

### Esquema de la Base de Datos

A continuación se describen los modelos de datos más importantes del sistema, agrupados por aplicación.

#### Módulo: `authentication`

-   **User:** Modelo central que representa a todos los usuarios del sistema. Incluye campos para información personal, de contacto, roles, y seguridad (2FA). Campos críticos como el DNI están encriptados.
-   **DoctorProfile:** Extiende el modelo `User` para añadir información específica de los doctores, como su número de licencia, especialidades y biografía.
-   **PatientProfile:** Extiende el modelo `User` para datos específicos de pacientes, como tipo de sangre, alergias y contacto de emergencia.
-   **LoginAttempt:** Registra los intentos de inicio de sesión para monitorear la seguridad.

#### Módulo: `appointments`

-   **Specialty:** Almacena las especialidades médicas disponibles en la clínica.
-   **MedicalSchedule:** Define los horarios de trabajo de los doctores, incluyendo días, horas y duración de las citas por especialidad.
-   **Appointment:** Representa una cita médica agendada entre un paciente y un doctor. Contiene el estado de la cita (agendada, confirmada, cancelada, etc.), fechas y motivo.
-   **TemporaryReservation:** Gestiona reservas de citas temporales para evitar conflictos mientras un usuario completa el proceso de agendamiento.
-   **AppointmentReminder:** Almacena los recordatorios de citas que se deben enviar a los pacientes.

#### Módulo: `medical_records`

-   **MedicalRecord:** El registro médico principal de un paciente, que agrupa consultas y otros eventos clínicos.
-   **Prescription:** Modela una receta médica emitida por un doctor, con su fecha de validez y diagnóstico.
-   **PrescriptionItem:** Detalla cada medicamento dentro de una receta, incluyendo dosis y frecuencia.
-   **VitalSigns:** Almacena las mediciones de signos vitales de un paciente en un momento dado.
-   **Allergy:** Registra las alergias conocidas de un paciente.
-   **LabTest:** Gestiona las solicitudes y resultados de exámenes de laboratorio.
-   **MedicalDocument:** Permite adjuntar archivos (PDF, imágenes) a un registro médico.
-   **ClinicalNote:** Contiene notas detalladas de la evolución del paciente, escritas por el personal médico.
-   **PatientHistory:** Almacena el historial médico, quirúrgico, familiar y social del paciente.

#### Módulo: `emergency`

-   **EmergencyCase:** Modela un caso de atención en el área de emergencias, incluyendo un sistema de triaje para clasificar la gravedad.
-   **EmergencyVitalSigns:** Registra los signos vitales tomados durante una emergencia.
-   **EmergencyMedication:** Detalla los medicamentos administrados en una emergencia.
-   **EmergencyProcedure:** Documenta los procedimientos realizados durante la atención de emergencia.
-   **EmergencyTransfer:** Gestiona el traslado de un paciente desde emergencias a otra área u hospital.
-   **TriageAssessment:** Contiene la evaluación detallada del triaje inicial del paciente.

### API Endpoints

La API está versionada bajo el prefijo `/api/v1/`. A continuación se listan los principales endpoints agrupados por funcionalidad.

#### Autenticación (`/auth/`)

-   `POST /login/`: Inicia sesión para usuarios web (pacientes). Devuelve tokens JWT.
-   `POST /desktop-login/`: Inicia sesión para usuarios de la aplicación de escritorio (personal).
-   `POST /token/refresh/`: Refresca un token JWT expirado.
-   `POST /register/`: Registra un nuevo usuario (paciente).
-   `GET, PUT /profile/`: Obtiene o actualiza el perfil del usuario autenticado.
-   `POST /change-password/`: Permite a un usuario cambiar su contraseña.
-   `GET /users/`: (Admin) Lista todos los usuarios del sistema.
-   `POST /check-email/`: Verifica si un email ya está registrado.
-   `POST /check-dni/`: Verifica si un DNI ya está registrado.

#### Autenticación de Dos Factores (2FA) (`/auth/2fa/`)

-   `POST /enable/`: Inicia el proceso para habilitar 2FA para un usuario.
-   `POST /confirm/`: Confirma y activa 2FA con un código de la app de autenticación.
-   `POST /disable/`: Deshabilita 2FA para un usuario.
-   `POST /verify/`: Verifica un código 2FA durante el login.
-   `POST /backup-tokens/`: Regenera los códigos de respaldo.

#### Citas (`/appointments/`)

-   `GET, POST /`: (CRUD) Gestiona las citas médicas. `GET` para listar, `POST` para crear.
-   `GET, PUT, DELETE /{appointment_id}/`: (CRUD) Obtiene, actualiza o elimina una cita específica.
-   `GET /available-slots/`: Obtiene los horarios disponibles para un doctor en una fecha específica.
-   `GET /specialties/`: Lista todas las especialidades médicas activas.
-   `GET /specialties/{specialty_id}/doctors/`: Lista los doctores disponibles para una especialidad.
-   `GET /upcoming/`: Devuelve las próximas 5 citas confirmadas para el usuario.

#### Expedientes Médicos (`/medical-records/`)

-   `GET, POST /`: (CRUD) Gestiona los registros médicos. `GET` para listar, `POST` para crear.
-   `GET, PUT, DELETE /{record_id}/`: (CRUD) Obtiene, actualiza o elimina un registro médico específico.
-   *Nota: Los endpoints para los modelos relacionados (Prescription, VitalSigns, etc.) suelen estar anidados bajo el registro médico correspondiente.*

#### Emergencias (`/emergency/`)

-   `GET, POST /cases/`: (CRUD) Gestiona los casos de emergencia.
-   `GET, PUT, DELETE /cases/{case_id}/`: (CRUD) Obtiene, actualiza o elimina un caso de emergencia.
-   `GET /patients/`: Lista los pacientes actualmente en el área de emergencias.
-   Endpoints CRUD para `medications`, `procedures` y `transfers` anidados bajo un caso de emergencia.

## 4. Frontend Web

El frontend web es una Aplicación de Página Única (SPA) construida con React y Vite, diseñada principalmente para el acceso de pacientes.

### Estructura del Proyecto (`/src`)

-   **`/assets`**: Almacena recursos estáticos como imágenes, logos e iconos.
-   **`/components`**: Contiene componentes de React reutilizables (ej. botones, modales, inputs) y componentes más complejos específicos de una funcionalidad (ej. `auth`, `layout`).
-   **`/contexts`**: Gestiona el estado global de la aplicación. El `AuthContext` es un ejemplo clave, manejando la información del usuario y el estado de autenticación.
-   **`/hooks`**: Define hooks de React personalizados para encapsular lógica reutilizable (ej. `useAuth` para acceder al contexto de autenticación).
-   **`/pages`**: Representa las diferentes vistas o "páginas" de la aplicación, como `Dashboard`, `Appointments`, `Profile`, etc. Cada archivo corresponde a una ruta principal.
-   **`/services`**: Encapsula la lógica de comunicación con la API del backend. Cada servicio (ej. `authService`, `appointmentService`) agrupa las llamadas a la API relacionadas con un módulo.
-   **`/styles`**: Archivos de estilos globales (CSS).
-   **`/utils`**: Funciones de utilidad genéricas que pueden ser usadas en cualquier parte de la aplicación.
-   **`App.jsx`**: Componente raíz que configura el enrutamiento de la aplicación utilizando `react-router-dom`.
-   **`main.jsx`**: Punto de entrada de la aplicación. Renderiza el componente `App` en el DOM.

### Componentes y Vistas Principales

-   **Vistas de Autenticación (`/login`, `/register`):** Formularios para el inicio de sesión y registro de nuevos pacientes.
-   **Dashboard (`/dashboard`):** Página principal después del login. Muestra un resumen de las próximas citas, notificaciones y accesos directos a otras secciones.
-   **Gestión de Citas (`/appointments`, `/appointments/new`):** Vistas para que los pacientes puedan ver su historial de citas, agendar nuevas citas y ver los detalles de una cita específica.
-   **Perfil de Usuario (`/profile`):** Permite al usuario ver y actualizar su información personal y cambiar su contraseña.

### Comunicación con el Backend

La comunicación con el servidor Django se realiza a través de una API RESTful. La librería `axios` se utiliza para realizar las peticiones HTTP.

-   **Instancia de Axios (`services/api.js`):** Se ha configurado una instancia central de `axios` con la URL base de la API (`http://localhost:8000/api/v1`).
-   **Interceptores:**
    -   **Request Interceptor:** Adjunta automáticamente el token de autenticación (JWT) a las cabeceras de todas las peticiones salientes, obteniéndolo del `localStorage`.
    -   **Response Interceptor:** Maneja las respuestas de la API. Si se recibe un error `401 No Autorizado`, el interceptor se encarga de limpiar los datos de sesión del `localStorage` y redirigir al usuario a la página de login.

---

## 5. Frontend Desktop (Electron)

La aplicación de escritorio está construida con Electron, que actúa como un contenedor para la misma aplicación web de React. Esto permite que el personal de la clínica utilice el sistema como una aplicación nativa, con mejor integración en el sistema operativo.

### Configuración y Puesta en Marcha

La aplicación se inicia con el comando `npm run dev`, que ejecuta dos procesos en paralelo:
1.  `vite`: Inicia el servidor de desarrollo para la aplicación React.
2.  `electron .`: Lanza la aplicación Electron una vez que el servidor de Vite está listo.

Para producción, el comando `npm run dist` empaqueta la aplicación en un instalador nativo utilizando `electron-builder`.

### Estructura y Componentes Clave

-   **Proceso Principal de Electron (`src/electron/main.cjs`):** Este es el corazón de la aplicación de escritorio. Sus responsabilidades son:
    -   Crear y gestionar las ventanas de la aplicación (`BrowserWindow`). Se utiliza una ventana pequeña para el login y una ventana principal para la aplicación una vez que el usuario se ha autenticado.
    -   Cargar el contenido web. En desarrollo, carga la URL del servidor de Vite (`http://localhost:5173`). En producción, carga el archivo `index.html` del directorio `dist`.
    -   Definir un menú de aplicación nativo (Archivo, Editar, Ver, etc.) que proporciona atajos y funcionalidades comunes.

-   **Comunicación Inter-Procesos (IPC):** La comunicación entre el proceso principal de Electron (backend de la app de escritorio) y el proceso de renderizado (la app de React) es fundamental. Se utiliza `ipcMain` en el proceso principal y un script de `preload` para exponer de forma segura ciertas funciones al frontend.
    -   **`login-success`**: Cuando el usuario inicia sesión con éxito en la interfaz de React, se envía un evento al proceso principal. Este, a su vez, cierra la ventana de login y abre la ventana principal de la aplicación.
    -   **`logout`**: Realiza el proceso inverso, cerrando la ventana principal y mostrando de nuevo la de login.
    -   **Integración Nativa**: Se exponen funciones para interactuar con diálogos nativos del sistema operativo, como la impresión (`print-document`) o guardar archivos (`save-file`).

### Diferencias con el Frontend Web

Aunque la base de código de la interfaz de usuario (React) es la misma, la versión de escritorio se beneficia de una integración más profunda con el sistema operativo, ofreciendo una experiencia de usuario más robusta y características que no son posibles en un navegador web estándar, como el menú de aplicación y el acceso directo al sistema de archivos.
