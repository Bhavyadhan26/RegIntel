from django.db import models
from django.contrib.auth.models import User


PROFESSIONAL_CATEGORY_NAMES = [
    "Chartered Accountant",
    "Lawyers",
    "Cost Accountant",
    "Banking / Financial Regulation",
    "Indirect Taxes and Income",
]


PROFESSION_INPUT_MAP = {
    "ca": "Chartered Accountant",
    "chartered accountant": "Chartered Accountant",
    "legal": "Lawyers",
    "legal professional": "Lawyers",
    "lawyer": "Lawyers",
    "lawyers": "Lawyers",
    "cost-accountant": "Cost Accountant",
    "cost accountant": "Cost Accountant",
    "banking-finance": "Banking / Financial Regulation",
    "banking or finance": "Banking / Financial Regulation",
    "banking / financial regulation": "Banking / Financial Regulation",
    "indirect-taxes": "Indirect Taxes and Income",
    "indirect taxes": "Indirect Taxes and Income",
    "indirect taxes and income": "Indirect Taxes and Income",
}


def normalize_profession_input(value: str) -> str | None:
    key = (value or "").strip().lower()
    if not key:
        return None
    return PROFESSION_INPUT_MAP.get(key)


class ProfessionalCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profession_category = models.ForeignKey(
        ProfessionalCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_profiles',
    )
    email_notifications = models.BooleanField(default=False)

    def __str__(self):
        profession_name = self.profession_category.name if self.profession_category else ""
        return f"{self.user.email} - {profession_name}"
