from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, ProfileView,
    ChangePasswordView, UserListView, Enable2FAView, Confirm2FAView,
    Disable2FAView, Verify2FAView, RegenerateBackupTokensView
)

urlpatterns = [
    # JWT Authentication
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
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
]
