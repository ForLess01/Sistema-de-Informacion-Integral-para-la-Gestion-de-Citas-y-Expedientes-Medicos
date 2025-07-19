"""
Tests de rendimiento y carga para el sistema
"""
import time
import random
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from decimal import Decimal
from django.test import override_settings
from django.db import connection, transaction
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient

from tests.base import IntegrationTestCase, TestUtils
from authentication.models import User
from appointments.models import Appointment, Specialty, MedicalSchedule
from medical_records.models import MedicalRecord, VitalSigns, Allergy
from pharmacy.models import Medication, Dispensation, StockMovement
from emergency.models import EmergencyCase, TriageAssessment
from notifications.models import Notification
from reports.models import GeneratedReport


class DatabasePerformanceTests(IntegrationTestCase):
    """Tests de rendimiento de base de datos"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    def test_bulk_user_creation_performance(self):
        """Test de creación masiva de usuarios"""
        start_time = time.time()
        
        # Crear 1000 usuarios
        users = []
        for i in range(1000):
            user = User(
                username=f'user_{i}',
                email=f'user{i}@test.com',
                first_name=f'First{i}',
                last_name=f'Last{i}',
                role='patient',
                is_active=True
            )
            user.set_password('TestPass123!')
            users.append(user)
            
        # Bulk create
        User.objects.bulk_create(users)
        
        end_time = time.time()
        elapsed = end_time - start_time
        
        # Verificar
        self.assertEqual(User.objects.filter(username__startswith='user_').count(), 1000)
        
        # Debe tomar menos de 5 segundos
        self.assertLess(elapsed, 5.0)
        
        # Limpiar
        User.objects.filter(username__startswith='user_').delete()
        
    def test_complex_query_performance(self):
        """Test de consultas complejas con JOINs"""
        # Crear datos de prueba
        doctors = []
        for i in range(10):
            doctor = self.test_utils.create_doctor(f'doctor_{i}')
            doctors.append(doctor)
            
        patients = []
        for i in range(100):
            patient = self.test_utils.create_patient(f'patient_{i}')
            patients.append(patient)
            
        # Crear citas
        appointments = []
        for i in range(500):
            appointment = Appointment(
                patient=random.choice(patients),
                doctor=random.choice(doctors),
                appointment_date=timezone.now() + timedelta(days=random.randint(1, 30)),
                reason=f'Consulta {i}',
                status=random.choice(['scheduled', 'confirmed', 'completed', 'cancelled'])
            )
            appointments.append(appointment)
            
        Appointment.objects.bulk_create(appointments)
        
        # Test de query compleja
        start_time = time.time()
        
        # Query con múltiples JOINs y agregaciones
        results = Appointment.objects.select_related(
            'patient', 'doctor', 'specialty'
        ).prefetch_related(
            'patient__medical_record__vital_signs',
            'patient__medical_record__allergies'
        ).filter(
            appointment_date__gte=timezone.now(),
            status__in=['scheduled', 'confirmed']
        ).values('doctor__username').annotate(
            total_appointments=models.Count('id'),
            avg_per_day=models.Count('id') / 30
        ).order_by('-total_appointments')
        
        # Forzar evaluación
        list(results)
        
        end_time = time.time()
        elapsed = end_time - start_time
        
        # Debe ejecutarse en menos de 1 segundo
        self.assertLess(elapsed, 1.0)
        
    def test_pagination_performance(self):
        """Test de rendimiento de paginación"""
        # Crear muchos registros
        for i in range(10000):
            User.objects.create_user(
                username=f'page_user_{i}',
                email=f'page{i}@test.com',
                password='Pass123!',
                role='patient'
            )
            
        # Test de diferentes tamaños de página
        page_sizes = [10, 50, 100, 500]
        
        for page_size in page_sizes:
            start_time = time.time()
            
            # Obtener primera página
            patients = User.objects.filter(
                role='patient'
            ).order_by('id')[0:page_size]
            
            # Forzar evaluación
            list(patients)
            
            end_time = time.time()
            elapsed = end_time - start_time
            
            # Cualquier página debe cargarse en menos de 0.5 segundos
            self.assertLess(elapsed, 0.5)
            
        # Limpiar
        User.objects.filter(username__startswith='page_user_').delete()
        
    def test_index_effectiveness(self):
        """Test de efectividad de índices"""
        # Crear datos
        for i in range(5000):
            medical_record = MedicalRecord.objects.create(
                patient=self.test_utils.create_patient(f'idx_patient_{i}'),
                blood_type=random.choice(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
                emergency_contact_name=f'Contact {i}',
                emergency_contact_phone=f'+123{i:07d}'
            )
            
        # Test de búsqueda por blood_type (debe tener índice)
        start_time = time.time()
        o_positive = MedicalRecord.objects.filter(blood_type='O+').count()
        end_time = time.time()
        
        # Con índice debe ser muy rápido
        self.assertLess(end_time - start_time, 0.1)
        self.assertGreater(o_positive, 0)
        
        # Test de búsqueda por fecha (campos con índice)
        start_time = time.time()
        recent = MedicalRecord.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=1)
        ).count()
        end_time = time.time()
        
        self.assertLess(end_time - start_time, 0.1)
        
    def test_transaction_performance(self):
        """Test de rendimiento de transacciones"""
        doctor = self.test_utils.create_doctor('trans_doctor')
        
        # Test de transacción simple
        start_time = time.time()
        
        with transaction.atomic():
            patient = self.test_utils.create_patient('trans_patient')
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=timezone.now() + timedelta(days=1),
                reason='Consulta transaccional'
            )
            medical_record = MedicalRecord.objects.create(
                patient=patient,
                blood_type='A+',
                emergency_contact_name='Contact',
                emergency_contact_phone='+1234567890'
            )
            
        end_time = time.time()
        elapsed = end_time - start_time
        
        # Transacción simple debe ser rápida
        self.assertLess(elapsed, 0.5)
        
        # Test de transacción compleja con múltiples operaciones
        start_time = time.time()
        
        with transaction.atomic():
            # Crear 50 citas en una transacción
            for i in range(50):
                patient = self.test_utils.create_patient(f'bulk_trans_{i}')
                Appointment.objects.create(
                    patient=patient,
                    doctor=doctor,
                    appointment_date=timezone.now() + timedelta(days=i),
                    reason=f'Consulta {i}'
                )
                
        end_time = time.time()
        elapsed = end_time - start_time
        
        # Incluso con 50 operaciones, debe ser razonable
        self.assertLess(elapsed, 3.0)


class APIPerformanceTests(IntegrationTestCase):
    """Tests de rendimiento de API"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123!'
        )
        
    def test_api_response_time(self):
        """Test de tiempo de respuesta de endpoints"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear algunos datos
        for i in range(100):
            self.test_utils.create_patient(f'api_patient_{i}')
            
        endpoints = [
            '/api/users/',
            '/api/appointments/',
            '/api/medical-records/',
            '/api/medications/',
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            response = self.client.get(endpoint)
            end_time = time.time()
            
            elapsed = end_time - start_time
            
            # Cada endpoint debe responder en menos de 1 segundo
            self.assertLess(elapsed, 1.0)
            self.assertEqual(response.status_code, 200)
            
    def test_concurrent_api_requests(self):
        """Test de requests concurrentes a la API"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear datos de prueba
        doctor = self.test_utils.create_doctor('api_doctor')
        patients = []
        for i in range(20):
            patient = self.test_utils.create_patient(f'concurrent_{i}')
            patients.append(patient)
            
        def make_appointment_request(patient_id):
            """Hacer request para crear cita"""
            client = APIClient()
            client.force_authenticate(user=self.admin)
            
            data = {
                'patient': patient_id,
                'doctor': doctor.id,
                'appointment_date': (timezone.now() + timedelta(days=random.randint(1, 30))).isoformat(),
                'reason': 'Consulta concurrente'
            }
            
            start = time.time()
            response = client.post('/api/appointments/', data, format='json')
            end = time.time()
            
            return {
                'status': response.status_code,
                'time': end - start,
                'patient_id': patient_id
            }
            
        # Ejecutar requests concurrentes
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for patient in patients:
                future = executor.submit(make_appointment_request, patient.id)
                futures.append(future)
                
            results = []
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                
        end_time = time.time()
        total_time = end_time - start_time
        
        # Verificar resultados
        successful = [r for r in results if r['status'] == 201]
        self.assertGreaterEqual(len(successful), 15)  # Al menos 75% exitosos
        
        # El tiempo total debe ser mucho menor que la suma de tiempos individuales
        sum_individual = sum(r['time'] for r in results)
        self.assertLess(total_time, sum_individual / 2)  # Beneficio de concurrencia
        
    def test_api_pagination_performance(self):
        """Test de rendimiento de paginación en API"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear muchos registros
        medications = []
        for i in range(1000):
            med = Medication(
                name=f'Medication {i}',
                generic_name=f'Generic {i}',
                presentation='Tablets',
                quantity_per_unit=30,
                unit_price=Decimal(f'{random.uniform(5, 100):.2f}')
            )
            medications.append(med)
            
        Medication.objects.bulk_create(medications)
        
        # Test de diferentes tamaños de página
        test_cases = [
            {'page_size': 10, 'max_time': 0.5},
            {'page_size': 50, 'max_time': 0.7},
            {'page_size': 100, 'max_time': 1.0},
        ]
        
        for test in test_cases:
            start_time = time.time()
            response = self.client.get(
                f'/api/medications/?page=1&page_size={test["page_size"]}'
            )
            end_time = time.time()
            
            elapsed = end_time - start_time
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.data['results']), test['page_size'])
            self.assertLess(elapsed, test['max_time'])
            
    def test_api_filtering_performance(self):
        """Test de rendimiento de filtrado en API"""
        self.client.force_authenticate(user=self.admin)
        
        # Crear citas con diferentes estados
        doctor = self.test_utils.create_doctor('filter_doctor')
        statuses = ['scheduled', 'confirmed', 'completed', 'cancelled']
        
        appointments = []
        for i in range(2000):
            patient = self.test_utils.create_patient(f'filter_patient_{i}')
            appointment = Appointment(
                patient=patient,
                doctor=doctor,
                appointment_date=timezone.now() + timedelta(days=random.randint(-30, 30)),
                reason=f'Consulta {i}',
                status=random.choice(statuses)
            )
            appointments.append(appointment)
            
        Appointment.objects.bulk_create(appointments)
        
        # Test de filtrado por estado
        for status in statuses:
            start_time = time.time()
            response = self.client.get(f'/api/appointments/?status={status}')
            end_time = time.time()
            
            elapsed = end_time - start_time
            
            self.assertEqual(response.status_code, 200)
            self.assertLess(elapsed, 1.0)
            
            # Verificar que los resultados son correctos
            for appointment in response.data['results']:
                self.assertEqual(appointment['status'], status)


class CachePerformanceTests(IntegrationTestCase):
    """Tests de rendimiento de caché"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        cache.clear()
        
    @override_settings(CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    })
    def test_cache_effectiveness(self):
        """Test de efectividad del caché"""
        # Crear datos costosos de calcular
        doctors = []
        for i in range(20):
            doctor = self.test_utils.create_doctor(f'cache_doctor_{i}')
            doctors.append(doctor)
            
        # Crear muchas citas
        for doctor in doctors:
            for i in range(50):
                patient = self.test_utils.create_patient(f'cache_patient_{doctor.id}_{i}')
                Appointment.objects.create(
                    patient=patient,
                    doctor=doctor,
                    appointment_date=timezone.now() + timedelta(days=random.randint(1, 30)),
                    status=random.choice(['scheduled', 'confirmed', 'completed'])
                )
                
        # Función costosa que debe ser cacheada
        def get_doctor_statistics(doctor_id):
            doctor = User.objects.get(id=doctor_id, role='doctor')
            stats = {
                'total_appointments': doctor.doctor_appointments.count(),
                'completed': doctor.doctor_appointments.filter(status='completed').count(),
                'scheduled': doctor.doctor_appointments.filter(status='scheduled').count(),
                'patients': doctor.doctor_appointments.values('patient').distinct().count(),
            }
            return stats
            
        # Primera llamada (sin caché)
        doctor = doctors[0]
        
        start_time = time.time()
        stats1 = get_doctor_statistics(doctor.id)
        end_time = time.time()
        
        first_call_time = end_time - start_time
        
        # Guardar en caché
        cache_key = f'doctor_stats_{doctor.id}'
        cache.set(cache_key, stats1, 300)  # 5 minutos
        
        # Segunda llamada (con caché)
        start_time = time.time()
        stats2 = cache.get(cache_key)
        if not stats2:
            stats2 = get_doctor_statistics(doctor.id)
        end_time = time.time()
        
        cached_call_time = end_time - start_time
        
        # La llamada con caché debe ser mucho más rápida
        self.assertLess(cached_call_time, first_call_time / 10)
        self.assertEqual(stats1, stats2)
        
    def test_cache_invalidation_performance(self):
        """Test de rendimiento de invalidación de caché"""
        # Llenar caché con muchas entradas
        start_time = time.time()
        
        for i in range(1000):
            cache.set(f'test_key_{i}', f'value_{i}', 300)
            
        end_time = time.time()
        set_time = end_time - start_time
        
        # Invalidación selectiva
        start_time = time.time()
        
        for i in range(0, 1000, 2):  # Invalidar la mitad
            cache.delete(f'test_key_{i}')
            
        end_time = time.time()
        delete_time = end_time - start_time
        
        # La invalidación debe ser rápida
        self.assertLess(delete_time, set_time)
        
        # Verificar que las entradas correctas fueron eliminadas
        for i in range(0, 1000, 2):
            self.assertIsNone(cache.get(f'test_key_{i}'))
            
        for i in range(1, 1000, 2):
            self.assertIsNotNone(cache.get(f'test_key_{i}'))


