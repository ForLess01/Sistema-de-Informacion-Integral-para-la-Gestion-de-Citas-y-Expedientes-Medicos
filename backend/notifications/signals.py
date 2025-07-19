from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import logging

from appointments.models import Appointment
from authentication.models import User
# from .services import notification_service  # Temporarily commented for testing external integrations
from .models import NotificationPreference

logger = logging.getLogger(__name__)

User = get_user_model()


@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """
    Crea preferencias de notificación por defecto para usuarios nuevos
    """
    if created:
        try:
            NotificationPreference.objects.create(user=instance)
            logger.info(f"Created notification preferences for user {instance.id}")
        except Exception as e:
            logger.error(f"Error creating notification preferences for user {instance.id}: {str(e)}")


# All other signal handlers temporarily commented for testing external integrations
# They will be restored after external integrations are configured
# The original signals.py is backed up as signals_backup.py
