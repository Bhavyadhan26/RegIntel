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
    stats = WebsiteScrapingRunSiteStatSerializer(many=True, read_only=True, source='websitescrapingrunsitestat_set')
    details = WebsiteScrapingRunSiteDetailSerializer(many=True, read_only=True, source='websitescrapingrunsitedetail_set')
    
    class Meta:
        model = WebsiteScrapingRun
        fields = '__all__'