class LoadTests(IntegrationTestCase):
    """Tests de carga del sistema"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    def test_system_under_load(self):
        """Test del sistema bajo carga simulada"""
        # Crear usuarios base
        doctors = []
        for i in range(5):
            doctor = self.test_utils.create_doctor(f'load_doctor_{i}')
            doctors.append(doctor)
            
        # Simular carga de múltiples operaciones simultáneas
        def simulate_user_activity(user_id):
            """Simular actividad de un usuario"""
            operations = []
            
            try:
                # Crear paciente
                patient = User.objects.create_user(
                    username=f'load_patient_{user_id}',
                    email=f'load{user_id}@test.com',
                    password='Pass123!',
                    role='patient'
                )
                operations.append('create_patient')
                
                # Crear expediente médico
                medical_record = MedicalRecord.objects.create(
                    patient=patient,
                    blood_type=random.choice(['A+', 'B+', 'O+', 'AB+']),
                    emergency_contact_name=f'Contact {user_id}',
                    emergency_contact_phone=f'+123{user_id:07d}'
                )
                operations.append('create_medical_record')
                
                # Agendar cita
                appointment = Appointment.objects.create(
                    patient=patient,
                    doctor=random.choice(doctors),
                    appointment_date=timezone.now() + timedelta(days=random.randint(1, 30)),
                    reason='Consulta de carga'
                )
                operations.append('create_appointment')
                
                # Agregar signos vitales
                VitalSigns.objects.create(
                    medical_record=medical_record,
                    blood_pressure_systolic=random.randint(110, 140),
                    blood_pressure_diastolic=random.randint(70, 90),
                    heart_rate=random.randint(60, 100),
                    temperature=random.uniform(36, 37.5)
                )
                operations.append('create_vital_signs')
                
                return {'user_id': user_id, 'success': True, 'operations': operations}
                
            except Exception as e:
                return {'user_id': user_id, 'success': False, 'error': str(e)}
                
        # Ejecutar carga simulada
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = []
            for i in range(100):  # 100 usuarios simultáneos
                future = executor.submit(simulate_user_activity, i)
                futures.append(future)
                
            results = []
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                
        end_time = time.time()
        total_time = end_time - start_time
        
        # Análisis de resultados
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        # Al menos 90% de éxito bajo carga
        success_rate = len(successful) / len(results)
        self.assertGreaterEqual(success_rate, 0.9)
        
        # Tiempo total razonable (menos de 30 segundos para 100 usuarios)
        self.assertLess(total_time, 30)
        
        # Verificar integridad de datos
        patient_count = User.objects.filter(username__startswith='load_patient_').count()
        self.assertGreaterEqual(patient_count, len(successful) * 0.95)
        
    def test_database_connection_pool(self):
        """Test del pool de conexiones bajo carga"""
        def check_connection():
            """Verificar conexión a base de datos"""
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                return result[0] == 1
                
        # Simular muchas conexiones concurrentes
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = []
            for i in range(200):
                future = executor.submit(check_connection)
                futures.append(future)
                
            results = []
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                
        end_time = time.time()
        elapsed = end_time - start_time
        
        # Todas las conexiones deben ser exitosas
        self.assertTrue(all(results))
        
        # Debe manejar 200 conexiones en menos de 5 segundos
        self.assertLess(elapsed, 5.0)


class MemoryPerformanceTests(IntegrationTestCase):
    """Tests de uso de memoria"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    def test_large_queryset_memory_usage(self):
        """Test de uso de memoria con querysets grandes"""
        # Crear muchos registros
        users = []
        for i in range(5000):
            user = User(
                username=f'mem_user_{i}',
                email=f'mem{i}@test.com',
                password='Pass123!',
                role='patient'
            )
            users.append(user)
            
        User.objects.bulk_create(users)
        
        # Test de iteración eficiente
        start_time = time.time()
        
        # Usar iterator() para eficiencia de memoria
        count = 0
        for user in User.objects.filter(username__startswith='mem_user_').iterator(chunk_size=100):
            count += 1
            # Simular procesamiento
            _ = user.username
            
        end_time = time.time()
        elapsed = end_time - start_time
        
        self.assertEqual(count, 5000)
        self.assertLess(elapsed, 5.0)
        
        # Limpiar
        User.objects.filter(username__startswith='mem_user_').delete()
        
    def test_select_related_vs_prefetch_related(self):
        """Test comparativo de select_related vs prefetch_related"""
        # Crear estructura de datos
        specialty = Specialty.objects.create(
            name='Test Specialty',
            description='For performance testing'
        )
        
        doctor = self.test_utils.create_doctor('perf_doctor')
        
        # Crear muchas citas con relaciones
        for i in range(100):
            patient = self.test_utils.create_patient(f'perf_patient_{i}')
            
            medical_record = MedicalRecord.objects.create(
                patient=patient,
                blood_type='O+',
                emergency_contact_name=f'Contact {i}',
                emergency_contact_phone=f'+123{i:07d}'
            )
            
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                specialty=specialty,
                appointment_date=timezone.now() + timedelta(days=i),
                reason=f'Consulta {i}'
            )
            
            # Agregar alergias
            for j in range(3):
                Allergy.objects.create(
                    medical_record=medical_record,
                    allergen=f'Allergen {j}',
                    severity='moderate'
                )
                
        # Test 1: Sin optimización (N+1 problem)
        start_time = time.time()
        appointments = Appointment.objects.filter(doctor=doctor)
        
        data = []
        for appointment in appointments:
            data.append({
                'patient': appointment.patient.username,
                'blood_type': appointment.patient.medical_record.blood_type,
                'allergies': list(appointment.patient.medical_record.allergies.values_list('allergen', flat=True))
            })
            
        end_time = time.time()
        no_optimization_time = end_time - start_time
        
        # Test 2: Con select_related y prefetch_related
        start_time = time.time()
        appointments = Appointment.objects.filter(doctor=doctor).select_related(
            'patient__medical_record'
        ).prefetch_related(
            'patient__medical_record__allergies'
        )
        
        data = []
        for appointment in appointments:
            data.append({
                'patient': appointment.patient.username,
                'blood_type': appointment.patient.medical_record.blood_type,
                'allergies': list(appointment.patient.medical_record.allergies.values_list('allergen', flat=True))
            })
            
        end_time = time.time()
        optimized_time = end_time - start_time
        
        # La versión optimizada debe ser significativamente más rápida
        self.assertLess(optimized_time, no_optimization_time / 2)


