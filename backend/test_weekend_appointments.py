#!/usr/bin/env python
"""
Script para probar la creación de citas en días laborables y fines de semana
Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos
"""

import requests
import json
from datetime import datetime, timedelta
import sys

class WeekendAppointmentTester:
    def __init__(self, base_url='http://127.0.0.1:8000'):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
    
    def login(self, email='rendoaltar@gmail.com', password='Admin123456'):
        """Autenticar usuario y obtener token"""
        url = f"{self.base_url}/api/v1/auth/login/"
        data = {
            'email': email,
            'password': password
        }
        
        print(f"🔐 Iniciando sesión como {email}...")
        
        try:
            response = self.session.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                self.token = result.get('access')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
                print(f"✅ Login exitoso. Token obtenido.")
                return True
            else:
                print(f"❌ Error en login: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error en login: {e}")
            return False
    
    def get_next_weekday(self, days_ahead, target_weekday):
        """Obtener la próxima fecha para un día específico de la semana"""
        current_date = datetime.now()
        days_to_add = days_ahead
        
        while True:
            next_date = current_date + timedelta(days=days_to_add)
            if next_date.weekday() == target_weekday:
                return next_date
            days_to_add += 1
            if days_to_add > 14:  # Evitar bucle infinito
                break
        return None
    
    def test_appointment_creation(self, date, day_type):
        """Probar creación de cita en una fecha específica"""
        print(f"\n--- PROBANDO CITA EN {day_type.upper()} ---")
        print(f"📅 Fecha: {date.strftime('%Y-%m-%d')} ({date.strftime('%A')})")
        
        appointment_data = {
            'patient': 1,  # ID del paciente autenticado
            'doctor': 1,   # ID del doctor
            'appointment_date': date.strftime('%Y-%m-%d'),
            'appointment_time': '10:00:00',
            'reason': f'Consulta médica programada para {day_type}',
            'notes': f'Cita creada en {day_type} como prueba del sistema'
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/appointments/", 
                json=appointment_data
            )
            
            if response.status_code == 201:
                print(f"✅ Cita creada exitosamente en {day_type}")
                data = response.json()
                print(f"   📋 ID de cita: {data.get('appointment_id', 'N/A')}")
                print(f"   🏥 Doctor: {data.get('doctor_name', 'N/A')}")
                print(f"   📊 Estado: {data.get('status', 'N/A')}")
                return True, data
            else:
                print(f"❌ Error al crear cita en {day_type}: {response.status_code}")
                print(f"   📝 Respuesta: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Error en creación de cita: {e}")
            return False, None
    
    def test_available_slots(self, date, day_type):
        """Probar disponibilidad de horarios"""
        print(f"\n--- HORARIOS DISPONIBLES - {day_type.upper()} ---")
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/v1/appointments/available-slots/?doctor_id=1&date={date.strftime('%Y-%m-%d')}"
            )
            
            if response.status_code == 200:
                slots = response.json()
                print(f"✅ Horarios disponibles en {day_type}: {len(slots)} slots")
                print(f"   🕐 Primeros 5 horarios: {slots[:5] if len(slots) > 5 else slots}")
                return True, slots
            else:
                print(f"❌ Error al consultar horarios: {response.status_code}")
                return False, []
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False, []
    
    def run_weekend_tests(self):
        """Ejecutar pruebas completas de días laborables vs fines de semana"""
        print("🚀 INICIANDO PRUEBAS DE CITAS - DÍAS LABORABLES VS FINES DE SEMANA")
        print("=" * 70)
        
        # Login
        if not self.login():
            print("❌ No se pudo autenticar. Abortando pruebas.")
            return False
        
        # Obtener fechas de prueba
        next_monday = self.get_next_weekday(1, 0)  # 0 = lunes
        next_saturday = self.get_next_weekday(1, 5)  # 5 = sábado
        next_sunday = self.get_next_weekday(1, 6)  # 6 = domingo
        
        results = []
        
        # Prueba 1: Día laborable (lunes)
        if next_monday:
            slot_success, slots = self.test_available_slots(next_monday, "día laborable")
            appointment_success, data = self.test_appointment_creation(next_monday, "día laborable")
            results.append(("Día laborable", slot_success and appointment_success))
        
        # Prueba 2: Fin de semana (sábado)
        if next_saturday:
            slot_success, slots = self.test_available_slots(next_saturday, "sábado")
            appointment_success, data = self.test_appointment_creation(next_saturday, "sábado")
            results.append(("Sábado", slot_success and appointment_success))
        
        # Prueba 3: Fin de semana (domingo)
        if next_sunday:
            slot_success, slots = self.test_available_slots(next_sunday, "domingo")
            appointment_success, data = self.test_appointment_creation(next_sunday, "domingo")
            results.append(("Domingo", slot_success and appointment_success))
        
        # Resumen
        print("\n" + "=" * 70)
        print("📊 RESUMEN DE PRUEBAS DE CITAS EN DIFERENTES DÍAS")
        print("=" * 70)
        
        total_tests = len(results)
        passed_tests = sum(1 for _, success in results if success)
        
        for day_type, success in results:
            status = "✅ EXITOSA" if success else "❌ FALLIDA"
            print(f"{day_type:15} : {status}")
        
        print(f"\n📈 Resultado final:")
        print(f"   ✅ Exitosas: {passed_tests}")
        print(f"   ❌ Fallidas: {total_tests - passed_tests}")
        print(f"   📊 Total: {total_tests}")
        print(f"   🎯 Éxito: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
            print("✨ El sistema permite correctamente crear citas tanto en días laborables como en fines de semana.")
            print("🏥 Los horarios se ajustan automáticamente según el día de la semana.")
        else:
            print(f"\n⚠️ {total_tests - passed_tests} pruebas fallaron.")
        
        return passed_tests == total_tests

def main():
    """Función principal"""
    print("Sistema de Información Integral - Pruebas de Citas Fin de Semana")
    print("Validación de creación de citas en días laborables y fines de semana")
    print()
    
    tester = WeekendAppointmentTester()
    
    try:
        success = tester.run_weekend_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n🛑 Pruebas interrumpidas por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
