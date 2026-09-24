from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth.models import User
from .models import ProfessionalCategory
from .admin_serializers import AdminProfessionalCategorySerializer, AdminUserSerializer

class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

class AdminProfessionalCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = ProfessionalCategory.objects.all().order_by("name")
    serializer_class = AdminProfessionalCategorySerializer

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
