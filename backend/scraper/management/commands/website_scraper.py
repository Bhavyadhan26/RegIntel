import asyncio
from collections import deque
import html
import json
import os
import re
import shutil
import time
from datetime import date, datetime
from urllib.parse import urljoin
import pymysql
import requests
from django.core.management.base import BaseCommand
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from pymysql.cursors import DictCursor

load_dotenv()
requests.packages.urllib3.disable_warnings()  # type: ignore[attr-defined]


def _required_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is required in the .env file")
    return value


_conn: pymysql.connections.Connection | None = None
FORCE_FULL_SCAN = False


def _as_int_env(name, default):
    raw = (os.getenv(name, str(default)) or "").strip()
    try:
        return int(raw)
    except ValueError:
        return default


class GeminiKeyPool:
    def __init__(self, keys, rpm_limit, rpd_limit):
        self.rpm_limit = max(rpm_limit, 1)
        self.rpd_limit = max(rpd_limit, 1)
        self._rr_index = 0
        self._states = [
            {
                "key": key,
                "minute_calls": deque(),
                "daily_calls": 0,
                "quota_blocked": False,
            }
            for key in keys
        ]

    def _evict_old_calls(self, state, now_ts):
        minute_calls = state["minute_calls"]
        while minute_calls and now_ts - minute_calls[0] >= 60:
            minute_calls.popleft()

    def acquire_key(self):
        if not self._states:
            return None, None

        now_ts = time.time()
        total = len(self._states)
        for offset in range(total):
            idx = (self._rr_index + offset) % total
            state = self._states[idx]

            if state["quota_blocked"]:
                continue
            if state["daily_calls"] >= self.rpd_limit:
                state["quota_blocked"] = True
                continue

            self._evict_old_calls(state, now_ts)
            if len(state["minute_calls"]) >= self.rpm_limit:
                continue

            state["minute_calls"].append(now_ts)
            state["daily_calls"] += 1
            self._rr_index = (idx + 1) % total
            return idx, state["key"]

        return None, None

    def block_key_for_quota(self, idx):
        if idx is None:
            return
        self._states[idx]["quota_blocked"] = True

    def has_available_keys(self):
        now_ts = time.time()
        for state in self._states:
            if state["quota_blocked"]:
                continue
            if state["daily_calls"] >= self.rpd_limit:
                continue
            self._evict_old_calls(state, now_ts)
            if len(state["minute_calls"]) < self.rpm_limit:
                return True
        return False

    def stats(self):
        return [
            {
                "key_index": idx + 1,
                "daily_calls": state["daily_calls"],
                "minute_calls_window": len(state["minute_calls"]),
                "quota_blocked": state["quota_blocked"],
            }
            for idx, state in enumerate(self._states)
        ]


def _build_gemini_key_pool():
    raw_multi = (os.getenv("GEMINI_API_KEYS", "") or "").strip()
    keys = [k.strip() for k in raw_multi.split(",") if k.strip()]

    single_key = (os.getenv("GEMINI_API_KEY", "") or "").strip()
    if single_key and single_key not in keys:
        keys.insert(0, single_key)

    unique_keys = []
    seen = set()
    for key in keys:
        if key in seen:
            continue
        seen.add(key)
        unique_keys.append(key)

    if not unique_keys:
        return None

    rpm_limit = _as_int_env("GEMINI_KEY_RPM_LIMIT", 15)
    rpd_limit = _as_int_env("GEMINI_KEY_RPD_LIMIT", 1000)
    print(f"Gemini key pool: {len(unique_keys)} key(s), per-key limits {rpm_limit} RPM / {rpd_limit} RPD")
    return GeminiKeyPool(unique_keys, rpm_limit=rpm_limit, rpd_limit=rpd_limit)


def _is_gemini_quota_or_rate_error(exc):
    message = str(exc).lower()
    markers = [
        "resource_exhausted",
        "quota exceeded",
        "rate limit",
        "too many requests",
        "429",
    ]
    return any(marker in message for marker in markers)


def _gemini_generate_with_key_pool(prompt, model, key_pool, row_title):
    if key_pool is None:
        return None

    try:
        import google.genai as genai
    except Exception as exc:
        print(f"Gemini SDK import failed: {exc}")
        return None

    attempts = 0
    max_attempts = len(key_pool.stats())
    while attempts < max_attempts:
        idx, key = key_pool.acquire_key()
        if key is None:
            break

        attempts += 1
        try:
            client = genai.Client(api_key=key)
            return client.models.generate_content(model=model, contents=prompt)
        except Exception as exc:
            if _is_gemini_quota_or_rate_error(exc):
                key_pool.block_key_for_quota(idx)
                print(f"Gemini key #{idx + 1} quota/rate limited for row (title={row_title}); trying next key")
                continue

            print(f"Gemini call failed on key #{idx + 1} for row (title={row_title}): {exc}; trying next key")
            continue

    return None


