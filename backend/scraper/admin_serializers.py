from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from .models import WebsiteScrapingRun, WebsiteScrapingSource, WebsiteScrapingSelector, WebsiteScrapingData, UserFeedback, WebsiteScrapingRunSiteStat, WebsiteScrapingRunSiteDetail

class UserFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFeedback
        fields = '__all__'

class WebsiteScrapingSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteScrapingSource
        fields = '__all__'

class WebsiteScrapingSelectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteScrapingSelector
        fields = '__all__'

class WebsiteScrapingDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteScrapingData
        fields = '__all__'

class WebsiteScrapingRunSiteStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteScrapingRunSiteStat
        fields = '__all__'

class WebsiteScrapingRunSiteDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteScrapingRunSiteDetail
        fields = '__all__'

class WebsiteScrapingRunSerializer(serializers.ModelSerializer):
    stats = WebsiteScrapingRunSiteStatSerializer(many=True, read_only=True, source='site_stats')
    details = WebsiteScrapingRunSiteDetailSerializer(many=True, read_only=True, source='site_details')
    activity = serializers.CharField(source='action', read_only=True)
    duration_seconds = serializers.SerializerMethodField()
    duration_display = serializers.SerializerMethodField()
    websites = serializers.SerializerMethodField()
    errors = serializers.SerializerMethodField()
    
    class Meta:
        model = WebsiteScrapingRun
        fields = '__all__'

    def get_duration_seconds(self, obj):
        end = obj.finished_at or timezone.now()
        return max(int((end - obj.started_at).total_seconds()), 0) if obj.started_at else 0

    def get_duration_display(self, obj):
        seconds = self.get_duration_seconds(obj)
        return str(timedelta(seconds=seconds))

    def get_websites(self, obj):
        names = set(obj.site_details.values_list('website_name', flat=True))
        names.update(obj.site_stats.values_list('website_name', flat=True))
        return sorted(names)

    def get_errors(self, obj):
        errors = set(obj.site_details.exclude(error_message__isnull=True).exclude(error_message='').values_list('error_message', flat=True))
        errors.update(obj.item_progress.exclude(error_message__isnull=True).exclude(error_message='').values_list('error_message', flat=True))
        return sorted(error.strip() for error in errors if error and error.strip())
