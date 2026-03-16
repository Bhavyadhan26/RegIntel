import asyncio
import json
import os
import re
import time
from urllib.parse import urljoin

import pymysql
import requests
from django.core.management.base import BaseCommand
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from pymysql.cursors import DictCursor

load_dotenv()
requests.packages.urllib3.disable_warnings()  # type: ignore[attr-defined]


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
            pdf_local_path VARCHAR(2048),
            raw_text LONGTEXT,
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

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Website_Scraping_Sources (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            website_name VARCHAR(32) UNIQUE NOT NULL,
            website_full_name VARCHAR(255) NOT NULL,
            start_url VARCHAR(2048) NOT NULL,
            active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
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

    conn.commit()
    conn.close()


def seed_sources_and_selectors():
    conn = get_conn()
    cur = conn.cursor()

    sources = [
        ("ICAI", "Institute of Chartered Accountants of India", "https://www.icai.org/category/notifications"),
        ("BCI", "Bar Council of India", "https://www.barcouncilofindia.org/info/notifications/all-noty"),
        ("ICMAI", "Institute of Cost Accountants of India", "https://icmai.in/icmai/"),
        ("RBI", "Reserve Bank of India", "https://www.rbi.org.in/Scripts/NotificationUser.aspx"),
        ("CBIC", "Central Board of Indirect Taxes and Customs", "https://www.cbic.gov.in/entities/view-sticker"),
    ]

    for s in sources:
        cur.execute(
            """
            INSERT INTO Website_Scraping_Sources (website_name, website_full_name, start_url)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE website_full_name = VALUES(website_full_name), start_url = VALUES(start_url)
            """,
            s,
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
        ("ICMAI", "tabs_wait", "div.HomeTabs"),
        ("ICMAI", "tab_updates", "div#Placements ul li a"),
        ("ICMAI", "tab_notification", "div#Notification_Updates ul li a"),
        ("ICMAI", "tab_tenders", "div#Tenders ul li a"),
        ("ICMAI", "base_url", "https://icmai.in"),
        ("ICMAI", "title_clean_remove_word", "New"),
        ("RBI", "table_wait", "table.tablebg"),
        ("RBI", "table_rows", "table.tablebg tr"),
        ("RBI", "date_heading", "h2.dop_header"),
        ("RBI", "title_link", "a.link2"),
        ("RBI", "pdf_link", "a[id^='APDF_'], a[href*='.PDF'], a[href*='.pdf']"),
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
    conn.close()


def get_source(website_name):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT website_name, website_full_name, start_url FROM Website_Scraping_Sources WHERE website_name = %s AND active = 1",
        (website_name,),
    )
    row = cur.fetchone()
    conn.close()
    return row


def get_selectors(website_name):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT selector_key, selector_value FROM Website_Scraping_Selectors WHERE website_name = %s",
        (website_name,),
    )
    rows = cur.fetchall()
    conn.close()
    return {r["selector_key"]: r["selector_value"] for r in rows}


def row_exists(website_name, title, category):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM Website_Scraping_data WHERE website_name=%s AND title=%s AND category=%s",
        (website_name, title, category),
    )
    exists = cur.fetchone() is not None
    conn.close()
    return exists


def insert_row(website_name, title, category, detail_url, notice_date, pdf_url):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO Website_Scraping_data
            (website_name, title, category, detail_url, notice_date, pdf_url)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (website_name, title, category, detail_url, notice_date, pdf_url),
        )
        row_id = cur.lastrowid
        conn.commit()
        print(f"Added [{website_name}] {category}: {title}")
        return row_id
    except pymysql.IntegrityError:
        cur.execute(
            "SELECT id FROM Website_Scraping_data WHERE website_name=%s AND title=%s AND category=%s",
            (website_name, title, category),
        )
        found = cur.fetchone()
        return found["id"] if found else None
    finally:
        conn.close()


