import os
from contextlib import contextmanager

import pymysql
from dotenv import load_dotenv
from pymysql.cursors import DictCursor


load_dotenv()


def _get_setting(name, fallback_name=None, default=None):
    value = os.getenv(name)
    if value:
        return value
    if fallback_name:
        return os.getenv(fallback_name, default)
    return default


def _required_setting(name, fallback_name=None):
    value = _get_setting(name, fallback_name)
    if not value:
        expected = name if not fallback_name else f"{name} (or {fallback_name})"
        raise RuntimeError(f"{expected} is required in the .env file")
    return value


def scraper_connection_kwargs():
    return {
        "host": _get_setting("SCRAPER_DB_HOST", "DB_HOST", "localhost"),
        "port": int(_get_setting("SCRAPER_DB_PORT", "DB_PORT", "3306")),
        "user": _required_setting("SCRAPER_DB_USER", "DB_USER"),
        "password": _required_setting("SCRAPER_DB_PASS", "DB_PASS"),
        "database": _required_setting("SCRAPER_DB_NAME", "DB_NAME"),
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "autocommit": False,
    }


def open_scraper_connection():
    return pymysql.connect(**scraper_connection_kwargs())


@contextmanager
def scraper_connection():
    connection = open_scraper_connection()
    try:
        yield connection
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()