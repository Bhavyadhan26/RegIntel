from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils.html import format_html

from scraper.admin_site import regintel_admin_site

from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    verbose_name_plural = "Profile Details"
    fields = ("profession", "email_notifications")


@admin.register(User, site=regintel_admin_site)
class RegIntelUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_superuser",
        "is_staff",
        "is_active",
        "last_login",
        "date_joined",
    )
    list_filter = ("is_superuser", "is_staff", "is_active", "date_joined", "last_login")
    search_fields = ("username", "email", "first_name", "last_name")
    readonly_fields = ("last_login", "date_joined")
    inlines = (UserProfileInline,)


@admin.register(UserProfile, site=regintel_admin_site)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "profession", "email_notifications")
    list_filter = ("profession", "email_notifications")
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name")
    readonly_fields = ("password_hash", "password_actions")
    fields = ("user", "profession", "email_notifications", "password_hash", "password_actions")

    @admin.display(description="Password (hashed)")
    def password_hash(self, obj):
        # Django stores only password hashes; raw passwords are never retrievable.
        return obj.user.password

    @admin.display(description="Password Management")
    def password_actions(self, obj):
        change_url = reverse("admin:auth_user_password_change", args=[obj.user_id])
        return format_html('<a class="button" href="{}">Change Password</a>', change_url)
