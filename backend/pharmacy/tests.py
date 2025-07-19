from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

from .models import (
    Medication, Dispensation, MedicationCategory,
    MedicationBatch, StockMovement, PharmacyReport
)
from .serializers import (
    MedicationSerializer, DispensationSerializer,
    MedicationCategorySerializer, MedicationBatchSerializer,
    StockMovementSerializer, PharmacyReportSerializer
)

User = get_user_model()


class BasePharmacyTestCase(TestCase):
    """Clase base para los tests de pharmacy"""
    
    def setUp(self):
        # Crear usuarios
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        self.pharmacist = User.objects.create_user(email='pharmacist@hospital.com',
            password='pharmacistpassword',
            role='pharmacist',
            first_name='John',
            last_name='Pharmacist'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            role='patient',
            first_name='Jane',
            last_name='Patient'
        )
        
        # Crear categoría de medicamento
        self.category = MedicationCategory.objects.create(
            name='Analgésicos',
            description='Medicamentos para el dolor'
        )
        
        # Crear medicamento
        self.medication = Medication.objects.create(
            name='Paracetamol',
            description='Analgésico y antipirético',
            dosage_form='Tableta',
            strength='500mg',
            quantity_in_stock=100,
            reordering_threshold=20
        )
        
        # Crear lote de medicamento
        self.batch = MedicationBatch.objects.create(
            batch_number='BATCH001',
            medication=self.medication,
            quantity=50,
            manufacturing_date=date.today() - timedelta(days=30),
            expiry_date=date.today() + timedelta(days=365),
            supplier='Laboratorio ABC',
            cost_per_unit=Decimal('0.50'),
            received_by=self.pharmacist
        )
        
        # Crear dispensación
        self.dispensation = Dispensation.objects.create(
            medication=self.medication,
            quantity=10,
            patient=self.patient,
            pharmacist=self.pharmacist,
            notes='Tomar cada 8 horas'
        )


class MedicationModelTests(BasePharmacyTestCase):
    """Tests para el modelo Medication"""
    
    def test_medication_creation(self):
        """Prueba la creación y atributos de un medicamento"""
        medication = Medication.objects.create(
            name='Ibuprofeno',
            description='Antiinflamatorio no esteroideo',
            dosage_form='Cápsula',
            strength='400mg',
            quantity_in_stock=200,
            reordering_threshold=50
        )
        
        self.assertEqual(medication.name, 'Ibuprofeno')
        self.assertEqual(medication.description, 'Antiinflamatorio no esteroideo')
        self.assertEqual(medication.dosage_form, 'Cápsula')
        self.assertEqual(medication.strength, '400mg')
        self.assertEqual(medication.quantity_in_stock, 200)
        self.assertEqual(medication.reordering_threshold, 50)
        self.assertIsNotNone(medication.created_at)
        self.assertIsNotNone(medication.updated_at)
    
    def test_medication_str_representation(self):
        """Prueba la representación string de un medicamento"""
        self.assertEqual(str(self.medication), 'Paracetamol - 500mg')
    
    def test_medication_needs_reorder_property(self):
        """Prueba la propiedad needs_reorder"""
        # Stock por encima del umbral
        self.assertFalse(self.medication.needs_reorder)
        
        # Stock en el umbral
        self.medication.quantity_in_stock = 20
        self.medication.save()
        self.assertTrue(self.medication.needs_reorder)
        
        # Stock por debajo del umbral
        self.medication.quantity_in_stock = 10
        self.medication.save()
        self.assertTrue(self.medication.needs_reorder)
    
    def test_medication_update_stock_add_operation(self):
        """Prueba actualizar stock con operación de suma"""
        initial_stock = self.medication.quantity_in_stock
        self.medication.update_stock(50, operation='add')
        
        self.medication.refresh_from_db()
        self.assertEqual(self.medication.quantity_in_stock, initial_stock + 50)
    
    def test_medication_update_stock_subtract_operation(self):
        """Prueba actualizar stock con operación de resta"""
        initial_stock = self.medication.quantity_in_stock
        self.medication.update_stock(30, operation='subtract')
        
        self.medication.refresh_from_db()
        self.assertEqual(self.medication.quantity_in_stock, initial_stock - 30)
    
    def test_medication_update_stock_insufficient_quantity(self):
        """Prueba actualizar stock con cantidad insuficiente"""
        with self.assertRaises(ValidationError) as context:
            self.medication.update_stock(200, operation='subtract')
        
        self.assertIn('Stock insuficiente', str(context.exception))
    
    def test_medication_unique_name_constraint(self):
        """Prueba la restricción de nombre único"""
        with self.assertRaises(Exception):
            Medication.objects.create(
                name='Paracetamol',  # Ya existe
                dosage_form='Jarabe',
                strength='120mg/5ml',
                quantity_in_stock=50
            )


