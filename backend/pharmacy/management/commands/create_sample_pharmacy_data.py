from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from pharmacy.models import Medication, Prescription, StockMovement
from datetime import datetime, timedelta
from django.utils import timezone
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample pharmacy data for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample pharmacy data...'))

        # Create sample medications
        medications_data = [
            {
                'name': 'Paracetamol 500mg',
                'description': 'Analgésico y antipirético',
                'dosage_form': 'Tableta',
                'strength': '500mg',
                'quantity_in_stock': 5,
                'reordering_threshold': 20
            },
            {
                'name': 'Ibuprofeno 200mg',
                'description': 'Antiinflamatorio no esteroideo',
                'dosage_form': 'Cápsula',
                'strength': '200mg',
                'quantity_in_stock': 0,
                'reordering_threshold': 15
            },
            {
                'name': 'Amoxicilina 500mg',
                'description': 'Antibiótico de amplio espectro',
                'dosage_form': 'Cápsula',
                'strength': '500mg',
                'quantity_in_stock': 50,
                'reordering_threshold': 25
            },
            {
                'name': 'Omeprazol 20mg',
                'description': 'Inhibidor de la bomba de protones',
                'dosage_form': 'Cápsula',
                'strength': '20mg',
                'quantity_in_stock': 8,
                'reordering_threshold': 30
            },
            {
                'name': 'Losartán 50mg',
                'description': 'Antagonista de los receptores de angiotensina',
                'dosage_form': 'Tableta',
                'strength': '50mg',
                'quantity_in_stock': 100,
                'reordering_threshold': 40
            },
        ]

        for med_data in medications_data:
            medication, created = Medication.objects.get_or_create(
                name=med_data['name'],
                defaults=med_data
            )
            if created:
                self.stdout.write(f'Created medication: {medication.name}')

        # Create sample patients and doctors if they don't exist
        try:
            patient = User.objects.filter(role='patient').first()
            if not patient:
                patient = User.objects.create_user(
                    email='patient@example.com',
                    password='password123',
                    first_name='Juan',
                    last_name='Pérez',
                    role='patient'
                )
                self.stdout.write('Created sample patient')

            doctor = User.objects.filter(role='doctor').first()
            if not doctor:
                doctor = User.objects.create_user(
                    email='doctor@example.com',
                    password='password123',
                    first_name='Dr. María',
                    last_name='González',
                    role='doctor'
                )
                self.stdout.write('Created sample doctor')

        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Error creating users: {e}'))
            # Use existing users or create simple ones
            patient = User.objects.filter(role='patient').first()
            doctor = User.objects.filter(role='doctor').first()

        if patient and doctor:
            # Create sample prescriptions
            medications = Medication.objects.all()[:3]
            for i in range(3):
                prescription, created = Prescription.objects.get_or_create(
                    patient=patient,
                    doctor=doctor,
                    diagnosis=f'Diagnóstico de ejemplo {i+1}',
                    defaults={
                        'status': 'pending',
                        'notes': f'Notas de prescripción {i+1}',
                    }
                )
                if created:
                    self.stdout.write(f'Created prescription: {prescription.id}')

        # Create sample stock movements
        medications = Medication.objects.all()
        pharmacist = User.objects.filter(role='pharmacist').first()
        
        if not pharmacist:
            pharmacist = User.objects.filter(is_staff=True).first()

        for medication in medications[:3]:
            # Create some recent movements
            for i in range(2):
                movement_type = random.choice(['in', 'out'])
                quantity = random.randint(5, 20)
                
                # Calculate stock before and after
                stock_before = medication.quantity_in_stock
                if movement_type == 'in':
                    stock_after = stock_before + quantity
                else:
                    stock_after = max(0, stock_before - quantity)
                    quantity = min(quantity, stock_before)  # Don't remove more than available

                if quantity > 0:  # Only create movement if there's actual quantity to move
                    StockMovement.objects.create(
                        medication=medication,
                        movement_type=movement_type,
                        quantity=quantity if movement_type == 'in' else -quantity,
                        reason=f'Movimiento de prueba - {movement_type}',
                        performed_by=pharmacist,
                        stock_before=stock_before,
                        stock_after=stock_after,
                        performed_at=timezone.now() - timedelta(minutes=random.randint(10, 120))
                    )
                    self.stdout.write(f'Created stock movement for {medication.name}')

        self.stdout.write(self.style.SUCCESS('Sample pharmacy data created successfully!'))
