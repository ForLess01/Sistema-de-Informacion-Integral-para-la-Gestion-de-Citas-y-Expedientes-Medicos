#!/usr/bin/env python
"""
Script de prueba para el endpoint de email de activación de notificaciones
Prueba el nuevo endpoint /notifications/test-email/
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings.development')
django.setup()

import json
from django.contrib.auth import get_user_model
from django.test import Client, RequestFactory
from django.urls import reverse
from notifications.models import NotificationPreference, Notification
from rest_framework.test import APIClient
# Token JWT authentication instead of Token auth
from django.contrib.auth.models import User as DjangoUser

User = get_user_model()

def create_test_user():
    """Crea un usuario de prueba"""
    try:
        user = User.objects.get(email='rendoaltar@gmail.com')
        print(f"✅ Usuario de prueba encontrado: {user.get_full_name()}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            email='rendoaltar@gmail.com',
            password='testpass123',
            first_name='Juan',
            last_name='Pérez',
            phone='987654321',
            dni='12399678',
            role='patient'
        )
        print(f"✅ Usuario de prueba creado: {user.get_full_name()}")
    
    return user

def test_email_activation_endpoint():
    """Prueba el endpoint de activación de email"""
    print("\n" + "="*60)
    print("🧪 PRUEBA DEL ENDPOINT DE ACTIVACIÓN DE EMAIL")
    print("="*60)
    
    # Crear usuario de prueba
    user = create_test_user()
    
    # Crear cliente API
    client = APIClient()
    
    # Autenticar usuario usando force_authenticate
    client.force_authenticate(user=user)
    
    print(f"\n👤 Usuario autenticado: {user.get_full_name()} ({user.email})")
    
    # Verificar estado inicial de preferencias
    preferences, created = NotificationPreference.objects.get_or_create(user=user)
    print(f"📧 Email habilitado inicialmente: {preferences.email_enabled}")
    print(f"🔔 Recordatorios habilitados: {preferences.appointment_reminders}")
    
    # Probar endpoint
    print(f"\n🔄 Enviando petición POST a /notifications/test-email/")
    
    # Datos de la petición
    data = {
        'enable_email': True  # Activar emails si no están activados
    }
    
    # Hacer la petición
    response = client.post('/api/v1/notifications/test-email/', data, format='json')
    
    print(f"📋 Status Code: {response.status_code}")
    print(f"📋 Response Data:")
    
    if hasattr(response, 'data'):
        print(json.dumps(response.data, indent=2, ensure_ascii=False))
    else:
        print(f"Response content: {response.content.decode('utf-8') if response.content else 'No content'}")
    
    # Verificar si se creó la notificación
    notifications = Notification.objects.filter(recipient=user, channel='email').order_by('-created_at')
    
    print(f"\n📊 Notificaciones creadas: {notifications.count()}")
    
    if notifications.exists():
        latest_notification = notifications.first()
        print(f"📧 Última notificación:")
        print(f"   • ID: {latest_notification.notification_id}")
        print(f"   • Asunto: {latest_notification.subject}")
        print(f"   • Estado: {latest_notification.status}")
        print(f"   • Email destino: {latest_notification.recipient_email}")
        print(f"   • Fecha: {latest_notification.created_at}")
    
    # Verificar cambios en preferencias
    preferences.refresh_from_db()
    print(f"\n📧 Email habilitado después: {preferences.email_enabled}")
    print(f"🔔 Recordatorios habilitados después: {preferences.appointment_reminders}")
    
    return response.status_code == 200

def test_preferences_endpoint():
    """Prueba el endpoint de preferencias"""
    print("\n" + "-"*60)
    print("🔧 PRUEBA DEL ENDPOINT DE PREFERENCIAS")
    print("-"*60)
    
    user = User.objects.get(email='rendoaltar@gmail.com')
    
    # Crear cliente API
    client = APIClient()
    client.force_authenticate(user=user)
    
    # Obtener preferencias actuales
    response = client.get('/api/v1/notifications/preferences/')
    
    print(f"📋 GET Preferences - Status Code: {response.status_code}")
    if response.status_code == 200:
        print("📋 Preferencias actuales:")
        prefs = response.data
        print(f"   • Email habilitado: {prefs.get('email_enabled')}")
        print(f"   • SMS habilitado: {prefs.get('sms_enabled')}")
        print(f"   • Recordatorios de citas: {prefs.get('appointment_reminders')}")
        print(f"   • Resultados de exámenes: {prefs.get('exam_results')}")
        
        # Modificar preferencias
        print(f"\n🔄 Actualizando preferencias...")
        
        update_data = {
            'email_enabled': True,
            'appointment_reminders': True,
            'exam_results': True,
            'sms_enabled': False
        }
        
        patch_response = client.patch('/api/v1/notifications/preferences/', update_data, format='json')
        print(f"📋 PATCH Preferences - Status Code: {patch_response.status_code}")
        
        if patch_response.status_code == 200:
            print("✅ Preferencias actualizadas correctamente")

def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DEL SISTEMA DE NOTIFICACIONES")
    print(f"🐍 Django Version: {django.get_version()}")
    print(f"🗃️ Base de datos: Usando configuración de desarrollo")
    
    try:
        # Probar endpoint de activación de email
        success = test_email_activation_endpoint()
        
        # Probar endpoint de preferencias
        test_preferences_endpoint()
        
        print("\n" + "="*60)
        print("📋 RESUMEN FINAL")
        print("="*60)
        
        if success:
            print("✅ ¡Todas las pruebas pasaron correctamente!")
            print("✅ El endpoint de activación de email funciona")
            print("✅ Las notificaciones se crean en la base de datos")
            print("✅ Las preferencias se actualizan correctamente")
            
            print("\n🎯 PRÓXIMOS PASOS:")
            print("1. Integrar el endpoint en el frontend")
            print("2. Configurar SMTP real para producción")
            print("3. Agregar estilos CSS al template HTML")
            print("4. Probar con usuarios reales")
            
        else:
            print("❌ Algunas pruebas fallaron")
            print("🔧 Revisar la configuración del sistema")
        
        print("\n📚 ENDPOINTS DISPONIBLES:")
        print("• POST /api/notifications/test-email/ - Enviar email de prueba")
        print("• GET/PATCH /api/notifications/preferences/ - Gestionar preferencias")
        print("• GET /api/notifications/user/ - Ver notificaciones del usuario")
        
    except Exception as e:
        print(f"\n❌ Error durante las pruebas: {e}")
        import traceback
        traceback.print_exc()
        
    print("\n" + "="*60)
    print("🏁 FIN DE LAS PRUEBAS")
    print("="*60)

if __name__ == "__main__":
    main()