class AsyncPerformanceTests(IntegrationTestCase):
    """Tests de rendimiento de operaciones asíncronas"""
    
    def setUp(self):
        super().setUp()
        self.test_utils = TestUtils()
        
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_async_notification_performance(self):
        """Test de rendimiento de notificaciones asíncronas"""
        # Crear muchos usuarios
        users = []
        for i in range(100):
            user = self.test_utils.create_patient(f'async_patient_{i}')
            users.append(user)
            
        # Simular envío masivo de notificaciones
        start_time = time.time()
        
        notifications = []
        for user in users:
            notification = Notification(
                user=user,
                title='Notificación de prueba',
                message='Este es un mensaje de prueba para rendimiento',
                notification_type='general',
                priority='normal'
            )
            notifications.append(notification)
            
        Notification.objects.bulk_create(notifications)
        
        # Simular procesamiento asíncrono
        # En producción esto sería manejado por Celery
        for notification in notifications:
            # Simular envío de email/SMS
            time.sleep(0.001)  # Simular latencia mínima
            
        end_time = time.time()
        elapsed = end_time - start_time
        
        # Debe completarse en tiempo razonable
        self.assertLess(elapsed, 5.0)
        
        # Verificar que todas las notificaciones fueron creadas
        self.assertEqual(
            Notification.objects.filter(user__username__startswith='async_patient_').count(),
            100
        )
        
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_async_report_generation_performance(self):
        """Test de rendimiento de generación asíncrona de reportes"""
        # Crear datos para reportes
        doctors = []
        for i in range(10):
            doctor = self.test_utils.create_doctor(f'report_doctor_{i}')
            doctors.append(doctor)
            
        # Crear muchas citas
        appointments = []
        for i in range(1000):
            patient = self.test_utils.create_patient(f'report_patient_{i}')
            appointment = Appointment(
                patient=patient,
                doctor=random.choice(doctors),
                appointment_date=timezone.now() - timedelta(days=random.randint(0, 90)),
                status=random.choice(['completed', 'cancelled', 'no_show']),
                reason=f'Consulta {i}'
            )
            appointments.append(appointment)
            
        Appointment.objects.bulk_create(appointments)
        
        # Generar reporte
        start_time = time.time()
        
        report = Report.objects.create(
            name='Reporte de Rendimiento',
            report_type='appointments',
            generated_by=doctors[0],
            parameters={
                'start_date': (timezone.now() - timedelta(days=90)).isoformat(),
                'end_date': timezone.now().isoformat()
            }
        )
        
        # Simular generación de reporte
        report_data = {
            'total_appointments': Appointment.objects.count(),
            'by_status': {},
            'by_doctor': {},
            'by_month': {}
        }
        
        # Agregaciones
        for status in ['completed', 'cancelled', 'no_show']:
            report_data['by_status'][status] = Appointment.objects.filter(status=status).count()
            
        for doctor in doctors:
            report_data['by_doctor'][doctor.username] = {
                'total': doctor.doctor_appointments.count(),
                'completed': doctor.doctor_appointments.filter(status='completed').count()
            }
            
        report.data = report_data
        report.status = 'completed'
        report.save()
        
        end_time = time.time()
        elapsed = end_time - start_time
        
        # La generación debe ser rápida incluso con muchos datos
        self.assertLess(elapsed, 3.0)
        
        # Verificar integridad del reporte
        self.assertEqual(report.status, 'completed')
        self.assertEqual(report.data['total_appointments'], 1000)


if __name__ == '__main__':
    import django
    from django.test import TestCase
    django.setup()
    TestCase.main()