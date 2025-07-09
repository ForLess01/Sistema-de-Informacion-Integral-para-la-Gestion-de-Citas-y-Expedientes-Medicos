# Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos

## Descripción
Sistema completo de gestión hospitalaria que incluye:
- Gestión de citas médicas
- Expedientes electrónicos
- Sistema de farmacia
- Módulo de emergencias
- Reportes y estadísticas

## Requisitos Previos

### Backend
- Python 3.8+
- PostgreSQL 12+
- Redis (opcional, para caché)

### Frontend
- Node.js 16+
- npm 8+

## Instalación

### 1. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd Sistema-de-Informacion-Integral-para-la-Gestion-de-Citas-y-Expedientes-Medicos
```

### 2. Configurar el Backend

#### a) Crear entorno virtual
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

#### b) Instalar dependencias
```bash
pip install -r requirements.txt
```

#### c) Configurar variables de entorno
Crear archivo `.env` en la carpeta `backend`:
```env
# Base de datos
DB_NAME=medical_system
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=tu_clave_secreta
DJANGO_ENVIRONMENT=development

# JWT
JWT_SECRET_KEY=tu_jwt_secret
```

#### d) Ejecutar migraciones
```bash
python manage.py migrate
```

#### e) Crear superusuario
```bash
python manage.py createsuperuser
```

### 3. Configurar el Frontend

#### a) Instalar dependencias
```bash
cd ../frontend-web
npm install
```

## Ejecución

### Método 1: Script automatizado (Windows PowerShell)
```powershell
# Desde la raíz del proyecto
.\start-servers.ps1
```

### Método 2: Manual

#### Backend
```bash
cd backend
python manage.py runserver
```

#### Frontend
```bash
cd frontend-web
npm run dev
```

## Acceso al Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/admin/

## Solución de Problemas

### Error de JSON al iniciar
Si encuentras errores de JSON al iniciar la aplicación:

1. **Limpiar el localStorage del navegador:**
   - Abre las DevTools (F12)
   - Ve a Application/Storage
   - Clear Site Data

2. **Usar el script de limpieza:**
   ```powershell
   .\clean-project.ps1
   ```

### El servidor no inicia
1. Verificar que PostgreSQL esté ejecutándose
2. Verificar las credenciales en el archivo `.env`
3. Verificar que no haya otros procesos usando los puertos 3000 y 8000

## Estructura del Proyecto

```
├── backend/               # API Django REST Framework
│   ├── appointments/      # Módulo de citas
│   ├── authentication/    # Autenticación y usuarios
│   ├── medical_records/   # Expedientes médicos
│   ├── pharmacy/          # Sistema de farmacia
│   ├── emergency/         # Módulo de emergencias
│   └── reports/          # Reportes y estadísticas
│
├── frontend-web/         # Aplicación React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── services/     # Servicios de API
│   │   └── contexts/     # Contextos de React
│   └── public/
│
└── docs/                 # Documentación adicional
```

## Características Principales

### Para Pacientes
- Agendar citas en línea
- Ver historial médico
- Descargar recetas
- Recibir notificaciones

### Para Personal Médico
- Gestionar agenda
- Crear y actualizar expedientes
- Prescribir medicamentos
- Ver historial de pacientes

### Para Administradores
- Gestión de usuarios
- Configuración del sistema
- Reportes y estadísticas
- Auditoría

## Desarrollo

### Comandos útiles

```bash
# Backend - Crear nueva app
python manage.py startapp nombre_app

# Backend - Crear migraciones
python manage.py makemigrations

# Frontend - Construir para producción
npm run build

# Frontend - Analizar bundle
npm run analyze
```

## Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
