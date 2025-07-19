#!/usr/bin/env python3
"""
Script de prueba para endpoints de reservas temporales
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

class TemporaryReservationTester:
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
            # Imprimir la respuesta para debug
            print(f"📄 Respuesta login: {json.dumps(response_data, indent=2)}")
            
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
    
    def create_temporary_reservation(self, doctor_id=1, specialty_id=1):
        """Probar crear reserva temporal"""
        print("\n" + "="*50)
        print("🧪 PROBANDO: Crear reserva temporal")
        print("="*50)
        
        # Fecha de mañana
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        url = f'{self.base_url}/appointments/create_temporary_reservation/'
        data = {
            'doctor': doctor_id,
            'specialty': specialty_id,
            'appointment_date': tomorrow,
            'appointment_time': '09:00:00'
        }
        
        print(f"📤 POST {url}")
        print(f"📄 Data: {json.dumps(data, indent=2)}")
        
        response = self.session.post(url, json=data, headers=self.headers)
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Reserva temporal creada exitosamente:")
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
    
    def list_temporary_reservations(self):
        """Probar listar reservas temporales"""
        print("\n" + "="*50)
        print("🧪 PROBANDO: Listar reservas temporales")
        print("="*50)
        
        url = f'{self.base_url}/appointments/list_temporary_reservations/'
        
        print(f"📤 GET {url}")
        
        response = self.session.get(url, headers=self.headers)
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Se encontraron {len(result)} reservas temporales activas:")
            print(json.dumps(result, indent=2))
            return result
        else:
            print(f"❌ Error listando reservas temporales:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
            return None
    
    def test_available_slots_with_temporary_reservations(self):
        """Probar que las reservas temporales bloquean slots"""
        print("\n" + "="*50)
        print("🧪 PROBANDO: Verificar bloqueo de slots por reservas temporales")
        print("="*50)
        
        # Fecha de mañana
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Primero obtener slots disponibles
        url = f'{self.base_url}/appointments/available-slots/'
        params = {
            'doctor_id': 1,
            'date': tomorrow
        }
        
        print(f"📤 GET {url} con parámetros: {params}")
        
        response = self.session.get(url, params=params, headers=self.headers)
        
        if response.status_code == 200:
            slots_before = response.json()
            print(f"✅ Slots disponibles ANTES de reserva temporal: {len(slots_before)}")
            print(f"Slots: {slots_before}")
            
            # Crear una reserva temporal
            temp_reservation = self.create_temporary_reservation()
            
            if temp_reservation:
                # Verificar slots otra vez
                response2 = self.session.get(url, params=params, headers=self.headers)
                if response2.status_code == 200:
                    slots_after = response2.json()
                    print(f"✅ Slots disponibles DESPUÉS de reserva temporal: {len(slots_after)}")
                    print(f"Slots: {slots_after}")
                    
                    # Verificar si el slot fue bloqueado
                    blocked_time = temp_reservation.get('appointment_time', '').split('T')[0] if temp_reservation.get('appointment_time') else '09:00'
                    if blocked_time not in slots_after and blocked_time in slots_before:
                        print(f"✅ El slot {blocked_time} fue correctamente bloqueado")
                    else:
                        print(f"⚠️ El slot {blocked_time} no fue bloqueado como esperado")
                else:
                    print(f"❌ Error obteniendo slots después: {response2.status_code}")
            
        else:
            print(f"❌ Error obteniendo slots: {response.status_code}")
            print(response.text)
    
    def cancel_temporary_reservation(self, reservation_id):
        """Probar cancelar reserva temporal"""
        print("\n" + "="*50)
        print("🧪 PROBANDO: Cancelar reserva temporal")
        print("="*50)
        
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
        """Probar confirmar reserva temporal"""
        print("\n" + "="*50)
        print("🧪 PROBANDO: Confirmar reserva temporal")
        print("="*50)
        
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
    
    def test_cancel_and_confirm_reservations(self):
        """Probar cancelar y confirmar reservas temporales"""
        print("\n" + "="*50)
        print("🧪 PROBANDO: Flujo completo de reservas temporales")
        print("="*50)
        
        # Crear dos reservas temporales con diferentes horarios
        print("🔹 Creando primera reserva temporal para cancelar...")
        reservation_to_cancel = self.create_temporary_reservation(doctor_id=1, specialty_id=1)
        
        if not reservation_to_cancel:
            print("❌ No se pudo crear reserva para cancelar")
            return
        
        # Crear segunda reserva con diferente hora
        print("🔹 Creando segunda reserva temporal para confirmar...")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        url = f'{self.base_url}/appointments/create_temporary_reservation/'
        data = {
            'doctor': 1,
            'specialty': 1,
            'appointment_date': tomorrow,
            'appointment_time': '10:00:00'  # Hora diferente
        }
        
        response = self.session.post(url, json=data, headers=self.headers)
        
        if response.status_code == 201:
            reservation_to_confirm = response.json()
            print(f"✅ Segunda reserva creada: ID {reservation_to_confirm['id']}")
        else:
            print("❌ No se pudo crear segunda reserva")
            return
        
        # Cancelar la primera reserva
        cancel_result = self.cancel_temporary_reservation(reservation_to_cancel['id'])
        
        # Confirmar la segunda reserva
        confirm_result = self.confirm_temporary_reservation(reservation_to_confirm['id'])
        
        # Verificar estado final
        print("🔹 Verificando estado final de reservas...")
        final_reservations = self.list_temporary_reservations()
        
        if cancel_result and confirm_result:
            print("✅ Flujo completo exitoso: cancelación y confirmación funcionan")
        else:
            print("⚠️ Hubo problemas en el flujo completo")
    
    def test_reservation_expiration(self):
        """Probar que las reservas temporales expiran"""
        print("\n" + "="*50)
        print("🧪 PROBANDO: Expiración de reservas temporales")
        print("="*50)
        
        # Crear una reserva temporal con tiempo de expiración muy corto
        # (Esto requeriría modificar el modelo para testing)
        print("⚠️ Esta prueba requiere configuración especial para simular expiración rápida")
        print("💡 En producción, las reservas expiran después del tiempo configurado")
        
        # Listar reservas actuales
        reservations = self.list_temporary_reservations()
        
        if reservations:
            print(f"📊 Se encontraron {len(reservations)} reservas activas")
            for reservation in reservations:
                expires_at = reservation.get('expires_at')
                print(f"🕐 Reserva ID {reservation.get('id')} expira en: {expires_at}")
        else:
            print("📊 No hay reservas temporales activas")
    
    def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print("🚀 INICIANDO PRUEBAS DE RESERVAS TEMPORALES")
        print("="*80)
        
        # Login
        if not self.login():
            print("❌ No se pudo realizar login. Abortando pruebas.")
            return
        
        # Ejecutar todas las pruebas
        self.create_temporary_reservation()
        self.list_temporary_reservations()
        self.test_available_slots_with_temporary_reservations()
        self.test_cancel_and_confirm_reservations()
        self.test_reservation_expiration()
        
        print("\n" + "="*80)
        print("✅ PRUEBAS COMPLETADAS")
        print("="*80)

def main():
    """Función principal"""
    tester = TemporaryReservationTester()
    tester.run_all_tests()

if __name__ == '__main__':
    main()
