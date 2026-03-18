from django.db import migrations


def drop_pdf_local_path(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'pdf_local_path'")
        exists = cursor.fetchone() is not None
        if exists:
            cursor.execute("ALTER TABLE Website_Scraping_data DROP COLUMN pdf_local_path")


def add_pdf_local_path_back(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'pdf_local_path'")
        exists = cursor.fetchone() is not None
        if not exists:
            cursor.execute("ALTER TABLE Website_Scraping_data ADD COLUMN pdf_local_path VARCHAR(2048) NULL")


class Migration(migrations.Migration):

    dependencies = [
        ("scraper", "0002_professionalcategory_userfeedback_and_more"),
    ]

    operations = [
        migrations.RunPython(drop_pdf_local_path, add_pdf_local_path_back),
        migrations.RemoveField(
            model_name="websitescrapingdata",
            name="pdf_local_path",
        ),
    ]
