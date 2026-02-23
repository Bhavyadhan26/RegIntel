# System Architecture & Data Flow

## Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR COMPLETE SYSTEM                        │
└─────────────────────────────────────────────────────────────────────┘

                    SCHEDULED EXECUTION (Cronjob/Task Scheduler)
                              ↓
                    ┌─────────────────────┐
                    │   scrape.py         │
                    │  (Main Orchestrator)│
                    └─────────────────────┘
                      ↓        ↓        ↓
            ┌─────────┴────┬───┴───┬────┴──────────┐
            ↓              ↓       ↓               ↓
        ┌────────┐    ┌────────┐  │          ┌──────────┐
        │  WEB   │    │DATABASE│  │          │Gemini AI │
        │SCRAPER │    │ WRITE  │  │          │  API     │
        │        │    │(INSERT)│  │          │          │
        └────────┘    └────────┘  │          └──────────┘
            ↓              ↓       ↓               ↓
        CBIC Website  news_database.db      PDF Summary
```

---

## Detailed Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        START: python scrape.py                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────────────┐
        │  PHASE 1: WEB SCRAPING                          │
        ├─────────────────────────────────────────────────┤
        │ 1. Open CBIC website with Playwright            │
        │ 2. Wait for Angular list to load                │
        │ 3. Extract: title, date                         │
        │ 4. Clean text (remove Hindi, etc)               │
        └─────────────────────────────────────────────────┘
                              ↓
            Data: [{"title": "...", "date": "..."}]
                              ↓
        ┌─────────────────────────────────────────────────┐
        │  PHASE 2: DEDUPLICATION CHECK                   │
        ├─────────────────────────────────────────────────┤
        │ For each news item:                             │
        │ - Query: SELECT FROM news WHERE title = ?       │
        │ - If EXISTS: Skip (prevent duplicate)           │
        │ - If NEW: Continue to Phase 3                   │
        └─────────────────────────────────────────────────┘
                              ↓
           News Items Split: [NEW] vs [EXISTING]
                              ↓
        ┌─────────────────────────────────────────────────┐
        │  PHASE 3: DATABASE INSERT                       │
        ├─────────────────────────────────────────────────┤
        │ For NEW items only:                             │
        │ - INSERT INTO news (title, url, date)           │
        │ - Get news_id (auto-incremented)                │
        │ - Create pdf_data record                        │
        │   - processed = 0 (flag for later)              │
        │   - pdf_url = extracted from page               │
        └─────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────────────┐
        │  PHASE 4: PDF DISCOVERY (SMART!)                │
        ├─────────────────────────────────────────────────┤
        │ Query: SELECT * FROM pdf_data                   │
        │        WHERE processed = 0                      │
        │ Result: Only NEW PDFs to process                │
        │ (Already processed PDFs skipped!)               │
        └─────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────────────┐
        │  PHASE 5: PDF DOWNLOAD & EXTRACTION             │
        ├─────────────────────────────────────────────────┤
        │ For each unprocessed PDF:                       │
        │ 1. Download: requests.get(pdf_url)              │
        │ 2. Save: pdfs/news_{id}.pdf                     │
        │ 3. Extract: PyPDF2.extract_text()               │
        │ 4. Store raw_text in pdf_data table             │
        │ 5. Set processed = 1 (mark as done)             │
        └─────────────────────────────────────────────────┘
                              ↓
    raw_text = "Lorem ipsum dolor sit amet, consectetur..."
                              ↓
        ┌─────────────────────────────────────────────────┐
        │  PHASE 6: GEMINI SUMMARIZATION                  │
        ├─────────────────────────────────────────────────┤
        │ API Call (ONLY FOR processed=0 docs)            │
        │ Input: PDF text snippet (first 3000 chars)      │
        │ Model: gemini-pro                               │
        │ Output: 3-4 sentence summary                    │
        │ Cost: ~0.01 API call per new document           │
        │ Savings: Don't call for already-processed       │
        └─────────────────────────────────────────────────┘
                              ↓
    summary = "This document discusses... in brief..."
                              ↓
        ┌─────────────────────────────────────────────────┐
        │  PHASE 7: STORE SUMMARY                         │
        ├─────────────────────────────────────────────────┤
        │ INSERT INTO summaries (pdf_id, summary)         │
        │ Now accessible via database queries             │
        └─────────────────────────────────────────────────┘
                              ↓
              ✓ PROCESS COMPLETE ✓
```

---

## Database Schema Visualization

```
                    NORMALIZED SCHEMA

        ┌─────────────────────────────────────┐
        │           news                      │
        ├─────────────────────────────────────┤
        │ id (PK)          [1]                │
        │ title (UNIQUE)   [`GST Circular...`]│
        │ url              [https://...]      │
        │ notice_date      [21.02.2026]      │
        │ created_at       [2026-02-21...]   │
        │ updated_at       [2026-02-21...]   │
        └─────────────────────────────────────┘
               │
               │ (1:1 relationship)
               │ FOREIGN KEY (news_id)
               ↓
        ┌─────────────────────────────────────┐
        │        pdf_data                     │
        ├─────────────────────────────────────┤
        │ id (PK)          [1]                │
        │ news_id (FK)     [1]                │ ← Links to news
        │ pdf_url          [...]              │
        │ pdf_local_path   [pdfs/news_1.pdf] │
        │ raw_text         [PDF content...]   │
        │ processed        [0 or 1] ← KEY!   │
        │ created_at       [2026-02-21...]   │
        └─────────────────────────────────────┘
               │
               │ (1:1 relationship)
               │ FOREIGN KEY (pdf_id)
               ↓
        ┌─────────────────────────────────────┐
        │       summaries                     │
        ├─────────────────────────────────────┤
        │ id (PK)          [1]                │
        │ pdf_id (FK)      [1]                │ ← Links to PDF
        │ summary          [AI summary...]    │
        │ generated_at     [2026-02-21...]   │
        └─────────────────────────────────────┘


KEY INSIGHT: processed field prevents duplicate API calls!

processed=0 → "Not yet summarized, call Gemini API"
processed=1 → "Already done, skip Gemini (SAVE MONEY!)"
```

