from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_financial import FinancialReportViewSet
from .views_emergency import EmergencyReportViewSet

router = DefaultRouter()
router.register(r'templates', views.ReportTemplateViewSet, basename='report-template')
router.register(r'generated', views.GeneratedReportViewSet, basename='generated-report')
router.register(r'scheduled', views.ScheduledReportViewSet, basename='scheduled-report')
router.register(r'audit', views.ReportAuditViewSet, basename='report-audit')
router.register(r'dashboard', views.DashboardStatsView, basename='dashboard-stats')
router.register(r'financial', FinancialReportViewSet, basename='financial-report')
router.register(r'emergency', EmergencyReportViewSet, basename='emergency-report')

urlpatterns = [
    path('', include(router.urls)),
]