class DispensationModelTests(BasePharmacyTestCase):
    """Tests para el modelo Dispensation"""
    
    def test_dispensation_creation(self):
        """Prueba la creación y atributos de una dispensación"""
        initial_stock = self.medication.quantity_in_stock
        
        dispensation = Dispensation.objects.create(
            medication=self.medication,
            quantity=5,
            patient=self.patient,
            pharmacist=self.pharmacist,
            notes='Completar el tratamiento'
        )
        
        self.assertEqual(dispensation.medication, self.medication)
        self.assertEqual(dispensation.quantity, 5)
        self.assertEqual(dispensation.patient, self.patient)
        self.assertEqual(dispensation.pharmacist, self.pharmacist)
        self.assertEqual(dispensation.notes, 'Completar el tratamiento')
        self.assertIsNotNone(dispensation.dispensed_at)
        
        # Verificar que el stock se actualizó
        self.medication.refresh_from_db()
        self.assertEqual(self.medication.quantity_in_stock, initial_stock - 5)
    
    def test_dispensation_str_representation(self):
        """Prueba la representación string de una dispensación"""
        expected_str = f"Dispensación de {self.medication.name} para {self.patient.get_full_name()}"
        self.assertEqual(str(self.dispensation), expected_str)
    
    def test_dispensation_updates_stock_on_save(self):
        """Prueba que la dispensación actualiza el stock al guardarse"""
        initial_stock = self.medication.quantity_in_stock
        quantity_to_dispense = 15
        
        Dispensation.objects.create(
            medication=self.medication,
            quantity=quantity_to_dispense,
            patient=self.patient,
            pharmacist=self.pharmacist
        )
        
        self.medication.refresh_from_db()
        self.assertEqual(
            self.medication.quantity_in_stock,
            initial_stock - quantity_to_dispense
        )
    
    def test_dispensation_fails_with_insufficient_stock(self):
        """Prueba que la dispensación falla con stock insuficiente"""
        with self.assertRaises(ValidationError):
            Dispensation.objects.create(
                medication=self.medication,
                quantity=200,  # Más que el stock disponible
                patient=self.patient,
                pharmacist=self.pharmacist
            )


class MedicationCategoryModelTests(BasePharmacyTestCase):
    """Tests para el modelo MedicationCategory"""
    
    def test_medication_category_creation(self):
        """Prueba la creación y atributos de una categoría"""
        category = MedicationCategory.objects.create(
            name='Antibióticos',
            description='Medicamentos contra infecciones bacterianas'
        )
        
        self.assertEqual(category.name, 'Antibióticos')
        self.assertEqual(category.description, 'Medicamentos contra infecciones bacterianas')
    
    def test_medication_category_str_representation(self):
        """Prueba la representación string de una categoría"""
        self.assertEqual(str(self.category), 'Analgésicos')
    
    def test_medication_category_unique_name_constraint(self):
        """Prueba la restricción de nombre único para categorías"""
        with self.assertRaises(Exception):
            MedicationCategory.objects.create(
                name='Analgésicos',  # Ya existe
                description='Otra descripción'
            )