---

## Frontend Integration Architecture

```
YOUR BACKEND                     YOUR FRONTEND
┌──────────────────┐             ┌──────────────────┐
│   scrape.py      │             │   React/Vue/...  │
│   (Cronjob)      │             │   (Browser)      │
└──────────────────┘             └──────────────────┘
        ↓                               ↑
  Updates DB               HTTP GET /api/news
        ↓                               ↑
┌──────────────────┐             ┌──────────────────┐
│ news_database.db │ ←→ api_server.py ←→ fetch()
│                  │             │   (Flask)        │
├──────────────────┤             └──────────────────┘
│ news            │
│ pdf_data        │
│ summaries       │
└──────────────────┘

Option A (Above) - REST API: Decoupled, scalable
Option B - Direct DB: Simple, fast, local
Option C - JSON Export: Static, simple
```

---

## Processing Flowchart

```
START
  ↓
[Initialize DB] → Create tables if not exist
  ↓
[Run Scraper]
  ↓
  ├─→ For each news item on website:
  │     ├─→ Check: EXISTS in DB? (dedup)
  │     │     ├─ YES → Skip (prevent duplicate)
  │     │     ├─ NO → Add to DB, get id
  │     │     └─→ Extract PDF URL if available
  │     │         └─→ Add PDF record (processed=0)
  │
  ├─→ AFTER SCRAPING:
  │     Query: SELECT FROM pdf_data WHERE processed=0
  │     (Get only NEW PDFs)
  │
  ├─→ For each NEW PDF:
  │     ├─→ Download file
  │     ├─→ Extract text with PyPDF2
  │     ├─→ Mark processed=1
  │     ├─→ Call Gemini API (once per PDF)
  │     └─→ Store summary
  │
  └─→ END: Database is updated
```

---

## API Endpoints Structure

```
┌─────────────────────────────────────────────────────────┐
│              api_server.py REST Endpoints               │
└─────────────────────────────────────────────────────────┘

GET /api/news
    ├─ Returns: All news items with optional summaries
    ├─ Query params: ?limit=50, ?has_summary=true
    └─ Example: http://localhost:5000/api/news?limit=10

GET /api/news/<id>
    ├─ Returns: Specific news with PDF and summary
    └─ Example: http://localhost:5000/api/news/1

GET /api/pdf/<id>
    ├─ Returns: PDF data and summary for news item
    └─ Example: http://localhost:5000/api/pdf/1

GET /api/stats
    ├─ Returns: {total_news, processed_pdfs, pending_pdfs}
    └─ Example: http://localhost:5000/api/stats

GET /api/search?q=<keyword>
    ├─ Returns: News matching keyword
    └─ Example: http://localhost:5000/api/search?q=GST

Response Format:
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "title": "...",
      "notice_date": "21.02.2026",
      "summary": "AI-generated summary..."
    }
  ]
}
```

---

## Cost Analysis

```
SCENARIO: Running daily with 5 new news/day

Year 1 Cost Breakdown:
├─ Database hosting: $0 (SQLite is free)
├─ PDF storage: $0 (local files)
├─ PDF processing (PyPDF2): $0 (free library)
├─ Gemini API calls:
│  ├─ 5 new items/day
│  ├─ 365 days/year
│  ├─ = 1,825 calls/year
│  ├─ Free tier: 60 calls/minute
│  ├─ Your usage: ~3 calls/minute
│  └─ Total cost: $0 (within free tier!)
│
└─ TOTAL: $0 ✓

Why so cheap with our design?
- processed=0 flag prevents re-processing
- Database prevents duplicates (UNIQUE constraint)
- Each new PDF summarized only ONCE
- No redundant API calls
```

---

## Scaling Considerations

```
Current Setup (SQLite):
├─ Database: 1 file (news_database.db)
├─ Typical size: 100KB per 1000 news items
├─ Max reasonable: ~100,000 news items (10MB)
└─ Recommended for: Single server, local access

For Larger Scale (PostgreSQL/MySQL):
├─ Replace SQLite with PostgreSQL
├─ Host database on managed service
├─ Same code, just connection string changes
├─ Can handle millions of records
└─ Cost: ~$10-20/month for managed DB

Architecture stays the same:
scrape.py → database → api_server.py → frontend
```

---

## Execution Timeline

```
Timeline for typical daily run:

00:00 → 00:05 : Scraping              (5 min)
             → Extract 20 news items
             → 5 are new, 15 exist (skipped)

00:05 → 00:10 : PDF Processing        (5 min)
             → Download 5 new PDFs
             → Extract text

00:10 → 00:15 : Gemini Summarization  (5 min)
             → 5 API calls to Gemini
             → Generate 5 summaries

00:15 → 00:20 : Database Update       (5 min)
             → Save all data
             → Create indexes

Total: ~20 minutes per run
Cost: ~$0.00 (within free tier)
Reliability: Very high (no external dependencies)
```

---

**This architecture ensures:**
- ✓ No duplicates in database
- ✓ Cost-effective (free Gemini tier)
- ✓ Scalable (can grow to millions of records)
- ✓ Reliable (offline-first, local DB)
- ✓ Fast (SQLite is quick for these sizes)
- ✓ Maintainable (simple, clear structure)

