import json
import os
from unittest.mock import patch

from django.test import SimpleTestCase

from .database import scraper_connection_kwargs
from .document_processing import extract_due_date, parse_provider_response, summary_word_count


class ScraperDatabaseConfigurationTests(SimpleTestCase):
	def test_scraper_database_settings_use_production_db_variables(self):
		env = {
			"DB_HOST": "prod-host",
			"DB_PORT": "3306",
			"DB_NAME": "prod-db",
			"DB_USER": "prod-user",
			"DB_PASS": "prod-pass",
		}
		with patch.dict(os.environ, env, clear=True):
			settings = scraper_connection_kwargs()

		self.assertEqual(settings["host"], "prod-host")
		self.assertEqual(settings["port"], 3306)
		self.assertEqual(settings["database"], "prod-db")
		self.assertEqual(settings["user"], "prod-user")


class DocumentProcessingTests(SimpleTestCase):
	def test_provider_response_accepts_short_summary(self):
		result = parse_provider_response('{"summary":"A short factual summary.","due_date":""}')
		self.assertEqual(result["summary"], "A short factual summary.")

	def test_provider_response_rejects_more_than_sixty_words(self):
		summary = " ".join(["word"] * 61)
		self.assertIsNone(parse_provider_response(json.dumps({"summary": summary, "due_date": ""})))

	def test_iso_due_date_returns_full_date(self):
		self.assertEqual(extract_due_date("Submit by: 2026-09-30"), "2026-09-30")

	def test_summary_word_count_enforces_hard_limit(self):
		self.assertEqual(summary_word_count(" ".join(["word"] * 60)), 60)
