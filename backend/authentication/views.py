from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)
from .services import TwoFactorService

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para obtención de tokens JWT"""
    serializer_class = CustomTokenObtainPairSerializer


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
