class ScraperDatabaseRouter:
    """Route scraper source/selector models to the MySQL scraper database."""

    scraper_models = {
        "websitescrapingsource",
        "websitescrapingselector",
        "websitescrapingdata",
        "websitescrapingrun",
        "websitescrapingrunsitestat",
    }

    def db_for_read(self, model, **hints):
        if model._meta.app_label == "scraper" and model._meta.model_name in self.scraper_models:
            return "scraper_db"
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == "scraper" and model._meta.model_name in self.scraper_models:
            return "scraper_db"
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == "scraper" and model_name in self.scraper_models:
            return False
        if db == "scraper_db":
            return False
        return None