def get_conn() -> pymysql.connections.Connection:
    """Return the module-level persistent connection, creating or reconnecting as needed."""
    global _conn
    if _conn is None:
        _conn = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=_required_env("DB_USER"),
            password=_required_env("DB_PASS"),
            database=_required_env("DB_NAME"),
            charset="utf8mb4",
            cursorclass=DictCursor,
            autocommit=False,
        )
    else:
        try:
            _conn.ping(reconnect=True)
        except Exception:
            _conn = pymysql.connect(
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "3306")),
                user=_required_env("DB_USER"),
                password=_required_env("DB_PASS"),
                database=_required_env("DB_NAME"),
                charset="utf8mb4",
                cursorclass=DictCursor,
                autocommit=False,
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

    cur.execute("DELETE FROM Website_Scraping_Selectors WHERE website_name = 'ICMAI'")

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
            (website_name, title, category, detail_url, notice_date, due_date, pdf_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (website_name, title, category, detail_url, notice_date, due_date or "", pdf_url),
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


def get_pending_pdf_rows():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
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
    )
    rows = cur.fetchall()
    return rows


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


def complete_run(run_id, total_new_rows, per_site_new_rows):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Website_Scraping_Runs
        SET status = 'success',
            finished_at = CURRENT_TIMESTAMP,
            total_new_rows = %s,
            error_text = NULL
        WHERE id = %s
        """,
        (total_new_rows, run_id),
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


def _gemini_url_no_summary_reason(response_text):
    if not response_text:
        return "empty_response"

    lowered = response_text.lower()
    no_summary_markers = [
        "no summary",
        "cannot",
        "can't",
        "unable",
        "not enough information",
        "insufficient",
        "url",
        "link",
        "no content",
        "empty",
        "does not provide",
        "not possible",
    ]
    if any(marker in lowered for marker in no_summary_markers):
        return "url_no_content"
    return None


def _gemini_url_no_summary_result():
    return {"summary": "Summary not available.", "due_date": "", "no_summary": True, "reason": "url_no_content"}


def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PyPDF2. Returns text if successful, None if extraction fails."""
    try:
        from PyPDF2 import PdfReader
        
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        
        if not text or len(text.strip()) == 0:
            return None
        return text
    except Exception as e:
        print(f"PDF text extraction failed: {e}")
        return None


