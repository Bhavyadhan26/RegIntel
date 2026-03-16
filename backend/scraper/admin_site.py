from django.contrib.admin import AdminSite
from django.db import DatabaseError
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import (
    WebsiteScrapingData,
    WebsiteScrapingRun,
    WebsiteScrapingSelector,
    WebsiteScrapingSource,
)


class RegIntelAdminSite(AdminSite):
    site_header = "RegIntel Administration"
    site_title = "RegIntel Admin"
    index_title = "Website Scraper Control Panel"
    index_template = "scraper/admin_dashboard.html"

    def has_permission(self, request):
        user = request.user
        return bool(user and user.is_active and user.is_superuser)

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
            dashboard["selector_count"] = selectors.count()
            dashboard["data_count"] = data_rows.count()
            dashboard["last_data_addition"] = data_rows.order_by("-created_at", "-id").first()
            dashboard["last_source_update"] = sources.order_by("-updated_at").first()
            dashboard["last_selector_update"] = selectors.order_by("-updated_at").first()
            dashboard["last_run"] = last_run

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
