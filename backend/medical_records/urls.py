from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'medical-records', views.MedicalRecordViewSet, basename='medical-record')
router.register(r'vital-signs', views.VitalSignsViewSet, basename='vital-signs')
router.register(r'prescriptions', views.PrescriptionViewSet, basename='prescription')
router.register(r'diagnoses', views.DiagnosisViewSet, basename='diagnosis')

urlpatterns = [
    # Rutas personalizadas
    path('consultations/', views.ConsultationsListView.as_view(), name='consultations-list'),
    path('consultations/<int:consultation_id>/', views.ConsultationDetailAPIView.as_view(), name='consultation-detail'),
    path('patients/<int:patient_id>/record/', views.PatientRecordView.as_view(), name='patient-record'),
    path('patients/<int:patient_id>/diagnoses/', views.PatientDiagnosesView.as_view(), name='patient-diagnoses'),
    path('patients/<int:patient_id>/vital-signs/', views.PatientVitalSignsView.as_view(), name='patient-vital-signs'),
    path('patients/<int:patient_id>/allergies/', views.PatientAllergiesView.as_view(), name='patient-allergies'),
    path('patients/<int:patient_id>/prescriptions/', views.PatientPrescriptionsView.as_view(), name='patient-prescriptions'),
    path('prescriptions/<int:id>/', views.PrescriptionDetailView.as_view(), name='prescription-detail'),
    path('doctor/prescriptions/', views.DoctorPrescriptionsView.as_view(), name='doctor-prescriptions'),
    path('patients/<int:patient_id>/documents/', views.PatientDocumentsView.as_view(), name='patient-documents'),
    path('patients/<int:patient_id>/history/', views.PatientHistoryView.as_view(), name='patient-history'),
    
    # Incluir rutas del router
    path('', include(router.urls)),
]
