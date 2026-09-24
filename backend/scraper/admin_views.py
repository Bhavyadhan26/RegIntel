import subprocess
import sys
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from .models import WebsiteScrapingRun, WebsiteScrapingSource, WebsiteScrapingSelector, WebsiteScrapingData, UserFeedback
from .admin_serializers import (
    WebsiteScrapingRunSerializer, WebsiteScrapingSourceSerializer, 
    WebsiteScrapingSelectorSerializer, WebsiteScrapingDataSerializer, UserFeedbackSerializer
)

class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

class TriggerScraperView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def post(self, request):
        website = request.query_params.get('website')
        cmd = [sys.executable, 'manage.py', 'website_scraper']
        if website:
            cmd.extend(['--website', website])
        
        # Launch asynchronously
        subprocess.Popen(cmd)
        
        return Response({"status": "started", "message": "Scraper triggered successfully"})

class AdminSourceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = WebsiteScrapingSource.objects.all().order_by("website_name")
    serializer_class = WebsiteScrapingSourceSerializer

class AdminSelectorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = WebsiteScrapingSelector.objects.all()
    serializer_class = WebsiteScrapingSelectorSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        website = self.request.query_params.get('website_name')
        if website:
            qs = qs.filter(website_name=website)
        return qs

class AdminDataViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = WebsiteScrapingData.objects.all().order_by("-created_at")
    serializer_class = WebsiteScrapingDataSerializer

class AdminRunLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = WebsiteScrapingRun.objects.all().order_by("-started_at")
    serializer_class = WebsiteScrapingRunSerializer

class AdminFeedbackViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = UserFeedback.objects.all().order_by('-created_at')
    serializer_class = UserFeedbackSerializer