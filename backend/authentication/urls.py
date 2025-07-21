from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, DesktopTokenObtainPairView, RegisterView, ProfileView,
    ChangePasswordView, UserListView, Enable2FAView, Confirm2FAView,
    Disable2FAView, Verify2FAView, RegenerateBackupTokensView,
    CheckEmailView, CheckDNIView, PatientListView, PatientDetailView, PatientSearchView
)

urlpatterns = [
    # JWT Authentication
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  # Frontend Web (pacientes)
    path('desktop-login/', DesktopTokenObtainPairView.as_view(), name='desktop_token_obtain_pair'),  # Frontend Desktop (personal)
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Management
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/', UserListView.as_view(), name='user_list'),
    
    # Two-Factor Authentication
    path('2fa/enable/', Enable2FAView.as_view(), name='enable_2fa'),
    path('2fa/confirm/', Confirm2FAView.as_view(), name='confirm_2fa'),
    path('2fa/disable/', Disable2FAView.as_view(), name='disable_2fa'),
    path('2fa/verify/', Verify2FAView.as_view(), name='verify_2fa'),
    path('2fa/backup-tokens/', RegenerateBackupTokensView.as_view(), name='regenerate_backup_tokens'),
    
    # Validation
    path('check-email/', CheckEmailView.as_view(), name='check_email'),
    path('check-dni/', CheckDNIView.as_view(), name='check_dni'),
    
    # Patient Management
    path('patients/', PatientListView.as_view(), name='patient_list'),
    path('patients/<int:pk>/', PatientDetailView.as_view(), name='patient_detail'),
    path('patients/search/', PatientSearchView.as_view(), name='patient_search'),
]
