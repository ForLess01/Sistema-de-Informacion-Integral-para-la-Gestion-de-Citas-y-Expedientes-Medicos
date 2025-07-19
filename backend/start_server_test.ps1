# Script para iniciar el servidor Django y ejecutar pruebas

Write-Host "=== Iniciando servidor Django ===" -ForegroundColor Cyan

# Iniciar el servidor en segundo plano
$djangoProcess = Start-Process python -ArgumentList "manage.py", "runserver" -PassThru -WindowStyle Hidden

# Esperar un momento para que el servidor inicie
Write-Host "Esperando que el servidor inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Ejecutar las pruebas
Write-Host "`nEjecutando pruebas de API..." -ForegroundColor Cyan
python test_api_endpoints.py

# Preguntar si desea mantener el servidor activo
$response = Read-Host "`n¿Desea mantener el servidor activo? (s/n)"

if ($response -ne 's') {
    Write-Host "Deteniendo servidor..." -ForegroundColor Yellow
    Stop-Process -Id $djangoProcess.Id -Force
    Write-Host "Servidor detenido." -ForegroundColor Green
} else {
    Write-Host "Servidor Django ejecutándose en http://localhost:8000" -ForegroundColor Green
    Write-Host "Para detenerlo, cierre esta ventana o presione Ctrl+C" -ForegroundColor Yellow
}
