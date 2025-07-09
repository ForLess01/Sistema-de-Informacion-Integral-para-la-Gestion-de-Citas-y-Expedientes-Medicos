@echo off
echo Iniciando Sistema Médico en modo desarrollo...
echo Verificando Redis en Docker...

docker ps | findstr redis
if %errorlevel% neq 0 (
    echo Iniciando Redis en Docker...
    docker run -d -p 6379:6379 --name redis-server redis:alpine
) else (
    echo Redis ya está corriendo en Docker
)

start "Django Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"
start "React Web" cmd /k "cd frontend-web && npm run dev"
start "Electron Desktop" cmd /k "cd frontend-desktop && npm start"

echo Todos los servicios iniciados!
echo Backend: http://localhost:8000
echo Frontend Web: http://localhost:3000
echo Frontend Desktop: Aplicación Electron
echo Redis: Docker Container (puerto 6379)
pause