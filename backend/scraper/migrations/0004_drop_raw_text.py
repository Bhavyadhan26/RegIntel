from django.db import migrations


def drop_raw_text(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'raw_text'")
        exists = cursor.fetchone() is not None
        if exists:
            cursor.execute("ALTER TABLE Website_Scraping_data DROP COLUMN raw_text")


def add_raw_text_back(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'raw_text'")
        exists = cursor.fetchone() is not None
        if not exists:
            cursor.execute("ALTER TABLE Website_Scraping_data ADD COLUMN raw_text LONGTEXT NULL")


class Migration(migrations.Migration):

    dependencies = [
        ("scraper", "0003_drop_pdf_local_path"),
    ]

    operations = [
        migrations.RunPython(drop_raw_text, add_raw_text_back),
        migrations.RemoveField(
            model_name="websitescrapingdata",
            name="raw_text",
        ),
    ]
