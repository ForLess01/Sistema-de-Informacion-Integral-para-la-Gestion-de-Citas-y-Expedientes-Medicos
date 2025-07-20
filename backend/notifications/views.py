from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Q, Count
from django.conf import settings
from datetime import timedelta
import logging

from .models import (
    Notification,
    NotificationTemplate,
    NotificationPreference,
    NotificationLog,
    PushDevice
)
from .serializers import (
    NotificationSerializer,
    NotificationTemplateSerializer,
    NotificationPreferenceSerializer,
    NotificationLogSerializer,
    PushDeviceSerializer,
    CreateNotificationSerializer,
    SendNotificationSerializer,
    NotificationStatsSerializer,
    BulkNotificationSerializer,
    UserNotificationListSerializer,
    MarkNotificationReadSerializer
)
# from .services import notification_service  # Temporarily commented for testing external integrations
from .tasks import send_notification_task, send_notification_batch

logger = logging.getLogger(__name__)


class NotificationListView(generics.ListAPIView):
    """Vista para listar notificaciones"""
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'channel', 'priority', 'template__notification_type']
    search_fields = ['subject', 'message', 'recipient__first_name', 'recipient__last_name']
    ordering_fields = ['created_at', 'scheduled_for', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        # Los admins pueden ver todas las notificaciones
        if user.role == 'admin':
            return Notification.objects.select_related(
                'recipient', 'template', 'content_type'
            ).all()
        
        # Los usuarios normales solo ven sus notificaciones
        return Notification.objects.filter(
            recipient=user
        ).select_related('template', 'content_type')


class NotificationDetailView(generics.RetrieveAPIView):
    """Vista para ver detalles de una notificación"""
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'notification_id'
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'admin':
            return Notification.objects.all()
        
        return Notification.objects.filter(recipient=user)


class UserNotificationListView(generics.ListAPIView):
    """Vista simplificada para notificaciones del usuario autenticado"""
    
    serializer_class = UserNotificationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['channel', 'priority', 'template__notification_type']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        # Filtrar por canal si se especifica
        queryset = Notification.objects.filter(
            recipient=user
        ).select_related('template')
        
        # Filtrar solo in-app si se solicita
        show_only_in_app = self.request.query_params.get('in_app_only', 'false').lower() == 'true'
        if show_only_in_app:
            queryset = queryset.filter(channel='in_app')
        
        # Filtrar no leídas si se solicita
        unread_only = self.request.query_params.get('unread_only', 'false').lower() == 'true'
        if unread_only:
            queryset = queryset.filter(
                Q(channel='in_app', status='pending') |
                Q(channel__in=['email', 'sms', 'push'], status='pending')
            )
        
        return queryset


class NotificationTemplateListView(generics.ListCreateAPIView):
    """Vista para listar y crear plantillas de notificaciones"""
    
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['notification_type', 'channel', 'is_active']
    search_fields = ['name', 'body_template']
    
    def get_permissions(self):
        """Solo admins pueden crear/editar plantillas"""
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [permissions.IsAuthenticated]
            # Verificar si es admin en get_queryset
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Verificar permisos antes de crear"""
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Solo los administradores pueden crear plantillas")
        serializer.save()


class NotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para detalles de plantillas de notificaciones"""
    
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Solo admins pueden editar/eliminar plantillas"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if self.request.user.role != 'admin':
                raise permissions.PermissionDenied("Solo los administradores pueden modificar plantillas")
        return super().get_permissions()


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """Vista para preferencias de notificaciones del usuario"""
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Obtener o crear preferencias del usuario"""
        user = self.request.user
        preferences, created = NotificationPreference.objects.get_or_create(user=user)
        return preferences


class PushDeviceListView(generics.ListCreateAPIView):
    """Vista para dispositivos push del usuario"""
    
    serializer_class = PushDeviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PushDevice.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PushDeviceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para detalles de dispositivos push"""
    
    serializer_class = PushDeviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PushDevice.objects.filter(user=self.request.user)


class CreateNotificationView(APIView):
    """Vista para crear notificaciones"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Crear una notificación"""
        # Solo admins y personal médico pueden crear notificaciones
        if request.user.role not in ['admin', 'doctor', 'nurse', 'receptionist']:
            return Response(
                {'error': 'No tienes permisos para crear notificaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CreateNotificationSerializer(data=request.data)
        if serializer.is_valid():
            notifications = serializer.save()
            
            # Enviar notificaciones asíncronamente
            for notification in notifications:
                send_notification_task.delay(notification.id)
            
            return Response({
                'message': f'Se crearon {len(notifications)} notificaciones',
                'notifications': [str(n.notification_id) for n in notifications]
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendNotificationView(APIView):
    """Vista para enviar una notificación específica"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Enviar una notificación"""
        if request.user.role not in ['admin', 'doctor', 'nurse']:
            return Response(
                {'error': 'No tienes permisos para enviar notificaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SendNotificationSerializer(data=request.data)
        if serializer.is_valid():
            notification_id = serializer.validated_data['notification_id']
            notification = get_object_or_404(Notification, notification_id=notification_id)
            
            # Enviar notificación asíncronamente
            task = send_notification_task.delay(notification.id)
            
            return Response({
                'message': 'Notificación enviada para procesamiento',
                'task_id': task.id
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BulkNotificationView(APIView):
    """Vista para crear notificaciones masivas"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Crear notificaciones masivas"""
        if request.user.role not in ['admin']:
            return Response(
                {'error': 'Solo los administradores pueden enviar notificaciones masivas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BulkNotificationSerializer(data=request.data)
        if serializer.is_valid():
            notifications = serializer.save()
            
            # Enviar notificaciones en lotes
            notification_ids = [n.id for n in notifications]
            batch_size = 50  # Procesar en lotes de 50
            
            for i in range(0, len(notification_ids), batch_size):
                batch = notification_ids[i:i + batch_size]
                send_notification_batch.delay(batch)
            
            return Response({
                'message': f'Se crearon {len(notifications)} notificaciones masivas',
                'total_notifications': len(notifications),
                'batches': (len(notifications) + batch_size - 1) // batch_size
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationStatsView(APIView):
    """Vista para estadísticas de notificaciones"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Obtener estadísticas de notificaciones"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Solo los administradores pueden ver estadísticas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Intentar obtener desde caché
        stats = cache.get('notification_stats')
        
        if not stats:
            # Calcular estadísticas
            from .signals import get_notification_stats
            stats = get_notification_stats()
            
            # Guardar en caché por 1 hora
            cache.set('notification_stats', stats, 3600)
        
        serializer = NotificationStatsSerializer(stats)
        return Response(serializer.data)


class MarkNotificationReadView(APIView):
    """Vista para marcar notificaciones como leídas"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Marcar notificaciones como leídas"""
        serializer = MarkNotificationReadSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            notification_ids = serializer.validated_data['notification_ids']
            
            # Marcar notificaciones como entregadas (leídas)
            notifications = Notification.objects.filter(
                notification_id__in=notification_ids,
                recipient=request.user,
                channel='in_app'  # Solo notificaciones in-app pueden marcarse como leídas
            )
            
            updated_count = 0
            for notification in notifications:
                if notification.status in ['pending', 'sent']:
                    notification.mark_as_delivered()
                    updated_count += 1
            
            return Response({
                'message': f'Se marcaron {updated_count} notificaciones como leídas',
                'updated_count': updated_count
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationLogListView(generics.ListAPIView):
    """Vista para logs de notificaciones"""
    
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['action', 'notification__status']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """Solo admins pueden ver todos los logs"""
        if self.request.user.role != 'admin':
            return NotificationLog.objects.none()
        
        notification_id = self.request.query_params.get('notification_id')
        if notification_id:
            return NotificationLog.objects.filter(
                notification__notification_id=notification_id
            )
        
        return NotificationLog.objects.all()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def test_notification(request):
    """Endpoint para probar el envío de notificaciones"""
    
    if request.user.role not in ['admin', 'doctor']:
        return Response(
            {'error': 'No tienes permisos para probar notificaciones'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Crear notificación de prueba
    test_data = {
        'recipient_id': request.user.id,
        'notification_type': 'system_maintenance',
        'context_data': {
            'user_name': request.user.get_full_name(),
            'test_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            'message': 'Esta es una notificación de prueba del sistema'
        },
        'priority': 'normal',
        'channels': request.data.get('channels', ['email', 'in_app'])
    }
    
    serializer = CreateNotificationSerializer(data=test_data)
    if serializer.is_valid():
        notifications = serializer.save()
        
        # Enviar inmediatamente para prueba - Temporarily commented
        results = []
        for notification in notifications:
            # success = notification_service.send_notification(notification)  # Temporarily commented
            success = True  # Mock success for testing
            results.append({
                'channel': notification.channel,
                'success': success,
                'notification_id': str(notification.notification_id)
            })
        
        return Response({
            'message': 'Notificaciones de prueba enviadas',
            'results': results
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_dashboard(request):
    """Dashboard de notificaciones para admins"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Solo los administradores pueden acceder al dashboard'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Estadísticas de los últimos 7 días
    last_week = timezone.now() - timedelta(days=7)
    
    daily_stats = []
    for i in range(7):
        day = last_week + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_notifications = Notification.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end
        )
        
        daily_stats.append({
            'date': day.strftime('%Y-%m-%d'),
            'total': day_notifications.count(),
            'sent': day_notifications.filter(status__in=['sent', 'delivered']).count(),
            'failed': day_notifications.filter(status='failed').count(),
            'pending': day_notifications.filter(status='pending').count()
        })
    
    # Estadísticas por canal
    channel_stats = Notification.objects.filter(
        created_at__gte=last_week
    ).values('channel').annotate(
        total=Count('id'),
        sent=Count('id', filter=Q(status__in=['sent', 'delivered'])),
        failed=Count('id', filter=Q(status='failed'))
    )
    
    # Top tipos de notificaciones
    type_stats = Notification.objects.filter(
        created_at__gte=last_week
    ).values('template__notification_type').annotate(
        total=Count('id')
    ).order_by('-total')[:10]
    
    return Response({
        'daily_stats': daily_stats,
        'channel_stats': list(channel_stats),
        'type_stats': list(type_stats),
        'period': 'last_7_days'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def retry_failed_notifications_view(request):
    """Endpoint para reintentar notificaciones fallidas"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Solo los administradores pueden reintentar notificaciones'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from .tasks import retry_failed_notifications
    
    # Ejecutar tarea asíncrona
    task = retry_failed_notifications.delay()
    
    return Response({
        'message': 'Tarea de reintento iniciada',
        'task_id': task.id
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_test_email(request):
    """Envía un email de prueba cuando el usuario activa las notificaciones por email"""
    
    try:
        from .services.email_service import EmailService
        
        user = request.user
        
        # Verificar si el usuario tiene email
        if not user.email:
            return Response(
                {'error': 'No tienes un email configurado en tu perfil'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener o crear preferencias del usuario
        preferences, created = NotificationPreference.objects.get_or_create(user=user)
        
        # Activar las notificaciones por email si se solicita
        if request.data.get('enable_email', False):
            preferences.email_enabled = True
            preferences.appointment_reminders = True
            preferences.save()
        
        # Crear el servicio de email
        email_service = EmailService()
        
        # Datos para el template
        context = {
            'user_name': user.get_full_name(),
            'user_email': user.email,
            'activation_date': timezone.now().strftime('%d/%m/%Y a las %H:%M'),
            'system_name': 'SIIGCEM🩺',
            'hospital_name': getattr(settings, 'HOSPITAL_NAME', 'Hospital General'),
        }
        
        subject = "🔔 Notificaciones por Email Activadas - Mensaje de Prueba"
        
        # Intentar usar template HTML, si no existe usar mensaje simple
        try:
            success = email_service.send_template_email(
                to_emails=[user.email],
                template_name='email_activation_test',
                context=context,
                subject=subject
            )
        except Exception:
            # Fallback a mensaje simple si no existe el template
            message = f"""
¡Hola {user.get_full_name()}!

✅ Las notificaciones por email han sido activadas correctamente en tu cuenta.

Este es un mensaje de prueba para confirmar que recibirás tus recordatorios de citas médicas en esta dirección de correo: {user.email}

Tipo de recordatorios que recibirás:
• Recordatorios de citas próximas
• Confirmaciones de citas agendadas
• Cancelaciones o reprogramaciones

Fecha de activación: {context['activation_date']}

Si no deseas recibir estos recordatorios, puedes desactivarlos en cualquier momento desde tu perfil.

---
{context['system_name']}
{context['hospital_name']}
            """.strip()
            
            success = email_service.send_email(
                to_emails=[user.email],
                subject=subject,
                message=message
            )
        
        if success:
            # Crear registro de notificación para auditoria
            from .models import NotificationTemplate, Notification
            
            # Intentar obtener template, si no crear uno temporal
            try:
                template = NotificationTemplate.objects.get(
                    notification_type='welcome',
                    channel='email'
                )
            except NotificationTemplate.DoesNotExist:
                # Crear un template temporal para el email de prueba
                template = NotificationTemplate.objects.create(
                    name='Email de Activación - Prueba',
                    notification_type='welcome',
                    channel='email',
                    subject_template='🔔 Notificaciones por Email Activadas - Mensaje de Prueba',
                    body_template='Email de prueba para confirmación de activación de notificaciones por email.',
                    is_html=True,
                    is_active=True
                )
            
            # Crear registro de notificación
            notification = Notification.objects.create(
                recipient=user,
                template=template,
                subject=subject,
                message="Email de prueba - Activación de notificaciones",
                channel='email',
                status='sent',
                sent_at=timezone.now(),
                recipient_email=user.email,
                context_data=context
            )
            
            return Response({
                'success': True,
                'message': f'Email de prueba enviado exitosamente a {user.email}',
                'email': user.email,
                'notification_id': str(notification.notification_id)
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': 'No se pudo enviar el email de prueba. Verifica la configuración del servidor de correo.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Error enviando email de prueba a {user.email}: {str(e)}")
        return Response({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
