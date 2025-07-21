from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from datetime import datetime, date
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer, DesktopTokenObtainPairSerializer
)
from .services import TwoFactorService

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para obtención de tokens JWT - Frontend Web (solo pacientes)"""
    serializer_class = CustomTokenObtainPairSerializer


class DesktopTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para obtención de tokens JWT - Frontend Desktop (personal médico y administrativo)"""
    serializer_class = DesktopTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """Vista para registro de nuevos usuarios"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Vista para ver y actualizar el perfil del usuario actual"""
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Vista para cambiar la contraseña del usuario"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Actualizar contraseña
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response(
                {'detail': 'Contraseña actualizada exitosamente'},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """Vista para listar usuarios (solo para administradores)"""
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated, permissions.IsAdminUser)
    
    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role', None)
        
        if role:
            queryset = queryset.filter(role=role)
        
        return queryset.order_by('-date_joined')


class Enable2FAView(APIView):
    """Vista para habilitar la autenticación de dos factores"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        
        # Si ya tiene 2FA habilitado, retornar error
        if user.two_factor_enabled:
            return Response(
                {'detail': 'La autenticación de dos factores ya está habilitada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generar secreto y tokens de respaldo
        secret, backup_tokens, qr_code = TwoFactorService.enable_two_factor(user)
        
        return Response({
            'qr_code': qr_code,
            'backup_tokens': backup_tokens,
            'message': 'Escanea el código QR con tu aplicación de autenticación y luego confirma con un código'
        }, status=status.HTTP_200_OK)


class Confirm2FAView(APIView):
    """Vista para confirmar la activación de 2FA"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        token = request.data.get('token', '')
        
        if not token:
            return Response(
                {'detail': 'El código de verificación es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar el token
        if TwoFactorService.confirm_two_factor(user, token):
            return Response(
                {'detail': 'Autenticación de dos factores habilitada exitosamente'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'detail': 'Código de verificación inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )


class Disable2FAView(APIView):
    """Vista para deshabilitar la autenticación de dos factores"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        password = request.data.get('password', '')
        
        # Verificar la contraseña del usuario
        if not user.check_password(password):
            return Response(
                {'detail': 'Contraseña incorrecta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deshabilitar 2FA
        TwoFactorService.disable_two_factor(user)
        
        return Response(
            {'detail': 'Autenticación de dos factores deshabilitada'},
            status=status.HTTP_200_OK
        )


class Verify2FAView(APIView):
    """Vista para verificar el código 2FA durante el login"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        email = request.data.get('email', '')
        token = request.data.get('token', '')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar si el usuario tiene 2FA habilitado
        if not user.two_factor_enabled:
            return Response(
                {'detail': 'Este usuario no tiene 2FA habilitado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Función auxiliar para generar respuesta exitosa con tokens
        def generate_success_response(user, message='Código verificado exitosamente', warning=None):
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Serializar datos del usuario
            user_serializer = UserSerializer(user)
            
            response_data = {
                'access': access_token,
                'refresh': refresh_token,
                'user': user_serializer.data,
                'detail': message,
                'verified': True
            }
            
            if warning:
                response_data['warning'] = warning
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        # Intentar verificar con código TOTP
        if TwoFactorService.verify_token(user.two_factor_secret, token):
            return generate_success_response(user)
        
        # Si no funciona, intentar con token de respaldo
        is_valid, used_token = TwoFactorService.verify_backup_token(user.backup_tokens, token)
        if is_valid:
            # Remover el token usado
            user.backup_tokens.remove(used_token)
            user.save()
            
            warning = f'Te quedan {len(user.backup_tokens)} tokens de respaldo'
            return generate_success_response(
                user, 
                'Token de respaldo verificado exitosamente',
                warning
            )
        
        return Response(
            {'detail': 'Código de verificación inválido', 'verified': False},
            status=status.HTTP_400_BAD_REQUEST
        )


class RegenerateBackupTokensView(APIView):
    """Vista para regenerar tokens de respaldo"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        
        if not user.two_factor_enabled:
            return Response(
                {'detail': 'Debes tener 2FA habilitado para regenerar tokens de respaldo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Regenerar tokens
        new_tokens = TwoFactorService.regenerate_backup_tokens(user)
        
        return Response({
            'backup_tokens': new_tokens,
            'message': 'Tokens de respaldo regenerados exitosamente'
        }, status=status.HTTP_200_OK)


class CheckEmailView(APIView):
    """Vista para verificar si un email ya está registrado"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        email = request.data.get('email', '')
        
        if not email:
            return Response(
                {'error': 'Email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si el email ya existe
        email_exists = User.objects.filter(email=email).exists()
        
        return Response({
            'exists': email_exists,
            'message': 'El email ya está registrado' if email_exists else 'Email disponible'
        }, status=status.HTTP_200_OK)


class CheckDNIView(APIView):
    """Vista para verificar si un DNI ya está registrado"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        dni = request.data.get('dni', '')
        
        if not dni:
            return Response(
                {'error': 'DNI es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si el DNI ya existe
        dni_exists = User.objects.filter(dni=dni).exists()
        
        return Response({
            'exists': dni_exists,
            'message': 'El DNI ya está registrado' if dni_exists else 'DNI disponible'
        }, status=status.HTTP_200_OK)


# =====================================================
# VISTAS ESPECÍFICAS PARA GESTIÓN DE PACIENTES
# =====================================================

class PatientListView(generics.ListCreateAPIView):
    """Vista para listar y crear pacientes"""
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        """Obtener lista de pacientes con filtros"""
        queryset = User.objects.filter(role='patient', is_active=True)
        
        # Filtro de búsqueda
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(dni__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Filtro por género
        gender = self.request.query_params.get('gender', None)
        if gender and gender != 'all':
            queryset = queryset.filter(gender=gender)
        
        # Filtro por rango de edad
        age_range = self.request.query_params.get('age_range', None)
        if age_range and age_range != 'all':
            from django.utils import timezone
            today = timezone.now().date()
            
            if age_range == '0-18':
                start_date = today.replace(year=today.year - 18)
                queryset = queryset.filter(date_of_birth__gte=start_date)
            elif age_range == '19-35':
                start_date = today.replace(year=today.year - 35)
                end_date = today.replace(year=today.year - 19)
                queryset = queryset.filter(
                    date_of_birth__gte=start_date,
                    date_of_birth__lte=end_date
                )
            elif age_range == '36-55':
                start_date = today.replace(year=today.year - 55)
                end_date = today.replace(year=today.year - 36)
                queryset = queryset.filter(
                    date_of_birth__gte=start_date,
                    date_of_birth__lte=end_date
                )
            elif age_range == '56+':
                end_date = today.replace(year=today.year - 56)
                queryset = queryset.filter(date_of_birth__lte=end_date)
        
        return queryset.select_related('patient_profile').order_by('-date_joined')
    
    def list(self, request, *args, **kwargs):
        """Listar pacientes con paginación"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            # Agregar información adicional de cada paciente
            patients_data = []
            for patient in page:
                # Obtener última cita
                from appointments.models import Appointment
                last_appointment = Appointment.objects.filter(
                    patient=patient
                ).order_by('-appointment_date', '-appointment_time').first()
                
                patient_data = {
                    'id': patient.id,
                    'first_name': patient.first_name,
                    'last_name': patient.last_name,
                    'dni': patient.dni,
                    'email': patient.email,
                    'phone': patient.phone,
                    'gender': patient.gender,
                    'date_of_birth': patient.date_of_birth,
                    'birth_date': patient.birth_date,  # Campo alternativo
                    'address': patient.address,
                    'city': patient.city,
                    'state': patient.state,
                    'date_joined': patient.date_joined,
                    'is_active': patient.is_active,
                    'age': patient.age,
                    'last_appointment': {
                        'date': last_appointment.appointment_date.strftime('%Y-%m-%d') if last_appointment else None,
                        'time': last_appointment.appointment_time.strftime('%H:%M') if last_appointment else None,
                        'doctor': f"{last_appointment.doctor.first_name} {last_appointment.doctor.last_name}" if last_appointment else None
                    } if last_appointment else None,
                    # Información del perfil de paciente si existe
                    'patient_profile': {
                        'blood_type': getattr(patient, 'patient_profile', {}).blood_type if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
                        'allergies': getattr(patient, 'patient_profile', {}).allergies if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
                        'chronic_conditions': getattr(patient, 'patient_profile', {}).chronic_conditions if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
                    } if hasattr(patient, 'patient_profile') and patient.patient_profile else None
                }
                patients_data.append(patient_data)
            
            return self.get_paginated_response(patients_data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Crear nuevo paciente"""
        # Asegurar que el nuevo usuario sea un paciente
        serializer.save(role='patient')


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar o eliminar un paciente específico"""
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return User.objects.filter(role='patient')
    
    def retrieve(self, request, *args, **kwargs):
        """Obtener detalles completos de un paciente"""
        patient = self.get_object()
        
        # Obtener historial de citas
        from appointments.models import Appointment
        appointments = Appointment.objects.filter(
            patient=patient
        ).select_related('doctor', 'specialty').order_by('-appointment_date', '-appointment_time')[:10]
        
        patient_data = {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'dni': patient.dni,
            'email': patient.email,
            'phone': patient.phone,
            'emergency_phone': patient.emergency_phone,
            'gender': patient.gender,
            'date_of_birth': patient.date_of_birth,
            'birth_date': patient.birth_date,
            'address': patient.address,
            'city': patient.city,
            'state': patient.state,
            'postal_code': patient.postal_code,
            'emergency_contact_name': patient.emergency_contact_name,
            'emergency_contact_phone': patient.emergency_contact_phone,
            'date_joined': patient.date_joined,
            'is_active': patient.is_active,
            'age': patient.age,
            # Información del perfil de paciente
            'patient_profile': {
                'blood_type': getattr(patient, 'patient_profile', {}).blood_type if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
                'allergies': getattr(patient, 'patient_profile', {}).allergies if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
                'chronic_conditions': getattr(patient, 'patient_profile', {}).chronic_conditions if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
                'insurance_provider': getattr(patient, 'patient_profile', {}).insurance_provider if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
                'insurance_policy_number': getattr(patient, 'patient_profile', {}).insurance_policy_number if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
            } if hasattr(patient, 'patient_profile') and patient.patient_profile else None,
            # Historial de citas recientes
            'recent_appointments': [{
                'id': apt.id,
                'date': apt.appointment_date.strftime('%Y-%m-%d'),
                'time': apt.appointment_time.strftime('%H:%M'),
                'doctor': f"{apt.doctor.first_name} {apt.doctor.last_name}",
                'specialty': apt.specialty.name if apt.specialty else 'General',
                'status': apt.status,
                'reason': apt.reason
            } for apt in appointments]
        }
        
        return Response(patient_data)
    
    def perform_destroy(self, instance):
        """Eliminación suave - marcar como inactivo"""
        instance.is_active = False
        instance.save()


class PatientSearchView(APIView):
    """Vista para búsqueda rápida de pacientes"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response({
                'results': [],
                'message': 'Ingresa al menos 2 caracteres para buscar'
            })
        
        patients = User.objects.filter(
            role='patient',
            is_active=True
        ).filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(dni__icontains=query) |
            Q(phone__icontains=query)
        )[:10]  # Limitar a 10 resultados
        
        results = []
        for patient in patients:
            results.append({
                'id': patient.id,
                'name': f"{patient.first_name} {patient.last_name}",
                'dni': patient.dni,
                'phone': patient.phone,
                'age': patient.age
            })
        
        return Response({
            'results': results,
            'count': len(results)
        })
