import sys
from pathlib import Path
from subprocess import Popen
from datetime import timedelta
from datetime import timezone as dt_timezone

from django.contrib import messages
from django.contrib.admin import AdminSite
from django.db import DatabaseError
from django.db.models import Count, Q
from django.http import HttpResponseRedirect
from django.http import JsonResponse
from django.urls import path, reverse
from django.utils import timezone

from .database import open_scraper_connection
from .run_lock import request_cancel

from .models import (
    WebsiteScrapingData,
    WebsiteScrapingRun,
    WebsiteScrapingRunSiteDetail,
    WebsiteScrapingSelector,
    WebsiteScrapingSource,
)


def _format_ist(dt_value):
    if not dt_value:
        return None

    # MySQL + managed=False models can return naive datetimes depending on backend settings.
    # Normalize to UTC first, then convert to IST for consistent dashboard display.
    if timezone.is_naive(dt_value):
        dt_value = timezone.make_aware(dt_value, dt_timezone.utc)

    ist_dt = timezone.localtime(dt_value, timezone.get_fixed_timezone(330))
    return ist_dt.strftime("%d %b %Y, %I:%M:%S %p")


class RegIntelAdminSite(AdminSite):
    site_header = "RegIntel Administration"
    site_title = "RegIntel Admin"
    index_title = "Website Scraper Control Panel"
    index_template = "scraper/admin_dashboard.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("run-scraper/", self.admin_view(self.run_scraper_view), name="run-scraper"),
            path("run-scraper/<str:website_name>/", self.admin_view(self.run_site_view), name="run-site-scraper"),
            path("toggle-scraper/<str:website_name>/", self.admin_view(self.toggle_site_view), name="toggle-site-scraper"),
            path("scraper-status/", self.admin_view(self.scraper_status_view), name="scraper-status"),
            path("stop-scraper/", self.admin_view(self.stop_scraper_view), name="stop-scraper"),
        ]
        return custom_urls + urls

    def has_permission(self, request):
        user = request.user
        return bool(user and user.is_active and user.is_superuser)

    def run_scraper_view(self, request):
        if request.method != "POST":
            messages.warning(request, "Use the dashboard button to run the scraper.")
            return HttpResponseRedirect(reverse("regintel_admin:index"))

        if WebsiteScrapingRun.objects.filter(status="running").exists():
            messages.warning(
                request,
                "A scraper run is already in progress. Check Run Logs before starting another run.",
            )
            return HttpResponseRedirect(reverse("regintel_admin:index"))

        backend_dir = Path(__file__).resolve().parents[1]
        logs_dir = backend_dir / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        log_file = logs_dir / "website_scraper_manual.log"

        with log_file.open("a", encoding="utf-8") as stream:
            stream.write(f"\n[{timezone.now().isoformat()}] Manual scraper trigger requested from admin.\n")

        with log_file.open("a", encoding="utf-8") as stream:
            Popen(
                [sys.executable, "manage.py", "website_scraper"],
                cwd=str(backend_dir),
                stdout=stream,
                stderr=stream,
                close_fds=True,
            )

        messages.success(
            request,
            "Scraper started in the background. Refresh Run Logs in a few moments to monitor progress.",
        )
        return HttpResponseRedirect(reverse("regintel_admin:index"))

    def run_site_view(self, request, website_name):
        if request.method != "POST":
            return HttpResponseRedirect(reverse("regintel_admin:index"))

        source = WebsiteScrapingSource.objects.filter(website_name__iexact=website_name).first()
        if not source or not source.active:
            messages.error(request, f"{website_name.upper()} is inactive or not configured.")
            return HttpResponseRedirect(reverse("regintel_admin:index"))
        if WebsiteScrapingRun.objects.filter(status="running").exists():
            messages.warning(request, "A scraper run is already active.")
            return HttpResponseRedirect(reverse("regintel_admin:index"))

        backend_dir = Path(__file__).resolve().parents[1]
        logs_dir = backend_dir / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        log_file = logs_dir / f"website_scraper_{source.website_name.lower()}.log"
        with log_file.open("a", encoding="utf-8") as stream:
            Popen(
                [sys.executable, "manage.py", "website_scraper", "--website", source.website_name.upper()],
                cwd=str(backend_dir),
                stdout=stream,
                stderr=stream,
                close_fds=True,
            )
        messages.success(request, f"{source.website_name} scraper started in the background.")
        return HttpResponseRedirect(reverse("regintel_admin:index"))

    def toggle_site_view(self, request, website_name):
        if request.method == "POST":
            source = WebsiteScrapingSource.objects.filter(website_name__iexact=website_name).first()
            if source:
                source.active = not source.active
                source.save(using="scraper_db", update_fields=["active"])
                state = "active" if source.active else "inactive"
                messages.success(request, f"{source.website_name} is now {state}.")
            else:
                messages.error(request, f"{website_name.upper()} is not configured.")
        return HttpResponseRedirect(reverse("regintel_admin:index"))

    def scraper_status_view(self, request):
        last_run = WebsiteScrapingRun.objects.order_by("-started_at", "-id").first()
        payload = {
            "run": None,
            "sites": [],
        }
        if last_run:
            payload["run"] = {
                "id": last_run.id,
                "status": last_run.status,
                "started_at": last_run.started_at.isoformat() if last_run.started_at else None,
                "finished_at": last_run.finished_at.isoformat() if last_run.finished_at else None,
                "total_new_rows": last_run.total_new_rows,
                "error": last_run.error_text or "",
            }
            payload["sites"] = list(
                last_run.site_stats.order_by("website_name").values("website_name", "new_rows")
            )
            payload["site_details"] = list(
                last_run.site_details.order_by("website_name").values(
                    "website_name", "status", "error_message", "started_at", "finished_at"
                )
            )
            payload["site_progress"] = list(
                last_run.site_progress.order_by("website_name").values(
                    "website_name",
                    "status",
                    "stage",
                    "current_url",
                    "started_at",
                    "heartbeat_at",
                    "finished_at",
                    "discovered_rows",
                    "new_rows",
                    "processed_rows",
                    "failed_rows",
                    "error_message",
                    "cancel_requested",
                )
            )
            payload["item_progress"] = list(
                last_run.item_progress.order_by("-started_at").values(
                    "data_id", "website_name", "stage", "status", "started_at", "finished_at", "error_message"
                )[:100]
            )
        return JsonResponse(payload)

    def stop_scraper_view(self, request):
        if request.method == "POST":
            connection = open_scraper_connection()
            try:
                request_cancel(connection)
            finally:
                connection.close()
            messages.warning(request, "Cancellation requested. The active worker will stop before its next item.")
        return HttpResponseRedirect(reverse("regintel_admin:index"))

    def index(self, request, extra_context=None):
        context = extra_context or {}
        dashboard = {
            "source_count": 0,
            "active_source_count": 0,
            "selector_count": 0,
            "data_count": 0,
            "new_additions_total": 0,
            "last_data_addition": None,
            "last_run": None,
            "per_website_additions": [],
            "website_period_additions": [],
            "today_total_additions": 0,
            "week_total_additions": 0,
            "period_today_date": None,
            "last_source_update": None,
            "last_selector_update": None,
            "status": "ok",
            "message": "",
            "links": {
                "sources": "/admin/scraper/websitescrapingsource/",
                "selectors": "/admin/scraper/websitescrapingselector/",
                "data": "/admin/scraper/websitescrapingdata/",
                "runs": "/admin/scraper/websitescrapingrun/",
                "run_scraper": reverse("regintel_admin:run-scraper"),
                "run_site_base": "/admin/run-scraper/",
                "toggle_site_base": "/admin/toggle-scraper/",
                "status": reverse("regintel_admin:scraper-status"),
                "stop_scraper": reverse("regintel_admin:stop-scraper"),
                "feedback": "/admin/scraper/userfeedback/",
                "users": "/admin/auth/user/",
                "profiles": "/admin/users/userprofile/",
            },
        }
        try:
            sources = WebsiteScrapingSource.objects.all()
            selectors = WebsiteScrapingSelector.objects.all()
            data_rows = WebsiteScrapingData.objects.all()
            last_run = WebsiteScrapingRun.objects.order_by("-started_at", "-id").first()
            dashboard["source_count"] = sources.count()
            dashboard["active_source_count"] = sources.filter(active=True).count()
            dashboard["active_sources"] = list(
                sources.filter(active=True).values("website_name", "website_full_name")
            )
            latest_progress = {}
            if last_run:
                latest_progress = {
                    row["website_name"]: row
                    for row in last_run.site_progress.values(
                        "website_name", "status", "stage", "failed_rows", "error_message"
                    )
                }
            dashboard["website_operations"] = [
                {
                    "website_name": source.website_name,
                    "website_full_name": source.website_full_name,
                    "active": source.active,
                    "progress": latest_progress.get(source.website_name, {}),
                    "last_success": WebsiteScrapingRunSiteDetail.objects.filter(
                        website_name=source.website_name, status="success"
                    ).order_by("-finished_at").values_list("finished_at", flat=True).first(),
                    "last_failure": WebsiteScrapingRunSiteDetail.objects.filter(
                        website_name=source.website_name, status="failed"
                    ).order_by("-finished_at").values_list("finished_at", flat=True).first(),
                }
                for source in sources
            ]
            dashboard["pipeline_running"] = bool(last_run and last_run.status == "running")
            dashboard["selector_count"] = selectors.count()
            dashboard["data_count"] = data_rows.count()
            dashboard["last_data_addition"] = data_rows.order_by("-created_at", "-id").first()
            dashboard["last_source_update"] = sources.order_by("-updated_at").first()
            dashboard["last_selector_update"] = selectors.order_by("-updated_at").first()
            dashboard["last_run"] = last_run
            dashboard["last_run_started_ist"] = _format_ist(last_run.started_at) if last_run else None
            dashboard["last_run_finished_ist"] = _format_ist(last_run.finished_at) if last_run else None

            today_date = timezone.localdate()
            week_start = timezone.now() - timedelta(days=7)
            period_rows = list(
                data_rows.values("website_name")
                .annotate(
                    today_new=Count("id", filter=Q(created_at__date=today_date)),
                    week_new=Count("id", filter=Q(created_at__gte=week_start)),
                )
                .order_by("-week_new", "-today_new", "website_name")
            )

            max_week = max((item["week_new"] for item in period_rows), default=1)
            max_today = max((item["today_new"] for item in period_rows), default=1)
            website_period_additions = []
            for item in period_rows:
                website_period_additions.append(
                    {
                        "website_name": item["website_name"],
                        "today_new": item["today_new"],
                        "week_new": item["week_new"],
                        "today_pct": int((item["today_new"] / max_today) * 100) if max_today else 0,
                        "week_pct": int((item["week_new"] / max_week) * 100) if max_week else 0,
                    }
                )

            dashboard["website_period_additions"] = website_period_additions
            dashboard["today_total_additions"] = sum(item["today_new"] for item in period_rows)
            dashboard["week_total_additions"] = sum(item["week_new"] for item in period_rows)
            dashboard["period_today_date"] = today_date

            if last_run:
                dashboard["new_additions_total"] = last_run.total_new_rows or 0
                stats = list(
                    last_run.site_stats.order_by("-new_rows", "website_name").values("website_name", "new_rows")
                )
                if stats:
                    dashboard["per_website_additions"] = stats
                else:
                    dashboard["per_website_additions"] = list(
                        data_rows.values("website_name")
                        .annotate(new_rows=Count("id"))
                        .order_by("-new_rows", "website_name")[:5]
                    )
            else:
                dashboard["per_website_additions"] = list(
                    data_rows.values("website_name")
                    .annotate(new_rows=Count("id"))
                    .order_by("-new_rows", "website_name")[:5]
                )
        except DatabaseError:
            dashboard["status"] = "error"
            dashboard["message"] = (
                "Scraper tables are not available in scraper_db. "
                "Run 'python manage.py website_scraper' after confirming .env MySQL settings."
            )

        context["scraper_dashboard"] = dashboard
        return super().index(request, extra_context=context)


regintel_admin_site = RegIntelAdminSite(name="regintel_admin")
