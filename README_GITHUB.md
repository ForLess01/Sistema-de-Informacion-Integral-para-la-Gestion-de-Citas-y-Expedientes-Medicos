# Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos

![Banner del Proyecto](https://via.placeholder.com/1200x400?text=Sistema+Medico)

## 🚀 Visión General del Proyecto

Este proyecto es un sistema integral diseñado para la gestión eficiente de citas y expedientes médicos en clínicas y consultorios. Ofrece una solución completa para la administración de pacientes, doctores, horarios, historiales clínicos y emergencias, accesible a través de una interfaz web moderna y una aplicación de escritorio robusta.

## ✨ Características Principales

-   **Gestión de Citas:** Agendamiento, confirmación, cancelación y recordatorios.
-   **Expedientes Médicos Electrónicos:** Historiales completos, signos vitales, alergias, recetas y resultados de laboratorio.
-   **Autenticación Segura:** Roles de usuario (paciente, doctor, administrador), autenticación de dos factores (2FA).
-   **Acceso Multiplataforma:** Aplicación web (React) y aplicación de escritorio (Electron).
-   **Módulo de Emergencias:** Sistema de triaje y gestión de casos urgentes.
-   **Reportes y Estadísticas:** Generación de informes sobre la operación de la clínica.

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura cliente-servidor distribuida, compuesta por:

-   **Backend (Django):** API RESTful que maneja la lógica de negocio, la base de datos y la autenticación.
-   **Frontend Web (React):** Interfaz de usuario para pacientes, accesible desde cualquier navegador.
-   **Frontend Desktop (Electron):** Aplicación de escritorio para el personal médico y administrativo, ofreciendo una experiencia más integrada.

## 🛠️ Tecnologías Utilizadas

-   **Backend:** Python, Django, Django REST Framework, PostgreSQL, Celery, Redis.
-   **Frontend Web:** React, Vite, Tailwind CSS, Axios, TanStack Query.
-   **Frontend Desktop:** Electron, React, Vite.

## 📋 Requisitos Previos

Para configurar y ejecutar este proyecto, necesitarás las siguientes herramientas instaladas en tu sistema. Se proporcionan enlaces a las guías de instalación oficiales para cada sistema operativo.

### 1. Git

Sistema de control de versiones.

-   **Windows:** [Descargar Git para Windows](https://git-scm.com/download/win)
-   **macOS:** Instala Xcode Command Line Tools (`xcode-select --install`) o Homebrew (`brew install git`).
-   **Linux (Debian/Ubuntu):** `sudo apt update && sudo apt install git`

### 2. Python 3.9+

Necesario para el backend de Django.

-   **Windows:** [Descargar Python para Windows](https://www.python.org/downloads/windows/) (asegúrate de marcar "Add Python to PATH" durante la instalación).
-   **macOS:** Python suele venir preinstalado, pero se recomienda usar Homebrew (`brew install python@3.9`).
-   **Linux:** `sudo apt update && sudo apt install python3.9 python3.9-venv`

### 3. Node.js 18+ y npm

Necesario para los frontends de React. `npm` se instala junto con Node.js.

-   **Windows/macOS:** [Descargar Node.js LTS](https://nodejs.org/en/download/)
-   **Linux:** [Instalar Node.js usando NVM](https://github.com/nvm-sh/nvm#installing-and-updating) (recomendado para gestionar versiones).

### 4. Docker y Docker Compose (Altamente Recomendado)

Para una configuración sencilla y consistente de PostgreSQL y Redis. **En Windows, usar Docker Desktop es la forma más robusta de ejecutar estos servicios, ya que evita complejidades de instalación nativa y posibles conflictos de puertos.**

-   **Windows/macOS:** [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/). **Nota para Windows:** Tras la instalación, es posible que Docker Desktop solicite iniciar sesión o registrarse. Puedes **saltar este paso** para continuar usando Docker localmente sin necesidad de una cuenta.
-   **Linux:** [Instalar Docker Engine y Docker Compose](https://docs.docker.com/engine/install/)

## 🚀 Guía de Instalación y Configuración Detallada

Sigue estos pasos meticulosamente para configurar y ejecutar el proyecto en tu máquina local.

### 1. Clonar el Repositorio

Abre tu terminal (o PowerShell en Windows) y ejecuta:

```bash
git clone https://github.com/tu-usuario/Sistema-de-Informacion-Integral-para-la-Gestion-de-Citas-y-Expedientes-Medicos.git
cd Sistema-de-Informacion-Integral-para-la-Gestion-de-Citas-y-Expedientes-Medicos
```

### 2. Configuración de Servicios Esenciales (PostgreSQL y Redis)

**¡La forma más sencilla y recomendada es usar Docker Compose!** Esto aísla la base de datos y el servidor de caché en contenedores, evitando conflictos con instalaciones nativas y simplificando la configuración, especialmente en Windows.

#### 2.1. Crear `docker-compose.yml`

En la **raíz del proyecto** (donde se encuentra este `README`), crea un archivo llamado `docker-compose.yml` con el siguiente contenido. Este archivo define dos servicios: `db` (PostgreSQL) y `redis`.

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    container_name: medical_system_db
    environment:
      POSTGRES_DB: medical_system
      POSTGRES_USER: medical_user
      POSTGRES_PASSWORD: your_password_for_db # ¡CAMBIA ESTO!
    ports:
      - "5432:5432" # Mapea el puerto 5432 del contenedor al 5432 de tu máquina
    volumes:
      - pg_data:/var/lib/postgresql/data # Persistencia de datos
    healthcheck: # Verifica que la DB esté lista para aceptar conexiones
      test: ["CMD-SHELL", "pg_isready -U medical_user -d medical_system"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped # Reinicia el contenedor automáticamente

  redis:
    image: redis:6-alpine
    container_name: medical_system_redis
    ports:
      - "6379:6379" # Mapea el puerto 6379 del contenedor al 6379 de tu máquina
    healthcheck: # Verifica que Redis esté respondiendo
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped # Reinicia el contenedor automáticamente

volumes:
  pg_data: # Volumen para la persistencia de los datos de PostgreSQL
```

**¡IMPORTANTE!** Cambia `your_password_for_db` por una contraseña segura de tu elección. Esta contraseña se usará en el archivo `.env` del backend.

#### 2.2. Iniciar los Servicios con Docker Compose

Desde la **raíz del proyecto**, ejecuta el siguiente comando para levantar los contenedores en segundo plano:

```bash
docker-compose up -d
```

-   `up`: Crea y levanta los servicios definidos en `docker-compose.yml`.
-   `-d`: Ejecuta los contenedores en modo "detached" (segundo plano).

**Verificar el estado de los servicios:**

```bash
docker-compose ps
```

Deberías ver `medical_system_db` y `medical_system_redis` con estado `Up (healthy)`. Si no están `healthy`, espera un poco más o revisa los logs con `docker-compose logs`.

#### 2.3. Alternativa (Instalación Nativa)

Si por alguna razón no puedes o no quieres usar Docker, deberás instalar PostgreSQL y Redis directamente en tu sistema operativo.

-   **PostgreSQL:**
    -   Instala PostgreSQL (versión 14+).
    -   Crea una base de datos llamada `medical_system`.
    -   Crea un usuario llamado `medical_user` con la contraseña que usarás en el `.env` del backend (ej. `your_password_for_db`).
    -   Asegúrate de que PostgreSQL esté escuchando en el puerto `5432`.
-   **Redis:**
    -   Instala Redis (versión 6+).
    -   Asegúrate de que Redis esté escuchando en el puerto `6379`.

Consulta la documentación oficial de cada software para instrucciones de instalación específicas de tu sistema operativo.

### 3. Configuración del Backend (Python/Django)

Navega al directorio `backend`:

```bash
cd backend
```

#### 3.1. Entorno Virtual y Dependencias

Es crucial usar un entorno virtual para aislar las dependencias de Python de tu sistema global.

Crea un entorno virtual:

```bash
python -m venv venv
```

Activa el entorno virtual:

-   **En Windows (CMD/PowerShell):**
    ```bash
    .\venv\Scripts\activate
    ```
-   **En macOS/Linux (Bash/Zsh):**
    ```bash
    source venv/bin/activate
    ```

Instala las dependencias de Python. El archivo `requirements.txt` lista todas las librerías necesarias.

```bash
pip install -r requirements.txt
```

**Nota sobre `requirements.txt`:** Este archivo es bastante extenso. Para entornos de producción, se recomienda usar un `requirements-prod.txt` más limpio y generado con herramientas como `pip-tools` para incluir solo las dependencias directas y sus subdependencias, lo que reduce el tamaño y posibles conflictos.

#### 3.2. Variables de Entorno

Crea un archivo `.env` en el directorio `backend/` (al mismo nivel que `manage.py`). Este archivo contendrá las configuraciones sensibles y específicas de tu entorno.

```dotenv
# Clave secreta de Django. ¡GENERAR UNA NUEVA Y SEGURA!
SECRET_KEY=your_django_secret_key_here

# Modo de depuración (True para desarrollo, False para producción)
DEBUG=True

# Hosts permitidos para Django (para producción, cambia a tu dominio)
ALLOWED_HOSTS=localhost,127.0.0.1

# Configuración de la base de datos PostgreSQL
# Asegúrate de que el usuario y la contraseña coincidan con los de tu DB/Docker Compose
DATABASE_URL=postgres://medical_user:your_password_for_db@localhost:5432/medical_system

# URL de Redis para Celery y caché
REDIS_URL=redis://localhost:6379/0

# Configuración de correo electrónico (ejemplo con Mailtrap para desarrollo)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_mailtrap_username
EMAIL_HOST_PASSWORD=your_mailtrap_password

# Otros ajustes de entorno si son necesarios
```

**Cómo generar una `SECRET_KEY` segura:**
Puedes usar Python para generar una clave aleatoria:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```
Copia la salida y pégala en tu archivo `.env`.

#### 3.3. Migraciones y Superusuario

Aplica las migraciones de la base de datos para crear el esquema necesario. Luego, crea un superusuario para acceder al panel de administración de Django.

```bash
python manage.py makemigrations # Crea migraciones si hay cambios en los modelos
python manage.py migrate        # Aplica todas las migraciones pendientes
python manage.py createsuperuser # Sigue las instrucciones para crear un admin
```

**Opcional: Cargar datos de prueba**
Si el proyecto incluye datos de prueba (fixtures), puedes cargarlos así:

```bash
python manage.py loaddata fixtures/initial_data.json
```

Regresa al directorio raíz del proyecto:

```bash
cd ..
```

### 4. Configuración del Frontend Web (React)

Navega al directorio `frontend-web`:

```bash
cd frontend-web
```

#### 4.1. Dependencias de Node.js

Instala las dependencias de Node.js definidas en `package.json`:

```bash
npm install
```

**Troubleshooting `npm install`:**
-   **Versión de Node.js/npm:** Asegúrate de que tu versión de Node.js sea 18+ y que npm esté actualizado (`npm install -g npm@latest`).
-   **Caché de npm corrupta:** Intenta limpiar la caché: `npm cache clean --force`.
-   **Problemas de red/proxy:** Verifica tu conexión a internet o la configuración de tu proxy.
-   **Permisos (Linux/macOS):** Si ves errores de permisos, evita usar `sudo npm install` si es posible. Intenta arreglar los permisos de tu directorio `node_modules` o usa `nvm` para gestionar Node.js.

#### 4.2. Variables de Entorno

Crea un archivo `.env.local` en el directorio `frontend-web/` (al mismo nivel que `package.json`). Este archivo es específico para el entorno local y **no debe ser versionado en Git**.

```dotenv
VITE_API_URL=http://localhost:8000/api/v1
```

Regresa al directorio raíz del proyecto:

```bash
cd ..
```

### 5. Configuración del Frontend Desktop (Electron)

Navega al directorio `frontend-desktop`:

```bash
cd frontend-desktop
```

#### 5.1. Dependencias de Node.js

Instala las dependencias de Node.js definidas en `package.json`:

```bash
npm install
```

**Nota:** Las mismas consideraciones de `npm install` aplican aquí.

#### 5.2. Variables de Entorno

Crea un archivo `.env.local` en el directorio `frontend-desktop/` (al mismo nivel que `package.json`). Este archivo es específico para el entorno local y **no debe ser versionado en Git**.

```dotenv
VITE_API_URL=http://localhost:8000/api/v1
```

Regresa al directorio raíz del proyecto:

```bash
cd ..
```

## ▶️ Cómo Ejecutar el Proyecto

Una vez que todos los componentes están configurados, puedes iniciar el sistema completo.

### Opción 1: Usar los Scripts de Inicio (Recomendado)

Desde el directorio **raíz del proyecto**, puedes usar los scripts proporcionados para iniciar todos los componentes simultáneamente.

#### Para Usuarios de Windows (CMD)

```bash
start_system.bat
```

Este script:
1.  Verifica si Redis y PostgreSQL están corriendo (asumiendo que los levantaste con Docker Compose o nativamente).
2.  Inicia el servidor de desarrollo de Django (backend) en `http://localhost:8000`.
3.  Inicia el servidor de desarrollo del Frontend Web en `http://localhost:3000`.
4.  Inicia la aplicación Electron del Frontend Desktop.

#### Para Usuarios de PowerShell

```powershell
.\start-servers.ps1
```

Este script realiza acciones similares al `.bat`, pero está diseñado para entornos PowerShell.

### Opción 2: Iniciar Componentes Manualmente (Para Depuración)

Si prefieres iniciar cada componente por separado para depuración o control granular:

1.  **Iniciar Servicios (PostgreSQL y Redis):**
    Si usas Docker Compose:
    ```bash
    docker-compose up -d
    ```
    Si usas instalaciones nativas, asegúrate de que estén corriendo.

2.  **Iniciar Backend (Django):**
    Abre una nueva terminal, navega a `backend/`, activa el entorno virtual y ejecuta:
    ```bash
    cd backend
    .\venv\Scripts\activate # Windows
    # source venv/bin/activate # macOS/Linux
    python manage.py runserver 8000
    ```

3.  **Iniciar Frontend Web (React):**
    Abre otra nueva terminal, navega a `frontend-web/` y ejecuta:
    ```bash
    cd frontend-web
    npm run dev
    ```

4.  **Iniciar Frontend Desktop (Electron):**
    Abre una tercera terminal, navega a `frontend-desktop/` y ejecuta:
    ```bash
    cd frontend-desktop
    npm run dev
    ```

### Acceso a los Servicios

Una vez que todos los servicios estén corriendo:

-   **Backend API:** `http://localhost:8000`
-   **Frontend Web:** `http://localhost:3000` (se abrirá automáticamente en tu navegador)
-   **Frontend Desktop:** La aplicación de escritorio se iniciará automáticamente.
-   **Panel de Administración Django:** `http://localhost:8000/admin`
-   **Documentación de la API (Swagger):** `http://localhost:8000/api/swagger/`

## 🚨 Troubleshooting (Problemas Comunes y Soluciones)

Aquí hay una lista de problemas comunes que podrías encontrar y cómo resolverlos.

### Problemas con Docker / Servicios (PostgreSQL, Redis)

-   **`docker-compose up -d` falla o los contenedores no están `healthy`:**
    -   **Daemon de Docker no corriendo:** Asegúrate de que Docker Desktop (Windows/macOS) o el servicio Docker (Linux) esté iniciado. Reinicia Docker si es necesario.
    -   **Puertos ocupados:** Si el puerto `5432` (PostgreSQL) o `6379` (Redis) ya está siendo utilizado por otra aplicación en tu sistema, Docker no podrá mapearlos.
        -   **Solución:** Detén la aplicación que está usando el puerto o cambia el mapeo de puertos en `docker-compose.yml` (ej. `5433:5432`). Recuerda actualizar la `DATABASE_URL` en tu `.env` del backend si cambias el puerto de PostgreSQL.
    -   **Logs del contenedor:** Revisa los logs de los contenedores para ver el error específico:
        ```bash
        docker-compose logs db
        docker-compose logs redis
        ```
    -   **Volúmenes corruptos:** Si los datos de PostgreSQL se corrompen, puedes intentar eliminar el volumen y recrearlo (¡esto borrará todos los datos de la DB!):
        ```bash
        docker-compose down -v # Detiene y elimina contenedores y volúmenes
        docker-compose up -d   # Vuelve a levantar
        ```

### Problemas con el Backend (Python/Django)

-   **`ModuleNotFoundError` o `ImportError`:**
    -   **Entorno virtual no activado:** Asegúrate de haber activado el entorno virtual (`source venv/bin/activate` o `.\venv\Scripts\activate`) antes de instalar dependencias o ejecutar comandos de Django.
    -   **Dependencias no instaladas:** Ejecuta `pip install -r requirements.txt` de nuevo para asegurarte de que todas las dependencias estén instaladas.
-   **`django.db.utils.OperationalError: connection refused`:**
    -   **Base de datos no corriendo:** Asegúrate de que tu contenedor de PostgreSQL (o instalación nativa) esté iniciado y accesible en el puerto `5432`.
    -   **Credenciales incorrectas:** Verifica que `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` en tu `docker-compose.yml` (o configuración nativa) coincidan con los de `DATABASE_URL` en el `.env` del backend.
-   **`django.core.exceptions.ImproperlyConfigured: The SECRET_KEY setting must not be empty.`:**
    -   Asegúrate de haber generado y pegado una `SECRET_KEY` válida en tu archivo `.env`.
-   **`You have 18 unapplied migration(s). Your project may not work properly until you apply the migrations for app(s): ...`:**
    -   Ejecuta `python manage.py migrate` para aplicar las migraciones pendientes.

### Problemas con los Frontends (React/Node.js)

-   **`npm install` falla:**
    -   **Versión de Node.js/npm:** Asegúrate de que tu versión de Node.js sea 18+ y que npm esté actualizado (`npm install -g npm@latest`).
    -   **Caché de npm corrupta:** Intenta limpiar la caché: `npm cache clean --force`.
    -   **Problemas de red/proxy:** Verifica tu conexión a internet o la configuración de tu proxy.
    -   **Permisos (Linux/macOS):** Si ves errores de permisos, evita usar `sudo npm install` si es posible. Intenta arreglar los permisos de tu directorio `node_modules` o usa `nvm` para gestionar Node.js.
-   **La aplicación web no carga o muestra errores en el navegador:**
    -   **Backend no corriendo:** Asegúrate de que el servidor de Django esté iniciado en `http://localhost:8000`. El frontend necesita comunicarse con él.
    -   **`VITE_API_URL` incorrecta:** Verifica que la URL en tu `.env.local` del frontend sea correcta y apunte a tu backend.
    -   **Errores en la consola del navegador:** Abre las herramientas de desarrollador (F12) y revisa la consola para ver mensajes de error específicos.
-   **La aplicación de escritorio no se inicia o se cierra inesperadamente:**
    -   **Servidor Vite no corriendo:** La aplicación Electron en desarrollo depende del servidor Vite. Asegúrate de que `npm run dev:vite` esté funcionando correctamente.
    -   **Errores en la consola de Electron:** Si la ventana de Electron se abre y luego se cierra, intenta iniciarla desde la terminal para ver los mensajes de error.
    -   **Problemas de `electron-builder`:** Si estás intentando construir la aplicación para distribución (`npm run dist`), asegúrate de que todas las dependencias de desarrollo estén instaladas y que no haya errores de compilación.

## 📂 Estructura Detallada del Proyecto

Este proyecto está organizado en una estructura modular, con directorios dedicados a cada componente principal (backend, frontend-web, frontend-desktop) y archivos de configuración y scripts en la raíz.

```
Sistema-de-Informacion-Integral-para-la-Gestion-de-Citas-y-Expedientes-Medicos/
├── .git/                       # Repositorio Git
├── .gitignore                  # Archivos y directorios a ignorar por Git
├── check_requirements.py       # Script para verificar dependencias
├── clean-project.ps1           # Script PowerShell para limpieza del proyecto
├── dev.bat                     # Script de desarrollo (Windows)
├── ejecutar_bats.py            # Script Python para ejecutar .bat
├── README.md                   # README original del proyecto
├── REQUIREMENTS_README.md      # Documentación sobre los requirements
├── requirements-dev.txt        # Dependencias de desarrollo Python
├── requirements-prod.txt       # Dependencias de producción Python
├── requirements.txt            # Dependencias generales Python (puede ser extenso)
├── run_system.py               # Script Python para iniciar el sistema
├── setup_backend.bat           # Script de configuración inicial del backend
├── setup_frontend_desktop.bat  # Script de configuración inicial del frontend desktop
├── setup_frontend_web.bat      # Script de configuración inicial del frontend web
├── start_system.bat            # Script para iniciar todos los servicios (Windows)
├── start-servers.ps1           # Script para iniciar todos los servicios (PowerShell)
├── test_2fa_frontend.py        # Tests para 2FA del frontend
├── DOCUMENTACION_COMPLETA.md   # Documentación completa del proyecto
├── requirements_global.txt     # Lista consolidada de todas las dependencias (Python y JS)
├── README_GITHUB.md            # Este archivo README
├── docker-compose.yml          # Configuración de Docker Compose para servicios
│
├── backend/                    # **Componente: Servidor Django (API RESTful)**
│   ├── api_external/           # App: Integración con APIs externas
│   │   ├── __init__.py
│   │   ├── models.py           # Modelos de datos para API externa
│   │   ├── serializers.py      # Serializadores DRF
│   │   ├── urls.py             # Rutas de la API externa
│   │   └── views.py            # Lógica de vistas de la API externa
│   ├── appointments/           # App: Gestión de citas y horarios
│   │   ├── __init__.py
│   │   ├── models.py           # Modelos: Specialty, MedicalSchedule, Appointment, TemporaryReservation
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── authentication/         # App: Autenticación, usuarios, roles, 2FA
│   │   ├── __init__.py
│   │   ├── models.py           # Modelos: User, DoctorProfile, PatientProfile, LoginAttempt
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── dashboard/              # App: Endpoints para el dashboard
│   │   ├── __init__.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── emergency/              # App: Gestión de casos de emergencia
│   │   ├── __init__.py
│   │   ├── models.py           # Modelos: EmergencyCase, EmergencyVitalSigns, EmergencyMedication, etc.
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── medical_records/        # App: Gestión de expedientes médicos
│   │   ├── __init__.py
│   │   ├── models.py           # Modelos: MedicalRecord, Prescription, VitalSigns, Allergy, LabTest, etc.
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── medical_system/         # Configuración principal del proyecto Django
│   │   ├── settings/           # Módulo de configuración (base, development, production)
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   └── ...
│   │   ├── urls.py             # Rutas URL principales del proyecto
│   │   └── wsgi.py             # Configuración WSGI para servidores
│   ├── notifications/          # App: Envío de notificaciones
│   ├── pharmacy/               # App: Gestión de farmacia
│   ├── reports/                # App: Generación de reportes
│   ├── static/                 # Archivos estáticos globales
│   ├── templates/              # Plantillas HTML globales
│   ├── tests/                  # Directorio para pruebas de integración y unitarias
│   ├── .coveragerc             # Configuración de cobertura de código
│   ├── manage.py               # Utilidad de línea de comandos de Django
│   ├── pytest.ini              # Configuración para Pytest
│   ├── tox.ini                 # Configuración para Tox (automatización de pruebas)
│   └── ...
│
├── frontend-web/               # **Componente: Aplicación Web (React)**
│   ├── public/                 # Archivos estáticos públicos
│   ├── src/                    # Código fuente de la aplicación React
│   │   ├── assets/             # Imágenes, iconos, etc.
│   │   ├── components/         # Componentes reutilizables de React
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   └── ...
│   │   ├── contexts/           # Contextos de React (ej. AuthContext)
│   │   ├── hooks/              # Hooks personalizados de React
│   │   ├── pages/              # Vistas/páginas principales de la aplicación
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Appointments.jsx
│   │   │   └── ...
│   │   ├── services/           # Lógica de comunicación con la API (Axios)
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── ...
│   │   ├── styles/             # Archivos de estilos (Tailwind CSS)
│   │   ├── utils/              # Funciones de utilidad
│   │   ├── App.jsx             # Componente principal y configuración de rutas
│   │   └── main.jsx            # Punto de entrada de la aplicación
│   ├── .gitignore
│   ├── package.json            # Definición de dependencias y scripts npm
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js          # Configuración de Vite
│   └── ...
│
└── frontend-desktop/           # **Componente: Aplicación de Escritorio (Electron)**
    ├── public/                 # Archivos estáticos públicos
    ├── src/                    # Código fuente de la aplicación Electron
    │   ├── electron/           # Proceso principal de Electron
    │   │   └── main.cjs        # Lógica principal de Electron (creación de ventanas, IPC)
    │   ├── preload/            # Script de Preload para comunicación segura
    │   │   └── preload.js      # Expone APIs de Electron al proceso de renderizado
    │   ├── renderer/           # Código fuente de la interfaz de usuario (React)
    │   │   ├── assets/
    │   │   ├── components/
    │   │   ├── contexts/
    │   │   ├── hooks/
    │   │   ├── pages/
    │   │   ├── services/
    │   │   ├── styles/
    │   │   ├── utils/
    │   │   ├── App.jsx
    │   │   └── main.jsx
    │   └── ...
    ├── .gitignore
    ├── electron-builder.json   # Configuración para empaquetado con Electron Builder
    ├── package.json            # Definición de dependencias y scripts npm
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js          # Configuración de Vite
    └── ...
```

Para una documentación aún más detallada de cada componente, incluyendo su estructura interna, modelos de datos, endpoints de API y análisis de código, consulta los siguientes archivos:

-   [Documentación Detallada del Backend](./backend/DOCUMENTACION_DETALLADA.md)
-   [Documentación Detallada del Frontend Web](./frontend-web/DOCUMENTACION_DETALLADA.md)
-   [Documentación Detallada del Frontend Desktop](./frontend-desktop/DOCUMENTACION_DETALLADA.md)

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas contribuir a este proyecto, por favor, sigue estos pasos:

1.  Haz un "fork" del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nombre-de-la-caracteristica`).
3.  Realiza tus cambios y asegúrate de que las pruebas pasen.
4.  Haz "commit" de tus cambios (`git commit -m 'feat: Añadir nueva característica'`).
5.  Haz "push" a tu rama (`git push origin feature/nombre-de-la-caracteristica`).
6.  Abre un "Pull Request" en el repositorio original.

Por favor, consulta las [directrices de contribución](CONTRIBUTING.md) (si existen) para más detalles sobre el estilo de código y el proceso de desarrollo.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