def update_pdf_processed(row_id, local_path, marker_text, summary, due_date):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Website_Scraping_data
        SET processed = 1,
            pdf_local_path = %s,
            raw_text = %s,
            summary = %s,
            due_date = %s
        WHERE id = %s
        """,
        (local_path, marker_text, summary, due_date or "-", row_id),
    )
    conn.commit()
    conn.close()


def get_pending_pdf_rows():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, website_name, title, category, pdf_url
        FROM Website_Scraping_data
        WHERE pdf_url IS NOT NULL AND (processed = 0 OR summary IS NULL)
        """
    )
    rows = cur.fetchall()
    conn.close()
    return rows


def get_total_data_count():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS total FROM Website_Scraping_data")
    row = cur.fetchone()
    conn.close()
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
    conn.close()
    return {r["website_name"]: int(r["total"]) for r in rows}


def create_run():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO Website_Scraping_Runs (status) VALUES ('running')")
    run_id = cur.lastrowid
    conn.commit()
    conn.close()
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
    conn.close()


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
    conn.close()


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


def normalize_due_date(value):
    if not value:
        return "-"

    due_date = str(value).strip()
    if not due_date:
        return "-"

    if due_date.lower() in {"n/a", "na", "none", "null", "not applicable", "no due date", "-"}:
        return "-"

    return due_date[:64]


def generate_summary_from_pdf(pdf_path, title, category, website_name, api_key):
    try:
        import google.genai as genai

        prompt = f"""You are analyzing an official notification document.

Website: {website_name}
Category: {category}
Title: {title}

Return valid JSON only with this exact shape:
{{
  "summary": "concise 3-4 sentence summary",
  "due_date": "exact due/compliance/last submission date if explicitly present, otherwise -"
}}

Rules:
1. Keep summary actionable and concise.
2. For due_date, return the exact date wording from the document when explicitly stated.
3. If the document has no explicit due/compliance deadline, set due_date to "-".
4. Do not include markdown fences or extra commentary."""

        client = genai.Client(api_key=api_key)
        with open(pdf_path, "rb") as f:
            uploaded = client.files.upload(
                file=f,
                config={"mime_type": "application/pdf", "display_name": title[:120]},
            )

        while uploaded.state.name == "PROCESSING":
            time.sleep(2)
            uploaded = client.files.get(name=uploaded.name)

        if uploaded.state.name == "FAILED":
            print("Gemini file upload failed")
            return None

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[uploaded, prompt],
        )

        client.files.delete(name=uploaded.name)
        payload = extract_json_payload(response.text)
        if not payload:
            return None

        summary = str(payload.get("summary", "")).strip()
        if not summary:
            return None

        due_date = normalize_due_date(payload.get("due_date"))
        return {"summary": summary, "due_date": due_date}
    except Exception as e:
        print(f"Gemini summary error: {e}")
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
            if new_count == 0:
                print("ICAI up to date (first item exists), stopping.")
                break
            continue

        pdf_url = urljoin(sel["base_url"], href)
        insert_row("ICAI", title, category, src["start_url"], notice_date, pdf_url)
        new_count += 1


async def scrape_rbi(page):
    src = get_source("RBI")
    sel = get_selectors("RBI")
    if not src or not sel:
        print("RBI source/selectors missing")
        return

    await page.goto(src["start_url"], wait_until="networkidle", timeout=90000)
    await page.wait_for_selector(sel["table_wait"], timeout=60000)
    rows = await page.locator(sel["table_rows"]).all()

    current_date = "N/A"
    new_count = 0

    for row in rows:
        date_heading = row.locator(sel["date_heading"])
        if await date_heading.count() > 0:
            current_date = (await date_heading.inner_text()).strip()
            continue

        title_link = row.locator(sel["title_link"]).first
        if await title_link.count() == 0:
            continue
        title = (await title_link.inner_text()).strip()
        if not title:
            continue

        detail_href = await title_link.get_attribute("href")
        detail_url = urljoin(src["start_url"], detail_href) if detail_href else src["start_url"]

        pdf_link = row.locator(sel["pdf_link"]).first
        pdf_url = None
        if await pdf_link.count() > 0:
            pdf_href = await pdf_link.get_attribute("href")
            if pdf_href:
                pdf_url = urljoin(src["start_url"], pdf_href)

        category = "Notification"
        if row_exists("RBI", title, category):
            print(f"RBI exists: {title}")
            if new_count == 0:
                print("RBI up to date (first item exists), stopping.")
                break
            continue

        insert_row("RBI", title, category, detail_url, current_date, pdf_url)
        new_count += 1


