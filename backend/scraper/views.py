from datetime import date, datetime, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
	ProfessionalCategory,
	WebsiteScrapingData,
	WebsiteScrapingRun,
	WebsiteScrapingSource,
)


def _normalize_category_filter(value: str) -> str:
	return (value or "all").strip().lower()


def _normalize_website_filter(value: str) -> str:
	return (value or "all").strip().upper()


def _resolve_user_sources(request):
	profile = getattr(request.user, "profile", None)
	user_category = getattr(getattr(profile, "profession_category", None), "name", "")
	if not user_category:
		return user_category, [], {}

	scraper_category = ProfessionalCategory.objects.filter(category_name=user_category).first()
	if not scraper_category:
		return user_category, [], {}

	source_queryset = WebsiteScrapingSource.objects.filter(
		active=True,
		professional_category_id=scraper_category.id,
	)
	source_names = list(source_queryset.values_list("website_name", flat=True))
	source_urls = {s.website_name.upper(): s.start_url for s in source_queryset}

	return user_category, source_names, source_urls


def _parse_due_date(raw_value: str) -> date | None:
	value = (raw_value or "").strip()
	if not value:
		return None

	normalized = value.lower()
	if normalized in {"-", "n/a", "na", "not applicable"}:
		return None

	patterns = [
		"%d-%m-%Y",
		"%d/%m/%Y",
		"%d.%m.%Y",
		"%Y-%m-%d",
		"%d %b %Y",
		"%d %B %Y",
		"%d %b, %Y",
		"%d %B, %Y",
	]

	for pattern in patterns:
		try:
			return datetime.strptime(value, pattern).date()
		except ValueError:
			continue

	return None


class PublicationListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		category = _normalize_category_filter(request.query_params.get("category", "all"))
		website = _normalize_website_filter(request.query_params.get("website", "all"))
		profile = getattr(request.user, "profile", None)
		default_profession = getattr(getattr(profile, "profession_category", None), "name", "")
		selected_profession = (request.query_params.get("profession", "") or "").strip() or default_profession or "all"
		search = (request.query_params.get("search", "") or "").strip()

		try:
			page = max(int(request.query_params.get("page", 1)), 1)
		except (TypeError, ValueError):
			page = 1

		try:
			page_size = max(min(int(request.query_params.get("page_size", 10)), 50), 1)
		except (TypeError, ValueError):
			page_size = 10

		queryset = WebsiteScrapingData.objects.all()
		all_active_sources = WebsiteScrapingSource.objects.filter(active=True)
		source_queryset = all_active_sources

		if selected_profession.lower() != "all":
			profession = ProfessionalCategory.objects.filter(category_name__iexact=selected_profession).first()
			if profession:
				source_queryset = source_queryset.filter(professional_category_id=profession.id)
			else:
				source_queryset = source_queryset.none()

		if website != "ALL":
			source_queryset = source_queryset.filter(website_name__iexact=website)

		source_names = list(source_queryset.values_list("website_name", flat=True))
		if selected_profession.lower() != "all" or website != "ALL":
			if source_names:
				queryset = queryset.filter(website_name__in=source_names)
			else:
				queryset = queryset.none()

		if category == "notifications":
			queryset = queryset.filter(
				Q(category__iexact="Notification")
				| Q(category__iexact="Notice")
				| Q(category__icontains="notification")
				| Q(category__icontains="notice")
			)
		elif category == "updates":
			queryset = queryset.filter(
				Q(category__iexact="Update")
				| Q(category__iexact="Updates")
				| Q(category__iexact="Circular")
				| Q(category__iexact="Amendment")
				| Q(category__icontains="update")
				| Q(category__icontains="circular")
				| Q(category__icontains="amend")
			)
		elif category == "events":
			queryset = queryset.filter(
				Q(category__iexact="Event")
				| Q(category__iexact="Events")
				| Q(category__icontains="event")
			)
		elif category == "tenders":
			queryset = queryset.filter(Q(category__iexact="Tender") | Q(category__icontains="tender"))

		if search:
			queryset = queryset.filter(
				Q(title__icontains=search)
				| Q(summary__icontains=search)
				| Q(category__icontains=search)
				| Q(website_name__icontains=search)
			)

		queryset = queryset.order_by("-id")
		total = queryset.count()
		offset = (page - 1) * page_size
		rows = list(queryset[offset: offset + page_size + 1])
		has_more = len(rows) > page_size
		rows = rows[:page_size]

		sources = {
			source.website_name.upper(): source.start_url
			for source in WebsiteScrapingSource.objects.filter(active=True)
		}

		profession_ids = list(
			all_active_sources.values_list("professional_category_id", flat=True).distinct()
		)
		available_professions = sorted(
			ProfessionalCategory.objects.filter(id__in=profession_ids).values_list("category_name", flat=True)
		)

		def normalize_type(raw_category: str) -> str:
			normalized = (raw_category or "").strip().lower()
			if "tender" in normalized:
				return "Tenders"
			if "event" in normalized:
				return "Events"
			if "amend" in normalized:
				return "Updates"
			if "update" in normalized or "circular" in normalized:
				return "Updates"
			if "notification" in normalized or "notice" in normalized:
				return "Notifications"
			return raw_category or "Notifications"

		payload = []
		for row in rows:
			source_url = sources.get((row.website_name or "").upper(), "")
			preferred_url = (row.pdf_url or "").strip() or (row.detail_url or "").strip() or source_url
			payload.append(
				{
					"id": str(row.id),
					"title": row.title,
					"authority": row.website_name,
					"summary": row.summary or "",
					"notice_date": row.notice_date or "",
					"created_at": row.created_at.isoformat() if row.created_at else "",
					"category": row.category or "",
					"type": normalize_type(row.category),
					"website_name": row.website_name,
					"pdf_url": row.pdf_url or "",
					"detail_url": row.detail_url or "",
					"source_url": source_url,
					"url": preferred_url,
				}
			)

		return Response(
			{
				"results": payload,
				"page": page,
				"page_size": page_size,
				"total": total,
				"has_more": has_more,
				"filters": {
					"professions": available_professions,
					"selected": {
						"profession": selected_profession,
						"website": "all" if website == "ALL" else website,
					},
				},
			}
		)


class AlertListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		tab = (request.query_params.get("tab", "new") or "new").strip().lower()
		if tab not in {"new", "old"}:
			tab = "new"

		try:
			page = max(int(request.query_params.get("page", 1)), 1)
		except (TypeError, ValueError):
			page = 1

		try:
			page_size = max(min(int(request.query_params.get("page_size", 20)), 50), 1)
		except (TypeError, ValueError):
			page_size = 20

		user_category, source_names, source_urls = _resolve_user_sources(request)

		if not user_category:
			return Response({"results": [], "tab": tab, "total": 0, "page": page, "page_size": page_size, "has_more": False, "profession": ""})

		if not source_names:
			return Response({"results": [], "tab": tab, "total": 0, "page": page, "page_size": page_size, "has_more": False, "profession": user_category})

		tz = timezone.get_current_timezone()
		today = timezone.localdate()
		today_start_dt = timezone.make_aware(datetime.combine(today, datetime.min.time()), tz)
		tomorrow_start_dt = today_start_dt + timedelta(days=1)
		three_days_start_dt = today_start_dt - timedelta(days=3)

		queryset = WebsiteScrapingData.objects.filter(website_name__in=source_names)
		if tab == "new":
			queryset = queryset.filter(created_at__gte=today_start_dt, created_at__lt=tomorrow_start_dt)
		else:
			# Old tab: last 3 days excluding today.
			queryset = queryset.filter(created_at__gte=three_days_start_dt, created_at__lt=today_start_dt)

		queryset = queryset.order_by("-id")
		total = queryset.count()
		offset = (page - 1) * page_size
		rows = list(queryset[offset: offset + page_size + 1])
		has_more = len(rows) > page_size
		rows = rows[:page_size]

		def detect_tag(raw_category: str) -> str:
			normalized = (raw_category or "").strip().lower()
			if "tender" in normalized:
				return "Tenders"
			if "event" in normalized:
				return "Events"
			if "amend" in normalized or "update" in normalized or "circular" in normalized:
				return "Updates"
			if "notification" in normalized or "notice" in normalized:
				return "Notifications"
			return raw_category or "Notifications"

		payload = []
		for row in queryset:
			source_url = source_urls.get((row.website_name or "").upper(), "")
			preferred_url = (row.pdf_url or "").strip() or (row.detail_url or "").strip() or source_url
			payload.append(
				{
					"id": str(row.id),
					"title": row.title,
					"authority": row.website_name,
					"summary": row.summary or "",
					"notice_date": row.notice_date or "",
					"category": row.category or "",
					"tag": detect_tag(row.category),
					"url": preferred_url,
					"created_at": row.created_at.isoformat() if row.created_at else "",
				}
			)

		return Response(
			{
				"results": payload,
				"tab": tab,
				"total": total,
				"page": page,
				"page_size": page_size,
				"has_more": has_more,
				"profession": user_category,
			}
		)


class DeadlineListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		selected_website = _normalize_website_filter(request.query_params.get("website", "all"))
		profile = getattr(request.user, "profile", None)
		default_profession = getattr(getattr(profile, "profession_category", None), "name", "")
		selected_profession = (request.query_params.get("profession", "") or "").strip() or default_profession or "all"

		all_active_sources = WebsiteScrapingSource.objects.filter(active=True)
		source_queryset = all_active_sources

		if selected_profession.lower() != "all":
			profession = ProfessionalCategory.objects.filter(category_name__iexact=selected_profession).first()
			if profession:
				source_queryset = source_queryset.filter(professional_category_id=profession.id)
			else:
				source_queryset = source_queryset.none()

		if selected_website != "ALL":
			source_queryset = source_queryset.filter(website_name__iexact=selected_website)

		source_names = list(source_queryset.values_list("website_name", flat=True))
		source_urls = {s.website_name.upper(): s.start_url for s in source_queryset}

		website_rows = all_active_sources.values_list("website_name", "website_full_name")
		website_map = {}
		for website_name, website_full_name in website_rows:
			website_map[website_name] = website_full_name or website_name
		available_websites = [
			{"code": code, "name": website_map[code]}
			for code in sorted(website_map.keys())
		]
		profession_ids = list(
			all_active_sources.values_list("professional_category_id", flat=True).distinct()
		)
		available_professions = sorted(
			ProfessionalCategory.objects.filter(id__in=profession_ids).values_list("category_name", flat=True)
		)

		filter_payload = {
			"websites": available_websites,
			"professions": available_professions,
			"selected": {
				"website": "all" if selected_website == "ALL" else selected_website,
				"profession": selected_profession if selected_profession else "all",
			},
		}

		if not source_names:
			return Response(
				{
					"results": [],
					"profession": "all",
					"filters": filter_payload,
					"counts": {
						"urgent": 0,
						"this_week": 0,
						"total": 0,
					},
				}
			)

		today = timezone.localdate()
		rows = WebsiteScrapingData.objects.filter(website_name__in=source_names).order_by("-id")

		results = []
		urgent_count = 0
		this_week_count = 0
		total_count = 0

		for row in rows:
			due = _parse_due_date(row.due_date or "")
			if due is None:
				continue

			days_left = (due - today).days
			if days_left < 0:
				continue

			if days_left <= 4:
				status = "Urgent"
				priority = 0
				urgent_count += 1
			elif days_left <= 10:
				status = "Upcoming"
				priority = 1
			else:
				status = "Normal"
				priority = 2

			if days_left <= 10:
				this_week_count += 1

			total_count += 1

			source_url = source_urls.get((row.website_name or "").upper(), "")
			preferred_url = (row.pdf_url or "").strip() or (row.detail_url or "").strip() or source_url
			results.append(
				{
					"id": str(row.id),
					"title": row.title,
					"category": row.category or "",
					"website_name": row.website_name,
					"body_date": row.notice_date or "",
					"due_date": due.strftime("%d %b %Y"),
					"days_left": days_left,
					"status": status,
					"url": preferred_url,
					"_priority": priority,
				}
			)

		results.sort(key=lambda item: (item["_priority"], item["days_left"], -int(item["id"])))
		for item in results:
			item.pop("_priority", None)

		return Response(
			{
				"results": results,
				"profession": "all",
				"filters": filter_payload,
				"counts": {
					"urgent": urgent_count,
					"this_week": this_week_count,
					"total": total_count,
				},
			}
		)


