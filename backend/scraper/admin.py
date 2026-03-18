from django.contrib import admin
from django.contrib import messages
from django.db import DatabaseError
from django.http import HttpResponse
import csv

from .admin_site import regintel_admin_site
from .models import (
	UserFeedback,
	WebsiteScrapingData,
	WebsiteScrapingRun,
	WebsiteScrapingRunSiteStat,
	WebsiteScrapingSelector,
	WebsiteScrapingSource,
)


class SuperuserOnlyAdminMixin:
	missing_table_warning = (
		"Scraper table is unavailable in scraper_db. "
		"Check MySQL env vars and run: python manage.py website_scraper"
	)

	def _is_superuser(self, request):
		user = request.user
		return bool(user and user.is_active and user.is_superuser)

	def has_module_permission(self, request):
		return self._is_superuser(request)

	def has_view_permission(self, request, obj=None):
		return self._is_superuser(request)

	def has_add_permission(self, request):
		return self._is_superuser(request)

	def has_change_permission(self, request, obj=None):
		return self._is_superuser(request)

	def has_delete_permission(self, request, obj=None):
		return self._is_superuser(request)

	def get_queryset(self, request):
		try:
			return super().get_queryset(request)
		except DatabaseError:
			self.message_user(request, self.missing_table_warning, level=messages.WARNING)
			return self.model.objects.none()


@admin.register(WebsiteScrapingSource, site=regintel_admin_site)
class WebsiteScrapingSourceAdmin(SuperuserOnlyAdminMixin, admin.ModelAdmin):
	list_display = ("website_name", "website_full_name", "start_url", "active", "updated_at")
	search_fields = ("website_name", "website_full_name", "start_url")
	list_filter = ("active",)
	list_editable = ("active",)
	readonly_fields = ("created_at", "updated_at")

	fieldsets = (
		("Website Identity", {"fields": ("website_name", "website_full_name")}),
		("Scraping Source", {"fields": ("start_url", "active")}),
		("Audit", {"fields": ("created_at", "updated_at")}),
	)


@admin.register(WebsiteScrapingSelector, site=regintel_admin_site)
class WebsiteScrapingSelectorAdmin(SuperuserOnlyAdminMixin, admin.ModelAdmin):
	list_display = ("website_name", "selector_key", "selector_value", "updated_at")
	search_fields = ("website_name", "selector_key", "selector_value")
	list_filter = ("website_name",)
	readonly_fields = ("created_at", "updated_at")

	fieldsets = (
		("Selector", {"fields": ("website_name", "selector_key", "selector_value")}),
		("Audit", {"fields": ("created_at", "updated_at")}),
	)


@admin.register(WebsiteScrapingData, site=regintel_admin_site)
class WebsiteScrapingDataAdmin(SuperuserOnlyAdminMixin, admin.ModelAdmin):
	list_display = ("website_name", "category", "title", "notice_date", "due_date", "processed", "created_at")
	search_fields = ("website_name", "category", "title", "notice_date", "due_date")
	list_filter = ("website_name", "category", "processed")
	readonly_fields = ("created_at", "updated_at")
	list_per_page = 50

	fieldsets = (
		("Record", {"fields": ("website_name", "category", "title", "notice_date", "due_date")}),
		("Links", {"fields": ("detail_url", "pdf_url")}),
		("Processing", {"fields": ("processed", "raw_text", "summary")}),
		("Audit", {"fields": ("created_at", "updated_at")}),
	)


class WebsiteScrapingRunSiteStatInline(admin.TabularInline):
	model = WebsiteScrapingRunSiteStat
	extra = 0
	can_delete = False
	fields = ("website_name", "new_rows", "created_at")
	readonly_fields = ("website_name", "new_rows", "created_at")

	def has_add_permission(self, request, obj=None):
		return False


@admin.register(WebsiteScrapingRun, site=regintel_admin_site)
class WebsiteScrapingRunAdmin(SuperuserOnlyAdminMixin, admin.ModelAdmin):
	list_display = ("id", "status", "started_at", "finished_at", "total_new_rows")
	search_fields = ("status", "error_text")
	list_filter = ("status",)
	readonly_fields = ("started_at", "finished_at", "status", "total_new_rows", "error_text", "created_at", "updated_at")
	inlines = (WebsiteScrapingRunSiteStatInline,)

	def has_add_permission(self, request):
		return False


@admin.register(UserFeedback, site=regintel_admin_site)
class UserFeedbackAdmin(SuperuserOnlyAdminMixin, admin.ModelAdmin):
	list_display = ("full_name", "user_email", "star_rating", "type_of_feedback", "created_at", "short_message")
	search_fields = ("full_name", "user_email", "type_of_feedback", "message")
	list_filter = ("star_rating", "type_of_feedback", "created_at")
	readonly_fields = ("full_name", "user_email", "star_rating", "type_of_feedback", "message", "created_at")
	ordering = ("-created_at", "-id")
	list_per_page = 50
	actions = ("export_selected_feedback_csv",)

	def has_add_permission(self, request):
		return False

	@admin.display(description="Message")
	def short_message(self, obj):
		text = (obj.message or "").strip()
		return text if len(text) <= 80 else f"{text[:77]}..."

	@admin.action(description="Export selected feedback as CSV")
	def export_selected_feedback_csv(self, request, queryset):
		response = HttpResponse(content_type="text/csv")
		response["Content-Disposition"] = 'attachment; filename="user_feedback.csv"'

		writer = csv.writer(response)
		writer.writerow(["Full Name", "User Email", "Stars", "Type", "Message", "Created At"])
		for item in queryset.order_by("-created_at", "-id"):
			writer.writerow([
				item.full_name,
				item.user_email,
				item.star_rating,
				item.type_of_feedback,
				item.message,
				item.created_at,
			])
		return response
