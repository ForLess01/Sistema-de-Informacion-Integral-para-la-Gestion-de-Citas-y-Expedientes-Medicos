# Script para iniciar los servidores de desarrollo

Write-Host "Iniciando Sistema de Información Médica..." -ForegroundColor Cyan

# Limpiar localStorage del navegador (opcional)
Write-Host "`n¿Deseas limpiar el caché del navegador? (s/n): " -NoNewline -ForegroundColor Yellow
$limpiar = Read-Host
if ($limpiar -eq 's' -or $limpiar -eq 'S') {
    Write-Host "Por favor, abre tu navegador y limpia el localStorage manualmente." -ForegroundColor Magenta
    Write-Host "Presiona cualquier tecla cuando hayas terminado..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Iniciar backend
Write-Host "`nIniciando servidor backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python manage.py runserver"

# Esperar un momento para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "Iniciando servidor frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend-web; npm run dev"

Write-Host "`nServidores iniciados:" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:8000" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "`nPresiona Ctrl+C en cada ventana para detener los servidores." -ForegroundColor Yellow
