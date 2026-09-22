# RegIntel Scraper V2 Implementation Plan

## 1. Purpose

This document defines the complete implementation and validation plan for replacing the current scraper pipeline with a safer, parallel, MarkItDown-based, Groq-powered pipeline.

The implementation must preserve the existing frontend and user-facing API behavior. The work must be performed on a new Git branch. Production scraping tables must remain untouched until the complete replacement pipeline has been tested and explicitly approved.

## 2. Confirmed Scope

### Included

- Read-only inspection of the live SQL schema before changes.
- Isolated scraper test database/schema.
- Parallel scraping for active websites.
- Per-website failure isolation.
- MarkItDown-based temporary PDF extraction.
- Temporary Markdown content only during processing.
- Groq-based summary generation.
- Summary target of 50 to 60 words with a hard maximum of 60 words.
- No minimum summary length.
- Due-date extraction from Markdown content if any exists.
- Existing `pdf_url` and `detail_url` selection logic.
- Admin-only live scraper status and error reporting.
- Manual per-website scraping from admin.
- Manual scraping of all active websites from admin.
- Active/inactive website controls.
- Safe run locking and cancellation.
- Full reset command after validation.
- Deletion of all scraper data during final reset.
- Deletion of all historical run records during final reset.
- Render-compatible Docker/cron deployment.
- Daily execution at 9:00 AM India time.

### Explicitly excluded

- No frontend source changes.
- No change to the existing frontend API response contracts unless strictly required for backend correctness.
- No email notifications initially.
- No permanent PDF or Markdown storage.
- No automatic production reset before approval.
- No deletion of source or selector configuration.

## 3. Current System Baseline

The current repository is on `main` at commit `ea7b601` at the time this plan was created. The current working tree was clean during planning.

The backend is Django with two MySQL connections:

- Default database for Django authentication and user data.
- Scraper database for scraper sources, selectors, scraped records, runs, and feedback.

Scraper models use `managed=False`, and scraper table creation is performed by raw SQL in `website_scraper.py`. Django migrations do not fully control the physical scraper schema.

The current scraper:

1. Initializes scraper tables.
2. May seed source and selector configuration.
3. Creates a scraper run.
4. Scrapes ICAI, ICMAI, RBI, BCI, and CBIC sequentially.
5. Inserts records into `Website_Scraping_data`.
6. Processes pending PDF/detail URLs.
7. Uses PyPDF2 and Gemini-related fallback logic.
8. Marks records as processed.
9. Stores run totals.
10. Closes the connection.

Important current limitations:

- Website scraping is sequential.
- A module-level PyMySQL connection is shared.
- The main Playwright scraper runs with `headless=False`.
- MarkItDown and Groq are not dependencies yet.
- The admin dashboard has no live polling or per-site run controls.
- Run locking is a check-then-start race.
- Scraper tests are currently absent.
- Existing documentation contains stale schema and scheduler information.

## 4. Branch and Safety Strategy

### Branch

Create a new branch from the verified deployment branch:

```text
feature/scraper-v2-markitdown-groq
```

The exact branch name can be adjusted before creation, but all work must remain separate from `main`.

### Production protection rules

Until final approval:

- Do not delete production scraper records.
- Do not alter production source rows.
- Do not alter production selector rows.
- Do not run destructive reset commands against production credentials.
- Do not enable the new Render cron job against production data.
- Do not change frontend files.

### Test environment

Use a separate scraper database/schema for development and validation. This is safer than adding test rows to the production tables because it prevents accidental reads, writes, or deletes against live data.

The test environment should have separate environment variables, for example:

```text
SCRAPER_DB_NAME=regintel_scraper_test
SCRAPER_DB_USER=...
SCRAPER_DB_PASS=...
SCRAPER_DB_HOST=...
SCRAPER_DB_PORT=3306
```

Source and selector configuration should be copied into the test schema. It must not be cleared or reseeded destructively.

## 5. Existing SQL Tables and Data Responsibilities

### `Professional_Category`

Stores the scraper-side professional categories.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `category_name` | Category name used to associate websites with professions |
| `created_at` | Creation timestamp |
| `updated_at` | Modification timestamp |

### `Website_Scraping_Sources`

Stores one configuration row per regulatory website.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `website_name` | Short code such as ICAI, RBI, or CBIC |
| `website_full_name` | Display name |
| `start_url` | Website listing or starting URL |
| `professional_category_id` | Scraper-side profession association |
| `active` | Whether this website may be scraped |
| `created_at` | Creation timestamp |
| `updated_at` | Modification timestamp |

