from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AppointmentViewSet, basename='appointment')

# Create custom function-based views for problematic endpoints
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_slots(request):
    viewset = views.AppointmentViewSet()
    # Initialize viewset properly
    viewset.request = request
    viewset.format_kwarg = None
    viewset.kwargs = {}
    return viewset.available_slots(request)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def specialties_view(request):
    viewset = views.AppointmentViewSet()
    # Initialize viewset properly
    viewset.request = request
    viewset.format_kwarg = None
    viewset.kwargs = {}
    return viewset.specialties(request)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_view(request):
    from datetime import date
    from appointments.serializers import AppointmentSerializer
    
    # Get appointments directly without using ViewSet methods that need DRF context
    user = request.user
    
    # Create a temporary viewset just to use the get_queryset method
    viewset = views.AppointmentViewSet()
    viewset.request = request
    
    # Get filtered appointments
    appointments = viewset.get_queryset().filter(
        appointment_date__gte=date.today(),
        status='confirmed'
    ).order_by('appointment_date', 'appointment_time')[:5]
    
    # Serialize manually
    serializer = AppointmentSerializer(appointments, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctors_by_specialty(request, specialty_id):
    viewset = views.AppointmentViewSet()
    # Initialize viewset properly
    viewset.request = request
    viewset.format_kwarg = None
    viewset.kwargs = {}
    return viewset.doctors_by_specialty(request, specialty_id)

urlpatterns = [
    # Custom endpoints that avoid router conflicts
    path('available-slots/', available_slots, name='available-slots'),
    path('specialties/', specialties_view, name='specialties'),
    path('upcoming/', upcoming_view, name='upcoming'),
    path('specialties/<int:specialty_id>/doctors/', doctors_by_specialty, name='doctors-by-specialty'),
    # Include router URLs
    path('', include(router.urls)),
]
