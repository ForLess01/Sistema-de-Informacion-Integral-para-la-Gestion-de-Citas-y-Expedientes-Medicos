"""
Script para corregir usernames duplicados usando SQL directo
"""
import os
import django
import sys
from django.db import connection

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings')
django.setup()

def fix_duplicate_usernames_sql():
    """Corrige usernames duplicados usando SQL directo"""
    
    print("=== Script de corrección de usernames duplicados (SQL) ===\n")
    
    with connection.cursor() as cursor:
        # Primero, veamos qué usernames están duplicados
        print("Verificando usernames duplicados...")
        cursor.execute("""
            SELECT username, COUNT(*) as count 
            FROM authentication_user 
            GROUP BY username 
            HAVING COUNT(*) > 1
        """)
        duplicates = cursor.fetchall()
        
        if not duplicates:
            print("No se encontraron usernames duplicados.")
            return True
        
        print(f"Se encontraron {len(duplicates)} usernames duplicados.")
        
        # Para cada username duplicado
        for username, count in duplicates:
            print(f"\nCorrigiendo username: {username} (aparece {count} veces)")
            
            # Obtener todos los IDs de usuarios con este username, ordenados por ID
            cursor.execute("""
                SELECT id, email 
                FROM authentication_user 
                WHERE username = %s OR username IS NULL
                ORDER BY id
            """, [username])
            users = cursor.fetchall()
            
            # Actualizar todos excepto el primero
            for i, (user_id, email) in enumerate(users):
                if i > 0:  # Skip the first one
                    # Generar un nuevo username único
                    if email:
                        new_username = f"{email.split('@')[0]}_{user_id}"
                    else:
                        new_username = f"user_{user_id}"
                    
                    # Verificar si el nuevo username ya existe
                    cursor.execute("""
                        SELECT COUNT(*) FROM authentication_user WHERE username = %s
                    """, [new_username])
                    
                    if cursor.fetchone()[0] > 0:
                        # Si existe, agregar un sufijo adicional
                        counter = 1
                        while True:
                            temp_username = f"{new_username}_{counter}"
                            cursor.execute("""
                                SELECT COUNT(*) FROM authentication_user WHERE username = %s
                            """, [temp_username])
                            if cursor.fetchone()[0] == 0:
                                new_username = temp_username
                                break
                            counter += 1
                    
                    # Actualizar el username
                    cursor.execute("""
                        UPDATE authentication_user 
                        SET username = %s 
                        WHERE id = %s
                    """, [new_username, user_id])
                    
                    print(f"  Usuario ID {user_id}: {username} -> {new_username}")
        
        # Verificar que no queden duplicados
        print("\nVerificando resultado...")
        cursor.execute("""
            SELECT username, COUNT(*) as count 
            FROM authentication_user 
            GROUP BY username 
            HAVING COUNT(*) > 1
        """)
        remaining = cursor.fetchall()
        
        if remaining:
            print(f"¡ERROR! Todavía hay {len(remaining)} usernames duplicados.")
            return False
        else:
            print("✓ Todos los usernames son únicos.")
            return True

def main():
    """Función principal"""
    try:
        if fix_duplicate_usernames_sql():
            print("\n✓ Script completado exitosamente. Ahora puedes ejecutar las migraciones.")
        else:
            print("\n✗ El script no pudo corregir todos los duplicados.")
            sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