def extract_due_date_from_text(text):
    """Extract due date from extracted PDF text using regex patterns."""
    if not text:
        return ""
    
    # Common date patterns in official documents
    date_patterns = [
        r'\b(?:due\s+)?(?:date|deadline|submission\s+date|last\s+date|on\s+or\s+before)\s*[:\-]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})',
        r'\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})',
        r'\b(?:due|deadline|submit)\s+(?:by|on|before)?\s*[:\-]?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
        r'\b(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})\b',
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return ""


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


def generate_summary_from_gemini_url_fallback(source_url, title, category, website_name, key_pool):
    """Fallback method: Use Gemini API with only the source URL when Python extraction fails."""
    try:
        prompt = f"""Return JSON only (no markdown) using ONLY accessible content from this URL: {source_url}
    JSON shape: {{"summary": "2-3 sentences", "due_date": "exact due/compliance/last submission date if explicitly present, otherwise empty string"}}
    Rules:
    STRICTLY "Attempt direct request to the URL. DO NOT use search engine snippets, cached versions, or historical data from your training set. If the live page is not reachable now or if it returns any error or content is unreadable, return empty strings for all fields. Any summary generated without a successful 200 OK live fetch is a violation of this prompt."
    Ground summary only in document text; do not infer from URL/metadata.
    If no explicit due date is found, due_date must be ""."""

        response = _gemini_generate_with_key_pool(
            prompt=prompt,
            model="gemini-2.5-flash-lite",
            key_pool=key_pool,
            row_title=title,
        )
        if response is None:
            return None

        payload = extract_json_payload(response.text)
        if not payload:
            print(f"Gemini URL fallback returned no usable summary for row (title={title}); marking processed")
            return _gemini_url_no_summary_result()

        summary = str(payload.get("summary", "")).strip()
        if not summary:
            print(f"Gemini URL fallback returned empty summary for row (title={title}); marking processed")
            return _gemini_url_no_summary_result()
        if not is_meaningful_summary(summary):
            print(f"Gemini URL fallback returned non-summary content for row (title={title}); marking processed")
            return _gemini_url_no_summary_result()

        due_date = normalize_due_date(payload.get("due_date"))
        return {"summary": summary, "due_date": due_date}
    except Exception as e:
        print(f"Gemini fallback error: {e}")
        return None


def generate_summary_from_gemini_text_fallback(source_text, title, category, website_name, source_url, key_pool):
    """Fallback method: Use Gemini API on extracted text when local extraction fails to summarize well."""
    try:
        prompt = f"""You are analyzing an official notification document.

Website: {website_name}
Category: {category}
Title: {title}
Source URL: {source_url}

Document text:
{source_text[:18000]}

Return valid JSON only with this exact shape:
{{
  "summary": "concise 3-4 sentence summary",
  "due_date": "exact due/compliance/last submission date if explicitly present, otherwise empty string"
}}

Rules:
1. Keep summary actionable and concise.
2. For due_date, return the exact date wording from the document when explicitly stated.
3. If the document has no explicit due/compliance deadline, set due_date to "".
4. Do not include markdown fences or extra commentary."""

        response = _gemini_generate_with_key_pool(
            prompt=prompt,
            model="gemini-2.5-flash-lite",
            key_pool=key_pool,
            row_title=title,
        )
        if response is None:
            return None

        payload = extract_json_payload(response.text)
        if not payload:
            return None

        summary = str(payload.get("summary", "")).strip()
        if not summary:
            return None
        if not is_meaningful_summary(summary):
            return None

        due_date = normalize_due_date(payload.get("due_date"))
        return {"summary": summary, "due_date": due_date}
    except Exception as e:
        print(f"Gemini text fallback error: {e}")
        return None


def generate_summary_from_pdf(pdf_path, source_url, title, category, website_name, key_pool):
    """
    Generate summary from PDF using Python extraction first, fallback to Gemini.
    Returns {"summary": str, "due_date": str} on success, None on failure.
    """
    # Step 1: Try Python-only text extraction
    print(f"  Attempting Python text extraction for row (title={title})")
    extracted_text = extract_text_from_pdf(pdf_path)
    
    if extracted_text and len(extracted_text.strip()) > 100:
        # Extraction succeeded with meaningful text
        result = generate_summary_from_python_extraction(extracted_text, title, category, website_name)
        if result:
            print(f"  ✓ Summary generated via Python extraction")
            return result
        else:
            print(f"  ✗ Python extraction failed to generate summary, trying Gemini fallback")
    else:
        print(f"  ✗ Python text extraction failed or returned minimal text, trying Gemini fallback")
    
    # Step 2: Fallback to Gemini API
    if key_pool and key_pool.has_available_keys():
        print(f"  Attempting Gemini URL-only fallback for row (title={title})")
        result = generate_summary_from_gemini_url_fallback(source_url, title, category, website_name, key_pool)
        if result:
            print(f"  ✓ Summary generated via Gemini API")
            return result
        else:
            print(f"  ✗ Gemini API fallback also failed")
    else:
        print(f"  ✗ No Gemini key currently available, skipping Gemini fallback")
    
    # Both methods failed
    return None


def generate_summary_from_detail_page(detail_url, title, category, website_name, key_pool):
    """Generate summary from HTML detail page when no real PDF is available."""
    print(f"  Attempting HTML extraction for row (title={title})")
    extracted_text = extract_text_from_html_page(detail_url)

    if extracted_text and len(extracted_text.strip()) > 100:
        result = generate_summary_from_python_extraction(extracted_text, title, category, website_name)
        if result:
            print("  ✓ Summary generated via HTML text extraction")
            return result
        print("  ✗ HTML extraction text was weak for summary, trying Gemini fallback")
    else:
        print("  ✗ HTML text extraction failed/minimal, trying Gemini fallback")

    # The extracted-text Gemini fallback is intentionally kept here for reference,
    # but disabled so Gemini only receives the URL and not extracted page text.
    # if api_key and extracted_text:
    #     result = generate_summary_from_gemini_text_fallback(
    #         extracted_text,
    #         title,
    #         category,
    #         website_name,
    #         detail_url,
    #         api_key,
    #     )
    #     if result:
    #         print("  ✓ Summary generated via Gemini text fallback")
    #         return result
    #     print("  ✗ Gemini text fallback also failed")
    # elif not api_key:
    if key_pool and key_pool.has_available_keys():
        print("  Attempting Gemini URL-only fallback for row (detail page)")
        result = generate_summary_from_gemini_url_fallback(detail_url, title, category, website_name, key_pool)
        if result:
            print("  ✓ Summary generated via Gemini API")
            return result
        print("  ✗ Gemini API fallback also failed")
    else:
        print("  ✗ No Gemini key currently available, skipping Gemini fallback")

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
            update_row_by_key("RBI", title, category, detail_url, notice_date, pdf_url, "")
            continue

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


async def scrape_all_sites():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={"width": 1366, "height": 900})
        page = await context.new_page()

        try:
            print("\n=== SCRAPING ICAI ===")
            await scrape_icai(page)

            print("\n=== SCRAPING ICMAI ===")
            await scrape_icmai(page)

            print("\n=== SCRAPING RBI ===")
            await scrape_rbi(page)

            print("\n=== SCRAPING BCI ===")
            await scrape_bci(page, context)

            print("\n=== SCRAPING CBIC ===")
            await scrape_cbic(page)
        finally:
            await browser.close()


