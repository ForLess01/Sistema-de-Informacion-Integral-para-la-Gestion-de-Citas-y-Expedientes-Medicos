from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from . import views

router = DefaultRouter()
router.register(r'cases', views.EmergencyCaseViewSet, basename='emergency-case')
router.register(r'medications', views.EmergencyMedicationViewSet, basename='emergency-medication')
router.register(r'procedures', views.EmergencyProcedureViewSet, basename='emergency-procedure')
router.register(r'transfers', views.EmergencyTransferViewSet, basename='emergency-transfer')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patients_view(request):
    """Obtener pacientes de emergencia por estado"""
    status_filter = request.query_params.get('status', 'active')
    
    # Por ahora retornamos datos vacíos para evitar el 404
    # En Fase 2 se implementará completamente
    return Response([])

urlpatterns = [
    path('patients/', patients_view, name='emergency-patients'),
    path('', include(router.urls)),
]
