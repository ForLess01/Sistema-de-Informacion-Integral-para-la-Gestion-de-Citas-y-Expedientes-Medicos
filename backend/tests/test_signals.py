"""
Tests de signals y eventos
"""
from django.test import TestCase
from unittest.mock import patch
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from appointments.models import Appointment
from notifications.models import Notification


class TestSignals(TestCase):
    """Tests para verificar el comportamiento de los signals"""

    @patch('notifications.models.Notification.send')
    def test_appointment_confirmation_creates_notification(self, mock_send):
        """Verificar que la confirmación de cita crea una notificación"""
        appointment = Appointment.objects.create(
            patient_id=1,  # Asume IDs de prueba existentes
            doctor_id=1,
            status='confirmed',
            appointment_date='2025-07-15'
        )

        # Verifica que se creó la notificación
        notification = Notification.objects.filter(
            user_id=appointment.patient_id,
            notification_type='appointment_confirmation'
        )
        self.assertTrue(notification.exists())
        
        # Verifica que la notificación fue enviada
        mock_send.assert_called_once()

    @patch('appointments.models.Appointment.cancel')
    @patch('notifications.models.Notification.send')
    def test_appointment_cancellation(self, mock_send, mock_cancel):
        """Verificar que la cancelación de cita envía notificación"""
        appointment = Appointment.objects.create(
            patient_id=1,
            doctor_id=1,
            status='cancelled',
            appointment_date='2025-07-15'
        )
        
        # Cancela la cita
        appointment.delete()

        # Verifica que la notificación fue enviada
        mock_send.assert_called_once()