def process_all_pdfs():
    """Process pending records from PDF URLs or detail URLs, save summaries, and cleanup temp files."""
    key_pool = _build_gemini_key_pool()
    icmai_skip_urls = (
        "https://icmai.in/ClntAbout/Notifications",
        "https://icmai.in/ClntAbout/Tender",
        "https://icmai.in/ClntAbout/Events",
    )
    
    rows = get_pending_pdf_rows()
    if not rows:
        print("No pending PDFs for summary.")
        return

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
        start_url = (row.get("start_url") or "").strip()
        normalized_start_url = start_url.rstrip("/")
        normalized_detail_url = detail_url.rstrip("/")
        normalized_pdf_url = pdf_url.rstrip("/")

        if not pdf_url and normalized_start_url and normalized_detail_url == normalized_start_url:
            print(f"\nSkipping Gemini for row {row_id}: detail URL matches start_url")
            update_pdf_processed(row_id, "No summary available", "")
            processed_count += 1
            continue

        if (
            website_name.strip().upper() == "ICMAI"
            and not pdf_url
            and any(skip_url.rstrip("/") in normalized_detail_url for skip_url in icmai_skip_urls)
        ):
            print(f"\nSkipping Gemini for row {row_id}: ICMAI detail URL is a category page")
            update_pdf_processed(row_id, "No summary available", "")
            processed_count += 1
            continue
        
        print(f"\nProcessing row {row_id}: {title[:60]}...")

        local_pdf = None
        pdf_folder = None
        result = None

        if is_probable_pdf_url(source_url):
            local_pdf = download_pdf(source_url, website_name, row_id)
            if not local_pdf:
                print(f"  ✗ PDF download failed for row {row_id}, skipping (will retry next run)")
                failed_count += 1
                continue
            pdf_folder = os.path.dirname(local_pdf)
            result = generate_summary_from_pdf(
                local_pdf,
                pdf_url,
                title,
                row["category"],
                website_name,
                key_pool,
            )
        else:
            result = generate_summary_from_detail_page(
                source_url,
                title,
                row["category"],
                website_name,
                key_pool,
            )
        
        if result:
            if result.get("no_summary"):
                update_pdf_processed(row_id, "No summary available", "")
                print(f"  ✓ Marked row {row_id} as processed with summary unavailable")
                processed_count += 1
                continue

            if not is_meaningful_summary(result.get("summary")):
                print(f"  ✗ Generated summary quality check failed for row {row_id} (will retry next run)")
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
    if key_pool:
        print(f"Gemini key usage stats: {key_pool.stats()}")



class Command(BaseCommand):
    help = "Scrape websites and process PDFs using raw SQL tables."

    def add_arguments(self, parser):
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
            "--seed",
            action="store_true",
            help="Force reseeding Website_Scraping_Sources and Website_Scraping_Selectors from code defaults.",
        )

    def handle(self, *args, **kwargs):
        global FORCE_FULL_SCAN
        FORCE_FULL_SCAN = bool(kwargs.get("full_scan"))
        skip_summary = bool(kwargs.get("skip_summary"))
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

        if FORCE_FULL_SCAN:
            print("FULL_SCAN mode enabled: ignoring first-existing-item early stops for this run.\n")

        run_id = create_run()
        before_total = get_total_data_count()
        before_site_counts = get_site_data_counts()

        try:
            print("Starting sequential scraping for all websites...")
            asyncio.run(scrape_all_sites())

            if skip_summary:
                print("\nSkipping PDF/detail summary processing as requested.")
            else:
                print("\nStarting PDF summary processing...")
                process_all_pdfs()

            after_total = get_total_data_count()
            after_site_counts = get_site_data_counts()

            total_new_rows = max(after_total - before_total, 0)
            all_sites = set(before_site_counts) | set(after_site_counts)
            per_site_new_rows = {
                site: max(after_site_counts.get(site, 0) - before_site_counts.get(site, 0), 0)
                for site in all_sites
            }
            complete_run(run_id, total_new_rows, per_site_new_rows)

            print("\nDone. Unified data is in table: Website_Scraping_data")
            print(f"Run analytics saved in Website_Scraping_Runs (run_id={run_id}).")
        except Exception as exc:
            fail_run(run_id, str(exc))
            raise
        finally:
            close_conn()