This table is operational configuration and must never be deleted by the final reset.

### `Website_Scraping_Selectors`

Stores selectors and website-specific scraping settings.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `website_name` | Website code |
| `selector_key` | Name of a selector or setting |
| `selector_value` | CSS selector, URL, regex, or other configuration value |
| `created_at` | Creation timestamp |
| `updated_at` | Modification timestamp |

This table must remain intact. Normal scraping must never overwrite manually maintained values.

### `Website_Scraping_data`

Stores the actual scraped regulatory records.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `title` | Notification, publication, event, or tender title |
| `category` | Record category |
| `website_name` | Source website code |
| `detail_url` | Source detail page URL |
| `notice_date` | Date published on the source website |
| `due_date` | Compliance, submission, or closing date extracted from content |
| `pdf_url` | PDF or document URL when available |
| `processed` | Whether enrichment processing completed |
| `summary` | Generated summary |
| `created_at` | Record insertion timestamp |
| `updated_at` | Last modification timestamp |

The final reset will delete all rows from this table across all categories.

### `Website_Scraping_Runs`

Stores one overall pipeline execution.

The new implementation should support run states such as:

```text
queued
running
partial_failure
success
failed
cancelled
stale
```

The existing status column length must be verified before adding these values.

### `Website_Scraping_Run_Site_Stats`

Currently stores limited per-site addition statistics. It should be extended or supplemented because it cannot represent live progress, current stage, current URL, or detailed site failures.

### `User_Feedback`

Stores authenticated user feedback. It is unrelated to scraper reset operations and must be preserved.

## 6. Required Read-Only Schema Inspection

Before schema work, run read-only SQL against the relevant test and production environments where credentials are available:

```sql
SHOW TABLES;

SHOW CREATE TABLE Professional_Category;
SHOW CREATE TABLE Website_Scraping_Sources;
SHOW CREATE TABLE Website_Scraping_Selectors;
SHOW CREATE TABLE Website_Scraping_data;
SHOW CREATE TABLE Website_Scraping_Runs;
SHOW CREATE TABLE Website_Scraping_Run_Site_Stats;
SHOW CREATE TABLE User_Feedback;

SHOW INDEX FROM Website_Scraping_data;
SHOW INDEX FROM Website_Scraping_Sources;
SHOW INDEX FROM Website_Scraping_Selectors;
SHOW INDEX FROM Website_Scraping_Runs;
SHOW INDEX FROM Website_Scraping_Run_Site_Stats;
```

The live schema is authoritative because scraper models are unmanaged. Any difference between model definitions and live SQL must be recorded before implementation.

## 7. Proposed Schema Improvements

Schema changes must first be applied only to the isolated test schema.

### Scraped data indexes

Add and verify indexes appropriate for the backend query patterns:

```text
(website_name, category)
(website_name, created_at)
(website_name, notice_date)
(website_name, processed)
(due_date)
```

Avoid adding redundant indexes without checking the existing indexes and query plans.

### Duplicate identity

The current logical identity is:

```text
website_name + title + category
```

The current database key uses a 640-character title prefix. This must be tested because two titles sharing the first 640 characters can collide while application lookup uses the full title.

The implementation must ensure:

- Concurrent identical inserts produce one row.
- Duplicate insert attempts do not count as new rows.
- Integrity errors do not produce misleading `new_count` values.
- Long titles are handled consistently.

### Site-run status table

Create or extend a per-site execution table with fields equivalent to:

- `id`
- `run_id`
- `website_name`
- `status`
- `stage`
- `current_url`
- `started_at`
- `heartbeat_at`
- `finished_at`
- `new_rows`
- `discovered_rows`
- `processed_rows`
- `failed_rows`
- `error_message`
- `cancel_requested`

### Item-processing table

A detailed item table is recommended for admin reporting:

- `id`
- `run_id`
- `site_run_id`
- `data_id`
- `website_name`
- `stage`
- `status`
- `started_at`
- `finished_at`
- `error_message`

This allows administrators to identify whether a record failed during download, MarkItDown extraction, due-date extraction, Groq processing, or database update.

## 8. Configuration Preservation

The source and selector tables must remain unchanged unless an administrator explicitly edits them.

Required changes:

