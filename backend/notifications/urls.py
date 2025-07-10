from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'notifications'

# URLs principales
urlpatterns = [
    # Notificaciones
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<uuid:notification_id>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('user/', views.UserNotificationListView.as_view(), name='user-notifications'),
    path('user/mark-read/', views.MarkNotificationReadView.as_view(), name='mark-read'),
    
    # Plantillas
    path('templates/', views.NotificationTemplateListView.as_view(), name='template-list'),
    path('templates/<int:pk>/', views.NotificationTemplateDetailView.as_view(), name='template-detail'),
    
    # Preferencias
    path('preferences/', views.NotificationPreferenceView.as_view(), name='preferences'),
    
    # Dispositivos Push
    path('devices/', views.PushDeviceListView.as_view(), name='device-list'),
    path('devices/<int:pk>/', views.PushDeviceDetailView.as_view(), name='device-detail'),
    
    # Acciones
    path('create/', views.CreateNotificationView.as_view(), name='create'),
    path('send/', views.SendNotificationView.as_view(), name='send'),
    path('bulk/', views.BulkNotificationView.as_view(), name='bulk'),
    path('test/', views.test_notification, name='test'),
    path('retry/', views.retry_failed_notifications_view, name='retry'),
    
    # Estadísticas y logs
    path('stats/', views.NotificationStatsView.as_view(), name='stats'),
    path('dashboard/', views.notification_dashboard, name='dashboard'),
    path('logs/', views.NotificationLogListView.as_view(), name='logs'),
]
