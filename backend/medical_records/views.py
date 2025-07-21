from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
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


# Consultations
class ConsultationsListView(generics.ListCreateAPIView):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return MedicalRecord.objects.filter(doctor=user)
        return MedicalRecord.objects.none()

class ConsultationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return MedicalRecord.objects.filter(doctor=user)
        return MedicalRecord.objects.none()

# Patients
class PatientRecordView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        record = get_object_or_404(MedicalRecord, patient_id=patient_id)
        serializer = MedicalRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PatientDiagnosesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        records = MedicalRecord.objects.filter(patient_id=patient_id)
        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Signos Vitales
class PatientVitalSignsView(generics.ListCreateAPIView):
    serializer_class = VitalSignsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VitalSigns.objects.filter(patient_id=self.kwargs['patient_id'])

# Vital Signs ViewSet
class VitalSignsViewSet(viewsets.ModelViewSet):
    queryset = VitalSigns.objects.all()
    serializer_class = VitalSignsSerializer
    permission_classes = [IsAuthenticated]

# Prescription ViewSet
class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

# Diagnosis ViewSet (Note: You might need to create a Diagnosis model and serializer)
class DiagnosisViewSet(viewsets.ViewSet):
    """ViewSet for handling diagnoses"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """List all diagnoses"""
        # For now, returning empty list since Diagnosis model doesn't exist
        return Response([])
    
    def create(self, request):
        """Create a new diagnosis"""
        return Response({'message': 'Diagnosis created'}, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, pk=None):
        """Retrieve a specific diagnosis"""
        return Response({'id': pk, 'message': 'Diagnosis details'})
    
    def update(self, request, pk=None):
        """Update a diagnosis"""
        return Response({'message': 'Diagnosis updated'})
    
    def destroy(self, request, pk=None):
        """Delete a diagnosis"""
        return Response(status=status.HTTP_204_NO_CONTENT)

# Prescriptions
class PatientPrescriptionsView(generics.ListCreateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prescription.objects.filter(patient_id=self.kwargs['patient_id'])
    
    def create(self, request, *args, **kwargs):
        """Crear una nueva receta médica"""
        data = request.data.copy()
        data['patient'] = self.kwargs['patient_id']
        data['doctor'] = request.user.id if hasattr(request.user, 'role') and request.user.role == 'doctor' else None
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PrescriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar o eliminar una receta específica"""
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role'):
            if user.role == 'doctor':
                # Los doctores pueden ver/editar sus propias recetas
                return Prescription.objects.filter(doctor=user)
            elif user.role == 'patient':
                # Los pacientes solo pueden ver sus recetas
                return Prescription.objects.filter(patient=user)
            elif user.role == 'pharmacist':
                # Los farmacéuticos pueden ver todas las recetas activas
                return Prescription.objects.filter(is_active=True)
        return Prescription.objects.none()
    
    def update(self, request, *args, **kwargs):
        """Actualizar una receta médica"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Solo el doctor que creó la receta puede actualizarla
        if hasattr(request.user, 'role') and request.user.role == 'doctor' and instance.doctor != request.user:
            return Response(
                {'detail': 'No tienes permiso para actualizar esta receta'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar (desactivar) una receta médica"""
        instance = self.get_object()
        
        # Solo el doctor que creó la receta puede eliminarla
        if hasattr(request.user, 'role') and request.user.role == 'doctor' and instance.doctor != request.user:
            return Response(
                {'detail': 'No tienes permiso para eliminar esta receta'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # En lugar de eliminar físicamente, desactivamos la receta
        instance.is_active = False
        instance.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


# Doctor's Prescriptions View
class DoctorPrescriptionsView(generics.ListAPIView):
    """Vista para que los doctores vean todas sus recetas emitidas"""
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if hasattr(self.request.user, 'role') and self.request.user.role == 'doctor':
            return Prescription.objects.filter(doctor=self.request.user).order_by('-issue_date')
        return Prescription.objects.none()


# Documents
class PatientDocumentsView(generics.ListCreateAPIView):
    serializer_class = MedicalDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MedicalDocument.objects.filter(record__patient_id=self.kwargs['patient_id'])

# Allergies
class PatientAllergiesView(generics.ListCreateAPIView):
    serializer_class = AllergySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Allergy.objects.filter(patient_id=self.kwargs['patient_id'])

# Patient Medical History
class PatientHistoryView(APIView):
    """Vista para obtener el historial médico completo de un paciente"""
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        """Obtener historial médico completo del paciente desde la base de datos"""
        try:
            # Obtener registros médicos (consultas)
            medical_records = MedicalRecord.objects.filter(patient_id=patient_id)
            consultations = []
            for record in medical_records:
                consultations.append({
                    'id': record.id,
                    'title': record.diagnosis or 'Consulta médica',
                    'description': record.treatment or 'Sin descripción disponible',
                    'date': record.created_at.isoformat() if record.created_at else None,
                    'doctor': record.doctor.get_full_name() if record.doctor else 'No especificado',
                    'specialty': getattr(record.doctor, 'specialty', 'Medicina General') if record.doctor else 'Medicina General',
                    'type': 'consultation'
                })

            # Obtener prescripciones con sus items
            prescriptions_qs = Prescription.objects.filter(patient_id=patient_id).prefetch_related('items__medication')
            prescriptions = []
            for prescription in prescriptions_qs:
                # Obtener items de la prescripción
                prescription_items = prescription.items.all()
                
                if prescription_items.exists():
                    # Si hay items, crear una entrada por cada medicamento
                    for item in prescription_items:
                        prescriptions.append({
                            'id': f'{prescription.id}_{item.id}',
                            'prescription_id': prescription.id,
                            'medication_name': item.medication.name if item.medication else 'Medicamento no especificado',
                            'dosage': item.dosage,
                            'frequency': item.frequency,
                            'instructions': item.instructions or prescription.instructions or 'Según indicación médica',
                            'start_date': prescription.issue_date.isoformat() if prescription.issue_date else None,
                            'end_date': prescription.valid_until.isoformat() if prescription.valid_until else None,
                            'doctor_name': prescription.doctor.get_full_name() if prescription.doctor else 'No especificado',
                            'status': 'active' if prescription.is_active and not prescription.is_expired else 'completed',
                            'diagnosis': prescription.diagnosis
                        })
                else:
                    # Si no hay items, crear entrada con información básica de la prescripción
                    prescriptions.append({
                        'id': prescription.id,
                        'prescription_id': prescription.id,
                        'medication_name': 'Prescripción médica',
                        'dosage': 'Ver instrucciones',
                        'frequency': 'Ver instrucciones',
                        'instructions': prescription.instructions or 'Según indicación médica',
                        'start_date': prescription.issue_date.isoformat() if prescription.issue_date else None,
                        'end_date': prescription.valid_until.isoformat() if prescription.valid_until else None,
                        'doctor_name': prescription.doctor.get_full_name() if prescription.doctor else 'No especificado',
                        'status': 'active' if prescription.is_active and not prescription.is_expired else 'completed',
                        'diagnosis': prescription.diagnosis
                    })

            # Obtener resultados de laboratorio
            lab_tests = LabTest.objects.filter(patient_id=patient_id)
            lab_results = []
            for test in lab_tests:
                lab_results.append({
                    'id': test.id,
                    'test_name': test.test_name,
                    'result_summary': test.results or 'Resultados pendientes',
                    'date': (test.result_date or test.ordered_date).isoformat() if (test.result_date or test.ordered_date) else None,
                    'doctor_name': test.ordered_by.get_full_name() if test.ordered_by else 'No especificado',
                    'status': 'completed' if test.results else 'pending',
                    'test_type': 'general'  # Valor por defecto ya que no existe test_type en el modelo
                })

            # Obtener alergias (como parte del historial)
            allergies = Allergy.objects.filter(patient_id=patient_id)
            diagnoses = []
            for allergy in allergies:
                diagnoses.append({
                    'id': allergy.id,
                    'condition': f'Alergia a {allergy.allergen}',
                    'description': allergy.reaction or 'Reacción alérgica',
                    'date': allergy.first_observed.isoformat() if allergy.first_observed else None,
                    'doctor_name': allergy.created_by.get_full_name() if allergy.created_by else 'No especificado',
                    'status': 'active' if allergy.is_active else 'inactive',
                    'severity': allergy.severity
                })

            # Agregar diagnósticos de los registros médicos
            for record in medical_records:
                if record.diagnosis:
                    diagnoses.append({
                        'id': f'diag_{record.id}',
                        'condition': record.diagnosis,
                        'description': record.treatment or 'Sin descripción adicional',
                        'date': record.created_at.isoformat() if record.created_at else None,
                        'doctor_name': record.doctor.get_full_name() if record.doctor else 'No especificado',
                        'status': 'active',
                        'severity': 'moderate'  # Valor por defecto
                    })

            history_data = {
                'patient_id': patient_id,
                'consultations': consultations,
                'prescriptions': prescriptions,
                'lab_results': lab_results,
                'diagnoses': diagnoses
            }
            
            return Response(history_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(f"ERROR in PatientHistoryView: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Error fetching patient history: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Vista para listar consultas médicas (para ConsultationsList)
class ConsultationsListView(APIView):
    """Vista para obtener lista de consultas médicas"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtener lista de consultas médicas desde registros médicos"""
        try:
            # Filtros opcionales
            status_filter = request.GET.get('status', 'all')
            date_filter = request.GET.get('date_filter', 'all')
            
            # Obtener registros médicos
            records = MedicalRecord.objects.select_related('patient', 'doctor').all()
            
            # Aplicar filtros de fecha si es necesario
            if date_filter == 'today':
                from datetime import date
                records = records.filter(record_date=date.today())
            elif date_filter == 'week':
                from datetime import date, timedelta
                week_ago = date.today() - timedelta(days=7)
                records = records.filter(record_date__gte=week_ago)
            elif date_filter == 'month':
                from datetime import date, timedelta
                month_ago = date.today() - timedelta(days=30)
                records = records.filter(record_date__gte=month_ago)
            
            consultations = []
            for record in records:
                consultation_data = {
                    'id': record.id,
                    'patient_name': record.patient.get_full_name(),
                    'patient_dni': getattr(record.patient, 'dni', 'N/D'),
                    'patient_age': self.calculate_age(getattr(record.patient, 'date_of_birth', None)),
                    'chief_complaint': record.description or 'Consulta médica',
                    'diagnosis': record.diagnosis,
                    'treatment': record.treatment,
                    'notes': record.notes,
                    'appointment_date': record.record_date.isoformat() if record.record_date else None,
                    'appointment_time': record.created_at.strftime('%H:%M') if record.created_at else None,
                    'doctor_name': record.doctor.get_full_name() if record.doctor else 'No asignado',
                    'specialty': 'Medicina General',  # Valor por defecto
                    'status': 'completed',  # Los registros médicos están completados
                    'patient_phone': getattr(record.patient, 'phone', None),
                    'patient_email': getattr(record.patient, 'email', None),
                }
                consultations.append(consultation_data)
            
            return Response({
                'results': consultations,
                'count': len(consultations)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error fetching consultations: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def calculate_age(self, birth_date):
        """Calcular edad desde fecha de nacimiento"""
        if not birth_date:
            return 'N/D'
        from datetime import date
        today = date.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


# Vista para obtener detalle de una consulta específica (para ConsultationDetail)
class ConsultationDetailAPIView(APIView):
    """Vista para obtener detalle de una consulta médica específica"""
    permission_classes = [IsAuthenticated]

    def get(self, request, consultation_id):
        """Obtener detalle completo de una consulta médica"""
        try:
            # Obtener el registro médico específico
            record = get_object_or_404(MedicalRecord, id=consultation_id)
            
            # Obtener signos vitales asociados si existen
            vital_signs = VitalSigns.objects.filter(patient=record.patient, recorded_at__date=record.record_date).first()
            
            consultation_detail = {
                'id': record.id,
                'patient_name': record.patient.get_full_name(),
                'patient_dni': getattr(record.patient, 'dni', 'N/D'),
                'patient_age': self.calculate_age(getattr(record.patient, 'date_of_birth', None)),
                'patient_phone': getattr(record.patient, 'phone', None),
                'patient_email': getattr(record.patient, 'email', None),
                'chief_complaint': record.description or 'Consulta médica',
                'diagnosis': record.diagnosis,
                'treatment': record.treatment,
                'notes': record.notes,
                'appointment_date': record.record_date.isoformat() if record.record_date else None,
                'appointment_time': record.created_at.strftime('%H:%M') if record.created_at else None,
                'doctor_name': record.doctor.get_full_name() if record.doctor else 'No asignado',
                'specialty': 'Medicina General',  # Valor por defecto
                'status': 'completed',
                
                # Signos vitales
                'vital_signs': {
                    'blood_pressure': vital_signs.blood_pressure if vital_signs else 'No registrado',
                    'heart_rate': vital_signs.heart_rate if vital_signs else None,
                    'temperature': vital_signs.temperature if vital_signs else None,
                    'weight': vital_signs.weight if vital_signs else None,
                    'height': vital_signs.height if vital_signs else None,
                    'respiratory_rate': vital_signs.respiratory_rate if vital_signs else None,
                    'oxygen_saturation': vital_signs.oxygen_saturation if vital_signs else None
                } if vital_signs else {},
                
                # Información adicional
                'created_at': record.created_at.isoformat() if record.created_at else None,
                'updated_at': record.updated_at.isoformat() if record.updated_at else None
            }
            
            return Response(consultation_detail, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error fetching consultation detail: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, consultation_id):
        """Actualizar una consulta médica"""
        try:
            record = get_object_or_404(MedicalRecord, id=consultation_id)
            
            # Actualizar campos si están presentes en la request
            data = request.data
            if 'diagnosis' in data:
                record.diagnosis = data['diagnosis']
            if 'treatment' in data:
                record.treatment = data['treatment']
            if 'notes' in data:
                record.notes = data['notes']
            if 'description' in data:
                record.description = data['description']
                
            record.save()
            
            # Retornar los datos actualizados
            return self.get(request, consultation_id)
            
        except Exception as e:
            return Response(
                {'error': f'Error updating consultation: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def calculate_age(self, birth_date):
        """Calcular edad desde fecha de nacimiento"""
        if not birth_date:
            return 'N/D'
        from datetime import date
        today = date.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
