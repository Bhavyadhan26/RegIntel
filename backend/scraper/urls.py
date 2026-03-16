from django.urls import path

from .views import AlertListView, DashboardSummaryView, DeadlineListView, PublicationListView

urlpatterns = [
    path("publications/", PublicationListView.as_view(), name="scraper-publications"),
    path("alerts/", AlertListView.as_view(), name="scraper-alerts"),
    path("deadlines/", DeadlineListView.as_view(), name="scraper-deadlines"),
    path("dashboard-summary/", DashboardSummaryView.as_view(), name="scraper-dashboard-summary"),
]
