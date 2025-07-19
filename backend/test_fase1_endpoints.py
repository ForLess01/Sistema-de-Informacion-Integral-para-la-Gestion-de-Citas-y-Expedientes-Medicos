#!/usr/bin/env python
"""
Script para probar los endpoints implementados en la Fase 1 - Parte 1
Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos
"""

import requests
import json
from datetime import datetime, timedelta
import sys

class APITester:
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
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error en login: {e}")
            return False
    
    def test_endpoint(self, url, method='GET', data=None, expected_status=200):
        """Probar un endpoint específico"""
        full_url = f"{self.base_url}{url}"
        print(f"📡 Probando {method} {url}...")
        
        try:
            if method == 'GET':
                response = self.session.get(full_url)
            elif method == 'POST':
                response = self.session.post(full_url, json=data)
            elif method == 'PUT':
                response = self.session.put(full_url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(full_url)
            
            if response.status_code == expected_status:
                print(f"✅ {method} {url} - Status: {response.status_code}")
                
                # Mostrar algunos datos de respuesta si es JSON
                try:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        print(f"   📊 Datos: {len(data)} elementos")
                        if len(data) <= 3:
                            for i, item in enumerate(data):
                                if isinstance(item, dict):
                                    keys = list(item.keys())[:3]
                                    print(f"     [{i+1}] Campos: {keys}")
                    elif isinstance(data, dict):
                        keys = list(data.keys())[:5]
                        print(f"   📊 Campos: {keys}")
                except:
                    print(f"   📊 Respuesta: {response.text[:100]}...")
                
                return True
            else:
                print(f"❌ {method} {url} - Status: {response.status_code} (esperado: {expected_status})")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error en {method} {url}: {e}")
            return False
    
    def test_appointments_flow(self):
        """Probar el flujo completo de citas"""
        print("\n=== PRUEBA: MÓDULO DE CITAS ===")
        
        tests = [
            # Obtener especialidades
            ("/api/v1/appointments/specialties/", "GET"),
            
            # Obtener doctores por especialidad
            ("/api/v1/appointments/specialties/1/doctors/", "GET"),
            ("/api/v1/appointments/specialties/2/doctors/", "GET"),
            ("/api/v1/appointments/specialties/3/doctors/", "GET"),
            
            # Obtener horarios disponibles
            ("/api/v1/appointments/available-slots/?doctor_id=1&date=2025-08-01", "GET"),
            ("/api/v1/appointments/available-slots/?doctor_id=2&date=2025-08-15", "GET"),
            
            # Obtener citas próximas
            ("/api/v1/appointments/upcoming/", "GET"),
            
            # Listar todas las citas
            ("/api/v1/appointments/", "GET"),
        ]
        
        results = []
        for endpoint, method in tests:
            result = self.test_endpoint(endpoint, method)
            results.append(result)
        
        return results
    
    def test_appointment_creation(self):
        """Probar creación de cita"""
        print("\n=== PRUEBA: CREAR CITA ===")
        
        # Buscar la próxima fecha que sea día laborable (lunes a viernes)
        current_date = datetime.now()
        days_to_add = 1
        while True:
            next_date = current_date + timedelta(days=days_to_add)
            # Si es lunes a viernes (0-4), usar esa fecha
            if next_date.weekday() < 5:  # 0=lunes, 4=viernes
                break
            days_to_add += 1
        
        appointment_data = {
            'patient': 1,  # ID del paciente autenticado
            'doctor': 1,   # ID del doctor
            'appointment_date': next_date.strftime('%Y-%m-%d'),  # Fecha en día laborable
            'appointment_time': '10:00:00',  # Solo la hora
            'reason': 'Consulta de control prenatal',
            'notes': 'Primera consulta'
        }
        
        print(f"   📅 Usando fecha: {next_date.strftime('%Y-%m-%d')} ({next_date.strftime('%A')})")
        
        # Crear cita
        result = self.test_endpoint(
            "/api/v1/appointments/", 
            "POST", 
            appointment_data, 
            201
        )
        
        return result
    
    def test_medical_records_flow(self):
        """Probar el flujo completo de expedientes médicos"""
        print("\n=== PRUEBA: MÓDULO DE EXPEDIENTES MÉDICOS ===")
        
        tests = [
            # Resumen del expediente médico
            ("/api/v1/medical-records/summary/", "GET"),
            
            # Expediente del paciente
            ("/api/v1/medical-records/my-record/", "GET"),
            
            # Historial de diagnósticos
            ("/api/v1/medical-records/diagnoses/", "GET"),
            
            # Historial de prescripciones
            ("/api/v1/medical-records/prescriptions/", "GET"),
            
            # Resultados de exámenes de laboratorio
            ("/api/v1/medical-records/lab-results/", "GET"),
            
            # Alergias
            ("/api/v1/medical-records/allergies/", "GET"),
            
            # Línea de tiempo médica
            ("/api/v1/medical-records/timeline/", "GET"),
            
            # Estadísticas de salud
            ("/api/v1/medical-records/stats/", "GET"),
        ]
        
        results = []
        for endpoint, method in tests:
            result = self.test_endpoint(endpoint, method)
            results.append(result)
        
        return results
    
    def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print("🚀 INICIANDO PRUEBAS DE ENDPOINTS - FASE 1 PARTE 1")
        print("=" * 60)
        
        # Login
        if not self.login():
            print("❌ No se pudo autenticar. Abortando pruebas.")
            return False
        
        # Probar endpoints
        appointments_results = self.test_appointments_flow()
        creation_result = self.test_appointment_creation()
        medical_records_results = self.test_medical_records_flow()
        
        # Resumen
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE PRUEBAS")
        print("=" * 60)
        
        all_results = appointments_results + [creation_result] + medical_records_results
        passed = sum(1 for r in all_results if r)
        total = len(all_results)
        
        print(f"✅ Exitosas: {passed}")
        print(f"❌ Fallidas: {total - passed}")
        print(f"📊 Total: {total}")
        print(f"🎯 Éxito: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
            print("🎯 Los endpoints para la Fase 1 - Parte 1 están funcionando correctamente.")
        else:
            print(f"\n⚠️  {total - passed} pruebas fallaron. Revisar implementación.")
        
        return passed == total

def main():
    """Función principal"""
    print("Sistema de Información Integral - Pruebas Fase 1")
    print("Módulo de Citas e Historial Médico para Pacientes")
    print()
    
    tester = APITester()
    
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n🛑 Pruebas interrumpidas por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
