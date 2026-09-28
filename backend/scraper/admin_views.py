import subprocess
import sys
from pathlib import Path
from django.db.models import Count
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
        skip_summary = request.query_params.get('skip_summary', '').lower() in {'1', 'true', 'yes'}
        summary_only = request.query_params.get('summary_only', '').lower() in {'1', 'true', 'yes'}
        if website:
            source = WebsiteScrapingSource.objects.filter(
                website_name__iexact=website,
                active=True,
            ).first()
            if not source:
                return Response(
                    {"detail": "The selected website is inactive or not configured."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if summary_only and skip_summary:
            return Response({"detail": "summary_only and skip_summary cannot be combined."}, status=status.HTTP_400_BAD_REQUEST)

        if WebsiteScrapingRun.objects.filter(status__in=['queued', 'running']).exists():
            return Response(
                {"detail": "A scraper run is already active."},
                status=status.HTTP_409_CONFLICT,
            )

        cmd = [sys.executable, 'manage.py', 'website_scraper']
        if website:
            cmd.extend(['--website', website])
        if skip_summary:
            cmd.append('--skip-summary')
        if summary_only:
            cmd.append('--summary-only')
        
        backend_dir = Path(__file__).resolve().parents[1]
        subprocess.Popen(cmd, cwd=str(backend_dir), close_fds=True)
        
        mode = "summary retry only" if summary_only else ("scrape only" if skip_summary else "scrape and summary processing")
        return Response({"status": "started", "message": f"{mode} run triggered successfully"})


class PendingSummaryCountView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        queryset = WebsiteScrapingData.objects.filter(
            processed=False,
            pdf_url__isnull=False,
        ).exclude(pdf_url='')
        rows = queryset.values("website_name").annotate(total=Count("id"))
        return Response({
            "total": queryset.count(),
            "by_website": {row["website_name"]: row["total"] for row in rows},
        })

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