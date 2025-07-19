"""
Script para verificar que los endpoints principales de la API funcionen correctamente
"""
import requests
import json
import sys
from colorama import init, Fore, Style

# Inicializar colorama para salida con colores
init()

# URL base del API
API_BASE_URL = "http://localhost:8000/api/v1"

def print_test(test_name, success, details=""):
    """Imprime el resultado de un test con formato"""
    if success:
        print(f"{Fore.GREEN}✓ {test_name}{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}✗ {test_name}{Style.RESET_ALL}")
    if details:
        print(f"  {details}")

def test_api_health():
    """Prueba que la API esté funcionando"""
    try:
        response = requests.get(f"{API_BASE_URL.replace('/api/v1', '')}/")
        if response.status_code == 200:
            print_test("API Health Check", True, f"Status: {response.status_code}")
            return True
        else:
            print_test("API Health Check", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("API Health Check", False, f"Error: {e}")
        return False

def test_login():
    """Prueba el endpoint de login"""
    try:
        # Intentar login con credenciales de admin
        data = {
            "email": "admin@hospital.com",
            "password": "admin123456"
        }
        response = requests.post(f"{API_BASE_URL}/auth/login/", json=data)
        
        if response.status_code == 200:
            result = response.json()
            if 'access' in result and 'refresh' in result:
                print_test("Login Endpoint", True, "Tokens recibidos correctamente")
                return result['access']
            else:
                print_test("Login Endpoint", False, "Respuesta sin tokens")
                return None
        else:
            print_test("Login Endpoint", False, f"Status: {response.status_code}")
            if response.text:
                print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print_test("Login Endpoint", False, f"Error: {e}")
        return None

def test_authenticated_endpoint(token):
    """Prueba un endpoint que requiere autenticación"""
    if not token:
        print_test("Authenticated Endpoint Test", False, "No hay token disponible")
        return
    
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        # Probar el endpoint de perfil
        response = requests.get(f"{API_BASE_URL}/auth/profile/", headers=headers)
        
        if response.status_code == 200:
            print_test("Profile Endpoint (Authenticated)", True)
            return True
        else:
            print_test("Profile Endpoint (Authenticated)", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Profile Endpoint (Authenticated)", False, f"Error: {e}")
        return False

def test_appointments_list(token):
    """Prueba el endpoint de citas"""
    if not token:
        return
    
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(f"{API_BASE_URL}/appointments/", headers=headers)
        
        if response.status_code == 200:
            print_test("Appointments List Endpoint", True)
            return True
        else:
            print_test("Appointments List Endpoint", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Appointments List Endpoint", False, f"Error: {e}")
        return False

def test_medical_records_list(token):
    """Prueba el endpoint de expedientes médicos"""
    if not token:
        return
    
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(f"{API_BASE_URL}/medical-records/", headers=headers)
        
        if response.status_code == 200:
            print_test("Medical Records List Endpoint", True)
            return True
        else:
            print_test("Medical Records List Endpoint", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Medical Records List Endpoint", False, f"Error: {e}")
        return False

def test_cors_headers():
    """Verifica que los headers CORS estén configurados correctamente"""
    try:
        # Simular una petición desde el frontend
        headers = {
            "Origin": "http://localhost:3000"
        }
        response = requests.options(f"{API_BASE_URL}/auth/login/", headers=headers)
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods")
        }
        
        if cors_headers["Access-Control-Allow-Origin"]:
            print_test("CORS Headers", True, f"Allow-Origin: {cors_headers['Access-Control-Allow-Origin']}")
            return True
        else:
            print_test("CORS Headers", False, "No CORS headers found")
            return False
    except Exception as e:
        print_test("CORS Headers", False, f"Error: {e}")
        return False

def main():
    """Función principal"""
    print(f"\n{Fore.CYAN}=== Verificación de Endpoints API ==={Style.RESET_ALL}\n")
    
    # Verificar que el servidor esté corriendo
    if not test_api_health():
        print(f"\n{Fore.YELLOW}Asegúrate de que el servidor Django esté corriendo:{Style.RESET_ALL}")
        print("  python manage.py runserver")
        sys.exit(1)
    
    # Probar endpoints
    print(f"\n{Fore.CYAN}Probando endpoints principales:{Style.RESET_ALL}")
    token = test_login()
    test_authenticated_endpoint(token)
    test_appointments_list(token)
    test_medical_records_list(token)
    
    print(f"\n{Fore.CYAN}Verificando configuración CORS:{Style.RESET_ALL}")
    test_cors_headers()
    
    print(f"\n{Fore.GREEN}✓ Verificación completada{Style.RESET_ALL}")

if __name__ == "__main__":
    # Verificar que requests esté instalado
    try:
        import requests
    except ImportError:
        print("El módulo 'requests' no está instalado. Instalando...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "colorama"])
        import requests
    
    main()
