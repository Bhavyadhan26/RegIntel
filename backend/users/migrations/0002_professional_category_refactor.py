from django.db import migrations, models
import django.db.models.deletion


CATEGORY_NAMES = [
    "Chartered Accountant",
    "Lawyers",
    "Cost Accountant",
    "Banking / Financial Regulation",
    "Indirect Taxes and Income",
]


def forwards(apps, schema_editor):
    ProfessionalCategory = apps.get_model("users", "ProfessionalCategory")
    UserProfile = apps.get_model("users", "UserProfile")

    for name in CATEGORY_NAMES:
        ProfessionalCategory.objects.get_or_create(name=name)

    mapping = {
        "ca": "Chartered Accountant",
        "chartered accountant": "Chartered Accountant",
        "legal": "Lawyers",
        "legal professional": "Lawyers",
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

    categories = {obj.name: obj for obj in ProfessionalCategory.objects.all()}

    for profile in UserProfile.objects.all():
        raw_value = (profile.profession or "").strip().lower()
        target_name = mapping.get(raw_value)
        if not target_name:
            continue
        profile.profession_category = categories.get(target_name)
        profile.save(update_fields=["profession_category"])


def backwards(apps, schema_editor):
    UserProfile = apps.get_model("users", "UserProfile")

    reverse_mapping = {
        "Chartered Accountant": "ca",
        "Lawyers": "legal",
        "Cost Accountant": "cost-accountant",
        "Banking / Financial Regulation": "banking-finance",
        "Indirect Taxes and Income": "indirect-taxes",
    }

    for profile in UserProfile.objects.select_related("profession_category").all():
        if profile.profession_category:
            profile.profession = reverse_mapping.get(profile.profession_category.name, "")
            profile.save(update_fields=["profession"])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProfessionalCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True)),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="userprofile",
            name="profession_category",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="user_profiles",
                to="users.professionalcategory",
            ),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(
            model_name="userprofile",
            name="profession",
        ),
    ]
