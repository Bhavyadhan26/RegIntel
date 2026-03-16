from django.core.management.base import BaseCommand

from .website_scraper import init_tables, seed_sources_and_selectors


class Command(BaseCommand):
    help = "Create and seed scraper tables (sources/selectors) without running scraping jobs."

    def handle(self, *args, **kwargs):
        self.stdout.write("Initializing scraper tables...")
        init_tables()
        seed_sources_and_selectors()
        self.stdout.write(self.style.SUCCESS("Scraper tables initialized and seeded successfully."))
