from django.urls import path
from .views import (
    DashboardStatsView, TodayAppointmentsView, EmergencyPatientsView,
    OdontologoStatsView, OdontologoAppointmentsView,
    DoctorStatsView, DoctorAppointmentsView,
    NurseStatsView, NurseAppointmentsView
)

urlpatterns = [
    # Rutas generales
    path('stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('today-appointments/', TodayAppointmentsView.as_view(), name='today_appointments'),
    path('emergency-patients/', EmergencyPatientsView.as_view(), name='emergency_patients'),
    
    # Rutas específicas para Odontólogo
    path('odontologo/stats/', OdontologoStatsView.as_view(), name='odontologo_stats'),
    path('odontologo/appointments/', OdontologoAppointmentsView.as_view(), name='odontologo_appointments'),
    
    # Rutas específicas para Doctor
    path('doctor/stats/', DoctorStatsView.as_view(), name='doctor_stats'),
    path('doctor/appointments/', DoctorAppointmentsView.as_view(), name='doctor_appointments'),
    
    # Rutas específicas para Nurse
    path('nurse/stats/', NurseStatsView.as_view(), name='nurse_stats'),
    path('nurse/appointments/', NurseAppointmentsView.as_view(), name='nurse_appointments'),
]
