from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (MedicalRecord, Allergy, Prescription, LabTest, VitalSigns, MedicalDocument)
from .serializers import (
    MedicalRecordSerializer, AllergySerializer, PrescriptionSerializer,
    LabTestSerializer, VitalSignsSerializer, MedicalDocumentSerializer, MedicalSummarySerializer)


class MedicalRecordViewSet(viewsets.ViewSet):
    """ViewSet para manejar expedientes médicos"""

    def list(self, request):
        records = MedicalRecord.objects.all()
        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        record = MedicalRecord.objects.get(pk=pk)
        serializer = MedicalRecordSerializer(record)
        return Response(serializer.data)

    @action(detail=False)
    def summary(self, request):
        # Aquí tendrías que calcular y devolver el resumen
        summary = {
            'patient_name': 'Juan Perez',
            'blood_type': 'O+',
            'age': 30,
            'allergies_count': 2,
            'active_prescriptions': 3,
            'pending_lab_results': 1,
            'last_visit': None,
            'total_records': 5,  # Cambiado de total_diagnoses a total_records
            'recent_vital_signs': None
        }
        serializer = MedicalSummarySerializer(summary)
        return Response(serializer.data)
