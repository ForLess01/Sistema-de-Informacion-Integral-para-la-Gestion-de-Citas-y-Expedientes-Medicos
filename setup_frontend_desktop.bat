@echo off
echo Configurando Frontend Desktop Electron...

cd frontend-desktop
echo Instalando dependencias npm...
npm install

echo Instalando Electron...
npm install -g electron

echo Creando archivo de configuración...
echo REACT_APP_API_URL=http://localhost:8000 > .env.local
echo REACT_APP_APP_NAME=Sistema Médico - Personal >> .env.local

echo Frontend Desktop configurado exitosamente!
pause