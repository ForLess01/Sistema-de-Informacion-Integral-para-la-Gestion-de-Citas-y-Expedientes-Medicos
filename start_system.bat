@echo off
echo ==========================================================
echo    Sistema de Informacion Integral para la Gestion de 
echo    Citas y Expedientes Medicos
echo ==========================================================
echo.
echo Iniciando sistema completo...
echo.

REM Verificar que Redis este corriendo
echo Verificando Redis...
docker ps | findstr redis >nul
if %errorlevel% neq 0 (
    echo [ERROR] Redis no esta corriendo. Iniciando Redis...
    docker run -d -p 6379:6379 --name redis-medical redis:alpine
    timeout /t 3 >nul
)
echo [OK] Redis esta corriendo

REM Verificar que PostgreSQL este corriendo
echo Verificando PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL no esta corriendo o no es accesible.
    echo Por favor, asegurate de que PostgreSQL este corriendo en el puerto 5432
    pause
    exit /b 1
)
echo [OK] PostgreSQL esta corriendo

echo.
echo Iniciando componentes del sistema...
echo.

REM Iniciar Backend Django
echo [1/3] Iniciando Backend Django (Puerto 8000)...
start "Backend Django" cmd /c "cd /d \"%~dp0backend\" && python manage.py runserver 8000"

REM Esperar un poco para que el backend se inicie
timeout /t 5 >nul

REM Iniciar Frontend Web
echo [2/3] Iniciando Frontend Web (Puerto 3000)...
start "Frontend Web" cmd /c "cd /d \"%~dp0frontend-web\" && npm run dev"

REM Esperar un poco para que el frontend web se inicie
timeout /t 3 >nul

REM Iniciar Frontend Desktop
echo [3/3] Iniciando Frontend Desktop (Electron)...
start "Frontend Desktop" cmd /c "cd /d \"%~dp0frontend-desktop\" && npm run dev"

echo.
echo ==========================================================
echo Sistema iniciado exitosamente!
echo ==========================================================
echo.
echo Servicios disponibles:
echo   - Backend API:     http://localhost:8000
echo   - Frontend Web:    http://localhost:3000
echo   - Frontend Desktop: Aplicacion Electron
echo   - Admin Panel:     http://localhost:8000/admin
echo   - API Docs:        http://localhost:8000/api/swagger/
echo.
echo Para detener el sistema, cierra todas las ventanas de terminal.
echo.
pause
