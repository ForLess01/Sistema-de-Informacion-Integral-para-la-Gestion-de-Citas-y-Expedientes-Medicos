#!/usr/bin/env python
"""
Script de prueba para las integraciones externas del Sistema Médico
Fecha: 2025-01-19
Fase 0 - Parte 3: Configuración de Integraciones Externas
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings.development')
django.setup()

from notifications.services import test_email_service, test_geolocation_service
from django.conf import settings

def print_header(title):
    """Imprime un header formateado"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_section(title):
    """Imprime una sección formateada"""
    print(f"\n🔧 {title}")
    print("-" * 40)

def test_email_integration():
    """Prueba la integración del servicio de email"""
    print_section("PRUEBA DE SERVICIO DE EMAIL")
    
    try:
        result = test_email_service()
        
        print(f"Proveedor: {result['provider']}")
        print(f"Estado: {'✅ ÉXITO' if result['success'] else '❌ ERROR'}")
        print(f"Mensaje: {result['message']}")
        
        if 'details' in result and result['details']:
            print("Detalles:")
            for key, value in result['details'].items():
                print(f"  • {key}: {value}")
        
        return result['success']
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def test_geolocation_integration():
    """Prueba la integración del servicio de geolocalización"""
    print_section("PRUEBA DE SERVICIO DE GEOLOCALIZACIÓN")
    
    try:
        result = test_geolocation_service()
        
        print(f"Estado: {'✅ ÉXITO' if result['success'] else '❌ ERROR'}")
        print(f"Mensaje: {result['message']}")
        
        if 'details' in result and result['details']:
            print("Coordenadas de prueba:")
            details = result['details']
            print(f"  • Latitud: {details.get('latitude', 'N/A')}")
            print(f"  • Longitud: {details.get('longitude', 'N/A')}")
            
            # Generar enlace de Google Maps
            if 'latitude' in details and 'longitude' in details:
                maps_url = f"https://www.google.com/maps?q={details['latitude']},{details['longitude']}"
                print(f"  • Google Maps: {maps_url}")
        
        return result['success']
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def show_configuration_status():
    """Muestra el estado actual de la configuración"""
    print_section("ESTADO DE CONFIGURACIÓN")
    
    # Email
    email_provider = getattr(settings, 'EMAIL_PROVIDER', 'django')
    email_host = getattr(settings, 'EMAIL_HOST', '')
    sendgrid_key = getattr(settings, 'SENDGRID_API_KEY', '')
    
    print("📧 Email:")
    print(f"  • Proveedor: {email_provider}")
    if email_provider == 'django':
        print(f"  • SMTP Host: {email_host or 'No configurado'}")
        print(f"  • SMTP User: {getattr(settings, 'EMAIL_HOST_USER', 'No configurado')}")
    else:
        print(f"  • SendGrid API Key: {'Configurado' if sendgrid_key else 'No configurado'}")
    
    # Geolocalización
    google_maps_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
    print("\n🗺️ Geolocalización:")
    print(f"  • Google Maps API Key: {'Configurado' if google_maps_key else 'No configurado'}")

def show_configuration_instructions():
    """Muestra instrucciones para configurar las integraciones"""
    print_section("INSTRUCCIONES DE CONFIGURACIÓN")
    
    print("Para configurar las integraciones, agrega las siguientes variables")
    print("de entorno a tu archivo .env:")
    print()
    
    print("📧 Para EMAIL (Opción 1 - Django SMTP):")
    print("EMAIL_HOST=smtp.gmail.com")
    print("EMAIL_PORT=587")
    print("EMAIL_USE_TLS=true")
    print("EMAIL_HOST_USER=tu-email@gmail.com")
    print("EMAIL_HOST_PASSWORD=tu-app-password")
    print()
    
    print("📧 Para EMAIL (Opción 2 - SendGrid):")
    print("EMAIL_PROVIDER=sendgrid")
    print("SENDGRID_API_KEY=tu-sendgrid-api-key")
    print()
    
    print("🗺️ Para GEOLOCALIZACIÓN:")
    print("GOOGLE_MAPS_API_KEY=tu-google-maps-api-key")
    print()
    
    print("📚 Enlaces útiles:")
    print("• SendGrid: https://sendgrid.com/")
    print("• Google Maps API: https://developers.google.com/maps/documentation/geocoding/get-api-key")
    print("• Gmail App Passwords: https://support.google.com/accounts/answer/185833")

def main():
    """Función principal del script de prueba"""
    print_header("🧪 PRUEBA DE INTEGRACIONES EXTERNAS")
    print("Sistema de Información Integral - Fase 0, Parte 3")
    
    # Mostrar configuración actual
    show_configuration_status()
    
    # Probar integraciones
    email_success = test_email_integration()
    geo_success = test_geolocation_integration()
    
    # Mostrar resumen
    print_section("📋 RESUMEN FINAL")
    
    if email_success and geo_success:
        print("🎉 ¡Todas las integraciones funcionan correctamente!")
        print("✅ El sistema está listo para la Fase 1")
        return_code = 0
    else:
        print("⚠️ Algunas integraciones necesitan configuración:")
        if not email_success:
            print("  • ❌ Servicio de Email")
        if not geo_success:
            print("  • ❌ Servicio de Geolocalización")
        
        show_configuration_instructions()
        return_code = 1
    
    print_section("🚀 PRÓXIMOS PASOS")
    
    if email_success and geo_success:
        print("1. ✅ Fase 0 completada - todas las integraciones funcionan")
        print("2. 🏗️ Proceder con Fase 1: Flujo Central - Cita y Consulta Médica")
        print("3. 📝 Actualizar documentación con el estado final")
    else:
        print("1. 🔧 Configurar las integraciones pendientes")
        print("2. ✅ Ejecutar nuevamente este script para verificar")
        print("3. 🏗️ Una vez configuradas, proceder con la Fase 1")
    
    print("\n" + "="*60)
    print("Fin de la prueba")
    print("="*60)
    
    sys.exit(return_code)

if __name__ == "__main__":
    main()
