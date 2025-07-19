from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Habilita la extensión pgcrypto en PostgreSQL para encriptación de datos'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            try:
                # Verificar si pgcrypto ya está habilitado
                cursor.execute("""
                    SELECT EXISTS(
                        SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
                    );
                """)
                
                exists = cursor.fetchone()[0]
                
                if exists:
                    self.stdout.write(
                        self.style.SUCCESS('✅ pgcrypto ya está habilitado')
                    )
                else:
                    # Habilitar pgcrypto
                    cursor.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
                    self.stdout.write(
                        self.style.SUCCESS('✅ pgcrypto habilitado exitosamente')
                    )
                
                # Probar funciones de encriptación
                cursor.execute("""
                    SELECT pgp_sym_encrypt('test', 'test-key'), 
                           pgp_sym_decrypt(pgp_sym_encrypt('test', 'test-key'), 'test-key');
                """)
                
                encrypted, decrypted = cursor.fetchone()
                
                if decrypted == 'test':
                    self.stdout.write(
                        self.style.SUCCESS('✅ Funciones de encriptación funcionando correctamente')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR('❌ Error en las funciones de encriptación')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error al configurar pgcrypto: {e}')
                )
