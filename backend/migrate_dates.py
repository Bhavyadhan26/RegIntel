import os
import sys

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from scraper.models import WebsiteScrapingData
from datetime import datetime
from django.db import connection

def _parse_date(raw_value):
    value = (raw_value or "").strip()
    if not value or value.lower() in {"-", "n/a", "na", "not applicable"}:
        return None
    patterns = ["%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y", "%Y-%m-%d", "%d %b %Y", "%d %B %Y", "%d %b, %Y", "%d %B, %Y"]
    for pattern in patterns:
        try:
            return datetime.strptime(value, pattern).date()
        except ValueError:
            pass
    return None

def run():
    print("Adding temporary date columns...")
    with connection.cursor() as cursor:
        try:
            cursor.execute("ALTER TABLE Website_Scraping_data ADD COLUMN temp_notice_date DATE;")
            cursor.execute("ALTER TABLE Website_Scraping_data ADD COLUMN temp_due_date DATE;")
        except Exception as e:
            print("Columns might already exist:", e)

    print("Parsing strings and storing as native DATE...")
    
    # We need to fetch rows manually since model is managed=False and 
    # we don't want to mess up with ORM caching during schema change.
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, notice_date, due_date FROM Website_Scraping_data")
        rows = cursor.fetchall()
        
        updates = []
        for row_id, n_date, d_date in rows:
            nd = _parse_date(n_date)
            dd = _parse_date(d_date)
            updates.append((nd, dd, row_id))
            
        print(f"Updating {len(updates)} rows...")
        cursor.executemany(
            "UPDATE Website_Scraping_data SET temp_notice_date = %s, temp_due_date = %s WHERE id = %s",
            updates
        )
        
    print("Schema Migration: Replacing old columns with new Date columns...")
    with connection.cursor() as cursor:
        cursor.execute("ALTER TABLE Website_Scraping_data DROP COLUMN notice_date;")
        cursor.execute("ALTER TABLE Website_Scraping_data DROP COLUMN due_date;")
        cursor.execute("ALTER TABLE Website_Scraping_data RENAME COLUMN temp_notice_date TO notice_date;")
        cursor.execute("ALTER TABLE Website_Scraping_data RENAME COLUMN temp_due_date TO due_date;")
        
    print("Done!")

if __name__ == '__main__':
    run()
