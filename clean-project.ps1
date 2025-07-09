# Script para limpiar y reiniciar el proyecto

Write-Host "Limpiando proyecto..." -ForegroundColor Cyan

# Detener todos los procesos Python en ejecución
Write-Host "`nDeteniendo servidores..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like '*python*' -or $_.ProcessName -like '*node*'} | Stop-Process -Force -ErrorAction SilentlyContinue

# Limpiar caché de Python
Write-Host "`nLimpiando caché de Python..." -ForegroundColor Yellow
Get-ChildItem -Path . -Include __pycache__ -Recurse -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Include *.pyc -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

# Limpiar logs
if (Test-Path "backend/logs") {
    Write-Host "Limpiando logs..." -ForegroundColor Yellow
    Get-ChildItem -Path "backend/logs" -Include *.log -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
}

# Limpiar node_modules (opcional)
Write-Host "`n¿Deseas reinstalar las dependencias de Node? (s/n): " -NoNewline -ForegroundColor Yellow
$reinstall = Read-Host
if ($reinstall -eq 's' -or $reinstall -eq 'S') {
    Write-Host "Eliminando node_modules..." -ForegroundColor Yellow
    if (Test-Path "frontend-web/node_modules") {
        Remove-Item -Path "frontend-web/node_modules" -Recurse -Force
    }
    Write-Host "Reinstalando dependencias..." -ForegroundColor Green
    cd frontend-web
    npm install
    cd ..
}

Write-Host "`nLimpieza completada!" -ForegroundColor Green
Write-Host "`nPara iniciar los servidores, ejecuta:" -ForegroundColor Cyan
Write-Host "  .\start-servers.ps1" -ForegroundColor White