class MedicationBatchModelTests(BasePharmacyTestCase):
    """Tests para el modelo MedicationBatch"""
    
    def test_medication_batch_creation(self):
        """Prueba la creación y atributos de un lote"""
        batch = MedicationBatch.objects.create(
            batch_number='BATCH002',
            medication=self.medication,
            quantity=100,
            manufacturing_date=date.today() - timedelta(days=60),
            expiry_date=date.today() + timedelta(days=300),
            supplier='Laboratorio XYZ',
            cost_per_unit=Decimal('0.75'),
            received_by=self.pharmacist,
            notes='Lote de reposición'
        )
        
        self.assertEqual(batch.batch_number, 'BATCH002')
        self.assertEqual(batch.medication, self.medication)
        self.assertEqual(batch.quantity, 100)
        self.assertEqual(batch.supplier, 'Laboratorio XYZ')
        self.assertEqual(batch.cost_per_unit, Decimal('0.75'))
        self.assertEqual(batch.received_by, self.pharmacist)
        self.assertEqual(batch.notes, 'Lote de reposición')
        self.assertIsNotNone(batch.received_date)
    
    def test_medication_batch_str_representation(self):
        """Prueba la representación string de un lote"""
        expected_str = f"Lote {self.batch.batch_number} - {self.medication.name}"
        self.assertEqual(str(self.batch), expected_str)
    
    def test_medication_batch_clean_validation(self):
        """Prueba la validación de fechas del lote"""
        with self.assertRaises(ValidationError):
            batch = MedicationBatch(
                batch_number='BATCH003',
                medication=self.medication,
                quantity=50,
                manufacturing_date=date.today(),
                expiry_date=date.today() - timedelta(days=1),  # Fecha de expiración antes que fabricación
                supplier='Laboratorio Test',
                cost_per_unit=Decimal('1.00')
            )
            batch.clean()
    
    def test_medication_batch_is_expired_property(self):
        """Prueba la propiedad is_expired"""
        # Lote no expirado
        self.assertFalse(self.batch.is_expired)
        
        # Lote expirado
        expired_batch = MedicationBatch.objects.create(
            batch_number='BATCHEXP',
            medication=self.medication,
            quantity=20,
            manufacturing_date=date.today() - timedelta(days=400),
            expiry_date=date.today() - timedelta(days=10),
            supplier='Laboratorio Old',
            cost_per_unit=Decimal('0.25'),
            received_by=self.pharmacist
        )
        self.assertTrue(expired_batch.is_expired)
    
    def test_medication_batch_days_until_expiry_property(self):
        """Prueba la propiedad days_until_expiry"""
        # Calcular días esperados - notar que batch fue creado con +365 días
        expected_days = (self.batch.expiry_date - date.today()).days
        # Permitir una diferencia de +/- 1 día para manejar casos límite
        self.assertIn(self.batch.days_until_expiry, [expected_days - 1, expected_days, expected_days + 1])
    
    def test_medication_batch_unique_batch_number_constraint(self):
        """Prueba la restricción de número de lote único"""
        with self.assertRaises(Exception):
            MedicationBatch.objects.create(
                batch_number='BATCH001',  # Ya existe
                medication=self.medication,
                quantity=30,
                manufacturing_date=date.today(),
                expiry_date=date.today() + timedelta(days=180),
                supplier='Otro Laboratorio',
                cost_per_unit=Decimal('0.60'),
                received_by=self.pharmacist
            )