- Remove unconditional reseeding from `init_scraper_tables`.
- Normal scraper startup must not overwrite existing configuration.
- `--seed` must either be removed or require explicit destructive confirmation.
- Existing selector manager commands must use the selected scraper database configuration.
- Missing configuration should be reported clearly instead of silently replacing configuration.

Validation:

1. Change a selector in the test schema.
2. Run initialization.
3. Confirm the selector remains unchanged.
4. Change a source URL.
5. Run initialization again.
6. Confirm the URL remains unchanged.

## 9. Database Connection Redesign

The current module-global PyMySQL connection is unsafe for parallel workers and is also imported by feedback submission.

Replace it with a connection boundary that provides:

- One connection per worker or a properly managed connection pool.
- No shared cursor state.
- Explicit commit/rollback behavior.
- Safe cleanup in `finally` blocks.
- Separate connections for web requests and scraper workers.
- Correct support for `DEFAULT_DB_*` and `SCRAPER_DB_*` variables.
- No use of the scraper command's global connection by the feedback endpoint.

Each worker should have an explicit run context containing:

```text
run_id
website_name
full_scan
cancel_event
connection
status reporter
```

## 10. Run Locking and Cancellation

The current check for an existing `running` row is race-prone. Two admin requests or a cron job and an admin request can start simultaneously.

Implement an atomic run lock using a database-backed lease or equivalent mechanism.

Required behavior:

- Only one full pipeline run may be active at a time unless parallelism is explicitly inside that run.
- A per-site manual run must not overlap with a full run for the same site.
- A stale run must be detectable using heartbeat timestamps.
- A stale run can be marked `stale` safely.
- A stop request sets a cancellation flag.
- Workers finish the current safe operation and stop before starting new items.
- A cancelled run is recorded as `cancelled`.

Never depend only on a browser confirmation dialog for locking or cancellation.

## 11. Parallel Scraping Design

The target execution model is:

```text
One pipeline run
    +-- ICAI worker
    +-- BCI worker
    +-- ICMAI worker
    +-- RBI worker
    +-- CBIC worker
```

Each worker must have:

- Its own Playwright page or browser context.
- Its own database connection.
- Its own website selectors.
- Its own counters.
- Its own status updates.
- Its own exception boundary.

Use bounded concurrency. The initial maximum can be five workers, but it should be configurable if Render resource limits require a lower value.

A single website failure must not cancel the other workers.

Example result:

```text
ICAI: success
BCI: success
ICMAI: failed
RBI: success
CBIC: success
Overall run: partial_failure
```

The Playwright browser must run headless in Render and scheduled environments.

## 12. Website Stop-at-Existing Logic

Preserve incremental scraping behavior without allowing one website to affect another.

For each website and category/page stream:

1. Load the newest source records first.
2. Parse records in source order.
3. Check the configured natural key.
4. Insert records that do not exist.
5. Stop when the first existing record is found.
6. Continue past existing records only with `--full-scan`.

This rule must be verified separately for ICAI, BCI, ICMAI, RBI, and CBIC because their current implementations do not behave identically.

Tests must include:

- First record already exists.
- Existing record appears in the middle.
- New record appears before an existing record.
- Source order changes.
- Empty result pages.
- Pagination.
- Full scan mode.
- Per-category ICMAI behavior.

## 13. URL Selection Logic

The current URL priority must remain unchanged:

```text
pdf_url -> detail_url -> source_url
```

Rules:

- If a valid `pdf_url` exists, process the PDF.
- If no PDF exists, process `detail_url` where appropriate.
- If neither exists, use the source URL only where current behavior explicitly allows it.
- Preserve existing category-page skip behavior.
- Do not fabricate document URLs.

## 14. MarkItDown PDF Pipeline

The new PDF flow is:

```text
pdf_url
  -> download temporary PDF
  -> convert with MarkItDown
  -> hold Markdown in memory or a temporary file
  -> extract due date
  -> generate Groq summary
  -> validate result
  -> update database
  -> delete PDF and Markdown temporary files
```

MarkItDown should be the primary PDF extraction library.

Temporary files must be cleaned on:

- Successful processing.
- Download failure.
- MarkItDown failure.
- Groq timeout.
- Groq invalid response.
- Database update failure.
- Cancellation.
- Unexpected exception.

Test inputs:

- Text-based PDF.
- PDF with tables.
- Scanned/image-only PDF.
- Malformed PDF.
- Encrypted PDF.
- Empty PDF.
- Very large PDF.
- HTML content returned from a PDF URL.

