#!/usr/bin/env python3
"""
Script de prueba específico para cancelar y confirmar reservas temporales existentes
"""
import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_system.settings.development')
sys.path.append('/'.join(__file__.split('/')[:-1]))

# Setup de Django
django.setup()

# URL base de la API
BASE_URL = 'http://localhost:8000/api/v1'

class CancelConfirmTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.base_url = BASE_URL
        self.headers = {}
    
    def login(self, email='admin@hospital.com', password='admin123456'):
        """Login para obtener token de autenticación"""
        login_url = f'{self.base_url}/auth/login/'
        data = {
            'email': email,
            'password': password
        }
        
        print(f"🔐 Intentando login con: {email}")
        response = self.session.post(login_url, data=data)
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Intentar diferentes nombres de campo para el token
            self.token = response_data.get('access') or response_data.get('access_token') or response_data.get('token')
            
            if self.token:
                self.headers = {'Authorization': f'Bearer {self.token}'}
                print("✅ Login exitoso")
                return True
            else:
                print("❌ No se encontró el token en la respuesta")
                return False
        else:
            print(f"❌ Error en login: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    
    def list_temporary_reservations(self):
        """Listar reservas temporales"""
        print("\n" + "="*60)
        print("📋 LISTANDO: Reservas temporales activas")
        print("="*60)
        
        url = f'{self.base_url}/appointments/list_temporary_reservations/'
        
        print(f"📤 GET {url}")
        
        response = self.session.get(url, headers=self.headers)
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Se encontraron {len(result)} reservas temporales activas:")
            for i, reservation in enumerate(result, 1):
                print(f"  {i}. ID: {reservation['id']} - {reservation['user_name']}")
                print(f"     Doctor: {reservation['doctor_name']}")
                print(f"     Fecha: {reservation['appointment_date']} {reservation['appointment_time']}")
                print(f"     Expira: {reservation['expires_at']}")
                print(f"     Tiempo restante: {reservation['time_remaining']} segundos")
                print()
            return result
        else:
            print(f"❌ Error listando reservas temporales:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
            return None
    
    def cancel_temporary_reservation(self, reservation_id):
        """Cancelar reserva temporal"""
        print("\n" + "="*60)
        print(f"❌ CANCELANDO: Reserva temporal ID {reservation_id}")
        print("="*60)
        
        url = f'{self.base_url}/appointments/cancel_temporary_reservation/'
        data = {
            'reservation_id': reservation_id
        }
        
        print(f"📤 POST {url}")
        print(f"📄 Data: {json.dumps(data, indent=2)}")
        
        response = self.session.post(url, json=data, headers=self.headers)
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Reserva temporal cancelada exitosamente:")
            print(json.dumps(result, indent=2))
            return result
        else:
            print(f"❌ Error cancelando reserva temporal:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
            return None
    
    def confirm_temporary_reservation(self, reservation_id):
        """Confirmar reserva temporal"""
        print("\n" + "="*60)
        print(f"✅ CONFIRMANDO: Reserva temporal ID {reservation_id}")
        print("="*60)
        
        url = f'{self.base_url}/appointments/confirm_temporary_reservation/'
        data = {
            'reservation_id': reservation_id
        }
        
        print(f"📤 POST {url}")
        print(f"📄 Data: {json.dumps(data, indent=2)}")
        
        response = self.session.post(url, json=data, headers=self.headers)
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Reserva temporal confirmada exitosamente:")
            print(json.dumps(result, indent=2))
            return result
        else:
            print(f"❌ Error confirmando reserva temporal:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
            return None
    
    def create_test_reservation(self):
        """Crear una reserva temporal de prueba"""
        print("\n" + "="*60)
        print("➕ CREANDO: Nueva reserva temporal para pruebas")
        print("="*60)
        
        # Fecha de mañana con hora diferente para evitar conflictos
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        url = f'{self.base_url}/appointments/create_temporary_reservation/'
        data = {
            'doctor': 1,
            'specialty': 1,
            'appointment_date': tomorrow,
            'appointment_time': '11:30:00'  # Hora que debería estar disponible
        }
        
        print(f"📤 POST {url}")
        print(f"📄 Data: {json.dumps(data, indent=2)}")
        
        response = self.session.post(url, json=data, headers=self.headers)
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Nueva reserva temporal creada:")
            print(json.dumps(result, indent=2))
            return result
        else:
            print(f"❌ Error creando reserva temporal:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
            return None
    
    def run_cancel_tests(self):
        """Ejecutar pruebas de cancelación"""
        print("🚀 INICIANDO PRUEBAS DE CANCELACIÓN Y CONFIRMACIÓN")
        print("="*80)
        
        # Login
        if not self.login():
            print("❌ No se pudo realizar login. Abortando pruebas.")
            return
        
        # Listar reservas existentes
        reservations = self.list_temporary_reservations()
        
        # Crear una nueva reserva para probar cancelación
        new_reservation = self.create_test_reservation()
        
        if new_reservation:
            print(f"\n🔄 Probando cancelación con reserva ID {new_reservation['id']}")
            cancel_result = self.cancel_temporary_reservation(new_reservation['id'])
            
            if cancel_result:
                print("✅ Test de cancelación exitoso")
            else:
                print("❌ Test de cancelación fallido")
        
        # Si hay reservas existentes, probar confirmación con la primera
        if reservations:
            first_reservation = reservations[0]
            print(f"\n🔄 Probando confirmación con reserva ID {first_reservation['id']}")
            confirm_result = self.confirm_temporary_reservation(first_reservation['id'])
            
            if confirm_result:
                print("✅ Test de confirmación exitoso")
                print("\n📋 Verificando lista final de reservas...")
                self.list_temporary_reservations()
            else:
                print("❌ Test de confirmación fallido")
        
        print("\n" + "="*80)
        print("✅ PRUEBAS DE CANCELACIÓN Y CONFIRMACIÓN COMPLETADAS")
        print("="*80)

def main():
    """Función principal"""
    tester = CancelConfirmTester()
    tester.run_cancel_tests()

if __name__ == '__main__':
    main()
