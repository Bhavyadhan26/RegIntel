from django.db import models
from django.contrib.auth.models import User


PROFESSION_CHOICES = [
    ('ca', 'Chartered Accountant'),
    ('legal', 'Legal Professional'),
    ('cost-accountant', 'Cost Accountant'),
    ('banking-finance', 'Banking or Finance'),
    ('indirect-taxes', 'Indirect Taxes'),
]


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profession = models.CharField(max_length=30, choices=PROFESSION_CHOICES, blank=True, default='')
    email_notifications = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} – {self.profession}"
