"""
URL configuration for medical_system project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Vista de bienvenida
def welcome_view(request):
    return JsonResponse({
        'message': 'Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'api_documentation': '/api/swagger/',
            'admin_panel': '/admin/',
            'api_schema': '/api/schema/',
            'authentication': '/api/v1/auth/',
            'dashboard': '/api/v1/dashboard/',
            'appointments': '/api/v1/appointments/',
            'medical_records': '/api/v1/medical-records/',
            'pharmacy': '/api/v1/pharmacy/',
            'emergency': '/api/v1/emergency/',
            'reports': '/api/v1/reports/',
            'notifications': '/api/v1/notifications/',
            'external_api': '/api/v1/external/',
        }
    })

urlpatterns = [
    # Página de bienvenida
    path('', welcome_view, name='welcome'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('api/v1/appointments/', include('appointments.urls')),
    path('api/v1/medical-records/', include('medical_records.urls')),
    path('api/v1/pharmacy/', include('pharmacy.urls')),
    path('api/v1/emergency/', include('emergency.urls')),
    path('api/v1/reports/', include('reports.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    
    # API Externa para otros sistemas
    path('api/v1/external/', include('api_external.urls')),
    
    # Documentación API con DRF Spectacular
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Servir archivos estáticos y media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
