from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, date, timedelta
from .models import (MedicalRecord, Allergy, Prescription, LabTest, VitalSigns, MedicalDocument)
from .serializers import (
    MedicalRecordSerializer, AllergySerializer, PrescriptionSerializer,
    LabTestSerializer, VitalSignsSerializer, MedicalDocumentSerializer, MedicalSummarySerializer)


class MedicalRecordViewSet(viewsets.ViewSet):
    """ViewSet para manejar expedientes médicos"""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Listar expedientes médicos del paciente"""
        user = request.user
        if hasattr(user, 'role') and user.role == 'patient':
            records = MedicalRecord.objects.filter(patient=user)
        else:
            records = MedicalRecord.objects.all()
        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Obtener un expediente médico específico"""
        record = get_object_or_404(MedicalRecord, pk=pk)
        serializer = MedicalRecordSerializer(record)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Obtener resumen del expediente médico"""
        user = request.user
        
        # Datos de ejemplo para demostración
        summary = {
            'patient_name': user.get_full_name() if user.get_full_name() else 'Paciente',
            'blood_type': 'O+',
            'age': 28,
            'allergies_count': 0,
            'active_prescriptions': 2,
            'pending_lab_results': 1,
            'last_visit': (datetime.now() - timedelta(days=15)).isoformat(),
            'total_visits': 8,
            'total_records': 12,
            'recent_vital_signs': {
                'blood_pressure': '120/80',
                'heart_rate': 72,
                'temperature': 36.5,
                'weight': 70.5,
                'height': 175
            }
        }
        serializer = MedicalSummarySerializer(summary)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-record')
    def my_record(self, request):
        """Obtener expediente médico del paciente autenticado"""
        user = request.user
        
        # Datos de ejemplo
        record_data = {
            'patient_name': user.get_full_name() if user.get_full_name() else 'Paciente',
            'blood_type': 'O+',
            'age': 28,
            'height': 175,
            'weight': 70.5,
            'emergency_contact': 'María González - 987654321',
            'created_at': datetime.now().isoformat()
        }
        
        return Response(record_data)
    
    @action(detail=False, methods=['get'])
    def diagnoses(self, request):
        """Obtener historial de diagnósticos"""
        diagnoses_data = [
            {
                'id': 1,
                'condition': 'Hipertensión Arterial',
                'description': 'Presión arterial elevada persistente. Se recomienda control periódico y medicación.',
                'date': (datetime.now() - timedelta(days=30)).isoformat(),
                'doctor_name': 'Dr. Roberto Silva',
                'status': 'active',
                'severity': 'moderate'
            },
            {
                'id': 2,
                'condition': 'Gastritis',
                'description': 'Inflamación de la mucosa gástrica. Tratamiento completado satisfactoriamente.',
                'date': (datetime.now() - timedelta(days=90)).isoformat(),
                'doctor_name': 'Dr. Juan Pérez',
                'status': 'resolved',
                'severity': 'mild'
            },
            {
                'id': 3,
                'condition': 'Control Prenatal',
                'description': 'Seguimiento rutinario del embarazo. Todos los parámetros normales.',
                'date': (datetime.now() - timedelta(days=15)).isoformat(),
                'doctor_name': 'Dra. María González',
                'status': 'active',
                'severity': 'low'
            }
        ]
        
        return Response(diagnoses_data)
    
    @action(detail=False, methods=['get'])
    def prescriptions(self, request):
        """Obtener historial de prescripciones"""
        prescriptions_data = [
            {
                'id': 1,
                'medication_name': 'Losartán',
                'dosage': '50mg',
                'frequency': 'Una vez al día',
                'instructions': 'Tomar por la mañana, preferiblemente con el desayuno.',
                'start_date': (datetime.now() - timedelta(days=30)).isoformat(),
                'end_date': (datetime.now() + timedelta(days=60)).isoformat(),
                'doctor_name': 'Dr. Roberto Silva',
                'status': 'active'
            },
            {
                'id': 2,
                'medication_name': 'Ácido Fólico',
                'dosage': '5mg',
                'frequency': 'Una vez al día',
                'instructions': 'Tomar durante el embarazo según indicación médica.',
                'start_date': (datetime.now() - timedelta(days=60)).isoformat(),
                'end_date': (datetime.now() + timedelta(days=180)).isoformat(),
                'doctor_name': 'Dra. María González',
                'status': 'active'
            },
            {
                'id': 3,
                'medication_name': 'Omeprazol',
                'dosage': '20mg',
                'frequency': 'Una vez al día',
                'instructions': 'Tomar 30 minutos antes del desayuno durante 4 semanas.',
                'start_date': (datetime.now() - timedelta(days=90)).isoformat(),
                'end_date': (datetime.now() - timedelta(days=60)).isoformat(),
                'doctor_name': 'Dr. Juan Pérez',
                'status': 'completed'
            }
        ]
        
        return Response(prescriptions_data)
    
    @action(detail=False, methods=['get'], url_path='lab-results')
    def lab_results(self, request):
        """Obtener resultados de exámenes de laboratorio"""
        lab_results_data = [
            {
                'id': 1,
                'test_name': 'Hemograma Completo',
                'result_summary': 'Valores dentro de rangos normales. Hemoglobina: 14.2 g/dL',
                'date': (datetime.now() - timedelta(days=20)).isoformat(),
                'doctor_name': 'Dr. Roberto Silva',
                'status': 'completed',
                'test_type': 'blood'
            },
            {
                'id': 2,
                'test_name': 'Perfil Lipídico',
                'result_summary': 'Colesterol total ligeramente elevado: 210 mg/dL',
                'date': (datetime.now() - timedelta(days=45)).isoformat(),
                'doctor_name': 'Dr. Roberto Silva',
                'status': 'completed',
                'test_type': 'blood'
            },
            {
                'id': 3,
                'test_name': 'Ecografía Obstétrica',
                'result_summary': 'Desarrollo fetal normal. Edad gestacional: 20 semanas',
                'date': (datetime.now() - timedelta(days=10)).isoformat(),
                'doctor_name': 'Dra. María González',
                'status': 'completed',
                'test_type': 'imaging'
            },
            {
                'id': 4,
                'test_name': 'Glucosa en Ayunas',
                'result_summary': 'Pendiente de realización',
                'date': datetime.now().isoformat(),
                'doctor_name': 'Dr. Roberto Silva',
                'status': 'pending',
                'test_type': 'blood'
            }
        ]
        
        return Response(lab_results_data)
    
    @action(detail=False, methods=['get'])
    def allergies(self, request):
        """Obtener alergias del paciente"""
        allergies_data = [
            {
                'id': 1,
                'name': 'Penicilina',
                'severity': 'severe',
                'reaction': 'Erupción cutánea y dificultad respiratoria',
                'discovered_date': (datetime.now() - timedelta(days=365)).isoformat()
            }
        ]
        
        return Response(allergies_data)
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """Obtener línea de tiempo médica"""
        timeline_data = [
            {
                'id': 1,
                'title': 'Control Prenatal',
                'description': 'Consulta de rutina. Presión arterial normal, peso adecuado.',
                'date': (datetime.now() - timedelta(days=15)).isoformat(),
                'doctor': 'María González',
                'specialty': 'Ginecología y Obstetricia',
                'type': 'consultation'
            },
            {
                'id': 2,
                'title': 'Consulta Cardiológica',
                'description': 'Evaluación de hipertensión. Ajuste de medicación.',
                'date': (datetime.now() - timedelta(days=30)).isoformat(),
                'doctor': 'Roberto Silva',
                'specialty': 'Medicina General',
                'type': 'consultation'
            },
            {
                'id': 3,
                'title': 'Exámenes de Laboratorio',
                'description': 'Hemograma y perfil lipídico realizados.',
                'date': (datetime.now() - timedelta(days=45)).isoformat(),
                'doctor': 'Roberto Silva',
                'specialty': 'Medicina General',
                'type': 'lab'
            },
            {
                'id': 4,
                'title': 'Tratamiento Gastritis',
                'description': 'Inicio de tratamiento con omeprazol. Recomendaciones dietéticas.',
                'date': (datetime.now() - timedelta(days=90)).isoformat(),
                'doctor': 'Juan Pérez',
                'specialty': 'Medicina General',
                'type': 'treatment'
            }
        ]
        
        return Response(timeline_data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de salud"""
        stats_data = {
            'total_consultations': 8,
            'consultations_this_year': 5,
            'active_treatments': 2,
            'completed_treatments': 3,
            'pending_exams': 1,
            'last_vital_signs': {
                'date': (datetime.now() - timedelta(days=15)).isoformat(),
                'blood_pressure': '125/82',
                'heart_rate': 75,
                'temperature': 36.6,
                'weight': 70.8,
                'height': 175
            },
            'health_trends': {
                'weight_change': '+0.5kg (último mes)',
                'blood_pressure_trend': 'Estable',
                'medication_adherence': '95%'
            }
        }
        
        return Response(stats_data)
