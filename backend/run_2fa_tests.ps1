# Script para ejecutar las pruebas de 2FA

Write-Host "=== Ejecutando pruebas de 2FA ===" -ForegroundColor Cyan

# Iniciar el servidor Django en segundo plano
Write-Host "Iniciando servidor Django..." -ForegroundColor Yellow
$server = Start-Process powershell -ArgumentList "-Command", "python manage.py runserver" -PassThru -WindowStyle Hidden

# Esperar a que el servidor esté listo
Write-Host "Esperando a que el servidor esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Ejecutar las pruebas
Write-Host "Ejecutando pruebas de 2FA..." -ForegroundColor Green
python test_2fa.py

# Preguntar si mantener el servidor activo
$response = Read-Host "`n¿Deseas mantener el servidor activo? (s/n)"

if ($response -ne 's') {
    # Detener el servidor
    Write-Host "Deteniendo servidor..." -ForegroundColor Yellow
    Stop-Process -Id $server.Id -Force
    Write-Host "Servidor detenido" -ForegroundColor Green
} else {
    Write-Host "El servidor sigue activo en el proceso ID: $($server.Id)" -ForegroundColor Green
    Write-Host "Para detenerlo manualmente usa: Stop-Process -Id $($server.Id)" -ForegroundColor Yellow
}
