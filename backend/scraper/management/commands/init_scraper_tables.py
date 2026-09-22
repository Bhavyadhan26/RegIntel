from django.core.management.base import BaseCommand

from .website_scraper import init_tables, seed_sources_and_selectors


class Command(BaseCommand):
    help = "Create scraper tables without changing source or selector configuration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--seed",
            action="store_true",
            help="Explicitly seed default source and selector configuration.",
        )

    def handle(self, *args, **options):
        self.stdout.write("Initializing scraper tables...")
        init_tables()
        if options["seed"]:
            seed_sources_and_selectors()
            self.stdout.write(self.style.WARNING("Default source and selector configuration was explicitly seeded."))
        else:
            self.stdout.write("Existing source and selector configuration was preserved.")
        self.stdout.write(self.style.SUCCESS("Scraper tables initialized successfully."))
