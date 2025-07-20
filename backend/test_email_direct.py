#!/usr/bin/env python
"""
Script para probar el envío de correos directamente
"""
import os
import sys
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings.development')
django.setup()

from notifications.services.email_service import EmailService
from django.contrib.auth import get_user_model

def test_email_service():
    """Prueba el servicio de email directamente"""
    
    print("🚀 Probando servicio de email...")
    
    # Crear el servicio
    email_service = EmailService()
    
    print(f"Proveedor configurado: {email_service.provider}")
    print(f"Email de origen: {email_service.from_email}")
    
    # Email de destino (tu email)
    to_email = "rendoaltar@gmail.com"
    
    # Contexto para el template
    context = {
        'user_name': 'Usuario de Prueba',
        'user_email': to_email,
        'activation_date': '20/07/2025 a las 16:15',
        'system_name': 'SIIGCEM',
        'hospital_name': 'SIIGCEM - Hospital 1',
    }
    
    subject = "🔔 Prueba Directa - Notificaciones por Email Activadas"
    
    try:
        # Probar con template HTML
        print(f"📧 Enviando email de prueba a: {to_email}")
        
        success = email_service.send_template_email(
            to_emails=[to_email],
            template_name='email_activation_test',
            context=context,
            subject=subject
        )
        
        if success:
            print("✅ Email enviado exitosamente!")
            print(f"   📬 Revisa tu bandeja de entrada: {to_email}")
            print(f"   📬 También revisa la carpeta de spam")
        else:
            print("❌ Error al enviar email")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
        # Intentar con mensaje simple
        print("🔄 Intentando con mensaje simple...")
        
        try:
            message = f"""
¡Hola Usuario de Prueba!

✅ Este es un email de prueba del sistema de notificaciones.

Sistema: Sistema de Gestión Médica
Hospital: SIIGCEM - Hospital 1
Fecha: 20/07/2025 a las 16:15

Si recibes este mensaje, el sistema de notificaciones está funcionando correctamente.
            """.strip()
            
            success = email_service.send_email(
                to_emails=[to_email],
                subject=subject,
                message=message
            )
            
            if success:
                print("✅ Email simple enviado exitosamente!")
                print(f"   📬 Revisa tu bandeja de entrada: {to_email}")
            else:
                print("❌ Error al enviar email simple")
                
        except Exception as e2:
            print(f"❌ Error enviando email simple: {e2}")

if __name__ == "__main__":
    test_email_service()