The Render filesystem is ephemeral, so it must never be treated as permanent storage.

## 15. Groq Summary Pipeline

Add the Groq client and configuration through environment variables:

```text
GROQ_API_KEY=
GROQ_MODEL=
GROQ_TIMEOUT_SECONDS=
```

The API key will be supplied manually in `.env` or Render environment settings. It must never be committed to the repository or written to logs.

Groq receives the Markdown content generated by MarkItDown.

Prompt requirements:

- Use only the supplied Markdown.
- Do not use external knowledge.
- Do not infer unsupported facts.
- Preserve authority, action, applicability, and important dates where present.
- Aim for 50–60 words.
- Never exceed 60 words.
- Return strict JSON only.

Expected response:

```json
{
  "summary": "A factual summary of no more than 60 words.",
  "due_date": "30 Sep 2026"
}
```

Validation:

- JSON must parse.
- `summary` must be present.
- Summary must not exceed 60 words.
- No minimum word count is enforced.
- Summary must not be a refusal, placeholder, or empty response.
- Summary must be based on extracted content.
- `due_date` may be empty.

If the summary exceeds 60 words, retry once with a correction instruction. If it still fails, leave the record retryable and report the failure in admin.

For documents with very little meaningful content, a shorter factual summary is allowed. The system must never invent content just to reach 50 words.

## 16. Notice Date and Due Date Rules

### `notice_date`

Stores the date the notice or notification was published on the source website. It must come from the website listing or source-specific publication-date field.

### `due_date`

Stores a compliance deadline, submission deadline, closing date, or equivalent date found in the Markdown document.

Rules:

- Do not use `notice_date` as a normal notification's fallback `due_date`.
- Tender closing dates may be used where the source explicitly provides them.
- Normalize parsed dates consistently.
- Preserve empty due dates when no deadline exists.
- Correct the current ISO extraction issue where only the year can be captured from `YYYY-MM-DD` values.

Test cases must distinguish publication dates from deadlines when a document contains multiple dates.

## 17. Error Isolation and Admin Alerts

No email alerts are required initially.

Every failure must be visible in the admin interface with:

- Run ID.
- Website name.
- Failed stage.
- URL.
- Start time.
- End time.
- Exception type.
- Human-readable error message.
- Technical traceback available in logs or restricted detail view.
- Whether the item/site will retry.

A website failure must not stop other website workers.

The overall run becomes:

- `success` if all enabled website workers succeed.
- `partial_failure` if at least one site fails and at least one site completes.
- `failed` if the run cannot start or all required work fails.
- `cancelled` if an administrator stops it.

Do not display credentials, API keys, or sensitive connection details in admin messages.

## 18. Admin Controls and Live Dashboard

The current server-rendered admin dashboard should be extended without touching the frontend application.

Required controls:

- Run all active websites.
- Run one selected website.
- Stop the current run.
- View active/inactive status.
- Toggle website active/inactive.
- View current website stage.
- View current URL.
- View discovered/new/processed/failed counts.
- View last error.
- View last successful run.
- View last failed run.
- View per-site reports.
- View item-processing failures.
- Refresh live status.
- Start the final reset only after validation.

Recommended live mechanism:

- Superuser-only JSON status endpoint.
- Admin template polling every 3–5 seconds.
- No WebSocket infrastructure initially.

Per-site `Run Now` behavior:

- Active site: start that site's worker.
- Inactive site: show a clear message and do not start.
- Full run active: prevent conflicting per-site execution.

## 19. Final Reset Design

The reset must not be available for production execution until the MarkItDown and Groq test pipeline has passed all approval gates.

Recommended command/action:

```text
python manage.py reset_scraper_data --confirm
```

The reset deletes:

- All rows from `Website_Scraping_data`.
- All rows from per-site run status/statistics.
- All rows from `Website_Scraping_Runs`.
- Any new item-processing report rows.

The reset preserves:

- `Professional_Category`.
- `Website_Scraping_Sources`.
- `Website_Scraping_Selectors`.
- Django users.
- User profiles.
- User feedback.
- Table definitions and indexes.

The reset must:

- Require explicit server-side confirmation.
- Refuse to run while a scraper is active.
- Show counts before deletion.
- Execute safely with transactions where possible.
- Report exactly what was deleted.
- Be tested only against the isolated test schema first.

## 20. Render Deployment and Schedule

The repository currently has no Dockerfile, Render manifest, or cron script. These must be added only after the local/test pipeline is stable.

