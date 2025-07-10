from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Notification,
    NotificationTemplate,
    NotificationPreference,
    NotificationLog,
    PushDevice
)

User = get_user_model()


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer para plantillas de notificaciones"""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'notification_type', 'channel',
            'subject_template', 'body_template', 'is_html',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que las plantillas de email tengan asunto
        if data.get('channel') == 'email' and not data.get('subject_template'):
            raise serializers.ValidationError(
                "Las plantillas de email deben tener un asunto"
            )
        
        # Validar que las plantillas push tengan asunto
        if data.get('channel') == 'push' and not data.get('subject_template'):
            raise serializers.ValidationError(
                "Las plantillas push deben tener un asunto"
            )
        
        return data


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones"""
    
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    notification_type = serializers.CharField(source='template.notification_type', read_only=True)
    related_object_type = serializers.CharField(source='content_type.model', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_id', 'recipient', 'recipient_name',
            'template', 'template_name', 'notification_type',
            'subject', 'message', 'context_data', 'channel',
            'priority', 'status', 'scheduled_for', 'sent_at',
            'delivered_at', 'attempts', 'max_attempts',
            'error_message', 'recipient_email', 'recipient_phone',
            'related_object_type', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'notification_id', 'sent_at', 'delivered_at', 'attempts',
            'created_at', 'updated_at', 'recipient_name', 'template_name',
            'notification_type', 'related_object_type'
        ]
    
    def validate_scheduled_for(self, value):
        """Validar que la fecha de programación sea futura"""
        from django.utils import timezone
        
        if value and value < timezone.now():
            raise serializers.ValidationError(
                "La fecha de programación debe ser futura"
            )
        return value


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer para preferencias de notificaciones"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'user_name',
            'email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled',
            'appointment_reminders', 'appointment_confirmations',
            'exam_results', 'prescription_notifications',
            'emergency_alerts', 'system_notifications',
            'quiet_hours_start', 'quiet_hours_end', 'language',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'user_name']
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar horas silenciosas
        quiet_start = data.get('quiet_hours_start')
        quiet_end = data.get('quiet_hours_end')
        
        if quiet_start and quiet_end and quiet_start == quiet_end:
            raise serializers.ValidationError(
                "Las horas de inicio y fin no pueden ser iguales"
            )
        
        return data


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de notificaciones"""
    
    notification_id = serializers.CharField(source='notification.notification_id', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'notification', 'notification_id',
            'action', 'details', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class PushDeviceSerializer(serializers.ModelSerializer):
    """Serializer para dispositivos push"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = PushDevice
        fields = [
            'id', 'user', 'user_name', 'device_token',
            'device_type', 'device_name', 'is_active',
            'last_used', 'created_at'
        ]
        read_only_fields = ['last_used', 'created_at', 'user_name']
    
    def validate_device_token(self, value):
        """Validar que el token no esté duplicado para el mismo usuario"""
        user = self.context['request'].user
        
        # Verificar si ya existe un dispositivo con este token para el usuario
        existing_device = PushDevice.objects.filter(
            user=user,
            device_token=value
        ).exclude(id=self.instance.id if self.instance else None)
        
        if existing_device.exists():
            raise serializers.ValidationError(
                "Ya existe un dispositivo registrado con este token"
            )
        
        return value


class CreateNotificationSerializer(serializers.Serializer):
    """Serializer para crear notificaciones via API"""
    
    recipient_id = serializers.IntegerField()
    notification_type = serializers.ChoiceField(
        choices=NotificationTemplate.NOTIFICATION_TYPES
    )
    context_data = serializers.JSONField(default=dict)
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_CHOICES,
        default='normal'
    )
    scheduled_for = serializers.DateTimeField(required=False)
    channels = serializers.ListField(
        child=serializers.ChoiceField(choices=NotificationTemplate.CHANNEL_CHOICES),
        required=False
    )
    
    def validate_recipient_id(self, value):
        """Validar que el destinatario existe"""
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("El usuario destinatario no existe")
        return value
    
    def validate_channels(self, value):
        """Validar canales"""
        if value and len(value) != len(set(value)):
            raise serializers.ValidationError("No se pueden duplicar canales")
        return value
    
    def create(self, validated_data):
        """Crear notificaciones"""
        from .services import notification_service
        
        recipient = User.objects.get(id=validated_data['recipient_id'])
        
        notifications = notification_service.create_notification(
            recipient=recipient,
            notification_type=validated_data['notification_type'],
            context_data=validated_data.get('context_data', {}),
            priority=validated_data.get('priority', 'normal'),
            scheduled_for=validated_data.get('scheduled_for'),
            channels=validated_data.get('channels')
        )
        
        return notifications


