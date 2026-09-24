import asyncio
import hashlib
from contextvars import ContextVar
import html
import json
import os
import re
import shutil
import sys
from datetime import date, datetime
from urllib.parse import urljoin
import pymysql
import requests
from django.core.management.base import BaseCommand, CommandError
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from pymysql.cursors import DictCursor

from scraper.database import open_scraper_connection, scraper_connection_kwargs
from scraper.document_processing import process_pdf_url, process_text_content
from scraper.run_lock import acquire_run_lock, clear_cancel, is_cancel_requested, release_run_lock

load_dotenv()
requests.packages.urllib3.disable_warnings()  # type: ignore[attr-defined]


def _required_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is required in the .env file")
    return value


_conn: pymysql.connections.Connection | None = None
_worker_conn: ContextVar[pymysql.connections.Connection | None] = ContextVar(
    "scraper_worker_connection", default=None
)
FORCE_FULL_SCAN = False
SELECTED_SITE = None
CURRENT_RUN_ID = None


def get_conn() -> pymysql.connections.Connection:
    """Return the current worker connection, or the command setup connection."""
    worker_conn = _worker_conn.get()
    if worker_conn is not None:
        try:
            worker_conn.ping(reconnect=True)
            return worker_conn
        except Exception:
            replacement = open_scraper_connection()
            _worker_conn.set(replacement)
            try:
                worker_conn.close()
            except Exception:
                pass
            return replacement

    global _conn
    if _conn is None:
        _conn = pymysql.connect(
            **scraper_connection_kwargs(),
        )
    else:
        try:
            _conn.ping(reconnect=True)
        except Exception:
            _conn = pymysql.connect(
                **scraper_connection_kwargs(),
            )
    return _conn


def close_conn() -> None:
    """Close the persistent connection at the end of the run."""
    global _conn
    if _conn is not None:
        try:
            _conn.close()
        except Exception:
            pass
        _conn = None


