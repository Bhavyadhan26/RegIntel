from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserProfile


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        full_name = validated_data['full_name'].strip()
        first_name, *rest = full_name.split(' ', 1)
        last_name = rest[0] if rest else ''

        user = User.objects.create_user(
            username=validated_data['email'].lower(),
            email=validated_data['email'].lower(),
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
        )
        UserProfile.objects.create(user=user)
        return user


class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)
    profession = serializers.ChoiceField(
        choices=['ca', 'legal', 'cost-accountant', 'banking-finance', 'indirect-taxes'],
        source='profile.profession',
        required=False,
        allow_blank=True,
    )
    email_notifications = serializers.BooleanField(source='profile.email_notifications', required=False)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'profession', 'email_notifications']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        # Update User fields
        if 'first_name' in validated_data or 'last_name' in validated_data:
            instance.first_name = validated_data.get('first_name', instance.first_name)
            instance.last_name = validated_data.get('last_name', instance.last_name)
            instance.save()

        # Update UserProfile fields
        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance


class UpdateProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False)
    profession = serializers.ChoiceField(
        choices=['ca', 'legal', 'cost-accountant', 'banking-finance', 'indirect-taxes'],
        required=False,
        allow_blank=True,
    )
    email_notifications = serializers.BooleanField(required=False)

    def update(self, instance, validated_data):
        if 'full_name' in validated_data:
            full_name = validated_data['full_name'].strip()
            first_name, *rest = full_name.split(' ', 1)
            instance.first_name = first_name
            instance.last_name = rest[0] if rest else ''
            instance.save()

        profile = instance.profile
        if 'profession' in validated_data:
            profile.profession = validated_data['profession']
        if 'email_notifications' in validated_data:
            profile.email_notifications = validated_data['email_notifications']
        profile.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(data['new_password'])
        return data
