import hashlib

from django.core.management.base import BaseCommand, CommandError

from scraper.database import scraper_connection


class Command(BaseCommand):
    help = "Prepare the isolated scraper schema with safe deduplication and query indexes."

    def add_arguments(self, parser):
        parser.add_argument("--confirm", action="store_true", help="Confirm schema changes.")

    def handle(self, *args, **options):
        if not options["confirm"]:
            raise CommandError("Refusing schema changes without --confirm.")

        with scraper_connection() as connection:
            cursor = connection.cursor()
            try:
                cursor.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'title_identity'")
                if cursor.fetchone() is None:
                    cursor.execute(
                        "ALTER TABLE Website_Scraping_data ADD COLUMN title_identity BINARY(32) NULL AFTER title"
                    )

                cursor.execute("SELECT id, website_name, title, category FROM Website_Scraping_data WHERE title_identity IS NULL")
                for row in cursor.fetchall():
                    identity = hashlib.sha256(
                        f"{row['website_name']}\0{row['category']}\0{row['title']}".encode("utf-8")
                    ).digest()
                    cursor.execute(
                        "UPDATE Website_Scraping_data SET title_identity = %s WHERE id = %s",
                        (identity, row["id"]),
                    )

                cursor.execute("SHOW INDEX FROM Website_Scraping_data WHERE Key_name = 'uk_site_title_category'")
                if cursor.fetchone() is not None:
                    cursor.execute("ALTER TABLE Website_Scraping_data DROP INDEX uk_site_title_category")

                cursor.execute("SHOW INDEX FROM Website_Scraping_data WHERE Key_name = 'uk_site_title_identity'")
                if cursor.fetchone() is None:
                    cursor.execute(
                        "ALTER TABLE Website_Scraping_data ADD UNIQUE KEY uk_site_title_identity (title_identity)"
                    )

                indexes = {
                    "idx_data_site_category": "(website_name, category)",
                    "idx_data_site_created": "(website_name, created_at)",
                    "idx_data_site_notice": "(website_name, notice_date)",
                    "idx_data_site_processed": "(website_name, processed)",
                    "idx_data_due_date": "(due_date)",
                }
                for name, columns in indexes.items():
                    cursor.execute("SHOW INDEX FROM Website_Scraping_data WHERE Key_name = %s", (name,))
                    if cursor.fetchone() is None:
                        cursor.execute(f"CREATE INDEX {name} ON Website_Scraping_data {columns}")
                connection.commit()
            finally:
                cursor.close()

        self.stdout.write(self.style.SUCCESS("Scraper schema prepared."))