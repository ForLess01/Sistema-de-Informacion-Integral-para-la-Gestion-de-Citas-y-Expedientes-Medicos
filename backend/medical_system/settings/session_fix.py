"""
Configuración temporal para solucionar problemas de sesiones en desarrollo
"""

# Sobrescribir la configuración de sesiones para usar base de datos en lugar de caché
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_CACHE_ALIAS = 'default'

# Opcional: También podemos usar sesiones basadas en cookies firmadas
# SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'

# Configuración adicional de sesiones
SESSION_COOKIE_AGE = 86400  # 24 horas
SESSION_SAVE_EVERY_REQUEST = False  # Cambiar a False para evitar problemas
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # False en desarrollo, True en producción
