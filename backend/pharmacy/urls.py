from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MedicationViewSet,
    DispensationViewSet,
    MedicationCategoryViewSet,
    MedicationBatchViewSet,
    StockMovementViewSet,
    PharmacyReportViewSet
)

router = DefaultRouter()
router.register(r'medications', MedicationViewSet, basename='medication')
router.register(r'dispensations', DispensationViewSet, basename='dispensation')
router.register(r'medication-categories', MedicationCategoryViewSet, basename='medicationcategory')
router.register(r'medication-batches', MedicationBatchViewSet, basename='medicationbatch')
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')
router.register(r'pharmacy-reports', PharmacyReportViewSet, basename='pharmacyreport')

urlpatterns = [
    path('', include(router.urls)),
]
