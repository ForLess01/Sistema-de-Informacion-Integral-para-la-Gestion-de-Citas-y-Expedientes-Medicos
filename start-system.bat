@echo off
echo ===============================================
echo   SISTEMA MEDICO INTEGRAL - INICIO RAPIDO
echo ===============================================
echo.

echo 🚀 Iniciando Backend Django...
echo.
cd backend
start cmd /k "python manage.py runserver 8000"
echo ✅ Backend iniciado en http://localhost:8000
echo.

timeout /t 3 /nobreak >nul

echo 🖥️  Iniciando Frontend Desktop...
echo.
cd ../frontend-desktop
start cmd /k "npm run dev"
echo ✅ Frontend Desktop iniciandose...
echo.

echo ===============================================
echo   🎉 SISTEMA INICIADO CORRECTAMENTE
echo ===============================================
echo.
echo 📍 Backend: http://localhost:8000
echo 📍 API Docs: http://localhost:8000/api/swagger/
echo 📍 Frontend Desktop: Se abrirá automáticamente
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
