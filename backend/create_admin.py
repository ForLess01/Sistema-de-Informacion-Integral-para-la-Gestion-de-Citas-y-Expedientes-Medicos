"""
Script para crear un superusuario admin
"""
import os
import django
import sys

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings')
django.setup()

from authentication.models import User

def create_admin_user():
    """Crea o actualiza el usuario admin"""
    
    print("=== Creando usuario administrador ===\n")
    
    email = 'admin@hospital.com'
    username = 'admin'
    password = 'admin123456'  # Cambiar en producción
    
    try:
        # Verificar si el usuario ya existe
        user = User.objects.filter(email=email).first()
        
        if user:
            print(f"Usuario con email {email} ya existe.")
            # Actualizar la contraseña y asegurar que sea superusuario
            user.username = username
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.role = 'admin'
            if not user.first_name:
                user.first_name = 'Admin'
            if not user.last_name:
                user.last_name = 'Sistema'
            if not user.dni:
                user.dni = '00000000'
            user.save()
            print("✓ Usuario actualizado correctamente.")
        else:
            # Crear nuevo usuario
            user = User.objects.create_superuser(
                email=email,
                password=password,
                first_name='Admin',
                last_name='Sistema',
                dni='00000000'
            )
            user.username = username
            user.save()
            print("✓ Usuario creado correctamente.")
        
        print(f"\nCredenciales de acceso:")
        print(f"  Email: {email}")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        print(f"\n¡IMPORTANTE! Cambia la contraseña en producción.")
        
        return True
        
    except Exception as e:
        print(f"✗ Error al crear usuario: {e}")
        return False

def test_admin_login():
    """Prueba que el usuario admin pueda autenticarse"""
    from django.contrib.auth import authenticate
    
    print("\nProbando autenticación...")
    user = authenticate(email='admin@hospital.com', password='admin123456')
    
    if user and user.is_superuser:
        print("✓ Autenticación exitosa.")
        return True
    else:
        print("✗ Error de autenticación.")
        return False

def main():
    """Función principal"""
    if create_admin_user():
        test_admin_login()
        print("\n✓ Proceso completado. Puedes acceder a http://localhost:8000/admin/")
    else:
        print("\n✗ Error al crear el usuario admin.")
        sys.exit(1)

if __name__ == "__main__":
    main()
