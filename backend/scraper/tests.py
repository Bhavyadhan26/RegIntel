import os
import json
import hashlib
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from django.test import SimpleTestCase

from .database import scraper_connection_kwargs
from .document_processing import extract_due_date, parse_provider_response, summary_word_count


class ScraperDatabaseConfigurationTests(SimpleTestCase):
	def test_scraper_database_settings_take_precedence(self):
		env = {
			"SCRAPER_DB_HOST": "scraper-host",
			"SCRAPER_DB_PORT": "3307",
			"SCRAPER_DB_NAME": "scraper-db",
			"SCRAPER_DB_USER": "scraper-user",
			"SCRAPER_DB_PASS": "scraper-pass",
			"DB_HOST": "default-host",
			"DB_PORT": "3306",
			"DB_NAME": "default-db",
			"DB_USER": "default-user",
			"DB_PASS": "default-pass",
		}
		with patch.dict(os.environ, env, clear=True):
			settings = scraper_connection_kwargs()

		self.assertEqual(settings["host"], "scraper-host")
		self.assertEqual(settings["port"], 3307)
		self.assertEqual(settings["database"], "scraper-db")
		self.assertEqual(settings["user"], "scraper-user")


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


class ConcurrentDeduplicationTests(SimpleTestCase):
	@staticmethod
	def _database_settings():
		from .database import scraper_connection_kwargs

		return scraper_connection_kwargs()

	@staticmethod
	def _insert_duplicate(settings, title, identity):
		import pymysql

		connection = pymysql.connect(**settings)
		try:
			with connection.cursor() as cursor:
				cursor.execute(
					"""
					INSERT INTO Website_Scraping_data
						(website_name, title, title_identity, category, detail_url, notice_date, due_date)
					VALUES ('CONCURRENCY_TEST', %s, %s, 'Notification', 'https://example.test', '22 Sep 2026', '')
					ON DUPLICATE KEY UPDATE id = id
					""",
					(title, identity),
				)
			connection.commit()
		finally:
			connection.close()

	@staticmethod
	def _enabled():
		return os.getenv("SCRAPER_DB_CONCURRENCY_TESTS", "false").lower() == "true"

	def test_concurrent_duplicate_insert_stores_one_row(self):
		if not self._enabled():
			self.skipTest("Set SCRAPER_DB_CONCURRENCY_TESTS=true for isolated MySQL concurrency tests.")

		import pymysql

		title = "Concurrent title " + ("X" * 680)
		identity = hashlib.sha256(f"CONCURRENCY_TEST\0Notification\0{title}".encode("utf-8")).digest()
		settings = self._database_settings()
		cleanup = pymysql.connect(**settings)
		try:
			with cleanup.cursor() as cursor:
				cursor.execute("DELETE FROM Website_Scraping_data WHERE website_name = 'CONCURRENCY_TEST'")
			cleanup.commit()

			with ThreadPoolExecutor(max_workers=2) as executor:
				futures = [executor.submit(self._insert_duplicate, settings, title, identity) for _ in range(2)]
				for future in futures:
					future.result()

			with cleanup.cursor() as cursor:
				cursor.execute("SELECT COUNT(*) AS total FROM Website_Scraping_data WHERE website_name = 'CONCURRENCY_TEST'")
				self.assertEqual(cursor.fetchone()["total"], 1)
		finally:
			with cleanup.cursor() as cursor:
				cursor.execute("DELETE FROM Website_Scraping_data WHERE website_name = 'CONCURRENCY_TEST'")
			cleanup.commit()
			cleanup.close()