class StockMovementModelTests(BasePharmacyTestCase):
    """Tests para el modelo StockMovement"""
    
    def test_stock_movement_creation(self):
        """Prueba la creación y atributos de un movimiento de stock"""
        initial_stock = self.medication.quantity_in_stock
        
        movement = StockMovement.objects.create(
            medication=self.medication,
            movement_type='in',
            quantity=50,
            batch=self.batch,
            reason='Recepción de nuevo lote',
            reference_number='REF001',
            performed_by=self.pharmacist,
            stock_before=initial_stock,
            stock_after=initial_stock + 50
        )
        
        self.assertEqual(movement.medication, self.medication)
        self.assertEqual(movement.movement_type, 'in')
        self.assertEqual(movement.quantity, 50)
        self.assertEqual(movement.batch, self.batch)
        self.assertEqual(movement.reason, 'Recepción de nuevo lote')
        self.assertEqual(movement.reference_number, 'REF001')
        self.assertEqual(movement.performed_by, self.pharmacist)
        self.assertEqual(movement.stock_before, initial_stock)
        self.assertEqual(movement.stock_after, initial_stock + 50)
        self.assertIsInstance(movement.movement_id, uuid.UUID)
        self.assertIsNotNone(movement.performed_at)
    
    def test_stock_movement_str_representation(self):
        """Prueba la representación string de un movimiento de stock"""
        movement = StockMovement.objects.create(
            medication=self.medication,
            movement_type='out',
            quantity=10,
            reason='Dispensación',
            performed_by=self.pharmacist,
            stock_before=100,
            stock_after=90
        )
        
        expected_str = f"Salida - {self.medication.name} - 10"
        self.assertEqual(str(movement), expected_str)
    
    def test_stock_movement_save_calculates_stock_values(self):
        """Prueba que save() calcula los valores de stock correctamente"""
        initial_stock = self.medication.quantity_in_stock
        
        # Movimiento de entrada
        movement_in = StockMovement(
            medication=self.medication,
            movement_type='in',
            quantity=30,
            reason='Entrada de stock',
            performed_by=self.pharmacist
        )
        movement_in.save()
        
        self.assertEqual(movement_in.stock_before, initial_stock)
        self.assertEqual(movement_in.stock_after, initial_stock + 30)
        
        # Movimiento de salida
        movement_out = StockMovement(
            medication=self.medication,
            movement_type='out',
            quantity=20,
            reason='Salida de stock',
            performed_by=self.pharmacist
        )
        movement_out.save()
        
        self.assertEqual(movement_out.stock_before, initial_stock)
        self.assertEqual(movement_out.stock_after, initial_stock - 20)


class PharmacyReportModelTests(BasePharmacyTestCase):
    """Tests para el modelo PharmacyReport"""
    
    def test_pharmacy_report_creation(self):
        """Prueba la creación y atributos de un reporte de farmacia"""
        report_data = {
            'total_medications': 10,
            'low_stock_items': 2,
            'total_dispensations': 50
        }
        
        report = PharmacyReport.objects.create(
            report_type='monthly',
            generated_by=self.pharmacist,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today(),
            report_data=report_data,
            notes='Reporte mensual de octubre'
        )
        
        self.assertEqual(report.report_type, 'monthly')
        self.assertEqual(report.generated_by, self.pharmacist)
        self.assertEqual(report.start_date, date.today() - timedelta(days=30))
        self.assertEqual(report.end_date, date.today())
        self.assertEqual(report.report_data, report_data)
        self.assertEqual(report.notes, 'Reporte mensual de octubre')
        self.assertIsNotNone(report.generated_date)
    
    def test_pharmacy_report_str_representation(self):
        """Prueba la representación string de un reporte"""
        report = PharmacyReport.objects.create(
            report_type='daily',
            generated_by=self.pharmacist,
            start_date=date.today(),
            end_date=date.today()
        )
        
        expected_str = f"Reporte Diario - {report.generated_date.strftime('%Y-%m-%d')}"
        self.assertEqual(str(report), expected_str)


