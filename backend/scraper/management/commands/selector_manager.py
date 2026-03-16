import os

import pymysql
from django.core.management.base import BaseCommand
from dotenv import load_dotenv
from pymysql.cursors import DictCursor

load_dotenv()


def get_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", "root"),
        database=os.getenv("DB_NAME", "regintel"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
    )


def list_sources():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT website_name, website_full_name, start_url, active
        FROM Website_Scraping_Sources
        ORDER BY website_name
        """
    )
    rows = cur.fetchall()
    conn.close()

    if not rows:
        print("No sources found")
        return

    print("Website Sources")
    for r in rows:
        print(f"- {r['website_name']}: {r['website_full_name']}")
        print(f"  url={r['start_url']}")
        print(f"  active={r['active']}")


def list_selectors(website_name):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT selector_key, selector_value
        FROM Website_Scraping_Selectors
        WHERE website_name = %s
        ORDER BY selector_key
        """,
        (website_name,),
    )
    rows = cur.fetchall()
    conn.close()

    if not rows:
        print(f"No selectors found for {website_name}")
        return

    print(f"Selectors for {website_name}")
    for r in rows:
        print(f"- {r['selector_key']} = {r['selector_value']}")


def set_selector(website_name, selector_key, selector_value):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO Website_Scraping_Selectors (website_name, selector_key, selector_value)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE selector_value = VALUES(selector_value)
        """,
        (website_name, selector_key, selector_value),
    )
    conn.commit()
    conn.close()
    print(f"Updated selector: {website_name}.{selector_key} = {selector_value}")


def set_source_url(website_name, start_url):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Website_Scraping_Sources
        SET start_url = %s
        WHERE website_name = %s
        """,
        (start_url, website_name),
    )
    conn.commit()
    affected = cur.rowcount
    conn.close()

    if affected == 0:
        print(f"No source row found for {website_name}")
    else:
        print(f"Updated source URL for {website_name}: {start_url}")


class Command(BaseCommand):
    help = "Manage Website_Scraper selector/source config"

    def add_arguments(self, parser):
        sub = parser.add_subparsers(dest="cmd", required=True)

        sub.add_parser("list-sources", help="List all configured website sources")

        p_ls = sub.add_parser("list-selectors", help="List selectors for one website")
        p_ls.add_argument("website_name", help="Website shortform, e.g. ICAI")

        p_ss = sub.add_parser("set-selector", help="Set selector key/value")
        p_ss.add_argument("website_name", help="Website shortform, e.g. ICAI")
        p_ss.add_argument("selector_key", help="Selector key")
        p_ss.add_argument("selector_value", help="Selector value")

        p_su = sub.add_parser("set-source-url", help="Set source URL for website")
        p_su.add_argument("website_name", help="Website shortform, e.g. ICAI")
        p_su.add_argument("start_url", help="New source URL")

    def handle(self, *args, **options):
        cmd = options["cmd"]

        if cmd == "list-sources":
            list_sources()
        elif cmd == "list-selectors":
            list_selectors(options["website_name"])
        elif cmd == "set-selector":
            set_selector(options["website_name"], options["selector_key"], options["selector_value"])
        elif cmd == "set-source-url":
            set_source_url(options["website_name"], options["start_url"])
