from django.urls import path
from .views import (
    DashboardStatsView, TodayAppointmentsView, EmergencyPatientsView,
    OdontologoStatsView, OdontologoAppointmentsView,
    DoctorStatsView, DoctorAppointmentsView,
    DoctorDashboardStatsView, DoctorTodayAppointmentsView, 
    DoctorTriageQueueView, DoctorWaitingPatientsView,
    NurseStatsView, NurseAppointmentsView,
    PharmacyStatsView, LowStockMedicinesView, PendingPrescriptionsView, RecentMedicineMovementsView
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
    path('doctor/stats/', DoctorDashboardStatsView.as_view(), name='doctor_stats'),
    path('doctor/appointments/', DoctorTodayAppointmentsView.as_view(), name='doctor_appointments'),
    path('doctor/triage-queue/', DoctorTriageQueueView.as_view(), name='doctor_triage_queue'),
    path('doctor/waiting-patients/', DoctorWaitingPatientsView.as_view(), name='doctor_waiting_patients'),
    
    # Rutas específicas para Nurse
    path('nurse/stats/', NurseStatsView.as_view(), name='nurse_stats'),
    path('nurse/appointments/', NurseAppointmentsView.as_view(), name='nurse_appointments'),
    
    # Rutas específicas para Farmacia
    path('pharmacy/stats/', PharmacyStatsView.as_view(), name='pharmacy_stats'),
    path('pharmacy/low-stock/', LowStockMedicinesView.as_view(), name='pharmacy_low_stock'),
    path('pharmacy/pending-prescriptions/', PendingPrescriptionsView.as_view(), name='pharmacy_pending_prescriptions'),
    path('pharmacy/recent-movements/', RecentMedicineMovementsView.as_view(), name='pharmacy_recent_movements'),
]