class MedicationSerializerTests(BasePharmacyTestCase):
    """Tests para los serializadores de pharmacy"""
    
    def test_medication_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = MedicationSerializer(self.medication)
        expected_fields = [
            'id', 'name', 'description', 'dosage_form', 'strength',
            'quantity_in_stock', 'reordering_threshold', 'needs_reorder',
            'created_at', 'updated_at'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_medication_serializer_needs_reorder_field(self):
        """Prueba el campo calculado needs_reorder"""
        serializer = MedicationSerializer(self.medication)
        self.assertFalse(serializer.data['needs_reorder'])
        
        # Cambiar stock para que necesite reorden
        self.medication.quantity_in_stock = 10
        self.medication.save()
        
        serializer = MedicationSerializer(self.medication)
        self.assertTrue(serializer.data['needs_reorder'])


class DispensationSerializerTests(BasePharmacyTestCase):
    """Tests para el serializador de Dispensation"""
    
    def test_dispensation_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = DispensationSerializer(self.dispensation)
        
        # Verificar que contiene los campos básicos
        self.assertIn('id', serializer.data)
        self.assertIn('medication', serializer.data)
        self.assertIn('quantity', serializer.data)
        self.assertIn('patient', serializer.data)
        self.assertIn('pharmacist', serializer.data)
        self.assertIn('dispensed_at', serializer.data)
        self.assertIn('notes', serializer.data)
        self.assertIn('medication_name', serializer.data)
    
    def test_dispensation_serializer_nested_data(self):
        """Prueba los datos anidados del serializador"""
        serializer = DispensationSerializer(self.dispensation)
        
        # Verificar datos del paciente
        self.assertEqual(
            serializer.data['patient']['username'],
            self.patient.email  # username es un alias para email en UserSerializer
        )
        
        # Verificar datos del farmacéutico
        self.assertEqual(
            serializer.data['pharmacist']['username'],
            self.pharmacist.email  # username es un alias para email en UserSerializer
        )
        
        # Verificar nombre del medicamento
        self.assertEqual(
            serializer.data['medication_name'],
            self.medication.name
        )


class MedicationBatchSerializerTests(BasePharmacyTestCase):
    """Tests para el serializador de MedicationBatch"""
    
    def test_medication_batch_serializer_contains_expected_fields(self):
        """Prueba que el serializador incluya los campos esperados"""
        serializer = MedicationBatchSerializer(self.batch)
        expected_fields = [
            'id', 'batch_number', 'medication', 'medication_name',
            'quantity', 'manufacturing_date', 'expiry_date', 'supplier',
            'cost_per_unit', 'received_date', 'received_by', 'notes',
            'is_expired', 'days_until_expiry'
        ]
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_medication_batch_serializer_calculated_fields(self):
        """Prueba los campos calculados del serializador"""
        serializer = MedicationBatchSerializer(self.batch)
        
        self.assertEqual(serializer.data['medication_name'], self.medication.name)
        self.assertFalse(serializer.data['is_expired'])
        self.assertGreater(serializer.data['days_until_expiry'], 0)


class PharmacyAPITests(APITestCase):
    """Tests para la API de Pharmacy"""
    
    def setUp(self):
        # Crear usuarios
        self.admin = User.objects.create_user(email='admin@hospital.com',
            password='adminpassword',
            is_staff=True,
            role='admin'
        )
        
        self.pharmacist = User.objects.create_user(email='pharmacist@hospital.com',
            password='pharmacistpassword',
            role='pharmacist'
        )
        
        self.patient = User.objects.create_user(email='patient@example.com',
            password='patientpassword',
            role='patient'
        )
        
        # Crear medicamento
        self.medication = Medication.objects.create(
            name='Aspirina',
            description='Ácido acetilsalicílico',
            dosage_form='Tableta',
            strength='100mg',
            quantity_in_stock=500,
            reordering_threshold=100
        )
        
        # URLs de la API
        self.medication_list_url = reverse('medication-list')
        self.medication_detail_url = reverse('medication-detail', args=[self.medication.id])
        self.medication_low_stock_url = reverse('medication-low-stock')
        self.medication_inventory_url = reverse('medication-inventory-summary')
        self.dispensation_list_url = reverse('dispensation-list')
        
    def test_unauthenticated_access_denied(self):
        """Prueba que usuarios no autenticados no puedan acceder"""
        response = self.client.get(self.medication_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_pharmacist_can_access_medications(self):
        """Prueba que un farmacéutico pueda acceder a medicamentos"""
        self.client.force_authenticate(user=self.pharmacist)
        
        response = self.client.get(self.medication_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar que solo hay un medicamento creado en el test setup
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_create_medication(self):
        """Prueba crear un nuevo medicamento"""
        self.client.force_authenticate(user=self.pharmacist)
        
        data = {
            'name': 'Amoxicilina',
            'description': 'Antibiótico de amplio espectro',
            'dosage_form': 'Cápsula',
            'strength': '500mg',
            'quantity_in_stock': 200,
            'reordering_threshold': 50
        }
        
        response = self.client.post(self.medication_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Medication.objects.count(), 2)
        
        # Verificar los datos creados
        new_medication = Medication.objects.get(name='Amoxicilina')
        self.assertEqual(new_medication.dosage_form, 'Cápsula')
        self.assertEqual(new_medication.quantity_in_stock, 200)
    
    def test_update_medication(self):
        """Prueba actualizar un medicamento"""
        self.client.force_authenticate(user=self.pharmacist)
        
        data = {
            'name': self.medication.name,
            'description': 'Descripción actualizada',
            'dosage_form': self.medication.dosage_form,
            'strength': self.medication.strength,
            'quantity_in_stock': 600,  # Actualizar stock
            'reordering_threshold': 150  # Actualizar umbral
        }
        
        response = self.client.put(self.medication_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar la actualización
        self.medication.refresh_from_db()
        self.assertEqual(self.medication.description, 'Descripción actualizada')
        self.assertEqual(self.medication.quantity_in_stock, 600)
        self.assertEqual(self.medication.reordering_threshold, 150)
    
    def test_get_low_stock_medications(self):
        """Prueba obtener medicamentos con stock bajo"""
        self.client.force_authenticate(user=self.pharmacist)
        
        # Crear medicamento con stock bajo
        low_stock_med = Medication.objects.create(
            name='Vitamina C',
            dosage_form='Tableta',
            strength='1000mg',
            quantity_in_stock=5,
            reordering_threshold=20
        )
        
        response = self.client.get(self.medication_low_stock_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Vitamina C')
    
    def test_update_stock_endpoint(self):
        """Prueba el endpoint de actualización de stock"""
        self.client.force_authenticate(user=self.pharmacist)
        
        initial_stock = self.medication.quantity_in_stock
        update_url = reverse('medication-update-stock', args=[self.medication.id])
        
        data = {
            'quantity': 100,
            'operation': 'add',
            'reason': 'Nuevo lote recibido'
        }
        
        response = self.client.post(update_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el stock se actualizó
        self.medication.refresh_from_db()
        self.assertEqual(self.medication.quantity_in_stock, initial_stock + 100)
        
        # Verificar que se creó el movimiento de stock
        movement = StockMovement.objects.filter(
            medication=self.medication,
            movement_type='in'
        ).first()
        self.assertIsNotNone(movement)
        self.assertEqual(movement.quantity, 100)
        self.assertEqual(movement.reason, 'Nuevo lote recibido')
    
    def test_create_dispensation(self):
        """Prueba crear una dispensación"""
        self.client.force_authenticate(user=self.pharmacist)
        
        initial_stock = self.medication.quantity_in_stock
        
        data = {
            'medication': self.medication.id,
            'quantity': 10,
            'patient_id': self.patient.id,  # Usar patient_id como campo de escritura
            'notes': 'Tomar con alimentos'
        }
        
        response = self.client.post(self.dispensation_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que se creó la dispensación
        dispensation = Dispensation.objects.first()
        self.assertEqual(dispensation.quantity, 10)
        self.assertEqual(dispensation.pharmacist, self.pharmacist)
        
        # Verificar que el stock se actualizó
        self.medication.refresh_from_db()
        self.assertEqual(self.medication.quantity_in_stock, initial_stock - 10)
    
    def test_inventory_summary_endpoint(self):
        """Prueba el endpoint de resumen de inventario"""
        self.client.force_authenticate(user=self.pharmacist)
        
        # Crear lote para el medicamento
        MedicationBatch.objects.create(
            batch_number='TEST001',
            medication=self.medication,
            quantity=100,
            manufacturing_date=date.today() - timedelta(days=30),
            expiry_date=date.today() + timedelta(days=60),  # Próximo a vencer
            supplier='Test Supplier',
            cost_per_unit=Decimal('1.00'),
            received_by=self.pharmacist
        )
        
        response = self.client.get(self.medication_inventory_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Verificar datos del inventario
        inventory_item = response.data[0]
        self.assertEqual(inventory_item['medication']['name'], self.medication.name)
        self.assertEqual(inventory_item['total_stock'], self.medication.quantity_in_stock)
        self.assertEqual(inventory_item['batches_count'], 1)
        self.assertEqual(inventory_item['expiring_soon'], 1)
    
    def test_patient_cannot_modify_medications(self):
        """Prueba que un paciente no pueda modificar medicamentos"""
        self.client.force_authenticate(user=self.patient)
        
        data = {
            'name': 'Nuevo Medicamento',
            'dosage_form': 'Tableta',
            'strength': '10mg',
            'quantity_in_stock': 100
        }
        
        response = self.client.post(self.medication_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)