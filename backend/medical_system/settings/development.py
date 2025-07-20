"""
Development settings for medical_system project.
"""
from .base import *
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'testserver']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='medical_system'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Debug Toolbar
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    INTERNAL_IPS = ['127.0.0.1', 'localhost']

# CORS - En desarrollo permitir cualquier origen
CORS_ALLOW_ALL_ORIGINS = True

# Configuración adicional para desarrollo
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Descomentado para usar SendGrid

# Configuración de Email Service
EMAIL_PROVIDER = config('EMAIL_PROVIDER', default='sendgrid')  # Usar SendGrid
SENDGRID_API_KEY = config('SENDGRID_API_KEY', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='rendoaltar@gmail.com')  # Cambiar por tu email verificado en SendGrid
HOSPITAL_NAME = config('HOSPITAL_NAME', default='SIIGCEM - Hospital 1')

# Deshabilitar caché en desarrollo
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Logging más detallado en desarrollo
LOGGING['handlers']['console']['level'] = 'INFO'
LOGGING['loggers']['django']['level'] = 'INFO'
LOGGING['loggers']['medical_system']['level'] = 'INFO'

# Configuración de archivos estáticos para desarrollo
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Celery - En desarrollo usar eager
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Fix para sesiones en desarrollo - Usar base de datos en lugar de Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_SAVE_EVERY_REQUEST = False
