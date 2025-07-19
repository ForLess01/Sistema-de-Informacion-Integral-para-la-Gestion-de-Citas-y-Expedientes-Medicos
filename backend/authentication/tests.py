from django.test import TestCase
from django.contrib.auth import get_user_model, authenticate
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from tests.base import BaseTestCase, BaseAPITestCase, TimestampTestMixin, DatabaseTestMixin
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from datetime import timedelta
from django.utils import timezone

User = get_user_model()


class UserModelTests(BaseTestCase, TimestampTestMixin, DatabaseTestMixin):
    """Tests para el modelo User"""
    
    def test_create_user(self):
        """Test para crear un usuario básico"""
        user = User.objects.create_user(email='test@example.com',
            password='testpass123',
            role='patient'
        )
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'patient')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTimestampsSet(user)
    
    def test_create_superuser(self):
        """Test para crear un superusuario"""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        self.assertEqual(admin.username, 'admin')
        self.assertEqual(admin.role, 'admin')
        self.assertTrue(admin.is_active)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
    
    def test_user_str_representation(self):
        """Test para representación string del usuario"""
        user = self.create_user('john', 'john@test.com', 'patient')
        expected = f"{user.get_full_name()} ({user.role})"
        self.assertEqual(str(user), expected)
    
    def test_get_full_name(self):
        """Test para método get_full_name"""
        user = User.objects.create_user(email='john@test.com',
            first_name='John',
            last_name='Doe',
            role='doctor'
        )
        
        self.assertEqual(user.get_full_name(), 'John Doe')
    
    def test_get_full_name_without_names(self):
        """Test get_full_name cuando no hay nombres"""
        user = User.objects.create_user(email='testuser@hospital.com',
            role='patient'
        )
        
        self.assertEqual(user.get_full_name(), 'testuser')
    
    def test_email_validation(self):
        """Test para validación de email"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email='test@hospital.com',
                password='testpass123',
                role='patient'
            )
    
    def test_role_choices(self):
        """Test para validar roles disponibles"""
        valid_roles = ['admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist']
        
        for role in valid_roles:
            user = User.objects.create_user(
                username=f'user_{role}',
                email=f'{role}@test.com',
                password='testpass123',
                role=role
            )
            self.assertEqual(user.role, role)
    
    def test_unique_username(self):
        """Test para validar que el username sea único"""
        User.objects.create_user(email='first@test.com',
            password='testpass123',
            role='patient'
        )
        
        with self.assertRaises(Exception):
            User.objects.create_user(email='second@test.com',
                password='testpass123',
                role='doctor'
            )
    
    def test_unique_email(self):
        """Test para validar que el email sea único"""
        User.objects.create_user(email='unique@test.com',
            password='testpass123',
            role='patient'
        )
        
        with self.assertRaises(Exception):
            User.objects.create_user(email='unique@test.com',
                password='testpass123',
                role='doctor'
            )
    
    def test_user_permissions_by_role(self):
        """Test para verificar permisos por rol"""
        # Admin debe tener permisos de staff
        admin = User.objects.create_user(email='admin@test.com',
            password='testpass123',
            role='admin'
        )
        # Note: Los permisos específicos se configurarían en un método personalizado
        
        # Paciente no debe tener permisos especiales
        patient = User.objects.create_user(email='patient@test.com',
            password='testpass123',
            role='patient'
        )
        
        self.assertFalse(patient.is_staff)
        self.assertFalse(patient.is_superuser)


class AuthenticationTests(BaseAPITestCase):
    """Tests para autenticación de usuarios"""
    
    def test_user_login(self):
        """Test para login de usuario"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        
        # Probar autenticación
        authenticated_user = authenticate(
            username='testuser',
            password='testpass123'
        )
        
        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user, user)
    
    def test_user_login_wrong_password(self):
        """Test para login con contraseña incorrecta"""
        self.create_user('testuser', 'test@test.com', 'patient')
        
        authenticated_user = authenticate(
            username='testuser',
            password='wrongpassword'
        )
        
        self.assertIsNone(authenticated_user)
    
    def test_user_login_inactive_user(self):
        """Test para login con usuario inactivo"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        user.is_active = False
        user.save()
        
        authenticated_user = authenticate(
            username='testuser',
            password='testpass123'
        )
        
        self.assertIsNone(authenticated_user)


class UserSerializerTests(BaseTestCase):
    """Tests para serializers de usuario"""
    
    def test_user_serializer_valid_data(self):
        """Test para serializer con datos válidos"""
        user_data = {
            'username': 'testuser',
            'email': 'test@test.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'patient'
        }
        
        serializer = UserSerializer(data=user_data)
        self.assertTrue(serializer.is_valid())
    
    def test_user_serializer_invalid_email(self):
        """Test para serializer con email inválido"""
        user_data = {
            'username': 'testuser',
            'email': 'invalid-email',
            'role': 'patient'
        }
        
        serializer = UserSerializer(data=user_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_register_serializer_valid(self):
        """Test para serializer de registro válido"""
        register_data = {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'patient'
        }
        
        serializer = RegisterSerializer(data=register_data)
        self.assertTrue(serializer.is_valid())
    
    def test_register_serializer_password_mismatch(self):
        """Test para passwords que no coinciden"""
        register_data = {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'password123',
            'password_confirm': 'different123',
            'role': 'patient'
        }
        
        serializer = RegisterSerializer(data=register_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password_confirm', serializer.errors)


class AuthenticationAPITests(BaseAPITestCase):
    """Tests para API de autenticación"""
    
    def test_register_api(self):
        """Test para endpoint de registro"""
        url = reverse('authentication:register')
        data = {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'patient'
        }
        
        response = self.client.post(url, data)
        self.assertCreated(response)
        
        # Verificar que el usuario fue creado
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_login_api(self):
        """Test para endpoint de login"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        
        url = reverse('authentication:token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        
        response_data = self.get_json_response(response)
        self.assertIn('access', response_data)
        self.assertIn('refresh', response_data)
    
    def test_login_api_invalid_credentials(self):
        """Test para login con credenciales inválidas"""
        url = reverse('authentication:token_obtain_pair')
        data = {
            'username': 'nonexistent',
            'password': 'wrongpass'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)
    
    def test_refresh_token_api(self):
        """Test para endpoint de refresh token"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        refresh = RefreshToken.for_user(user)
        
        url = reverse('authentication:token_refresh')
        data = {'refresh': str(refresh)}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        
        response_data = self.get_json_response(response)
        self.assertIn('access', response_data)
    
    def test_profile_api_authenticated(self):
        """Test para endpoint de perfil con usuario autenticado"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        self.authenticate(user)
        
        url = reverse('authentication:profile')
        response = self.client.get(url)
        
        self.assertSuccess(response)
        response_data = self.get_json_response(response)
        self.assertEqual(response_data['username'], 'testuser')
    
    def test_profile_api_unauthenticated(self):
        """Test para endpoint de perfil sin autenticación"""
        url = reverse('authentication:profile')
        response = self.client.get(url)
        
        self.assertUnauthorized(response)
    
    def test_update_profile_api(self):
        """Test para actualizar perfil"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        self.authenticate(user)
        
        url = reverse('authentication:profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'updated@test.com'
        }
        
        response = self.client.patch(url, data)
        self.assertSuccess(response)
        
        # Verificar que se actualizó
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Updated')
        self.assertEqual(user.last_name, 'Name')
        self.assertEqual(user.email, 'updated@test.com')
    
    def test_change_password_api(self):
        """Test para cambiar contraseña"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        self.authenticate(user)
        
        url = reverse('authentication:change_password')
        data = {
            'old_password': 'testpass123',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data)
        self.assertSuccess(response)
        
        # Verificar que la contraseña cambió
        user.refresh_from_db()
        self.assertTrue(user.check_password('newpass123'))
        self.assertFalse(user.check_password('testpass123'))
    
    def test_change_password_wrong_old_password(self):
        """Test para cambiar contraseña con contraseña actual incorrecta"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        self.authenticate(user)
        
        url = reverse('authentication:change_password')
        data = {
            'old_password': 'wrongpass',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data)
        self.assertBadRequest(response)
    
    def test_user_list_api_admin_only(self):
        """Test para listar usuarios (solo admin)"""
        # Test con usuario no admin
        patient = self.create_user('patient', 'patient@test.com', 'patient')
        self.authenticate(patient)
        
        url = reverse('authentication:user-list')
        response = self.client.get(url)
        self.assertForbidden(response)
        
        # Test con admin
        self.authenticate(self.admin_user)
        response = self.client.get(url)
        self.assertSuccess(response)
    
    def test_logout_api(self):
        """Test para logout"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        refresh = RefreshToken.for_user(user)
        self.authenticate(user)
        
        url = reverse('authentication:logout')
        data = {'refresh': str(refresh)}
        
        response = self.client.post(url, data)
        self.assertSuccess(response)


class TokenTests(BaseAPITestCase):
    """Tests para manejo de tokens JWT"""
    
    def test_token_generation(self):
        """Test para generación de tokens"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        refresh = RefreshToken.for_user(user)
        
        self.assertIsNotNone(refresh)
        self.assertIsNotNone(refresh.access_token)
    
    def test_token_validation(self):
        """Test para validación de tokens"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        token = self.authenticate(user)
        
        # El token debe permitir acceso a endpoints protegidos
        url = reverse('authentication:profile')
        response = self.client.get(url)
        self.assertSuccess(response)
    
    def test_expired_token(self):
        """Test para token expirado"""
        user = self.create_user('testuser', 'test@test.com', 'patient')
        refresh = RefreshToken.for_user(user)
        
        # Simular token expirado modificando el tiempo
        refresh.access_token.set_exp(from_time=timezone.now() - timedelta(hours=1))
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        url = reverse('authentication:profile')
        response = self.client.get(url)
        self.assertUnauthorized(response)


class PermissionTests(BaseAPITestCase):
    """Tests para permisos por rol"""
    
    def test_admin_permissions(self):
        """Test para permisos de administrador"""
        self.authenticate(self.admin_user)
        
        # Admin debe poder acceder a lista de usuarios
        url = reverse('authentication:user-list')
        response = self.client.get(url)
        self.assertSuccess(response)
    
    def test_doctor_permissions(self):
        """Test para permisos de doctor"""
        self.authenticate(self.doctor)
        
        # Doctor debe poder acceder a su perfil
        url = reverse('authentication:profile')
        response = self.client.get(url)
        self.assertSuccess(response)
        
        # Pero no a lista de usuarios
        url = reverse('authentication:user-list')
        response = self.client.get(url)
        self.assertForbidden(response)
    
    def test_patient_permissions(self):
        """Test para permisos de paciente"""
        self.authenticate(self.patient)
        
        # Paciente debe poder acceder a su perfil
        url = reverse('authentication:profile')
        response = self.client.get(url)
        self.assertSuccess(response)
        
        # Pero no a funciones administrativas
        url = reverse('authentication:user-list')
        response = self.client.get(url)
        self.assertForbidden(response)
