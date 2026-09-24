from django.core.management.base import BaseCommand, CommandError

from scraper.database import scraper_connection
from scraper.run_lock import LOCK_KEY


class Command(BaseCommand):
    help = "Delete scraper data and run history while preserving source and selector configuration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Confirm deletion in the configured scraper database.",
        )

    def handle(self, *args, **options):
        if not options["confirm"]:
            raise CommandError("Refusing to reset scraper data without --confirm.")

        with scraper_connection() as connection:
            cursor = connection.cursor()
            try:
                cursor.execute(
                    "SELECT state_value FROM Website_Scraping_State WHERE state_key = %s",
                    (LOCK_KEY,),
                )
                if cursor.fetchone():
                    raise CommandError("Cannot reset while a scraper lease is active.")

                cursor.execute(
                    "SELECT id FROM Website_Scraping_Runs WHERE status IN ('queued', 'running') LIMIT 1"
                )
                active_run = cursor.fetchone()
                if active_run:
                    raise CommandError(
                        f"Cannot reset while scraper run {active_run['id']} is queued or running."
                    )

                cursor.execute("SELECT COUNT(*) AS total FROM Website_Scraping_data")
                data_count = cursor.fetchone()["total"]
                cursor.execute("SELECT COUNT(*) AS total FROM Website_Scraping_Run_Site_Stats")
                stat_count = cursor.fetchone()["total"]
                cursor.execute("SELECT COUNT(*) AS total FROM Website_Scraping_Run_Site_Details")
                detail_count = cursor.fetchone()["total"]
                cursor.execute("SELECT COUNT(*) AS total FROM Website_Scraping_Site_Progress")
                progress_count = cursor.fetchone()["total"]
                cursor.execute("SELECT COUNT(*) AS total FROM Website_Scraping_Item_Progress")
                item_count = cursor.fetchone()["total"]
                cursor.execute("SELECT COUNT(*) AS total FROM Website_Scraping_Runs")
                run_count = cursor.fetchone()["total"]

                cursor.execute("DELETE FROM Website_Scraping_Run_Site_Stats")
                cursor.execute("DELETE FROM Website_Scraping_Run_Site_Details")
                cursor.execute("DELETE FROM Website_Scraping_Item_Progress")
                cursor.execute("DELETE FROM Website_Scraping_Site_Progress")
                cursor.execute("DELETE FROM Website_Scraping_data")
                cursor.execute("DELETE FROM Website_Scraping_Runs")
                cursor.execute("ALTER TABLE Website_Scraping_data AUTO_INCREMENT = 1")
                connection.commit()
            finally:
                cursor.close()

        self.stdout.write(
            self.style.SUCCESS(
                f"Reset complete: deleted {data_count} data rows, {stat_count} site stats, {detail_count} site details, {progress_count} site progress rows, {item_count} item progress rows, and {run_count} runs."
            )
        )