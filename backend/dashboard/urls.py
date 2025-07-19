from django.urls import path
from .views import (
    DashboardStatsView, TodayAppointmentsView, EmergencyPatientsView
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('today-appointments/', TodayAppointmentsView.as_view(), name='today_appointments'),
    path('emergency-patients/', EmergencyPatientsView.as_view(), name='emergency_patients'),
]
