import os
from contextlib import contextmanager

import pymysql
from dotenv import load_dotenv
from pymysql.cursors import DictCursor


load_dotenv()


def _required_setting(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is required in the .env file")
    return value


def scraper_connection_kwargs():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": _required_setting("DB_USER"),
        "password": _required_setting("DB_PASS"),
        "database": _required_setting("DB_NAME"),
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