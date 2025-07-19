from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, DoctorProfile, PatientProfile


class UserSerializer(serializers.ModelSerializer):
    """Serializer básico para usuarios"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    username = serializers.EmailField(source='email', read_only=True)
    gender = serializers.SerializerMethodField()
    
    def get_gender(self, obj):
        """Mapear género de base de datos a formato frontend"""
        gender_mapping = {
            'M': 'male',
            'F': 'female', 
            'O': 'other'
        }
        return gender_mapping.get(obj.gender, 'other')
    
    class Meta:
        model = User
        fields = [
            'id', 'user_id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'dni', 'birth_date', 'gender', 'phone', 'emergency_phone',
            'address', 'city', 'state', 'postal_code', 'role',
            'is_active', 'date_joined', 'profile_picture', 'two_factor_enabled'
        ]
        read_only_fields = ['user_id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'dni', 'birth_date', 'gender', 'phone', 'role'
        ]
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DoctorProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil de doctor"""
    user = UserSerializer(read_only=True)
    specialties_names = serializers.StringRelatedField(source='specialties', many=True, read_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PatientProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil de paciente"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PatientProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales incorrectas')
            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo')
            data['user'] = user
        else:
            raise serializers.ValidationError('Debe incluir email y contraseña')
        
        return data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado para JWT"""
    
    def validate(self, attrs):
        # Primero validar las credenciales
        data = super().validate(attrs)
        
        # Obtener el usuario autenticado
        user = self.user
        
        # Serializar información del usuario
        user_serializer = UserSerializer(user)
        
        # Agregar información sobre 2FA
        data['two_factor_enabled'] = user.two_factor_enabled
        data['requires_2fa'] = user.two_factor_enabled
        
        # Si el usuario tiene 2FA habilitado, no devolver los tokens aún
        if user.two_factor_enabled:
            data.pop('refresh', None)
            data.pop('access', None)
            data['message'] = 'Se requiere código de autenticación de dos factores'
        else:
            # Si no tiene 2FA, incluir la información del usuario completa
            data['user'] = user_serializer.data
        
        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Agregar información adicional al token
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        
        return token


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta")
        return value


# Alias para mantener compatibilidad
RegisterSerializer = UserCreateSerializer
