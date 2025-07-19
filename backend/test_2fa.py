#!/usr/bin/env python
"""
Script de prueba para verificar la funcionalidad de autenticación de dos factores (2FA)
"""

import os
import sys
import django
import time
import pyotp
import requests
from colorama import init, Fore, Style

# Inicializar colorama para Windows
init()

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from authentication.services import TwoFactorService

User = get_user_model()

# Configuración
BASE_URL = 'http://localhost:8000/api/v1'
TEST_USER_EMAIL = 'test2fa@hospital.com'
TEST_USER_PASSWORD = 'testpass123'


def print_success(message):
    print(f"{Fore.GREEN}✓ {message}{Style.RESET_ALL}")


def print_error(message):
    print(f"{Fore.RED}✗ {message}{Style.RESET_ALL}")


def print_info(message):
    print(f"{Fore.BLUE}ℹ {message}{Style.RESET_ALL}")


def print_warning(message):
    print(f"{Fore.YELLOW}⚠ {message}{Style.RESET_ALL}")


def create_test_user():
    """Crear un usuario de prueba"""
    print_info("Creando usuario de prueba...")
    
    # Eliminar usuario si existe
    User.objects.filter(email=TEST_USER_EMAIL).delete()
    
    # Generar DNI único basado en timestamp
    import time
    unique_dni = f"99{int(time.time()) % 1000000}"
    
    # Crear nuevo usuario
    user = User.objects.create_user(
        email=TEST_USER_EMAIL,
        password=TEST_USER_PASSWORD,
        first_name='Test',
        last_name='2FA',
        dni=unique_dni,
        phone='987654321'
    )
    
    print_success(f"Usuario creado: {user.email}")
    return user


