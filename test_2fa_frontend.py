#!/usr/bin/env python3
"""
Script de prueba para verificar la integración completa de 2FA entre Frontend y Backend
"""

import requests
import json
import time
from urllib.parse import urljoin

# Configuración
BASE_URL = 'http://localhost:8000'
API_BASE = urljoin(BASE_URL, '/api/v1/')  # Agregar / al final

# Credenciales de prueba - CAMBIAR POR CREDENCIALES VÁLIDAS
TEST_CREDENTIALS = {
    'email': 'rendoaltar@gmail.com',  # Cambiar por un usuario válido
    'password': 'Admin123456'       # Cambiar por la contraseña correcta
}

# Si no tienes credenciales, crea un superusuario ejecutando:
# python manage.py createsuperuser

class TwoFactorTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        
    def print_step(self, step, description):
        print(f"\n{'='*60}")
        print(f"PASO {step}: {description}")
        print('='*60)
        
    def print_result(self, success, message, data=None):
        status = "✅ ÉXITO" if success else "❌ ERROR"
        print(f"{status}: {message}")
        if data:
            print(f"Datos: {json.dumps(data, indent=2)}")
            
    def login_user(self):
        """Paso 1: Login inicial del usuario"""
        self.print_step(1, "Login inicial del usuario")
        
        url = urljoin(API_BASE, 'auth/login/')  # Sin / al inicio
        print(f"URL completa: {url}")  # Debug
        response = self.session.post(url, json=TEST_CREDENTIALS)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verificar si requiere 2FA
            if data.get('requires_2fa'):
                self.print_result(True, "Usuario requiere 2FA (correcto si ya está habilitado)", data)
                return 'requires_2fa'
            else:
                # Login exitoso sin 2FA
                self.access_token = data['access']
                self.refresh_token = data['refresh']
                self.session.headers.update({'Authorization': f'Bearer {self.access_token}'})
                self.print_result(True, "Login exitoso sin 2FA", {
                    'user': data.get('user', {}),
                    'has_tokens': bool(self.access_token)
                })
                return 'success'
        else:
            try:
                error_data = response.json()
            except:
                error_data = {'error': response.text or 'No response body'}
            self.print_result(False, f"Error en login: {response.status_code}", error_data)
            return 'error'
    
    def enable_2fa(self):
        """Paso 2: Habilitar 2FA para el usuario"""
        self.print_step(2, "Habilitando 2FA para el usuario")
        
        if not self.access_token:
            self.print_result(False, "No hay token de acceso. Debes hacer login primero.")
            return False
            
        url = urljoin(API_BASE, 'auth/2fa/enable/')
        response = self.session.post(url)
        
        if response.status_code == 200:
            data = response.json()
            self.print_result(True, "2FA habilitado. QR generado.", {
                'qr_code_length': len(data.get('qr_code', '')),
                'backup_tokens_count': len(data.get('backup_tokens', [])),
                'secret_provided': bool(data.get('secret'))
            })
            return data
        else:
            try:
                error_data = response.json()
            except:
                error_data = {'error': response.text or 'No response body'}
            self.print_result(False, f"Error habilitando 2FA: {response.status_code}", error_data)
            return False
    
    def confirm_2fa(self, test_token="123456"):
        """Paso 3: Intentar confirmar 2FA (fallará con token falso)"""
        self.print_step(3, "Intentando confirmar 2FA con token de prueba")
        
        url = urljoin(API_BASE, 'auth/2fa/confirm/')
        response = self.session.post(url, json={'token': test_token})
        
        if response.status_code == 200:
            data = response.json()
            self.print_result(True, "2FA confirmado exitosamente", data)
            return True
        else:
            # Es esperado que falle con un token falso
            try:
                error_data = response.json()
            except:
                error_data = {'error': response.text or 'No response body'}
            self.print_result(False, f"Falló confirmación (esperado con token falso): {response.status_code}", error_data)
            return False
    
    def test_2fa_verification(self, test_token="123456"):
        """Paso 4: Probar verificación de 2FA durante login"""
        self.print_step(4, "Probando verificación de 2FA durante login")
        
        url = urljoin(API_BASE, 'auth/2fa/verify/')
        response = self.session.post(url, json={
            'email': TEST_CREDENTIALS['email'],
            'token': test_token
        })
        
        if response.status_code == 200:
            data = response.json()
            self.print_result(True, "Verificación 2FA exitosa", data)
            return True
        else:
            # Es esperado que falle con un token falso
            try:
                error_data = response.json()
            except:
                error_data = {'error': response.text or 'No response body'}
            self.print_result(False, f"Falló verificación (esperado con token falso): {response.status_code}", error_data)
            return False
    
    def disable_2fa(self):
        """Paso 5: Deshabilitar 2FA"""
        self.print_step(5, "Deshabilitando 2FA")
        
        if not self.access_token:
            self.print_result(False, "No hay token de acceso")
            return False
            
        url = urljoin(API_BASE, 'auth/2fa/disable/')
        response = self.session.post(url, json={'password': TEST_CREDENTIALS['password']})
        
        if response.status_code == 200:
            data = response.json()
            self.print_result(True, "2FA deshabilitado exitosamente", data)
            return True
        else:
            try:
                error_data = response.json()
            except:
                error_data = {'error': response.text or 'No response body'}
            self.print_result(False, f"Error deshabilitando 2FA: {response.status_code}", error_data)
            return False
    
    def test_backend_health(self):
        """Verificar que el backend esté funcionando"""
        self.print_step(0, "Verificando conectividad con el backend")
        
        try:
            # Probar endpoint de salud si existe, sino probar login
            response = self.session.get(urljoin(BASE_URL, '/admin/'))
            if response.status_code in [200, 302]:  # 302 es redirect al login
                self.print_result(True, "Backend accesible")
                return True
            else:
                self.print_result(False, f"Backend no accesible: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            self.print_result(False, "No se puede conectar al backend. ¿Está ejecutándose?")
            return False
    
    def run_full_test(self):
        """Ejecutar prueba completa de 2FA"""
        print("🧪 INICIANDO PRUEBAS COMPLETAS DE 2FA")
        print("=" * 60)
        
        # Verificar backend
        if not self.test_backend_health():
            print("\n❌ PRUEBAS ABORTADAS: Backend no disponible")
            print("\n💡 SOLUCIÓN: Ejecuta 'python manage.py runserver' en el directorio del backend")
            return
        
        # Paso 1: Login inicial
        login_result = self.login_user()
        
        if login_result == 'error':
            print("\n❌ PRUEBAS ABORTADAS: Error en login inicial")
            return
            
        # Si requiere 2FA, el usuario ya lo tiene habilitado
        if login_result == 'requires_2fa':
            print("\n⚠️  El usuario ya tiene 2FA habilitado")
            print("Para pruebas completas, deshabilita 2FA primero o usa un usuario diferente")
            
            # Aún podemos probar la verificación
            self.test_2fa_verification()
            return
        
        # Usuario no tiene 2FA, proceder con pruebas completas
        if login_result == 'success':
            # Paso 2: Habilitar 2FA
            enable_data = self.enable_2fa()
            if enable_data:
                time.sleep(1)  # Pequeña pausa
                
                # Paso 3: Intentar confirmar (fallará con token falso)
                self.confirm_2fa()
                time.sleep(1)
                
                # Paso 4: Probar verificación durante login
                self.test_2fa_verification()
                time.sleep(1)
                
                # Paso 5: Deshabilitar 2FA para cleanup
                self.disable_2fa()
        
        print(f"\n{'='*60}")
        print("🏁 PRUEBAS COMPLETADAS")
        print("="*60)
        print("\n📋 RESUMEN:")
        print("- Si ves errores con tokens falsos, es NORMAL")
        print("- Los errores indican que la validación funciona correctamente")
        print("- Para pruebas reales, necesitarás una app autenticadora (Google Authenticator, Authy, etc.)")
        print("\n🔧 PRÓXIMOS PASOS:")
        print("1. Probar con una app autenticadora real")
        print("2. Verificar la interfaz web en http://localhost:3000")
        print("3. Probar el flujo completo login -> 2FA -> dashboard")

if __name__ == "__main__":
    tester = TwoFactorTester()
    tester.run_full_test()
