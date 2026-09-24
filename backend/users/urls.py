from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    ChangePasswordView, FeedbackSubmitView,
    ForgotPasswordView, ResetPasswordView,
)

from .admin_views import AdminUserViewSet, AdminProfessionalCategoryViewSet

router = DefaultRouter()
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'admin/professions', AdminProfessionalCategoryViewSet, basename='admin-professions')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('feedback/', FeedbackSubmitView.as_view(), name='auth-feedback-submit'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    
    # Admin URLs
    path("", include(router.urls)),
]
