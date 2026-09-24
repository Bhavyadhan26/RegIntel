from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ProfessionalCategory, UserProfile

class AdminProfessionalCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalCategory
        fields = '__all__'

class AdminUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['profession_category', 'email_notifications']

class AdminUserSerializer(serializers.ModelSerializer):
    profile = AdminUserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'is_active', 'last_login', 'date_joined', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update nested profile fields
        if profile_data is not None:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance
