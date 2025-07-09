"""
Django settings loader.
Esto carga la configuración correcta según el entorno.
"""

import os
from decouple import config

# Determinar qué configuración usar
ENVIRONMENT = config('DJANGO_ENVIRONMENT', default='development')

if ENVIRONMENT == 'production':
    from .production import *
elif ENVIRONMENT == 'testing':
    from .testing import *
else:
    from .development import *
