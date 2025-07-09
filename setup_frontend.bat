@echo off
echo Configurando Frontend Web React...

cd frontend-web
echo Instalando dependencias npm...
npm install

echo Creando archivo de configuración...
echo VITE_API_URL=http://localhost:8000 > .env.local
echo VITE_APP_NAME=Sistema Médico - Pacientes >> .env.local

echo Frontend Web configurado exitosamente!
pause