class SendNotificationSerializer(serializers.Serializer):
    """Serializer para enviar notificaciones individuales"""
    
    notification_id = serializers.UUIDField()
    
    def validate_notification_id(self, value):
        """Validar que la notificación existe"""
        try:
            notification = Notification.objects.get(notification_id=value)
            if notification.status != 'pending':
                raise serializers.ValidationError(
                    f"La notificación ya está en estado: {notification.status}"
                )
        except Notification.DoesNotExist:
            raise serializers.ValidationError("La notificación no existe")
        return value


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de notificaciones"""
    
    total = serializers.IntegerField(read_only=True)
    pending = serializers.IntegerField(read_only=True)
    sent = serializers.IntegerField(read_only=True)
    delivered = serializers.IntegerField(read_only=True)
    failed = serializers.IntegerField(read_only=True)
    email = serializers.IntegerField(read_only=True)
    sms = serializers.IntegerField(read_only=True)
    push = serializers.IntegerField(read_only=True)
    in_app = serializers.IntegerField(read_only=True)


class BulkNotificationSerializer(serializers.Serializer):
    """Serializer para envío masivo de notificaciones"""
    
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=1000
    )
    notification_type = serializers.ChoiceField(
        choices=NotificationTemplate.NOTIFICATION_TYPES
    )
    context_data = serializers.JSONField(default=dict)
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_CHOICES,
        default='normal'
    )
    scheduled_for = serializers.DateTimeField(required=False)
    channels = serializers.ListField(
        child=serializers.ChoiceField(choices=NotificationTemplate.CHANNEL_CHOICES),
        required=False
    )
    
    def validate_recipient_ids(self, value):
        """Validar que todos los destinatarios existen"""
        existing_users = User.objects.filter(id__in=value).values_list('id', flat=True)
        missing_users = set(value) - set(existing_users)
        
        if missing_users:
            raise serializers.ValidationError(
                f"Los siguientes usuarios no existen: {list(missing_users)}"
            )
        
        return value
    
    def create(self, validated_data):
        """Crear notificaciones masivas"""
        from .services import notification_service
        
        recipients = User.objects.filter(id__in=validated_data['recipient_ids'])
        all_notifications = []
        
        for recipient in recipients:
            notifications = notification_service.create_notification(
                recipient=recipient,
                notification_type=validated_data['notification_type'],
                context_data=validated_data.get('context_data', {}),
                priority=validated_data.get('priority', 'normal'),
                scheduled_for=validated_data.get('scheduled_for'),
                channels=validated_data.get('channels')
            )
            all_notifications.extend(notifications)
        
        return all_notifications


class UserNotificationListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de notificaciones del usuario"""
    
    notification_type = serializers.CharField(source='template.notification_type', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_id', 'subject', 'message',
            'notification_type', 'template_name', 'channel',
            'priority', 'status', 'created_at', 'is_read'
        ]
        read_only_fields = ['created_at']
    
    def get_is_read(self, obj):
        """Determinar si la notificación fue leída"""
        # Para notificaciones in-app, se considera leída si fue entregada
        if obj.channel == 'in_app':
            return obj.status == 'delivered'
        # Para otros canales, se considera leída si fue enviada
        return obj.status in ['sent', 'delivered']


class MarkNotificationReadSerializer(serializers.Serializer):
    """Serializer para marcar notificaciones como leídas"""
    
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    
    def validate_notification_ids(self, value):
        """Validar que todas las notificaciones existen y pertenecen al usuario"""
        user = self.context['request'].user
        
        notifications = Notification.objects.filter(
            notification_id__in=value,
            recipient=user
        )
        
        if notifications.count() != len(value):
            raise serializers.ValidationError(
                "Algunas notificaciones no existen o no te pertenecen"
            )
        
        return value