def init_tables():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_data (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(700) NOT NULL,
            category VARCHAR(64) NOT NULL DEFAULT 'Notification',
            website_name VARCHAR(32) NOT NULL,
            detail_url VARCHAR(2048),
            notice_date VARCHAR(64),
            due_date VARCHAR(64) NOT NULL DEFAULT '-',
            pdf_url VARCHAR(2048),
            processed TINYINT DEFAULT 0,
            summary LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_site_title_category (website_name, title(640), category)
        ) ENGINE=InnoDB
        """
    )

    cur.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'due_date'")
    if cur.fetchone() is None:
        cur.execute(
            """
            ALTER TABLE Website_Scraping_data
            ADD COLUMN due_date VARCHAR(64) NOT NULL DEFAULT '-'
            AFTER notice_date
            """
        )

    cur.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'pdf_local_path'")
    if cur.fetchone() is not None:
        cur.execute(
            """
            ALTER TABLE Website_Scraping_data
            DROP COLUMN pdf_local_path
            """
        )

    cur.execute("SHOW COLUMNS FROM Website_Scraping_data LIKE 'raw_text'")
    if cur.fetchone() is not None:
        cur.execute(
            """
            ALTER TABLE Website_Scraping_data
            DROP COLUMN raw_text
            """
        )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Professional_Category (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            category_name VARCHAR(100) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Sources (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            website_name VARCHAR(32) UNIQUE NOT NULL,
            website_full_name VARCHAR(255) NOT NULL,
            start_url VARCHAR(2048) NOT NULL,
            professional_category_id BIGINT NULL,
            active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        """
    )

    cur.execute("SHOW COLUMNS FROM Website_Scraping_Sources LIKE 'professional_category_id'")
    if cur.fetchone() is None:
        cur.execute(
            """
            ALTER TABLE Website_Scraping_Sources
            ADD COLUMN professional_category_id BIGINT NULL AFTER start_url
            """
        )

    cur.execute("SHOW INDEX FROM Website_Scraping_Sources WHERE Key_name = 'idx_source_prof_category'")
    if cur.fetchone() is None:
        cur.execute(
            """
            CREATE INDEX idx_source_prof_category ON Website_Scraping_Sources (professional_category_id)
            """
        )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Selectors (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            website_name VARCHAR(32) NOT NULL,
            selector_key VARCHAR(128) NOT NULL,
            selector_value VARCHAR(1024) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_site_selector (website_name, selector_key)
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Runs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            finished_at TIMESTAMP NULL,
            status VARCHAR(16) NOT NULL,
            total_new_rows INT NOT NULL DEFAULT 0,
            error_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Run_Site_Stats (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            run_id BIGINT NOT NULL,
            website_name VARCHAR(32) NOT NULL,
            new_rows INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_run_site (run_id, website_name),
            CONSTRAINT fk_run_stats_run
                FOREIGN KEY (run_id) REFERENCES Website_Scraping_Runs(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Run_Site_Details (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            run_id BIGINT NOT NULL,
            website_name VARCHAR(32) NOT NULL,
            status VARCHAR(16) NOT NULL,
            error_message TEXT NULL,
            started_at TIMESTAMP NULL,
            finished_at TIMESTAMP NULL,
            UNIQUE KEY uk_run_site_detail (run_id, website_name),
            CONSTRAINT fk_run_site_detail_run
                FOREIGN KEY (run_id) REFERENCES Website_Scraping_Runs(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Site_Progress (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            run_id BIGINT NOT NULL,
            website_name VARCHAR(32) NOT NULL,
            status VARCHAR(16) NOT NULL,
            stage VARCHAR(32) NULL,
            current_url VARCHAR(2048) NULL,
            started_at TIMESTAMP NULL,
            heartbeat_at TIMESTAMP NULL,
            finished_at TIMESTAMP NULL,
            discovered_rows INT NOT NULL DEFAULT 0,
            new_rows INT NOT NULL DEFAULT 0,
            processed_rows INT NOT NULL DEFAULT 0,
            failed_rows INT NOT NULL DEFAULT 0,
            error_message TEXT NULL,
            cancel_requested TINYINT NOT NULL DEFAULT 0,
            UNIQUE KEY uk_run_site_progress (run_id, website_name),
            CONSTRAINT fk_site_progress_run
                FOREIGN KEY (run_id) REFERENCES Website_Scraping_Runs(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Item_Progress (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            run_id BIGINT NOT NULL,
            site_progress_id BIGINT NOT NULL,
            data_id BIGINT NULL,
            website_name VARCHAR(32) NOT NULL,
            stage VARCHAR(32) NOT NULL,
            status VARCHAR(16) NOT NULL,
            started_at TIMESTAMP NULL,
            finished_at TIMESTAMP NULL,
            error_message TEXT NULL,
            KEY idx_item_progress_run (run_id),
            KEY idx_item_progress_site (site_progress_id),
            CONSTRAINT fk_item_progress_run
                FOREIGN KEY (run_id) REFERENCES Website_Scraping_Runs(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_item_progress_site
                FOREIGN KEY (site_progress_id) REFERENCES Website_Scraping_Site_Progress(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS User_Feedback (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(150) NOT NULL,
            user_email VARCHAR(254) NOT NULL,
            star_rating TINYINT NOT NULL,
            type_of_feedback VARCHAR(32) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_feedback_email (user_email),
            KEY idx_feedback_type (type_of_feedback),
            KEY idx_feedback_created_at (created_at)
        ) ENGINE=InnoDB
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_State (
            state_key VARCHAR(128) PRIMARY KEY,
            state_value VARCHAR(2048) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        """
    )

    def ensure_column(table_name, column_name, definition):
        cur.execute(
            "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
            (table_name, column_name),
        )
        if not cur.fetchone()["total"]:
            cur.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {definition}")

    ensure_column("Website_Scraping_data", "title_identity", "BINARY(32) NULL AFTER title")
    cur.execute(
        "UPDATE Website_Scraping_data SET title_identity = UNHEX(SHA2(CONCAT(website_name, CHAR(0), category, CHAR(0), title), 256)) WHERE title_identity IS NULL"
    )
    cur.execute("SELECT COUNT(*) AS total FROM Website_Scraping_data WHERE title_identity IS NULL")
    if cur.fetchone()["total"] == 0:
        cur.execute("ALTER TABLE Website_Scraping_data MODIFY title_identity BINARY(32) NOT NULL")

    for index_name, columns in {
        "uk_site_title_identity": "title_identity",
        "idx_data_site_category": "website_name, category",
        "idx_data_site_created": "website_name, created_at",
        "idx_data_site_notice": "website_name, notice_date",
        "idx_data_site_processed": "website_name, processed",
        "idx_data_due_date": "due_date",
    }.items():
        cur.execute(
            "SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Website_Scraping_data' AND INDEX_NAME = %s",
            (index_name,),
        )
        if not cur.fetchone()["total"]:
            index_type = "UNIQUE KEY" if index_name.startswith("uk_") else "INDEX"
            cur.execute(f"ALTER TABLE Website_Scraping_data ADD {index_type} `{index_name}` ({columns})")

    for table_name, columns in {
        "Website_Scraping_Site_Progress": {
            "stage": "VARCHAR(32) NULL",
            "current_url": "VARCHAR(2048) NULL",
            "heartbeat_at": "TIMESTAMP NULL",
            "discovered_rows": "INT NOT NULL DEFAULT 0",
            "new_rows": "INT NOT NULL DEFAULT 0",
            "processed_rows": "INT NOT NULL DEFAULT 0",
            "failed_rows": "INT NOT NULL DEFAULT 0",
            "error_message": "TEXT NULL",
            "cancel_requested": "TINYINT NOT NULL DEFAULT 0",
        },
        "Website_Scraping_Item_Progress": {
            "data_id": "BIGINT NULL",
            "stage": "VARCHAR(32) NOT NULL DEFAULT 'discovered'",
            "status": "VARCHAR(16) NOT NULL DEFAULT 'running'",
            "started_at": "TIMESTAMP NULL",
            "finished_at": "TIMESTAMP NULL",
            "error_message": "TEXT NULL",
        },
    }.items():
        for column_name, definition in columns.items():
            ensure_column(table_name, column_name, definition)

    conn.commit()


def seed_sources_and_selectors():
    conn = get_conn()
    cur = conn.cursor()

    categories = [
        ("Chartered Accountant",),
        ("Lawyers",),
        ("Cost Accountant",),
        ("Banking / Financial Regulation",),
        ("Indirect Taxes and Income",),
    ]

    for category in categories:
        cur.execute(
            """
            INSERT INTO Professional_Category (category_name)
            VALUES (%s)
            ON DUPLICATE KEY UPDATE category_name = VALUES(category_name)
            """,
            category,
        )

    sources = [
        (
            "ICAI",
            "Institute of Chartered Accountants of India",
            "https://www.icai.org/category/notifications",
            "Chartered Accountant",
        ),
        (
            "BCI",
            "Bar Council of India",
            "https://www.barcouncilofindia.org/info/notifications/all-noty",
            "Lawyers",
        ),
        (
            "ICMAI",
            "Institute of Cost Accountants of India",
            "https://icmai.in/ClntAbout/Updates",
            "Cost Accountant",
        ),
        (
            "RBI",
            "Reserve Bank of India",
            "https://www.rbi.org.in/Scripts/NotificationUser.aspx",
            "Banking / Financial Regulation",
        ),
        (
            "CBIC",
            "Central Board of Indirect Taxes and Customs",
            "https://www.cbic.gov.in/entities/view-sticker",
            "Indirect Taxes and Income",
        ),
    ]

    for s in sources:
        cur.execute(
            """
            INSERT INTO Website_Scraping_Sources (website_name, website_full_name, start_url, professional_category_id)
            VALUES (
                %s,
                %s,
                %s,
                (SELECT id FROM Professional_Category WHERE category_name = %s)
            )
            ON DUPLICATE KEY UPDATE
                website_full_name = VALUES(website_full_name),
                start_url = VALUES(start_url),
                professional_category_id = VALUES(professional_category_id)
            """,
            s,
        )

    cur.execute(
        """
        UPDATE Website_Scraping_Sources s
        JOIN Professional_Category c ON c.category_name = 'Chartered Accountant'
        SET s.professional_category_id = c.id
        WHERE s.start_url LIKE 'https://www.icai.org%'
        """
    )
    cur.execute(
        """
        UPDATE Website_Scraping_Sources s
        JOIN Professional_Category c ON c.category_name = 'Lawyers'
        SET s.professional_category_id = c.id
        WHERE s.start_url LIKE 'https://www.barcouncilofindia.org%'
        """
    )
    cur.execute(
        """
        UPDATE Website_Scraping_Sources s
        JOIN Professional_Category c ON c.category_name = 'Cost Accountant'
        SET s.professional_category_id = c.id
        WHERE s.start_url LIKE 'https://icmai.in%'
        """
    )
    cur.execute(
        """
        UPDATE Website_Scraping_Sources s
        JOIN Professional_Category c ON c.category_name = 'Indirect Taxes and Income'
        SET s.professional_category_id = c.id
        WHERE s.start_url LIKE 'https://www.cbic.gov.in/entities/view-sticker%'
        """
    )

    selectors = [
        ("ICAI", "list_wait", "ul.list-group"),
        ("ICAI", "item_links", "ul.list-group li.list-group-item a"),
        ("ICAI", "date_regex", r"\((\d{2}-\d{2}-\d{4})\)"),
        ("ICAI", "base_url", "https://www.icai.org"),
        ("BCI", "feed_wait", "div.feeds___coJNE"),
        ("BCI", "card_links", "div.feeds___coJNE a"),
        ("BCI", "card_title", "h5.title"),
        ("BCI", "card_date_regex", r"\d{1,2}\s+[A-Za-z]{3},\s+\d{4}"),
        ("BCI", "base_url", "https://www.barcouncilofindia.org"),
        ("BCI", "detail_pdf_primary", "a[href$='.pdf'], a[href*='.pdf?']"),
        ("ICMAI", "updates_url", "https://icmai.in/ClntAbout/Updates"),
        ("ICMAI", "updates_archive_url", "https://icmai.in/ClntAbout/UpdateArchive"),
        ("ICMAI", "tenders_archive_url", "https://icmai.in/ClntAbout/TendersArchives"),
        ("ICMAI", "notifications_url", "https://icmai.in/ClntAbout/Notifications"),
        ("ICMAI", "events_url", "https://icmai.in/ClntAbout/Events"),
        ("ICMAI", "tenders_url", "https://icmai.in/ClntAbout/Tender"),
        ("ICMAI", "students_connect_url", "https://icmai.in/ClntAbout/StudentsConnect"),
        ("ICMAI", "content_list_wait", "ul#elearning"),
        ("ICMAI", "content_list_links", "ul#elearning li a"),
        ("ICMAI", "content_pagination", "#pagination"),
        ("ICMAI", "content_pagination_next", "#pagination a.next"),
        ("ICMAI", "students_content_links", ".disciplinary-wrap a[href]"),
        ("ICMAI", "list_wait", "ul#disciplinarydirectorate"),
        ("ICMAI", "list_links", "ul#disciplinarydirectorate li a"),
        ("ICMAI", "archive_table_rows", "#datatable tbody tr"),
        ("ICMAI", "archive_next", "#datatable_next"),
        ("ICMAI", "tender_cards", "div.tender-box"),
        ("ICMAI", "tender_title", "div.tender-text p"),
        ("ICMAI", "tender_read_more", "a[href]"),
        ("ICMAI", "tender_close_day", "div.tender-sub-sec h2"),
        ("ICMAI", "tender_close_text", "div.tender-sub-sec span"),
        ("ICMAI", "tender_next", "ul#tenderPagination li:not(.disabled) a:has(i.feather-chevron-right)"),
        ("ICMAI", "base_url", "https://icmai.in"),
        ("ICMAI", "title_clean_remove_word", "New"),
        ("RBI", "base_url", "https://www.rbi.org.in"),
        ("RBI", "list_table", "table.tablebg"),
        ("RBI", "list_rows", "table.tablebg tbody tr"),
        ("RBI", "date_header", "h2.dop_header"),
        ("RBI", "title_link", "a.link2, td a[href*='NotificationUser.aspx?Id=']"),
        ("CBIC", "list_wait", ".all-new-list"),
        ("CBIC", "item_links", ".all-new-list li a"),
        ("CBIC", "next_button", "li.pagination-next:not(.disabled) a, a:has-text('Next')"),
        ("CBIC", "date_regex", r"(\d{2}[./-]\d{2}[./-]\d{4})"),
    ]

    for row in selectors:
        cur.execute(
            """
            INSERT INTO Website_Scraping_Selectors (website_name, selector_key, selector_value)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE selector_value = VALUES(selector_value)
            """,
            row,
        )

    conn.commit()


def should_seed_sources_and_selectors(force_seed=False):
    """Seed config only when explicitly requested or when config tables are empty."""
    if force_seed:
        return True

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) AS total FROM Website_Scraping_Sources")
    src_row = cur.fetchone() or {}
    sources_total = int(src_row.get("total") or 0)

    cur.execute("SELECT COUNT(*) AS total FROM Website_Scraping_Selectors")
    sel_row = cur.fetchone() or {}
    selectors_total = int(sel_row.get("total") or 0)

    return sources_total == 0 or selectors_total == 0


def get_source(website_name):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT website_name, website_full_name, start_url, professional_category_id
        FROM Website_Scraping_Sources
        WHERE website_name = %s AND active = 1
        """,
        (website_name,),
    )
    row = cur.fetchone()
    return row


def get_selectors(website_name):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT selector_key, selector_value FROM Website_Scraping_Selectors WHERE website_name = %s",
        (website_name,),
    )
    rows = cur.fetchall()
    return {r["selector_key"]: r["selector_value"] for r in rows}


def row_exists(website_name, title, category):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM Website_Scraping_data WHERE website_name=%s AND title=%s AND category=%s",
        (website_name, title, category),
    )
    exists = cur.fetchone() is not None
    return exists


def insert_row(website_name, title, category, detail_url, notice_date, pdf_url, due_date=""):
    conn = get_conn()
    cur = conn.cursor()
    try:
        notice_date = normalize_notice_date(notice_date)
        cur.execute(
            """
            INSERT INTO Website_Scraping_data
            (website_name, title, title_identity, category, detail_url, notice_date, due_date, pdf_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                website_name,
                title,
                hashlib.sha256(f"{website_name}\0{category}\0{title}".encode("utf-8")).digest(),
                category,
                detail_url,
                notice_date,
                due_date or "",
                pdf_url,
            ),
        )
        row_id = cur.lastrowid
        conn.commit()
        print(f"Added [{website_name}] {category}: {title}")
        return row_id
    except pymysql.IntegrityError:
        conn.rollback()
        cur.execute(
            "SELECT id FROM Website_Scraping_data WHERE website_name=%s AND title=%s AND category=%s",
            (website_name, title, category),
        )
        found = cur.fetchone()
        return found["id"] if found else None


def update_row_by_key(website_name, title, category, detail_url, notice_date, pdf_url, due_date=""):
    """Update existing row by natural key when source link/date changes."""
    conn = get_conn()
    cur = conn.cursor()
    notice_date = normalize_notice_date(notice_date)
    cur.execute(
        """
        UPDATE Website_Scraping_data
        SET detail_url = %s,
            notice_date = %s,
            due_date = %s,
            pdf_url = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE website_name = %s AND title = %s AND category = %s
        """,
        (detail_url, notice_date, due_date or "", pdf_url, website_name, title, category),
    )
    conn.commit()
    return cur.rowcount


def update_pdf_processed(row_id, summary, due_date):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Website_Scraping_data
        SET processed = 1,
            summary = %s,
            due_date = %s
        WHERE id = %s
        """,
        (summary, due_date or "", row_id),
    )
    conn.commit()


def get_pending_pdf_rows(website_name=None):
    conn = get_conn()
    cur = conn.cursor()
    query = """
                SELECT
                        d.id,
                        d.website_name,
                        d.title,
                        d.category,
                        d.pdf_url,
                        d.detail_url,
                        COALESCE(s.start_url, '') AS start_url
                FROM Website_Scraping_data d
                LEFT JOIN Website_Scraping_Sources s
                    ON UPPER(d.website_name) = UPPER(s.website_name)
                WHERE (d.pdf_url IS NOT NULL OR d.detail_url IS NOT NULL)
                    AND (d.processed = 0 OR d.summary IS NULL)
        """
    params = ()
    if website_name:
        query += " AND UPPER(d.website_name) = %s"
        params = (website_name.upper(),)
    cur.execute(query, params)
    rows = cur.fetchall()
    return rows


def get_active_site_names():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT website_name FROM Website_Scraping_Sources WHERE active = 1")
    return {row["website_name"].upper() for row in cur.fetchall()}


def is_probable_pdf_url(url):
    if not url:
        return False
    lowered = url.lower()
    return ".pdf" in lowered


def get_total_data_count():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS total FROM Website_Scraping_data")
    row = cur.fetchone()
    return int(row["total"]) if row else 0


def get_site_data_counts():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT website_name, COUNT(*) AS total
        FROM Website_Scraping_data
        GROUP BY website_name
        """
    )
    rows = cur.fetchall()
    return {r["website_name"]: int(r["total"]) for r in rows}


def create_run():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO Website_Scraping_Runs (status) VALUES ('running')")
    run_id = cur.lastrowid
    conn.commit()
    return run_id


def report_site_progress(
    website_name,
    status="running",
    stage=None,
    current_url=None,
    discovered_rows=None,
    new_rows=None,
    processed_rows=None,
    failed_rows=None,
    error_message=None,
    cancel_requested=None,
):
    if CURRENT_RUN_ID is None:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT discovered_rows, new_rows, processed_rows, failed_rows, cancel_requested FROM Website_Scraping_Site_Progress WHERE run_id = %s AND website_name = %s",
        (CURRENT_RUN_ID, website_name),
    )
    existing = cur.fetchone() or {}
    discovered_rows = existing.get("discovered_rows", 0) if discovered_rows is None else discovered_rows
    new_rows = existing.get("new_rows", 0) if new_rows is None else new_rows
    processed_rows = existing.get("processed_rows", 0) if processed_rows is None else processed_rows
    failed_rows = existing.get("failed_rows", 0) if failed_rows is None else failed_rows
    cancel_requested = existing.get("cancel_requested", 0) if cancel_requested is None else cancel_requested
    cur.execute(
        """
        INSERT INTO Website_Scraping_Site_Progress
            (run_id, website_name, status, stage, current_url, started_at, heartbeat_at,
             discovered_rows, new_rows, processed_rows, failed_rows, error_message, cancel_requested)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            stage = COALESCE(VALUES(stage), stage),
            current_url = COALESCE(VALUES(current_url), current_url),
            heartbeat_at = CURRENT_TIMESTAMP,
            discovered_rows = COALESCE(VALUES(discovered_rows), discovered_rows),
            new_rows = COALESCE(VALUES(new_rows), new_rows),
            processed_rows = COALESCE(VALUES(processed_rows), processed_rows),
            failed_rows = COALESCE(VALUES(failed_rows), failed_rows),
            error_message = VALUES(error_message),
            cancel_requested = COALESCE(VALUES(cancel_requested), cancel_requested),
            finished_at = IF(VALUES(status) IN ('success', 'failed', 'cancelled'), CURRENT_TIMESTAMP, finished_at)
        """,
        (
            CURRENT_RUN_ID,
            website_name,
            status,
            stage,
            current_url,
            discovered_rows,
            new_rows,
            processed_rows,
            failed_rows,
            error_message,
            int(bool(cancel_requested)) if cancel_requested is not None else 0,
        ),
    )
    conn.commit()
    cur.execute(
        "SELECT id FROM Website_Scraping_Site_Progress WHERE run_id = %s AND website_name = %s",
        (CURRENT_RUN_ID, website_name),
    )
    row = cur.fetchone()
    return row["id"] if row else None


def start_item_progress(website_name, data_id, stage):
    site_progress_id = report_site_progress(website_name, stage=stage)
    if site_progress_id is None or CURRENT_RUN_ID is None:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO Website_Scraping_Item_Progress
            (run_id, site_progress_id, data_id, website_name, stage, status, started_at)
        VALUES (%s, %s, %s, %s, %s, 'running', CURRENT_TIMESTAMP)
        """,
        (CURRENT_RUN_ID, site_progress_id, data_id, website_name, stage),
    )
    conn.commit()
    increment_site_progress(website_name, "discovered_rows")
    return cur.lastrowid


def increment_site_progress(website_name, field_name):
    allowed_fields = {"discovered_rows", "new_rows", "processed_rows", "failed_rows"}
    if field_name not in allowed_fields or CURRENT_RUN_ID is None:
        return
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE Website_Scraping_Site_Progress SET {field_name} = {field_name} + 1, heartbeat_at = CURRENT_TIMESTAMP WHERE run_id = %s AND website_name = %s",
        (CURRENT_RUN_ID, website_name),
    )
    conn.commit()


def finish_item_progress(item_id, status, stage, error_message=None):
    if item_id is None:
        return
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Website_Scraping_Item_Progress
        SET status = %s, stage = %s, finished_at = CURRENT_TIMESTAMP, error_message = %s
        WHERE id = %s
        """,
        (status, stage, error_message, item_id),
    )
    conn.commit()
    cur.execute("SELECT website_name FROM Website_Scraping_Item_Progress WHERE id = %s", (item_id,))
    row = cur.fetchone()
    if row:
        increment_site_progress(row["website_name"], "processed_rows" if status == "completed" else "failed_rows")
        report_site_progress(
            row["website_name"],
            status="success" if status == "completed" else "failed",
            stage=stage,
            error_message=error_message,
        )


def complete_run(run_id, total_new_rows, per_site_new_rows, site_results, status="success"):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Website_Scraping_Runs
        SET status = %s,
            finished_at = CURRENT_TIMESTAMP,
            total_new_rows = %s,
            error_text = NULL
        WHERE id = %s
        """,
        (status, total_new_rows, run_id),
    )

    for website_name, new_rows in per_site_new_rows.items():
        if new_rows <= 0:
            continue
        cur.execute(
            """
            INSERT INTO Website_Scraping_Run_Site_Stats (run_id, website_name, new_rows)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE new_rows = VALUES(new_rows)
            """,
            (run_id, website_name, new_rows),
        )

    for website_name, error in site_results:
        cur.execute(
            """
            INSERT INTO Website_Scraping_Run_Site_Details
                (run_id, website_name, status, error_message, started_at, finished_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE status = VALUES(status), error_message = VALUES(error_message), finished_at = CURRENT_TIMESTAMP
            """,
            (run_id, website_name, "failed" if error else "success", str(error)[:4000] if error else None),
        )

    conn.commit()


def fail_run(run_id, error_text):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Website_Scraping_Runs
        SET status = 'failed',
            finished_at = CURRENT_TIMESTAMP,
            error_text = %s
        WHERE id = %s
        """,
        (error_text[:4000], run_id),
    )
    conn.commit()


def download_pdf(pdf_url, website_name, row_id):
    folder = f"{website_name.lower()}_pdfs"
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, f"row_{row_id}.pdf")
    try:
        resp = requests.get(pdf_url, timeout=20, verify=False)
        resp.raise_for_status()
        with open(file_path, "wb") as f:
            f.write(resp.content)
        print(f"Downloaded PDF: {file_path}")
        return file_path
    except Exception as e:
        print(f"PDF download failed: {e}")
        return None


def extract_json_payload(response_text):
    if not response_text:
        return None

    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def _strip_ordinal_suffix(text):
    """Remove ordinal suffixes (st, nd, rd, th) from text."""
    import re
    return re.sub(r'(\d+)(st|nd|rd|th)\b', r'\1', text, flags=re.IGNORECASE)


def normalize_due_date(value):
    if not value:
        return ""

    due_date = str(value).strip()
    if not due_date:
        return ""

    if due_date.lower() in {"n/a", "na", "none", "null", "not applicable", "no due date", "-"}:
        return ""

    due_date = _strip_ordinal_suffix(due_date)
    due_date = due_date.replace(" . ", " ").replace("/.", "/").replace(".", "/")
    due_date = due_date.replace("Sept ", "Sep ").replace("Sept,", "Sep,")

    patterns = [
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d.%m.%Y",
        "%d.%m.%y",
        "%Y-%m-%d",
        "%d %b %Y",
        "%d %B %Y",
        "%d %b, %Y",
        "%d %B, %Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%b %d %Y",
        "%B %d %Y",
        "%B %d,%Y",
    ]

    parsed_date = None
    for pattern in patterns:
        try:
            parsed_date = datetime.strptime(due_date, pattern).date()
            break
        except ValueError:
            continue

    if parsed_date is None:
        return ""

    return parsed_date.strftime("%d %b %Y")


def normalize_notice_date(value):
    if not value:
        return "N/A"

    notice_date = str(value).strip()
    if not notice_date:
        return "N/A"

    if notice_date.lower() in {"n/a", "na", "none", "null", "not applicable", "-"}:
        return "N/A"

    notice_date = _strip_ordinal_suffix(notice_date)
    notice_date = notice_date.replace(" . ", " ").replace("/.", "/").replace(".", "/")
    notice_date = notice_date.replace("Sept ", "Sep ").replace("Sept,", "Sep,")

    patterns = [
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d.%m.%Y",
        "%d.%m.%y",
        "%Y-%m-%d",
        "%d %b %Y",
        "%d %B %Y",
        "%d %b, %Y",
        "%d %B, %Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%b %d %Y",
        "%B %d %Y",
        "%B %d,%Y",
    ]

    parsed_date = None
    for pattern in patterns:
        try:
            parsed_date = datetime.strptime(notice_date, pattern).date()
            break
        except ValueError:
            continue

    if parsed_date is None:
        return "N/A"

    if parsed_date > date.today():
        return "N/A"

    return parsed_date.strftime("%d %b %Y")


def clean_html_to_text(content):
    """Convert raw HTML to plain text suitable for summary generation."""
    if not content:
        return ""

    cleaned = re.sub(r"<script[^>]*>.*?</script>", " ", content, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<style[^>]*>.*?</style>", " ", cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


PLACEHOLDER_MARKERS = [
    "you are using an outdated browser",
    "you must enable javascript to view this page",
    "please upgrade your browser",
    "enable javascript",
]


def _contains_placeholder_marker(text):
    lowered = (text or "").lower()
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def is_js_gate_placeholder(text):
    """Detect pages that require JS and don't contain the actual document body."""
    if not text:
        return True

    lowered = text.lower()
    marker_hits = sum(1 for marker in PLACEHOLDER_MARKERS if marker in lowered)
    return marker_hits >= 1 or len(text) < 120


def _build_meaningful_summary(text, title=""):
    """Extract concise, meaningful summary text from noisy source text."""
    if not text:
        return ""

    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return ""

    chunks = re.split(r"(?<=[.!?])\s+|[\n\r]+", normalized)
    useful = []
    seen = set()
    title_tokens = {
        tok for tok in re.findall(r"[a-zA-Z]{4,}", (title or "").lower()) if tok not in {"notification", "regarding"}
    }
    regulatory_tokens = {
        "circular", "notification", "amendment", "compliance", "deadline", "submission", "tax", "duty",
        "regulation", "gst", "customs", "act", "order", "clause", "effective", "applicable",
    }
    ignore_markers = [
        "skip to main content",
        "privacy policy",
        "cookie",
        "terms and conditions",
        "all rights reserved",
        "javascript",
        "outdated browser",
    ]

    scored = []
    for idx, chunk in enumerate(chunks):
        line = chunk.strip(" -|:\t")
        if len(line) < 35 or len(line) > 450:
            continue

        low = line.lower()
        if any(marker in low for marker in ignore_markers):
            continue

        if low in seen:
            continue

        alpha_count = sum(1 for ch in line if ch.isalpha())
        if alpha_count < 20:
            continue

        words = set(re.findall(r"[a-zA-Z]{3,}", low))
        title_hits = len(words & title_tokens)
        regulation_hits = len(words & regulatory_tokens)
        score = (3 * title_hits) + regulation_hits + (1 if len(line) > 90 else 0)
        scored.append((score, idx, low, line))

    if not scored:
        return ""

    scored.sort(key=lambda item: (-item[0], item[1]))
    for score, idx, low, line in scored:
        if low in seen:
            continue
        seen.add(low)
        useful.append(line)
        if len(useful) >= 4:
            break

    return " ".join(useful)[:700].strip()


def is_meaningful_summary(summary_text):
    """Reject placeholder or low-information summaries before saving to DB."""
    summary = re.sub(r"\s+", " ", (summary_text or "")).strip()
    if len(summary) < 60:
        return False
    if _contains_placeholder_marker(summary):
        return False
    alpha_count = sum(1 for ch in summary if ch.isalpha())
    if alpha_count < 40:
        return False
    return True


def extract_text_with_playwright(page_url):
    """Render the page in a browser and extract visible text from the DOM."""
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                page = browser.new_page(viewport={"width": 1366, "height": 900})
                page.goto(page_url, wait_until="networkidle", timeout=60000)
                body_text = page.locator("body").inner_text(timeout=15000)
                body_text = re.sub(r"\s+", " ", body_text or "").strip()
                return body_text if len(body_text) >= 120 else None
            finally:
                browser.close()
    except Exception as e:
        print(f"Playwright HTML extraction failed: {e}")
        return None


def extract_text_from_html_page(page_url):
    """Fetch and extract readable text from an HTML detail page."""
    try:
        resp = requests.get(page_url, timeout=25, verify=False)
        resp.raise_for_status()
        content = resp.text or ""
        if not content.strip():
            return None

        text_content = clean_html_to_text(content)
        if is_js_gate_placeholder(text_content):
            print("HTML page appears JS-gated; retrying extraction via Playwright rendering")
            rendered_text = extract_text_with_playwright(page_url)
            return rendered_text

        return text_content if len(text_content) >= 80 else None
    except Exception as e:
        print(f"HTML text extraction failed: {e}")
        return None


def generate_summary_from_python_extraction(text, title, category, website_name):
    """Generate summary from extracted PDF text using heuristics and regex."""
    try:
        if not text:
            return None
        
        summary = _build_meaningful_summary(text, title=title)
        if not summary:
            return None

        if not is_meaningful_summary(summary):
            return None
        
        # Extract due date
        due_date = extract_due_date_from_text(text)
        
        return {"summary": summary, "due_date": due_date}
    except Exception as e:
        print(f"Python extraction summary generation error: {e}")
        return None


def generate_summary_from_detail_page(detail_url, title, category, website_name):
    """Generate summary from HTML detail page with Groq only."""
    print(f"  Attempting HTML extraction for row (title={title})")
    extracted_text = extract_text_from_html_page(detail_url)

    if not extracted_text or len(extracted_text.strip()) < 40:
        print("  ✗ HTML text extraction failed/minimal; leaving row retryable")
        return None
    try:
        result = process_text_content(
            extracted_text,
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            timeout_seconds=int(os.getenv("GROQ_TIMEOUT_SECONDS", "30")),
        )
        print("  ✓ Summary generated via Groq HTML processing")
        return result
    except Exception as exc:
        print(f"  ✗ Groq HTML processing failed: {exc}")
        return None


async def scrape_icai(page):
    src = get_source("ICAI")
    sel = get_selectors("ICAI")
    if not src or not sel:
        print("ICAI source/selectors missing")
        return

    await page.goto(src["start_url"], wait_until="networkidle", timeout=60000)
    await page.wait_for_selector(sel["list_wait"], timeout=30000)
    links = await page.locator(sel["item_links"]).all()

    new_count = 0
    for link in links:
        text = await link.inner_text()
        href = await link.get_attribute("href")
        if not text or not href:
            continue

        clean_text = text.strip()
        m = re.search(sel["date_regex"], clean_text)
        notice_date = m.group(1) if m else "N/A"
        title = re.sub(r"\s*-\s*\(" + re.escape(notice_date) + r"\)$", "", clean_text).strip() if m else clean_text

        category = "Notification"
        if row_exists("ICAI", title, category):
            print(f"ICAI exists: {title}")
            if not FORCE_FULL_SCAN and new_count == 0:
                print("ICAI up to date (first item exists), stopping.")
                break
            continue

        pdf_url = urljoin(sel["base_url"], href)
        insert_row("ICAI", title, category, src["start_url"], notice_date, pdf_url)
        new_count += 1


def _clean_rbi_text(value):
    return re.sub(r"\s+", " ", html.unescape((value or "")).strip())


async def _rbi_first_notice_title(page, sel):
    title = await page.evaluate(
        """
        (tableSelector) => {
            const table = document.querySelector(tableSelector);
            if (!table) {
                return "";
            }

            let seenHeader = false;
            for (const tr of table.querySelectorAll("tr")) {
                if (tr.querySelector("h2.dop_header")) {
                    seenHeader = true;
                    continue;
                }

                if (!seenHeader) {
                    continue;
                }

                const anchor = tr.querySelector("a.link2, td a[href*='NotificationUser.aspx?Id=']");
                if (anchor) {
                    return (anchor.textContent || "").replace(/\s+/g, ' ').trim();
                }
            }

            return "";
        }
        """,
        sel["list_table"],
    )
    return _clean_rbi_text(title)


async def _scrape_rbi_current_table(page, sel):
    rows = await page.locator(sel["list_rows"]).all()
    if not rows:
        return 0

    new_count = 0
    current_notice_date = "N/A"

    for row in rows:
        header = row.locator(sel["date_header"]).first
        if await header.count() > 0:
            current_notice_date = _clean_rbi_text(await header.inner_text()) or "N/A"
            continue

        cells = row.locator("td")
        if await cells.count() < 1:
            continue

        title_loc = cells.nth(0).locator(sel["title_link"]).first
        if await title_loc.count() == 0:
            continue

        title = _clean_rbi_text(await title_loc.inner_text())
        if not title:
            continue

        detail_href = _clean_rbi_text(await title_loc.get_attribute("href"))
        detail_url = urljoin(sel["base_url"], detail_href) if detail_href else sel["base_url"] + "/Scripts/NotificationUser.aspx"

        pdf_url = ""
        link_candidates = await row.locator("a[href]").all()
        for link in link_candidates:
            href = _clean_rbi_text(await link.get_attribute("href"))
            if not href:
                continue
            absolute_href = urljoin(sel["base_url"], href)
            if ".pdf" in absolute_href.lower():
                pdf_url = absolute_href
                break

        if not pdf_url and ".pdf" in detail_url.lower():
            pdf_url = detail_url

        notice_date = current_notice_date if current_notice_date != "N/A" else "N/A"
        category = "Notification"

        if row_exists("RBI", title, category):
            if FORCE_FULL_SCAN:
                update_row_by_key("RBI", title, category, detail_url, notice_date, pdf_url, "")
                continue
            print(f"RBI exists: {title}")
            print("RBI up to date (encountered existing item), stopping.")
            break

        insert_row("RBI", title, category, detail_url, notice_date, pdf_url, "")
        new_count += 1

    return new_count


async def scrape_rbi(page):
    src = get_source("RBI")
    sel = get_selectors("RBI")
    if not src or not sel:
        print("RBI source/selectors missing")
        return

    await page.goto(src["start_url"], wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_selector(sel["list_table"], timeout=30000)

    first_title = await _rbi_first_notice_title(page, sel)
    if first_title and row_exists("RBI", first_title, "Notification"):
        print(f"RBI up to date (first item exists): {first_title}")
        return

    new_count = await _scrape_rbi_current_table(page, sel)
    print(f"RBI landing page scraped: 2026, new rows: {new_count}")


async def scrape_icmai(page):
    src = get_source("ICMAI")
    sel = get_selectors("ICMAI")
    if not src or not sel:
        print("ICMAI source/selectors missing")
        return

    def _extract_notice_date(text_value):
        text_value = text_value or ""
        patterns = [
            r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b",
            r"\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4}\b",
            r"\b[A-Za-z]+\s+\d{1,2},\s*\d{4}\b",
        ]
        for pat in patterns:
            m = re.search(pat, text_value, flags=re.IGNORECASE)
            if m:
                return m.group(0)
        return "N/A"

    async def _scrape_list_page(page_url, category):
        await page.goto(page_url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_selector(sel["list_wait"], timeout=30000)

        links = await page.locator(sel["list_links"]).all()
        new_count = 0

        for link in links:
            raw_href = await link.get_attribute("href")
            href = (raw_href or "").strip()
            raw_text = (await link.inner_text() or "").strip()

            title = re.sub(r"\b" + re.escape(sel["title_clean_remove_word"]) + r"\b", "", raw_text, flags=re.IGNORECASE).strip()
            title = re.sub(r"\s+", " ", title)
            if not title:
                continue

            full_url = urljoin(sel["base_url"], href) if href else page_url
            full_url = full_url.strip()
            lowered = full_url.lower()
            pdf_url = full_url if any(ext in lowered for ext in [".pdf", ".png", ".jpg", ".jpeg"]) else None
            notice_date = _extract_notice_date(title)

            if row_exists("ICMAI", title, category):
                print(f"ICMAI exists ({category}): {title}")
                if not FORCE_FULL_SCAN and new_count == 0:
                    print(f"ICMAI {category} up to date (first item exists), stopping category.")
                    break
                continue

            insert_row("ICMAI", title, category, full_url, notice_date, pdf_url)
            new_count += 1

    async def _scrape_tenders():
        visited = set()
        next_page_url = sel["tenders_url"]
        new_count = 0

        while next_page_url and next_page_url not in visited:
            visited.add(next_page_url)
            await page.goto(next_page_url, wait_until="domcontentloaded", timeout=60000)
            try:
                await page.wait_for_selector(sel["tender_cards"], timeout=30000)
            except Exception:
                print(f"ICMAI Tenders page has no tender cards at {next_page_url}; stopping tender pagination.")
                break

            cards = await page.locator(sel["tender_cards"]).all()
            if not cards:
                print(f"ICMAI Tenders page has empty tender cards at {next_page_url}; stopping tender pagination.")
                break
            for card in cards:
                title_loc = card.locator(sel["tender_title"]).first
                title = re.sub(r"\s+", " ", (await title_loc.inner_text() if await title_loc.count() > 0 else "").strip())
                if not title:
                    continue

                href = ""
                anchors = await card.locator(sel["tender_read_more"]).all()
                for anchor in anchors:
                    link_text = ((await anchor.inner_text()) or "").strip().lower()
                    candidate_href = ((await anchor.get_attribute("href")) or "").strip()
                    if not candidate_href:
                        continue
                    if "read more" in link_text or candidate_href.lower().endswith(".pdf"):
                        href = candidate_href
                        break
                full_url = urljoin(sel["base_url"], href) if href else next_page_url
                lowered = full_url.lower()
                pdf_url = full_url if any(ext in lowered for ext in [".pdf", ".png", ".jpg", ".jpeg"]) else None

                day_loc = card.locator(sel["tender_close_day"]).first
                text_locs = await card.locator(sel["tender_close_text"]).all_inner_texts()
                day_txt = ((await day_loc.inner_text()) if await day_loc.count() > 0 else "").strip()
                tail_txt = ""
                for t in text_locs:
                    candidate = (t or "").strip()
                    lower = candidate.lower()
                    if not candidate:
                        continue
                    if "closing date" in lower or "no date available" in lower:
                        continue
                    tail_txt = candidate
                    break
                notice_date = "N/A"
                if day_txt and day_txt != "-":
                    notice_date = f"{day_txt} {tail_txt}".strip()
                notice_date = _extract_notice_date(notice_date) if notice_date != "N/A" else "N/A"

                category = "Tenders"
                due_date = notice_date if notice_date != "N/A" else ""
                if row_exists("ICMAI", title, category):
                    print(f"ICMAI exists ({category}): {title}")
                    update_row_by_key("ICMAI", title, category, full_url, notice_date, pdf_url, due_date)
                    if not FORCE_FULL_SCAN and new_count == 0:
                        print("ICMAI Tenders up to date (first item exists), stopping category.")
                        return
                    continue

                insert_row("ICMAI", title, category, full_url, notice_date, pdf_url, due_date)
                new_count += 1

            next_btn = page.locator(sel["tender_next"]).first
            if await next_btn.count() == 0:
                break
            next_href = ((await next_btn.get_attribute("href")) or "").strip()
            if not next_href:
                break
            candidate = urljoin(next_page_url, next_href)
            if candidate in visited:
                break
            next_page_url = candidate

    await _scrape_list_page(sel["updates_url"], "Updates")
    await _scrape_list_page(sel["notifications_url"], "Notifications")
    await _scrape_list_page(sel["events_url"], "Events")
    await _scrape_tenders()


async def scrape_icmai_update_archive(page):
    """One-time backfill scraper for ICMAI UpdateArchive pages."""
    src = get_source("ICMAI")
    sel = get_selectors("ICMAI")
    if not src or not sel:
        print("ICMAI source/selectors missing")
        return

    archive_url = sel.get("updates_archive_url")
    if not archive_url:
        print("ICMAI archive URL selector missing")
        return

    def _extract_notice_date(text_value):
        text_value = text_value or ""
        patterns = [
            r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b",
            r"\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}\b",
            r"\b[A-Za-z]+\s+\d{1,2},\s*\d{4}\b",
        ]
        for pat in patterns:
            m = re.search(pat, text_value, flags=re.IGNORECASE)
            if m:
                return m.group(0)
        return "N/A"

    await page.goto(archive_url, wait_until="domcontentloaded", timeout=60000)
    await page.wait_for_selector(sel["archive_table_rows"], timeout=30000)

    page_num = 1
    inserted = 0
    seen_first_titles = set()

    while True:
        rows = await page.locator(sel["archive_table_rows"]).all()
        if not rows:
            break

        first_cells = rows[0].locator("td")
        first_title = ""
        if await first_cells.count() >= 2:
            first_title = re.sub(r"\s+", " ", (await first_cells.nth(1).inner_text() or "").strip())
        if first_title and first_title in seen_first_titles:
            break
        if first_title:
            seen_first_titles.add(first_title)

        for row in rows:
            cells = row.locator("td")
            if await cells.count() < 5:
                continue

            title = re.sub(r"\s+", " ", (await cells.nth(1).inner_text() or "").strip())
            if not title:
                continue

            closing_date_text = (await cells.nth(2).inner_text() or "").strip()
            link_loc = cells.nth(4).locator("a").first
            href = (await link_loc.get_attribute("href") if await link_loc.count() > 0 else "") or ""
            href = href.strip()

            # Preserve source URL exactly as published in the archive table.
            detail_url = href if href else archive_url
            lowered = detail_url.lower()
            pdf_url = detail_url if any(ext in lowered for ext in [".pdf", ".png", ".jpg", ".jpeg"]) else None

            notice_date = "N/A"
            if closing_date_text and closing_date_text not in {"-", "--", "N/A", "NA"}:
                notice_date = closing_date_text
            else:
                notice_date = _extract_notice_date(title)

            category = "Updates"
            if row_exists("ICMAI", title, category):
                update_row_by_key("ICMAI", title, category, detail_url, notice_date, pdf_url, "")
                continue

            insert_row("ICMAI", title, category, detail_url, notice_date, pdf_url, "")
            inserted += 1

        next_btn = page.locator(sel["archive_next"]).first
        if await next_btn.count() == 0:
            break

        cls = ((await next_btn.get_attribute("class")) or "").lower()
        aria_disabled = ((await next_btn.get_attribute("aria-disabled")) or "").lower()
        if "disabled" in cls or aria_disabled == "true":
            break

        prev_first_title = first_title
        await next_btn.click()
        changed = False
        for _ in range(20):
            await asyncio.sleep(0.3)
            probe_rows = await page.locator(sel["archive_table_rows"]).all()
            if not probe_rows:
                continue
            probe_cells = probe_rows[0].locator("td")
            if await probe_cells.count() < 2:
                continue
            probe_title = re.sub(r"\s+", " ", (await probe_cells.nth(1).inner_text() or "").strip())
            if probe_title and probe_title != prev_first_title:
                changed = True
                break
        if not changed:
            break
        page_num += 1

    print(f"ICMAI archive pages scraped: {page_num}, new rows: {inserted}")


async def scrape_icmai_tender_archive(page):
    """One-time backfill scraper for ICMAI TendersArchives pages."""
    src = get_source("ICMAI")
    sel = get_selectors("ICMAI")
    if not src or not sel:
        print("ICMAI source/selectors missing")
        return

    archive_url = sel.get("tenders_archive_url")
    if not archive_url:
        print("ICMAI tender archive URL selector missing")
        return

    def _extract_notice_date(text_value):
        text_value = text_value or ""
        patterns = [
            r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b",
            r"\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}\b",
            r"\b[A-Za-z]+\s+\d{1,2},\s*\d{4}\b",
        ]
        for pat in patterns:
            m = re.search(pat, text_value, flags=re.IGNORECASE)
            if m:
                return m.group(0)
        return "N/A"

    def _normalize_link(raw_href):
        href = (raw_href or "").strip()
        if not href:
            return ""
        url = urljoin(sel["base_url"], href)
        lowered = url.lower().rstrip("/")
        if lowered.endswith("/upload/tender"):
            return ""
        return url

    await page.goto(archive_url, wait_until="domcontentloaded", timeout=60000)
    await page.wait_for_selector(sel["archive_table_rows"], timeout=30000)

    page_num = 1
    inserted = 0

    while True:
        rows = await page.locator(sel["archive_table_rows"]).all()
        if not rows:
            break

        for row in rows:
            cells = row.locator("td")
            if await cells.count() < 8:
                continue

            title_col = re.sub(r"\s+", " ", (await cells.nth(1).inner_text() or "").strip())
            desc_col = re.sub(r"\s+", " ", (await cells.nth(2).inner_text() or "").strip())
            start_col = (await cells.nth(3).inner_text() or "").strip()
            end_col = (await cells.nth(4).inner_text() or "").strip()

            title = title_col or desc_col
            if not title:
                continue

            read_more_link = ""
            tender_doc_link = ""
            corr_link = ""

            read_more_loc = cells.nth(5).locator("a").first
            if await read_more_loc.count() > 0:
                read_more_link = _normalize_link(await read_more_loc.get_attribute("href"))

            tender_doc_loc = cells.nth(6).locator("a").first
            if await tender_doc_loc.count() > 0:
                tender_doc_link = _normalize_link(await tender_doc_loc.get_attribute("href"))

            corr_loc = cells.nth(7).locator("a").first
            if await corr_loc.count() > 0:
                corr_link = _normalize_link(await corr_loc.get_attribute("href"))

            detail_url = read_more_link or tender_doc_link or corr_link or archive_url
            lowered = detail_url.lower()
            pdf_url = detail_url if any(ext in lowered for ext in [".pdf", ".png", ".jpg", ".jpeg"]) else None

            notice_date = "N/A"
            if end_col and end_col not in {"-", "--", "N/A", "NA"}:
                notice_date = end_col
            elif start_col and start_col not in {"-", "--", "N/A", "NA"}:
                notice_date = start_col
            else:
                notice_date = _extract_notice_date(desc_col)

            category = "Tenders"
            due_date = notice_date if notice_date != "N/A" else ""
            if row_exists("ICMAI", title, category):
                update_row_by_key("ICMAI", title, category, detail_url, notice_date, pdf_url, due_date)
                continue

            insert_row("ICMAI", title, category, detail_url, notice_date, pdf_url, due_date)
            inserted += 1

        next_btn = page.locator(sel["archive_next"]).first
        if await next_btn.count() == 0:
            break

        cls = ((await next_btn.get_attribute("class")) or "").lower()
        aria_disabled = ((await next_btn.get_attribute("aria-disabled")) or "").lower()
        if "disabled" in cls or aria_disabled == "true":
            break

        prev_snapshot = ""
        if rows:
            preview_count = min(len(rows), 2)
            preview_texts = []
            for i in range(preview_count):
                row_cells = rows[i].locator("td")
                if await row_cells.count() >= 3:
                    preview_texts.append(
                        re.sub(r"\s+", " ", (await row_cells.nth(2).inner_text() or "").strip())
                    )
            prev_snapshot = " || ".join(preview_texts)

        await next_btn.click()
        changed = False
        for _ in range(60):
            await asyncio.sleep(0.25)
            probe_rows = await page.locator(sel["archive_table_rows"]).all()
            if not probe_rows:
                continue
            probe_preview_count = min(len(probe_rows), 2)
            probe_texts = []
            for i in range(probe_preview_count):
                probe_cells = probe_rows[i].locator("td")
                if await probe_cells.count() >= 3:
                    probe_texts.append(
                        re.sub(r"\s+", " ", (await probe_cells.nth(2).inner_text() or "").strip())
                    )
            probe_snapshot = " || ".join(probe_texts)
            if probe_snapshot and probe_snapshot != prev_snapshot:
                changed = True
                break
        if not changed:
            break
        page_num += 1

    print(f"ICMAI tender archive pages scraped: {page_num}, new rows: {inserted}")


async def scrape_bci(page, context):
    src = get_source("BCI")
    sel = get_selectors("BCI")
    if not src or not sel:
        print("BCI source/selectors missing")
        return

    await page.goto(src["start_url"], wait_until="networkidle", timeout=60000)
    await page.wait_for_selector(sel["feed_wait"], timeout=30000)
    cards = await page.locator(sel["card_links"]).all()

    new_count = 0
    for card in cards:
        href = await card.get_attribute("href")
        if not href:
            continue

        title_loc = card.locator(sel["card_title"]).first
        title = ""
        if await title_loc.count() > 0:
            title = (await title_loc.inner_text()).strip()
        if not title:
            continue

        spans = await card.locator("span").all_inner_texts()
        notice_date = "N/A"
        for t in spans:
            m = re.search(sel["card_date_regex"], t.strip())
            if m:
                notice_date = m.group(0)
                break

        detail_url = urljoin(sel["base_url"], href)
        pdf_url = None

        detail = await context.new_page()
        try:
            await detail.goto(detail_url, wait_until="networkidle", timeout=60000)
            pdf_a = detail.locator(sel["detail_pdf_primary"]).first
            if await pdf_a.count() > 0:
                p = await pdf_a.get_attribute("href")
                if p:
                    pdf_url = urljoin(sel["base_url"], p)
            if not pdf_url:
                all_anchors = await detail.locator("a").all()
                for a in all_anchors:
                    p = await a.get_attribute("href")
                    if p and ".pdf" in p.lower():
                        pdf_url = urljoin(sel["base_url"], p)
                        break
        except Exception as e:
            print(f"BCI detail parse error: {e}")
        finally:
            await detail.close()

        category = "Notification"
        if row_exists("BCI", title, category):
            print(f"BCI exists: {title}")
            if not FORCE_FULL_SCAN and new_count == 0:
                print("BCI up to date (first item exists), stopping.")
                break
            continue

        insert_row("BCI", title, category, detail_url, notice_date, pdf_url)
        new_count += 1


async def scrape_cbic(page):
    src = get_source("CBIC")
    sel = get_selectors("CBIC")
    if not src or not sel:
        print("CBIC source/selectors missing")
        return

    await page.goto(src["start_url"], wait_until="networkidle", timeout=60000)

    new_count = 0
    page_num = 1
    while True:
        await page.wait_for_selector(sel["list_wait"], timeout=30000)
        await asyncio.sleep(1)

        texts = await page.locator(sel["item_links"]).all_inner_texts()
        for txt in texts:
            clean = txt.strip().replace("\xa0", " ")
            if not clean:
                continue
            dates = re.findall(sel["date_regex"], clean)
            notice_date = dates[0] if dates else "N/A"
            title = clean
            category = "Notification"

            if row_exists("CBIC", title, category):
                if not FORCE_FULL_SCAN and new_count == 0 and page_num == 1:
                    print("CBIC up to date (first item exists), stopping.")
                    return
                continue

            insert_row("CBIC", title, category, src["start_url"], notice_date, None)
            new_count += 1

        next_btn = page.locator(sel["next_button"]).first
        if await next_btn.count() > 0 and await next_btn.is_visible() and await next_btn.is_enabled():
            await next_btn.click()
            page_num += 1
            await asyncio.sleep(2)
        else:
            break

    print(f"CBIC pages scraped: {page_num}, new rows: {new_count}")


async def scrape_icmai(page):
    """Scrape every ICMAI tab using the live layout for that tab."""
    src = get_source("ICMAI")
    sel = get_selectors("ICMAI")
    if not src or not sel:
        print("ICMAI source/selectors missing")
        return

    seen_items = set()

    async def scrape_content_tab(category, selector_key, link_selector):
        tab_url = sel.get(selector_key)
        if not tab_url:
            print(f"ICMAI {category} URL selector missing")
            return

        visited_pages = set()
        page_number = 1
        page_loaded = False
        while tab_url and page_number <= 100 and (page_loaded or tab_url not in visited_pages):
            if not page_loaded:
                visited_pages.add(tab_url)
                await page.goto(tab_url, wait_until="domcontentloaded", timeout=60000)
                await page.wait_for_selector(".disciplinary-wrap", timeout=30000)
                page_loaded = True

            links = await page.locator(link_selector).all()
            for link in links:
                href = ((await link.get_attribute("href")) or "").strip()
                title = re.sub(r"\s+", " ", (await link.inner_text() or "").strip())
                if not title or not href or href == "#" or title.lower() in {"prev", "next"}:
                    continue

                full_url = urljoin(sel["base_url"], href)
                item_key = (category, title, full_url)
                if item_key in seen_items:
                    continue
                seen_items.add(item_key)
                pdf_url = full_url if ".pdf" in full_url.lower() else None

                if row_exists("ICMAI", title, category):
                    update_row_by_key("ICMAI", title, category, full_url, "N/A", pdf_url, "")
                    continue
                insert_row("ICMAI", title, category, full_url, "N/A", pdf_url)

            next_button = page.locator(sel["content_pagination_next"]).first
            if await next_button.count() == 0:
                break
            classes = ((await next_button.get_attribute("class")) or "").lower()
            if "disabled" in classes or await next_button.get_attribute("aria-disabled") == "true":
                break
            next_href = ((await next_button.get_attribute("href")) or "").strip()
            if next_href and next_href != "#":
                next_url = urljoin(tab_url, next_href)
                if next_url in visited_pages:
                    break
                tab_url = next_url
                page_loaded = False
            else:
                await next_button.click()
                await page.wait_for_timeout(250)
                page_loaded = True
            page_number += 1

        print(f"ICMAI {category}: scraped {page_number} page(s)")

    await scrape_content_tab("Updates", "updates_url", sel["content_list_links"])
    await scrape_content_tab("Notifications", "notifications_url", sel["content_list_links"])
    await scrape_content_tab("Events", "events_url", sel["content_list_links"])

    await scrape_icmai_update_archive(page)
    await scrape_icmai_tender_archive(page)

    await scrape_content_tab("Students Connect", "students_connect_url", sel["students_content_links"])

    tender_url = sel.get("tenders_url")
    if tender_url:
        visited_tender_pages = set()
        page_number = 1
        next_url = tender_url
        while next_url and next_url not in visited_tender_pages and page_number <= 100:
            visited_tender_pages.add(next_url)
            await page.goto(next_url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_selector(sel["tender_cards"], timeout=30000)
            for card in await page.locator(sel["tender_cards"]).all():
                title_locator = card.locator(sel["tender_title"]).first
                title = re.sub(
                    r"\s+",
                    " ",
                    (await title_locator.inner_text() if await title_locator.count() else "").strip(),
                )
                if not title:
                    continue
                href = ""
                for anchor in await card.locator(sel["tender_read_more"]).all():
                    candidate = ((await anchor.get_attribute("href")) or "").strip()
                    if candidate:
                        href = candidate
                        break
                full_url = urljoin(sel["base_url"], href) if href else next_url
                item_key = ("Tender", title, full_url)
                if item_key in seen_items:
                    continue
                seen_items.add(item_key)
                pdf_url = full_url if ".pdf" in full_url.lower() else None
                if row_exists("ICMAI", title, "Tender"):
                    update_row_by_key("ICMAI", title, "Tender", full_url, "N/A", pdf_url, "")
                else:
                    insert_row("ICMAI", title, "Tender", full_url, "N/A", pdf_url)

            next_button = page.locator(sel["tender_next"]).first
            if await next_button.count() == 0:
                break
            classes = ((await next_button.get_attribute("class")) or "").lower()
            if "disabled" in classes:
                break
            href = ((await next_button.get_attribute("href")) or "").strip()
            if not href:
                break
            next_url = urljoin(next_url, href)
            page_number += 1
        print(f"ICMAI Tender: scraped {page_number} page(s)")


async def scrape_all_sites():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        async def run_site(site_name):
            connection = open_scraper_connection()
            connection_token = _worker_conn.set(connection)
            context = await browser.new_context(
                viewport={"width": 1366, "height": 900},
                ignore_https_errors=True,
            )
            page = await context.new_page()
            heartbeat_task = None
            try:
                if is_cancel_requested(connection):
                    report_site_progress(site_name, status="cancelled", stage="cancelled", cancel_requested=True)
                    return site_name, RuntimeError("Cancellation requested")
                source = get_source(site_name)
                report_site_progress(
                    site_name,
                    stage="scraping",
                    current_url=source["start_url"] if source else None,
                )

                async def heartbeat_loop():
                    while True:
                        await asyncio.sleep(15)
                        report_site_progress(site_name, stage="scraping")

                heartbeat_task = asyncio.create_task(heartbeat_loop())
                print(f"\n=== SCRAPING {site_name} ===")
                if site_name == "ICAI":
                    await scrape_icai(page)
                elif site_name == "ICMAI":
                    await scrape_icmai(page)
                elif site_name == "RBI":
                    await scrape_rbi(page)
                elif site_name == "BCI":
                    await scrape_bci(page, context)
                else:
                    await scrape_cbic(page)
                report_site_progress(site_name, status="success", stage="completed")
                return site_name, None
            except Exception as exc:
                print(f"{site_name} worker failed: {exc}")
                report_site_progress(
                    site_name,
                    status="failed",
                    stage="scraping",
                    error_message=str(exc),
                )
                return site_name, exc
            finally:
                if heartbeat_task is not None:
                    heartbeat_task.cancel()
                try:
                    await context.close()
                except Exception as cleanup_error:
                    print(f"{site_name} browser cleanup warning: {cleanup_error}")
                try:
                    connection.close()
                except Exception as cleanup_error:
                    print(f"{site_name} database cleanup warning: {cleanup_error}")
                _worker_conn.reset(connection_token)

        configured_sites = ("ICAI", "BCI", "ICMAI", "RBI", "CBIC")
        active_sites = get_active_site_names()
        results = await asyncio.gather(
            *(
                run_site(site_name)
                for site_name in configured_sites
                if site_name in active_sites and (not SELECTED_SITE or site_name == SELECTED_SITE)
            ),
        )
        await browser.close()
        failures = [f"{site}: {error}" for site, error in results if error is not None]
        if failures:
            print("Site failures: " + " | ".join(failures))
        return results


def process_all_pdfs(limit=None, website_name=None):
    """Process pending records from PDF URLs or detail URLs and save summaries."""
    icmai_skip_urls = (
        "https://icmai.in/ClntAbout/Notifications",
        "https://icmai.in/ClntAbout/Tender",
        "https://icmai.in/ClntAbout/Events",
    )
    rows = get_pending_pdf_rows(website_name=website_name)
    if limit is not None:
        rows = rows[:limit]
    if not rows:
        print("No pending PDFs for summary.")
        return {"processed": 0, "failed": 0, "total": 0}

    print(f"Found {len(rows)} pending rows to process")
    processed_count = 0
    failed_count = 0
    
    for row in rows:
        pdf_url = (row.get("pdf_url") or "").strip()
        detail_url = (row.get("detail_url") or "").strip()
        source_url = pdf_url or detail_url
        if not source_url:
            continue

        row_id = row["id"]
        website_name = row["website_name"]
        title = row["title"]
        item_progress_id = start_item_progress(website_name, row_id, "discovered")
        start_url = (row.get("start_url") or "").strip()
        normalized_start_url = start_url.rstrip("/")
        normalized_detail_url = detail_url.rstrip("/")
        normalized_pdf_url = pdf_url.rstrip("/")

        if not pdf_url and normalized_start_url and normalized_detail_url == normalized_start_url:
            print(f"\nSkipping summary for row {row_id}: detail URL matches start_url")
            update_pdf_processed(row_id, "No summary available", "")
            finish_item_progress(item_progress_id, "completed", "database_update")
            processed_count += 1
            continue

        if (
            website_name.strip().upper() == "ICMAI"
            and not pdf_url
            and any(skip_url.rstrip("/") in normalized_detail_url for skip_url in icmai_skip_urls)
        ):
            print(f"\nSkipping summary for row {row_id}: ICMAI detail URL is a category page")
            update_pdf_processed(row_id, "No summary available", "")
            finish_item_progress(item_progress_id, "completed", "database_update")
            processed_count += 1
            continue
        
        print(f"\nProcessing row {row_id}: {title[:60]}...")

        local_pdf = None
        pdf_folder = None
        result = None

        if is_probable_pdf_url(source_url):
            try:
                report_site_progress(website_name, stage="downloading", current_url=source_url)
                result = process_pdf_url(
                    source_url,
                    model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
                    timeout_seconds=int(os.getenv("GROQ_TIMEOUT_SECONDS", "30")),
                )
            except Exception as exc:
                print(f"  ✗ MarkItDown/Groq processing failed for row {row_id}: {exc}")
                finish_item_progress(item_progress_id, "failed", "groq_summary", str(exc))
                failed_count += 1
                continue
        else:
            report_site_progress(website_name, stage="detail_processing", current_url=source_url)
            result = generate_summary_from_detail_page(
                source_url,
                title,
                row["category"],
                website_name,
            )
        
        if result:
            if result.get("no_summary"):
                update_pdf_processed(row_id, "No summary available", "")
                finish_item_progress(item_progress_id, "completed", "database_update")
                print(f"  ✓ Marked row {row_id} as processed with summary unavailable")
                processed_count += 1
                continue

            if not is_meaningful_summary(result.get("summary")):
                print(f"  ✗ Generated summary quality check failed for row {row_id} (will retry next run)")
                finish_item_progress(item_progress_id, "failed", "validation", "Summary quality validation failed")
                failed_count += 1
                # Cleanup any temporary local files when quality validation fails
                try:
                    if local_pdf and os.path.exists(local_pdf):
                        os.remove(local_pdf)
                        print(f"  ✓ Deleted failed PDF: {local_pdf}")

                    if pdf_folder and os.path.exists(pdf_folder) and os.path.isdir(pdf_folder):
                        if not os.listdir(pdf_folder):
                            os.rmdir(pdf_folder)
                            print(f"  ✓ Deleted empty folder: {pdf_folder}")
                except Exception as e:
                    print(f"  ⚠ Cleanup warning: {e}")
                continue

            # Success: save to database and cleanup files
            update_pdf_processed(
                row_id,
                result["summary"],
                result["due_date"],
            )
            finish_item_progress(item_progress_id, "completed", "database_update")
            print(f"  ✓ Summary and due date saved for row {row_id}")
            processed_count += 1
            
            # Cleanup: delete the PDF file and folder
            try:
                if local_pdf and os.path.exists(local_pdf):
                    os.remove(local_pdf)
                    print(f"  ✓ Deleted PDF file: {local_pdf}")
                
                if pdf_folder and os.path.exists(pdf_folder) and os.path.isdir(pdf_folder):
                    # Only delete if folder is now empty
                    if not os.listdir(pdf_folder):
                        os.rmdir(pdf_folder)
                        print(f"  ✓ Deleted empty folder: {pdf_folder}")
            except Exception as e:
                print(f"  ⚠ Cleanup warning: {e}")
        else:
            # Failure: cleanup PDF but don't mark as processed (will retry next run)
            print(f"  ✗ Summary/due date extraction failed for row {row_id} (will retry next run)")
            finish_item_progress(item_progress_id, "failed", "summary", "No valid summary returned")
            failed_count += 1
            
            # Still cleanup the downloaded file to save space
            try:
                if local_pdf and os.path.exists(local_pdf):
                    os.remove(local_pdf)
                    print(f"  ✓ Deleted failed PDF: {local_pdf}")
                
                if pdf_folder and os.path.exists(pdf_folder) and os.path.isdir(pdf_folder):
                    if not os.listdir(pdf_folder):
                        os.rmdir(pdf_folder)
                        print(f"  ✓ Deleted empty folder: {pdf_folder}")
            except Exception as e:
                print(f"  ⚠ Cleanup warning: {e}")
    
    print(f"\n=== PDF Processing Summary ===")
    print(f"Total processed: {processed_count}")
    print(f"Total failed (will retry): {failed_count}")
    print(f"Total rows: {len(rows)}")
    return {"processed": processed_count, "failed": failed_count, "total": len(rows)}



class Command(BaseCommand):
    help = "Scrape websites and process PDFs using raw SQL tables."

    def add_arguments(self, parser):
        parser.add_argument(
            "--website",
            choices=("ICAI", "BCI", "ICMAI", "RBI", "CBIC"),
            help="Run only one active website worker.",
        )
        parser.add_argument(
            "--full-scan",
            action="store_true",
            help="Run one full top-to-bottom scan without early stop on first existing item.",
        )
        parser.add_argument(
            "--skip-summary",
            action="store_true",
            help="Skip PDF/detail summary processing after scraping completes.",
        )
        parser.add_argument(
            "--summary-limit",
            type=int,
            help="Process at most this many pending PDF/detail documents.",
        )
        parser.add_argument(
            "--seed",
            action="store_true",
            help="Force reseeding Website_Scraping_Sources and Website_Scraping_Selectors from code defaults.",
        )

    def handle(self, *args, **kwargs):
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        global FORCE_FULL_SCAN
        global SELECTED_SITE
        global CURRENT_RUN_ID
        FORCE_FULL_SCAN = bool(kwargs.get("full_scan"))
        SELECTED_SITE = (kwargs.get("website") or "").upper() or None
        skip_summary = bool(kwargs.get("skip_summary"))
        summary_limit = kwargs.get("summary_limit")
        force_seed = bool(kwargs.get("seed"))

        print("Initializing unified tables...")
        init_tables()

        if should_seed_sources_and_selectors(force_seed=force_seed):
            if force_seed:
                print("Forced selector/source reseed requested via --seed")
            else:
                print("Sources/selectors missing or empty; seeding defaults")
            seed_sources_and_selectors()
        else:
            print("Using existing sources/selectors from database (no reseed)")

        print("DB setup complete\n")

        if SELECTED_SITE and SELECTED_SITE not in get_active_site_names():
            raise CommandError(f"{SELECTED_SITE} is inactive or not configured.")

        if FORCE_FULL_SCAN:
            print("FULL_SCAN mode enabled: ignoring first-existing-item early stops for this run.\n")

        run_id = create_run()
        CURRENT_RUN_ID = run_id
        lock_token = acquire_run_lock(get_conn(), run_id)
        if not lock_token:
            fail_run(run_id, "Another scraper run is already active.")
            close_conn()
            raise CommandError("Another scraper run is already active.")
        clear_cancel(get_conn())
        before_total = get_total_data_count()
        before_site_counts = get_site_data_counts()

        try:
            print("Starting parallel scraping for active websites...")
            site_results = asyncio.run(scrape_all_sites())
            get_conn().commit()
            site_failures = [f"{site}: {error}" for site, error in site_results if error is not None]

            if skip_summary:
                print("\nSkipping PDF/detail summary processing as requested.")
                summary_result = {"processed": 0, "failed": 0, "total": 0}
            else:
                print("\nStarting PDF summary processing...")
                summary_result = process_all_pdfs(limit=summary_limit, website_name=SELECTED_SITE)

            after_total = get_total_data_count()
            after_site_counts = get_site_data_counts()

            total_new_rows = max(after_total - before_total, 0)
            all_sites = set(before_site_counts) | set(after_site_counts)
            per_site_new_rows = {
                site: max(after_site_counts.get(site, 0) - before_site_counts.get(site, 0), 0)
                for site in all_sites
            }
            run_status = "cancelled" if is_cancel_requested(get_conn()) else (
                "partial_failure" if site_failures or summary_result["failed"] else "success"
            )
            complete_run(
                run_id,
                total_new_rows,
                per_site_new_rows,
                site_results,
                status=run_status,
            )

            print("\nDone. Unified data is in table: Website_Scraping_data")
            print(f"Run analytics saved in Website_Scraping_Runs (run_id={run_id}).")
        except Exception as exc:
            fail_run(run_id, str(exc))
            raise
        finally:
            clear_cancel(get_conn())
            release_run_lock(get_conn(), lock_token)
            close_conn()
            CURRENT_RUN_ID = None