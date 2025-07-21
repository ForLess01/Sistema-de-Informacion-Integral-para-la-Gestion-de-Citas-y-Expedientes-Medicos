#!/usr/bin/env python
"""
Script para normalizar campos encriptados en usuarios existentes.
Corrige usuarios que tienen DNI/identification_number en diferentes estados de encriptación.
"""

import os
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings')
django.setup()

from django.db import connection
from authentication.models import User


def is_encrypted_value(value):
    """Verifica si un valor está encriptado (es bytes/memoryview)"""
    return isinstance(value, (bytes, memoryview))


def decrypt_value(encrypted_value, key):
    """Desencripta un valor usando pgcrypto"""
    if not encrypted_value:
        return None
        
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pgp_sym_decrypt(%s::bytea, %s::text)",
                [encrypted_value, key]
            )
            result = cursor.fetchone()
            return result[0] if result else None
    except Exception as e:
        print(f"Error desencriptando: {e}")
        return None


def encrypt_value(value, key):
    """Encripta un valor usando pgcrypto"""
    if not value:
        return None
        
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pgp_sym_encrypt(%s::text, %s::text)",
                [str(value), key]
            )
            result = cursor.fetchone()
            return result[0] if result else None
    except Exception as e:
        print(f"Error encriptando: {e}")
        return None


def normalize_user_encryption():
    """Normaliza todos los usuarios para tener campos encriptados consistentes"""
    
    # Obtener la clave de encriptación
    crypto_key = getattr(settings, 'PGCRYPTO_KEY', os.environ.get('PGCRYPTO_KEY', 'default-encryption-key'))
    
    print(f"Iniciando normalización de campos encriptados...")
    print(f"Usando clave de encriptación: {crypto_key[:10]}...")
    
    users = User.objects.all()
    total_users = users.count()
    
    print(f"Procesando {total_users} usuarios...")
    
    fixed_users = 0
    errors = 0
    
    for i, user in enumerate(users, 1):
        print(f"\nProcesando usuario {i}/{total_users}: {user.email}")
        
        try:
            # Variables para almacenar valores desencriptados
            dni_clear = None
            identification_clear = None
            
            # Procesar DNI
            if user.dni:
                if is_encrypted_value(user.dni):
                    # Está encriptado, desencriptar para obtener valor limpio
                    dni_clear = decrypt_value(user.dni, crypto_key)
                    print(f"  DNI desencriptado: {dni_clear}")
                else:
                    # No está encriptado, usar valor directo
                    dni_clear = str(user.dni)
                    print(f"  DNI ya en texto plano: {dni_clear}")
            
            # Procesar identification_number
            if user.identification_number:
                if is_encrypted_value(user.identification_number):
                    # Está encriptado, desencriptar
                    identification_clear = decrypt_value(user.identification_number, crypto_key)
                    print(f"  ID desencriptado: {identification_clear}")
                else:
                    # No está encriptado, usar valor directo
                    identification_clear = str(user.identification_number)
                    print(f"  ID ya en texto plano: {identification_clear}")
            
            # Actualizar directamente en la base de datos para evitar problemas con el campo personalizado
            update_needed = False
            
            if dni_clear:
                encrypted_dni = encrypt_value(dni_clear, crypto_key)
                if encrypted_dni:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "UPDATE authentication_user SET dni = %s WHERE id = %s",
                            [encrypted_dni, user.id]
                        )
                    print(f"  ✓ DNI re-encriptado y guardado")
                    update_needed = True
                    
            if identification_clear:
                encrypted_id = encrypt_value(identification_clear, crypto_key)
                if encrypted_id:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "UPDATE authentication_user SET identification_number = %s WHERE id = %s",
                            [encrypted_id, user.id]
                        )
                    print(f"  ✓ ID re-encriptado y guardado")
                    update_needed = True
            
            if update_needed:
                fixed_users += 1
                print(f"  ✅ Usuario {user.email} normalizado correctamente")
            else:
                print(f"  ⏭️ Usuario {user.email} no necesitaba cambios")
                
        except Exception as e:
            errors += 1
            print(f"  ❌ Error procesando usuario {user.email}: {e}")
            continue
    
    print(f"\n🎉 Normalización completada!")
    print(f"📊 Estadísticas:")
    print(f"   • Total usuarios: {total_users}")
    print(f"   • Usuarios corregidos: {fixed_users}")
    print(f"   • Errores: {errors}")
    print(f"   • Usuarios sin cambios: {total_users - fixed_users - errors}")


def verify_encryption_status():
    """Verifica el estado actual de la encriptación"""
    print("\n🔍 Verificando estado actual de encriptación...")
    
    crypto_key = getattr(settings, 'PGCRYPTO_KEY', os.environ.get('PGCRYPTO_KEY', 'default-encryption-key'))
    users = User.objects.all()[:10]  # Solo los primeros 10 para verificación
    
    for user in users:
        print(f"\nUsuario: {user.email}")
        
        # Verificar DNI
        if user.dni:
            is_dni_encrypted = is_encrypted_value(user.dni)
            print(f"  DNI encriptado: {is_dni_encrypted}")
            
            if is_dni_encrypted:
                decrypted = decrypt_value(user.dni, crypto_key)
                print(f"  DNI desencriptado: {decrypted}")
        
        # Verificar identification_number
        if user.identification_number:
            is_id_encrypted = is_encrypted_value(user.identification_number)
            print(f"  ID encriptado: {is_id_encrypted}")
            
            if is_id_encrypted:
                decrypted = decrypt_value(user.identification_number, crypto_key)
                print(f"  ID desencriptado: {decrypted}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        verify_encryption_status()
    else:
        print("🔧 Herramienta de normalización de campos encriptados")
        print("=" * 50)
        
        response = input("¿Desea continuar con la normalización? (y/N): ")
        
        if response.lower() in ['y', 'yes', 's', 'si']:
            normalize_user_encryption()
            print("\n🔍 Verificando resultados...")
            verify_encryption_status()
        else:
            print("Operación cancelada.")
            
        print("\n💡 Para solo verificar el estado actual, ejecute:")
        print("   python fix_encrypted_fields.py verify")