class DashboardSummaryView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			page = max(int(request.query_params.get("page", 1)), 1)
		except (TypeError, ValueError):
			page = 1

		try:
			page_size = max(min(int(request.query_params.get("page_size", 10)), 50), 1)
		except (TypeError, ValueError):
			page_size = 10

		tz = timezone.get_current_timezone()
		today = timezone.localdate()
		week_start = today - timedelta(days=6)
		today_start_dt = timezone.make_aware(datetime.combine(today, datetime.min.time()), tz)
		tomorrow_start_dt = today_start_dt + timedelta(days=1)
		three_day_start_dt = today_start_dt - timedelta(days=2)
		week_start_dt = today_start_dt - timedelta(days=6)

		user_category, profession_source_names, profession_source_urls = _resolve_user_sources(request)

		all_source_names = list(
			WebsiteScrapingSource.objects.filter(active=True).values_list("website_name", flat=True)
		)

		if all_source_names:
			all_rows = WebsiteScrapingData.objects.filter(website_name__in=all_source_names).order_by("-id")
		else:
			all_rows = WebsiteScrapingData.objects.none()

		if profession_source_names:
			profession_rows = WebsiteScrapingData.objects.filter(website_name__in=profession_source_names).order_by("-id")
		else:
			profession_rows = WebsiteScrapingData.objects.none()

		# Card 1: unread alerts + three-day new count from profession-specific websites
		unread_alerts_count = profession_rows.filter(
			created_at__gte=today_start_dt,
			created_at__lt=tomorrow_start_dt,
		).count()
		unread_alerts_three_day_count = profession_rows.filter(
			created_at__gte=three_day_start_dt,
			created_at__lt=tomorrow_start_dt,
		).count()

		# Card 2: publications today and in current 7-day window
		publications_today_count = all_rows.filter(
			created_at__gte=today_start_dt,
			created_at__lt=tomorrow_start_dt,
		).count()
		publications_week_count = all_rows.filter(
			created_at__gte=week_start_dt,
			created_at__lt=tomorrow_start_dt,
		).count()

		# Card 3: deadline metrics from all websites
		deadlines_active_count = 0
		deadlines_week_with_due_count = 0

		for row in all_rows:
			due = _parse_due_date(row.due_date or "")
			if due is None:
				continue

			if due >= today:
				deadlines_active_count += 1

			created_local_date = timezone.localtime(row.created_at, tz).date() if row.created_at else None
			if created_local_date and created_local_date >= week_start and due >= today:
				deadlines_week_with_due_count += 1

		# Upcoming deadlines: user profession websites only, max 5, nearest due first
		upcoming_items = []
		for row in profession_rows:
			due = _parse_due_date(row.due_date or "")
			if due is None or due < today:
				continue

			days_left = (due - today).days
			source_url = profession_source_urls.get((row.website_name or "").upper(), "")
			preferred_url = (row.pdf_url or "").strip() or (row.detail_url or "").strip() or source_url
			upcoming_items.append(
				{
					"id": str(row.id),
					"title": row.title,
					"due_date": due.strftime("%d %b %Y"),
					"days_left": days_left,
					"urgent": days_left <= 4,
					"url": preferred_url,
				}
			)

		upcoming_items.sort(key=lambda item: (item["days_left"], -int(item["id"])))
		total_upcoming = len(upcoming_items)
		offset = (page - 1) * page_size
		paginated_upcoming_items = upcoming_items[offset: offset + page_size]
		has_more_upcoming = offset + page_size < total_upcoming

		last_run = (
			WebsiteScrapingRun.objects.filter(finished_at__isnull=False)
			.order_by("-finished_at", "-id")
			.values_list("finished_at", flat=True)
			.first()
		)

		return Response(
			{
				"cards": {
					"unread_alerts": unread_alerts_count,
					"unread_alerts_three_day": unread_alerts_three_day_count,
					"publications_today": publications_today_count,
					"publications_week": publications_week_count,
					"deadlines_active": deadlines_active_count,
					"deadlines_week_with_due": deadlines_week_with_due_count,
				},
				"last_updated": last_run.isoformat() if last_run else None,
				"upcoming_deadlines": paginated_upcoming_items,
				"upcoming_deadlines_total": total_upcoming,
				"upcoming_deadlines_page": page,
				"upcoming_deadlines_page_size": page_size,
				"upcoming_deadlines_has_more": has_more_upcoming,
				"profession": user_category or "",
			}
		)
