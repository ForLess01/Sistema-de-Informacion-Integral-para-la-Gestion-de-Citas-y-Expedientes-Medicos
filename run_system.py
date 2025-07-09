#!/usr/bin/env python3
"""
Script simple para ejecutar el sistema usando el archivo batch
"""

import os
import subprocess
import sys
from pathlib import Path

def main():
    """Ejecuta el sistema usando el archivo batch"""
    
    # Obtener la ruta del proyecto
    project_root = Path(__file__).parent
    
    # Ruta del archivo batch
    batch_file = project_root / 'start_system.bat'
    
    # Verificar que el archivo batch existe
    if not batch_file.exists():
        print("Error: El archivo start_system.bat no existe")
        sys.exit(1)
    
    # Ejecutar el archivo batch
    try:
        print("Ejecutando sistema...")
        subprocess.run([str(batch_file)], shell=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error ejecutando el sistema: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nSistema interrumpido por el usuario")
        sys.exit(0)

if __name__ == "__main__":
    main()