def test_login_without_2fa(session):
    """Probar login sin 2FA habilitado"""
    print_info("\n1. Probando login sin 2FA...")
    
    response = session.post(f'{BASE_URL}/auth/login/', json={
        'email': TEST_USER_EMAIL,
        'password': TEST_USER_PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        if 'access' in data and 'refresh' in data:
            print_success("Login exitoso sin 2FA")
            return data['access']
        else:
            print_error("Respuesta inesperada")
            return None
    else:
        print_error(f"Error en login: {response.status_code}")
        # Intentar obtener más información del error
        try:
            error_data = response.json()
            print(f"Error detalle: {error_data}")
        except:
            print(f"Respuesta sin formato JSON: {response.text}")
        return None


def test_enable_2fa(session, token):
    """Probar habilitación de 2FA"""
    print_info("\n2. Habilitando 2FA...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = session.post(f'{BASE_URL}/auth/2fa/enable/', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print_success("2FA iniciado correctamente")
        print_info(f"Backup tokens recibidos: {len(data.get('backup_tokens', []))}")
        
        # Extraer el secreto del código QR (solo para pruebas)
        qr_code = data.get('qr_code', '')
        if qr_code:
            print_success("Código QR generado")
            # En una aplicación real, el usuario escanearía este QR
            # Para pruebas, usaremos el secreto directamente
            return data
    else:
        print_error(f"Error al habilitar 2FA: {response.status_code}")
        print(response.json())
    
    return None


def test_confirm_2fa(session, token, user):
    """Confirmar la activación de 2FA con un código válido"""
    print_info("\n3. Confirmando activación de 2FA...")
    
    # Generar código TOTP válido
    totp = pyotp.TOTP(user.two_factor_secret)
    code = totp.now()
    
    print_info(f"Código TOTP generado: {code}")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = session.post(f'{BASE_URL}/auth/2fa/confirm/', 
                           headers=headers,
                           json={'token': code})
    
    if response.status_code == 200:
        print_success("2FA confirmado y activado exitosamente")
        return True
    else:
        print_error(f"Error al confirmar 2FA: {response.status_code}")
        print(response.json())
        return False


def test_login_with_2fa(session):
    """Probar login con 2FA habilitado"""
    print_info("\n4. Probando login con 2FA habilitado...")
    
    # Primer intento de login
    response = session.post(f'{BASE_URL}/auth/login/', json={
        'email': TEST_USER_EMAIL,
        'password': TEST_USER_PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('requires_2fa'):
            print_success("Login detectó 2FA habilitado correctamente")
            print_info(f"Mensaje: {data.get('message')}")
            return True
        else:
            print_error("No se detectó 2FA habilitado")
            return False
    else:
        print_error(f"Error en login: {response.status_code}")
        return False


def test_verify_2fa(session, user):
    """Verificar código 2FA"""
    print_info("\n5. Verificando código 2FA...")
    
    # Generar código TOTP válido
    totp = pyotp.TOTP(user.two_factor_secret)
    code = totp.now()
    
    response = session.post(f'{BASE_URL}/auth/2fa/verify/', json={
        'email': TEST_USER_EMAIL,
        'token': code
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('verified'):
            print_success("Código 2FA verificado exitosamente")
            return True
    else:
        print_error(f"Error al verificar 2FA: {response.status_code}")
    
    return False


def test_backup_tokens(session, user, backup_tokens):
    """Probar tokens de respaldo"""
    print_info("\n6. Probando token de respaldo...")
    
    if backup_tokens:
        # Usar el primer token de respaldo
        backup_token = backup_tokens[0]
        
        response = session.post(f'{BASE_URL}/auth/2fa/verify/', json={
            'email': TEST_USER_EMAIL,
            'token': backup_token
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('verified'):
                print_success("Token de respaldo verificado exitosamente")
                print_warning(data.get('warning', ''))
                return True
    
    print_error("No se pudo verificar token de respaldo")
    return False


def test_disable_2fa(session, token):
    """Deshabilitar 2FA"""
    print_info("\n7. Deshabilitando 2FA...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = session.post(f'{BASE_URL}/auth/2fa/disable/', 
                           headers=headers,
                           json={'password': TEST_USER_PASSWORD})
    
    if response.status_code == 200:
        print_success("2FA deshabilitado exitosamente")
        return True
    else:
        print_error(f"Error al deshabilitar 2FA: {response.status_code}")
        print(response.json())
        return False


def main():
    """Ejecutar todas las pruebas"""
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"    PRUEBAS DE AUTENTICACIÓN DE DOS FACTORES (2FA)")
    print(f"{'='*60}{Style.RESET_ALL}\n")
    
    # Crear sesión
    session = requests.Session()
    
    try:
        # Crear usuario de prueba
        user = create_test_user()
        
        # 1. Login sin 2FA
        token = test_login_without_2fa(session)
        if not token:
            print_error("No se pudo obtener token de acceso")
            return
        
        # 2. Habilitar 2FA
        enable_data = test_enable_2fa(session, token)
        if not enable_data:
            return
        
        # Refrescar usuario para obtener el secreto
        user.refresh_from_db()
        
        # 3. Confirmar 2FA
        if not test_confirm_2fa(session, token, user):
            return
        
        # 4. Probar login con 2FA habilitado
        if not test_login_with_2fa(session):
            return
        
        # 5. Verificar código 2FA
        if not test_verify_2fa(session, user):
            return
        
        # 6. Probar token de respaldo
        backup_tokens = enable_data.get('backup_tokens', [])
        test_backup_tokens(session, user, backup_tokens)
        
        # 7. Deshabilitar 2FA
        test_disable_2fa(session, token)
        
        print(f"\n{Fore.GREEN}{'='*60}")
        print(f"    TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE")
        print(f"{'='*60}{Style.RESET_ALL}\n")
        
    except Exception as e:
        print_error(f"\nError durante las pruebas: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Limpiar
        User.objects.filter(email=TEST_USER_EMAIL).delete()
        print_info("Usuario de prueba eliminado")


if __name__ == '__main__':
    main()