Recommended Render layout:

- Existing web service for Django API/admin.
- Separate Render Cron Job for scheduled scraping.
- Shared application code and environment settings.
- Headless Playwright runtime.
- Separate process lock.

The requested time is 9:00 AM India time.

Render cron uses UTC, so use:

```cron
30 3 * * *
```

The scheduled command should:

1. Load the correct environment.
2. Change to the backend directory.
3. Acquire the run lock.
4. Run all active website workers.
5. Write structured logs.
6. Release the lock.
7. Return an appropriate exit code.

The deployment must install Playwright Chromium and Linux dependencies. MarkItDown and the Groq client must be pinned in `requirements.txt` after compatibility testing.

## 21. Staged Implementation and Validation Gates

Each stage must pass before the next stage begins.

### Stage 0: Branch and baseline

Actions:

- Create the feature branch.
- Record current commit and status.
- Run existing backend checks.
- Confirm frontend files are not touched.

Gate:

- Baseline is documented.
- Main branch remains unchanged.

### Stage 1: Read-only SQL inspection

Actions:

- Inspect live table definitions and indexes.
- Record model/schema drift.
- Confirm production credentials are not used by test commands.

Gate:

- Actual schema is documented.
- No production data is modified.

### Stage 2: Isolated test schema

Actions:

- Create the test schema.
- Copy source and selector configuration.
- Create test data/run/report structures.

Gate:

- Test commands can run exclusively against the test schema.
- Source and selector configuration is intact.

### Stage 3: Indexes and atomic deduplication

Actions:

- Add test-schema indexes.
- Test concurrent identical inserts.
- Test long-title collisions.
- Correct per-site insertion counts.

Gate:

- Exactly one row is stored for duplicate records.
- Counts are accurate.

### Stage 4: Connection and run-lock redesign

Actions:

- Remove shared connection behavior.
- Add worker connection boundaries.
- Add atomic run locking.
- Add heartbeat and stale-run handling.

Gate:

- Two simultaneous starts cannot create conflicting runs.
- A killed run can be recovered.

### Stage 5: Single-site worker migration

Actions:

- Refactor one website into the new worker interface.
- Preserve its selectors, URLs, dates, and stop logic.
- Test it against the isolated schema.

Gate:

- One website works end to end without changing other websites.

### Stage 6: All existing website workers

Actions:

- Migrate ICAI, BCI, ICMAI, RBI, and CBIC.
- Keep website-specific parsing behavior.
- Add per-site results and error boundaries.

Gate:

- Sequential test run works for all sites.
- Existing-record stopping behavior passes site-specific tests.

### Stage 7: Parallel execution

Actions:

- Run active website workers concurrently with bounded concurrency.
- Give each worker separate Playwright and database resources.
- Make failures local to each site.

Gate:

- One intentional website failure does not stop other sites.
- Browser contexts and connections close correctly.

### Stage 8: MarkItDown

Actions:

- Add and pin MarkItDown dependency.
- Replace PDF extraction path.
- Keep Markdown temporary.
- Add cleanup handling.

Gate:

- All PDF fixture tests pass.
- No Markdown/PDF files remain after processing.

### Stage 9: Groq summaries

Actions:

- Add Groq dependency and environment configuration.
- Send extracted Markdown to Groq.
- Enforce strict JSON and maximum 60 words.
- Add retry and failure handling.

Gate:

- Valid summaries are stored.
- Overlong summaries are retried/rejected.
- Short factual summaries are accepted.
- Invalid provider responses remain retryable.

### Stage 10: Due-date extraction

Actions:

- Extract due dates from Markdown.
- Normalize date formats.
- Separate notice dates and due dates.
- Fix ISO parsing.

Gate:

- Multiple-date test fixtures select the correct deadline.
- Missing deadlines remain empty.

### Stage 11: Admin live control

Actions:

- Add per-site run controls.
- Add run-all-active control.
- Add active/inactive control.
- Add status endpoint and admin polling.
- Add error and processing reports.

Gate:

- A superuser can observe live progress.
- Inactive sites are skipped.
- Per-site runs work independently.

### Stage 12: Reset validation

Actions:

- Add reset command/action.
- Test confirmation and active-run blocking.
- Test deletion against the isolated schema.

Gate:

- All scraper data and run history are deleted.
- Sources and selectors remain.
- Users and feedback remain.
- A new scrape works after reset.

