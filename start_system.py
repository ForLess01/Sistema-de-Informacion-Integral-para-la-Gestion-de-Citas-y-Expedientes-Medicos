#!/usr/bin/env python3
"""
Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos
Script para iniciar todos los componentes del sistema
"""

import os
import sys
import subprocess
import time
import threading
import signal
from pathlib import Path

# Configuración de colores para terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Rutas del proyecto
PROJECT_ROOT = Path(__file__).parent
BACKEND_PATH = PROJECT_ROOT / 'backend'
FRONTEND_WEB_PATH = PROJECT_ROOT / 'frontend-web'
FRONTEND_DESKTOP_PATH = PROJECT_ROOT / 'frontend-desktop'

# Lista de procesos iniciados
running_processes = []

def print_banner():
    """Imprime el banner del sistema"""
    print(f"{Colors.HEADER}" + "="*60)
    print("    Sistema de Información Integral para la Gestión de")
    print("    Citas y Expedientes Médicos")
    print("="*60 + f"{Colors.ENDC}")
    print()

def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    print(f"{Colors.OKBLUE}Verificando dependencias...{Colors.ENDC}")
    
    # Verificar Python
    try:
        python_version = sys.version_info
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
            print(f"{Colors.FAIL}[ERROR] Python 3.8+ requerido{Colors.ENDC}")
            return False
        print(f"{Colors.OKGREEN}[OK] Python {python_version.major}.{python_version.minor}{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.FAIL}[ERROR] Error verificando Python: {e}{Colors.ENDC}")
        return False
    
    # Verificar Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"{Colors.OKGREEN}[OK] Node.js {result.stdout.strip()}{Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}[ERROR] Node.js no encontrado{Colors.ENDC}")
            return False
    except FileNotFoundError:
        print(f"{Colors.FAIL}[ERROR] Node.js no encontrado{Colors.ENDC}")
        return False
    
    # Verificar npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"{Colors.OKGREEN}[OK] npm {result.stdout.strip()}{Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}[ERROR] npm no encontrado{Colors.ENDC}")
            return False
    except FileNotFoundError:
        print(f"{Colors.FAIL}[ERROR] npm no encontrado{Colors.ENDC}")
        return False
    
    return True