async def scrape_icmai(page):
    src = get_source("ICMAI")
    sel = get_selectors("ICMAI")
    if not src or not sel:
        print("ICMAI source/selectors missing")
        return

    await page.goto(src["start_url"], wait_until="networkidle", timeout=60000)
    await page.wait_for_selector(sel["tabs_wait"], timeout=30000)

    tab_defs = [
        (sel["tab_updates"], "Updates"),
        (sel["tab_notification"], "Notification"),
        (sel["tab_tenders"], "Tenders"),
    ]

    for tab_selector, category in tab_defs:
        links = await page.locator(tab_selector).all()
        new_count = 0
        for link in links:
            href = await link.get_attribute("href")
            text = await link.inner_text()
            if not href or not text:
                continue

            title = re.sub(r"\b" + re.escape(sel["title_clean_remove_word"]) + r"\b", "", text, flags=re.IGNORECASE).strip()
            title = re.sub(r"\s+", " ", title)
            if not title:
                continue

            notice_date = "N/A"
            for pat in [r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b", r"\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}\b", r"\b[A-Za-z]+\s+\d{1,2},\s*\d{4}\b"]:
                m = re.search(pat, title, flags=re.IGNORECASE)
                if m:
                    notice_date = m.group(0)
                    break

            full_url = urljoin(sel["base_url"], href)
            pdf_url = full_url if ".pdf" in full_url.lower() else None

            if row_exists("ICMAI", title, category):
                print(f"ICMAI exists ({category}): {title}")
                if new_count == 0:
                    print(f"ICMAI {category} up to date (first item exists), stopping category.")
                    if category == "Updates":
                        print("ICMAI website up to date, stopping ICMAI scraping.")
                        return
                    break
                continue

            insert_row("ICMAI", title, category, full_url, notice_date, pdf_url)
            new_count += 1


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
            if new_count == 0:
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
                if new_count == 0 and page_num == 1:
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

            print("\n=== SCRAPING RBI ===")
            await scrape_rbi(page)

            print("\n=== SCRAPING ICMAI ===")
            await scrape_icmai(page)

            print("\n=== SCRAPING BCI ===")
            await scrape_bci(page, context)

            print("\n=== SCRAPING CBIC ===")
            await scrape_cbic(page)
        finally:
            await browser.close()


def process_all_pdfs():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set. Skipping summary generation.")
        return

    rows = get_pending_pdf_rows()
    if not rows:
        print("No pending PDFs for summary.")
        return

    print(f"Found {len(rows)} PDF rows to process")
    for row in rows:
        if not row["pdf_url"]:
            continue

        local_pdf = download_pdf(row["pdf_url"], row["website_name"], row["id"])
        if not local_pdf:
            continue

        result = generate_summary_from_pdf(
            local_pdf,
            row["title"],
            row["category"],
            row["website_name"],
            api_key,
        )

        if result:
            update_pdf_processed(
                row["id"],
                local_pdf,
                "[PDF sent directly to Gemini]",
                result["summary"],
                result["due_date"],
            )
            print(f"Summary and due date saved for row {row['id']}")
        else:
            print(f"Summary/due date extraction failed for row {row['id']} (will retry next run)")


class Command(BaseCommand):
    help = "Scrape websites and process PDFs using raw SQL tables."

    def handle(self, *args, **kwargs):
        print("Initializing unified tables and selector configuration...")
        init_tables()
        seed_sources_and_selectors()
        print("DB setup complete\n")

        run_id = create_run()
        before_total = get_total_data_count()
        before_site_counts = get_site_data_counts()

        try:
            print("Starting sequential scraping for all websites...")
            asyncio.run(scrape_all_sites())

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