### Stage 13: Render deployment

Actions:

- Add Docker/runtime configuration.
- Install Chromium dependencies.
- Add Render cron configuration.
- Configure Groq through environment variables.
- Configure 03:30 UTC schedule.

Gate:

- Clean deployment starts.
- Headless scraping works.
- Temporary processing works.
- Scheduled run lock works.

### Stage 14: Production cutover

Actions:

1. Obtain final approval.
2. Back up production databases.
3. Confirm no active production scrape.
4. Verify production source/selector configuration.
5. Run the final reset against the intended production scraper database.
6. Deploy the verified feature branch or merge through the normal release process.
7. Run a controlled manual scrape.
8. Verify admin reports and records.
9. Enable the 9 AM India schedule.

Gate:

- Production data starts fresh.
- Sources/selectors remain intact.
- All active websites are operating.
- Admin can observe failures and progress.
- Frontend API behavior remains compatible.

## 22. Required Test Matrix

### Scraping

- All websites active.
- One website inactive.
- Multiple websites inactive.
- One website unavailable.
- One website selector invalid.
- One website returns an empty page.
- Existing newest record.
- New records before existing record.
- Full scan.
- Per-site manual run.
- Full active-site run.
- Concurrent manual and scheduled trigger.

### PDF and Markdown

- Text PDF.
- Table PDF.
- Scanned PDF.
- Encrypted PDF.
- Corrupt PDF.
- Empty PDF.
- HTML returned for a PDF URL.
- Download timeout.
- MarkItDown timeout/failure.
- Cleanup after every result.

### Groq

- Valid 50-word summary.
- Valid short summary.
- Exactly 60 words.
- More than 60 words.
- Empty summary.
- Invalid JSON.
- Missing due date.
- Multiple due dates.
- Rate limit.
- Timeout.
- API key missing.

### Admin

- Superuser access.
- Non-superuser denial.
- Live polling.
- Per-site status.
- Run-all status.
- Manual per-site trigger.
- Inactive-site prevention.
- Cancellation.
- Stale run recovery.
- Human-readable error report.
- Reset confirmation.
- Reset blocked during active run.

### Deployment

- Clean Render build.
- Chromium installation.
- Headless browser execution.
- Environment variable loading.
- 03:30 UTC schedule.
- Duplicate schedule prevention.
- Temporary filesystem cleanup.
- Database reconnect behavior.

## 23. Rollback Strategy

Before production cutover:

- Export or snapshot production databases.
- Preserve the current deployment branch and commit.
- Keep the old scraper command available until the new pipeline is verified.
- Do not delete the backup after initial verification.

Rollback procedure:

1. Disable the new cron job.
2. Stop active new runs.
3. Restore the previous application version.
4. Restore the database backup only if data recovery is required.
5. Verify API and admin operation.
6. Investigate using the isolated test environment.

A database rollback cannot undo source-site requests, Groq API calls, or external side effects, so processing must remain item-level and observable.

## 24. Known Risks to Track

- Render may impose memory/CPU limits for parallel Chromium contexts.
- Some source websites may block concurrent requests or automated browsers.
- MarkItDown quality may vary for scanned PDFs and image-only documents.
- Groq output may not always follow the requested structure.
- Temporary files may accumulate if process termination bypasses cleanup.
- A stale run may remain after an infrastructure crash.
- Source pages may reorder historical records, affecting stop-at-existing logic.
- Unmanaged tables can drift from Django model definitions.
- Existing report documentation is stale and should be updated after implementation.
- Feedback currently shares scraper connection code and must be decoupled.

## 25. Definition of Done

The work is complete only when:

- The feature branch contains the new backend-only implementation.
- No frontend files were changed.
- Production scraper data was untouched during testing.
- Sources and selectors were preserved.
- All five websites can run in parallel.
- A website failure does not stop other websites.
- MarkItDown successfully processes supported PDFs.
- Markdown is temporary and cleaned up.
- Groq summaries never exceed 60 words.
- Short factual summaries are accepted.
- Notice and due dates are stored correctly.
- Admin shows live run and failure status.
- Admin can run one website or all active websites.
- Admin can activate/deactivate websites.
- Reset deletes all scraper data and historical run records only after approval.
- Reset preserves sources, selectors, users, profiles, and feedback.
- Render can run the scraper headlessly.
- Render cron runs at 9:00 AM India time.
- Existing frontend API consumers continue working.
- A production backup and rollback procedure are documented.