def check_database():
    """Verifica que la base de datos esté disponible"""
    print(f"{Colors.OKBLUE}Verificando PostgreSQL...{Colors.ENDC}")
    try:
        result = subprocess.run(['pg_isready', '-h', 'localhost', '-p', '5432'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"{Colors.OKGREEN}[OK] PostgreSQL está corriendo{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.WARNING}[WARNING] PostgreSQL no responde{Colors.ENDC}")
            return False
    except FileNotFoundError:
        print(f"{Colors.WARNING}[WARNING] pg_isready no encontrado{Colors.ENDC}")
        return False

def check_redis():
    """Verifica que Redis esté disponible"""
    print(f"{Colors.OKBLUE}Verificando Redis...{Colors.ENDC}")
    try:
        result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
        if 'redis' in result.stdout:
            print(f"{Colors.OKGREEN}[OK] Redis está corriendo{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.WARNING}[WARNING] Redis no está corriendo{Colors.ENDC}")
            # Intentar iniciar Redis
            print(f"{Colors.OKBLUE}Iniciando Redis con Docker...{Colors.ENDC}")
            subprocess.run(['docker', 'run', '-d', '-p', '6379:6379', '--name', 'redis-medical', 'redis:alpine'],
                         capture_output=True)
            time.sleep(3)
            return True
    except FileNotFoundError:
        print(f"{Colors.WARNING}[WARNING] Docker no encontrado{Colors.ENDC}")
        return False

def start_backend():
    """Inicia el backend Django"""
    print(f"{Colors.OKBLUE}[1/3] Iniciando Backend Django (Puerto 8000)...{Colors.ENDC}")
    
    # Verificar que el directorio existe
    if not BACKEND_PATH.exists():
        print(f"{Colors.FAIL}[ERROR] Directorio backend no encontrado{Colors.ENDC}")
        return None
    
    # Cambiar al directorio del backend
    os.chdir(BACKEND_PATH)
    
    # Iniciar el servidor Django
    try:
        process = subprocess.Popen(
            [sys.executable, 'manage.py', 'runserver', '8000'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        running_processes.append(process)
        print(f"{Colors.OKGREEN}[OK] Backend iniciado en http://localhost:8000{Colors.ENDC}")
        return process
    except Exception as e:
        print(f"{Colors.FAIL}[ERROR] Error iniciando backend: {e}{Colors.ENDC}")
        return None

def start_frontend_web():
    """Inicia el frontend web"""
    print(f"{Colors.OKBLUE}[2/3] Iniciando Frontend Web (Puerto 3000)...{Colors.ENDC}")
    
    # Verificar que el directorio existe
    if not FRONTEND_WEB_PATH.exists():
        print(f"{Colors.FAIL}[ERROR] Directorio frontend-web no encontrado{Colors.ENDC}")
        return None
    
    # Cambiar al directorio del frontend web
    os.chdir(FRONTEND_WEB_PATH)
    
    # Iniciar el servidor de desarrollo
    try:
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        running_processes.append(process)
        print(f"{Colors.OKGREEN}[OK] Frontend Web iniciado en http://localhost:3000{Colors.ENDC}")
        return process
    except Exception as e:
        print(f"{Colors.FAIL}[ERROR] Error iniciando frontend web: {e}{Colors.ENDC}")
        return None

def start_frontend_desktop():
    """Inicia el frontend desktop"""
    print(f"{Colors.OKBLUE}[3/3] Iniciando Frontend Desktop (Electron)...{Colors.ENDC}")
    
    # Verificar que el directorio existe
    if not FRONTEND_DESKTOP_PATH.exists():
        print(f"{Colors.FAIL}[ERROR] Directorio frontend-desktop no encontrado{Colors.ENDC}")
        return None
    
    # Cambiar al directorio del frontend desktop
    os.chdir(FRONTEND_DESKTOP_PATH)
    
    # Iniciar la aplicación Electron
    try:
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        running_processes.append(process)
        print(f"{Colors.OKGREEN}[OK] Frontend Desktop iniciado{Colors.ENDC}")
        return process
    except Exception as e:
        print(f"{Colors.FAIL}[ERROR] Error iniciando frontend desktop: {e}{Colors.ENDC}")
        return None

def signal_handler(signum, frame):
    """Maneja la señal de interrupción"""
    print(f"\n{Colors.WARNING}Cerrando sistema...{Colors.ENDC}")
    cleanup_processes()
    sys.exit(0)

def cleanup_processes():
    """Termina todos los procesos iniciados"""
    for process in running_processes:
        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        except Exception:
            pass

def main():
    """Función principal"""
    # Configurar manejador de señales
    signal.signal(signal.SIGINT, signal_handler)
    
    # Mostrar banner
    print_banner()
    
    # Verificar dependencias
    if not check_dependencies():
        print(f"{Colors.FAIL}Error: Dependencias faltantes{Colors.ENDC}")
        sys.exit(1)
    
    # Verificar servicios
    db_ok = check_database()
    redis_ok = check_redis()
    
    if not db_ok:
        print(f"{Colors.WARNING}Advertencia: PostgreSQL no está disponible{Colors.ENDC}")
    
    if not redis_ok:
        print(f"{Colors.WARNING}Advertencia: Redis no está disponible{Colors.ENDC}")
    
    print()
    print(f"{Colors.OKBLUE}Iniciando componentes del sistema...{Colors.ENDC}")
    print()
    
    # Iniciar backend
    backend_process = start_backend()
    if backend_process:
        time.sleep(3)  # Esperar a que el backend se inicie
    
    # Iniciar frontend web
    web_process = start_frontend_web()
    if web_process:
        time.sleep(2)  # Esperar a que el frontend web se inicie
    
    # Iniciar frontend desktop
    desktop_process = start_frontend_desktop()
    
    # Mostrar información del sistema
    print()
    print(f"{Colors.OKGREEN}" + "="*60)
    print("Sistema iniciado exitosamente!")
    print("="*60 + f"{Colors.ENDC}")
    print()
    print("Servicios disponibles:")
    print(f"  - Backend API:     {Colors.OKCYAN}http://localhost:8000{Colors.ENDC}")
    print(f"  - Frontend Web:    {Colors.OKCYAN}http://localhost:3000{Colors.ENDC}")
    print(f"  - Frontend Desktop: {Colors.OKCYAN}Aplicación Electron{Colors.ENDC}")
    print(f"  - Admin Panel:     {Colors.OKCYAN}http://localhost:8000/admin{Colors.ENDC}")
    print(f"  - API Docs:        {Colors.OKCYAN}http://localhost:8000/api/swagger/{Colors.ENDC}")
    print()
    print(f"Presiona {Colors.BOLD}Ctrl+C{Colors.ENDC} para detener el sistema")
    print()
    
    # Mantener el script corriendo
    try:
        while True:
            time.sleep(1)
            # Verificar si algún proceso ha terminado
            for process in running_processes[:]:
                if process.poll() is not None:
                    running_processes.remove(process)
                    print(f"{Colors.WARNING}Un proceso ha terminado{Colors.ENDC}")
    except KeyboardInterrupt:
        pass
    finally:
        cleanup_processes()

if __name__ == "__main__":
    main()
