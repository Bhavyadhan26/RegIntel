import subprocess
import sys
from pathlib import Path
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from .models import (
    WebsiteScrapingRun, WebsiteScrapingSource, WebsiteScrapingSelector,
    WebsiteScrapingData, UserFeedback, WebsiteScrapingSiteProgress,
    WebsiteScrapingItemProgress,
)
from .database import open_scraper_connection
from .run_lock import request_cancel
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
        summary_limit_value = request.query_params.get('summary_limit', '').strip()
        try:
            summary_limit = int(summary_limit_value) if summary_limit_value else None
        except ValueError:
            return Response({"detail": "summary_limit must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)
        if summary_limit is not None and summary_limit <= 0:
            return Response({"detail": "summary_limit must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)
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
        if summary_limit is not None:
            cmd.extend(['--summary-limit', str(summary_limit)])
        
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


class PipelineStatusView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        run = WebsiteScrapingRun.objects.order_by("-started_at", "-id").first()
        totals_by_site = {
            row["website_name"]: row["total"]
            for row in WebsiteScrapingData.objects.values("website_name").annotate(total=Count("id"))
        }
        if not run:
            return Response({"run": None, "sites": [], "website_totals": totals_by_site, "pending_summaries": 0})

        pending = WebsiteScrapingData.objects.filter(
            processed=False, pdf_url__isnull=False,
        ).exclude(pdf_url="").count()
        progress_by_site = {
            row["website_name"]: row
            for row in run.site_progress.order_by("website_name").values(
                "website_name", "status", "stage", "current_url",
                "heartbeat_at", "finished_at", "discovered_rows",
                "new_rows", "processed_rows", "failed_rows", "error_message",
            )
        }
        stats_by_site = {
            row["website_name"]: row["new_rows"]
            for row in run.site_stats.values("website_name", "new_rows")
        }
        sites = []
        involved_sites = set(progress_by_site) | set(stats_by_site)
        for source in WebsiteScrapingSource.objects.filter(website_name__in=involved_sites).order_by("website_name"):
            sites.append({
                "website_name": source.website_name,
                "active": source.active,
                "total_notices": totals_by_site.get(source.website_name, 0),
                "latest_new_notices": stats_by_site.get(source.website_name, 0),
                **progress_by_site.get(source.website_name, {
                    "status": "not_run",
                    "stage": None,
                    "current_url": None,
                    "heartbeat_at": None,
                    "finished_at": None,
                    "discovered_rows": 0,
                    "new_rows": 0,
                    "processed_rows": 0,
                    "failed_rows": 0,
                    "error_message": None,
                }),
            })
        item_rows = list(
            WebsiteScrapingItemProgress.objects.filter(run=run)
            .exclude(status="completed")
            .order_by("-started_at")
            .values("data_id", "website_name", "stage", "status", "started_at", "finished_at", "error_message")[:200]
        )
        failure_map = {}
        for item in item_rows:
            reason = (item["error_message"] or "Unknown failure").strip()
            entry = failure_map.setdefault(reason, {"reason": reason, "count": 0, "sites": set(), "items": []})
            entry["count"] += 1
            entry["sites"].add(item["website_name"])
            entry["items"].append(item)
        failures = [
            {**entry, "sites": sorted(entry["sites"])}
            for entry in failure_map.values()
        ]
        return Response({
            "run": {
                "id": run.id,
                "status": run.status,
                "action": run.action or "full",
                "started_at": run.started_at,
                "finished_at": run.finished_at,
                "total_new_rows": run.total_new_rows,
                "error_text": run.error_text,
                "activity": run.action or "full",
                "websites": sorted(set(progress_by_site) | set(stats_by_site)),
                "duration_seconds": max(
                    int(((run.finished_at or timezone.now()) - run.started_at).total_seconds()),
                    0,
                ) if run.started_at else 0,
                "duration_display": str(
                    (run.finished_at or timezone.now()) - run.started_at
                ).split('.')[0] if run.started_at else "0:00:00",
                "metrics": {
                    "new_rows": run.total_new_rows,
                    "failed": run.summary_failed if run.action == "summary" else sum(site["failed_rows"] for site in sites),
                    "processed": run.summary_success if run.action == "summary" else sum(site["processed_rows"] for site in sites),
                    "pending_before": run.pending_before,
                    "success": run.summary_success,
                    "pending_after": run.pending_after,
                },
            },
            "sites": sites,
            "website_totals": totals_by_site,
            "items": item_rows,
            "failure_reasons": sorted(failures, key=lambda item: (-item["count"], item["reason"])),
            "pending_summaries": pending,
        })


class StopScraperView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def post(self, request):
        if not WebsiteScrapingRun.objects.filter(status__in=["queued", "running"]).exists():
            return Response({"detail": "No active scraper run."}, status=status.HTTP_409_CONFLICT)
        connection = open_scraper_connection()
        try:
            request_cancel(connection)
        finally:
            connection.close()
        return Response({"status": "cancellation_requested"})

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
    queryset = WebsiteScrapingData.objects.all()
    serializer_class = WebsiteScrapingDataSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        search = (request.query_params.get("search") or "").strip()
        website = (request.query_params.get("website") or "").strip()
        category = (request.query_params.get("category") or "").strip()
        processed = (request.query_params.get("processed") or "").strip().lower()
        ordering = request.query_params.get("ordering", "-created_at")
        allowed_ordering = {
            "id", "-id", "title", "-title", "website_name", "-website_name",
            "category", "-category", "notice_date", "-notice_date",
            "due_date", "-due_date", "processed", "-processed",
            "created_at", "-created_at", "updated_at", "-updated_at",
        }
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(summary__icontains=search)
                | Q(website_name__icontains=search)
                | Q(category__icontains=search)
                | Q(notice_date__icontains=search)
                | Q(due_date__icontains=search)
            )
        if website:
            queryset = queryset.filter(website_name__iexact=website)
        if category:
            queryset = queryset.filter(category__iexact=category)
        if processed in {"true", "false"}:
            queryset = queryset.filter(processed=processed == "true")

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
            page_size = min(max(int(request.query_params.get("page_size", 50)), 1), 100)
        except ValueError:
            page, page_size = 1, 50

        ordering = ordering if ordering in allowed_ordering else "-created_at"
        queryset = queryset.order_by(ordering, "-id")
        total = queryset.count()
        offset = (page - 1) * page_size
        rows = queryset[offset:offset + page_size]
        return Response({
            "results": self.get_serializer(rows, many=True).data,
            "page": page,
            "page_size": page_size,
            "total": total,
            "has_more": offset + page_size < total,
        })

class AdminRunLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = WebsiteScrapingRun.objects.all().order_by("-started_at")
    serializer_class = WebsiteScrapingRunSerializer

class AdminFeedbackViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = UserFeedback.objects.all().order_by('-created_at')
    serializer_class = UserFeedbackSerializer