from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AlertListView, DashboardSummaryView, DeadlineListView, PublicationListView
from .admin_views import (
    AdminRunLogViewSet, AdminSourceViewSet, AdminSelectorViewSet, 
    AdminDataViewSet, AdminFeedbackViewSet, TriggerScraperView
)

router = DefaultRouter()
router.register(r'admin/run-logs', AdminRunLogViewSet, basename='admin-run-logs')
router.register(r'admin/sources', AdminSourceViewSet, basename='admin-sources')
router.register(r'admin/selectors', AdminSelectorViewSet, basename='admin-selectors')
router.register(r'admin/data', AdminDataViewSet, basename='admin-data')
router.register(r'admin/feedback', AdminFeedbackViewSet, basename='admin-feedback')

urlpatterns = [
    path("publications/", PublicationListView.as_view(), name="scraper-publications"),
    path("alerts/", AlertListView.as_view(), name="scraper-alerts"),
    path("deadlines/", DeadlineListView.as_view(), name="scraper-deadlines"),
    path("dashboard-summary/", DashboardSummaryView.as_view(), name="scraper-dashboard-summary"),
    path("trigger/", TriggerScraperView.as_view(), name="scraper-trigger"),
    
    # Admin URLs
    path("", include(router.urls)),
]
