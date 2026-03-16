# RegIntel

RegIntel is a regulatory intelligence platform that collects official updates from multiple Indian regulatory websites, organizes them, and delivers role-based insights through a modern dashboard.

## What It Does

- Scrapes notices and updates from supported regulator websites
- Stores and manages data in MySQL
- Tracks scraper runs and additions over time
- Shows role-aware Alerts, Publications, and Deadlines in the frontend
- Supports admin operations with a custom Django admin dashboard
- Supports manual scraper trigger from admin and scheduled runs via cron

## Key Features

- JWT-based authentication (login/signup/profile/password)
- Profession-based filtering for targeted updates
- Publications with category and website filters, lazy loading, and detail links
- Alerts split into New/Old with backend-driven counts
- Deadlines with due-date status logic (Urgent/Upcoming/Normal)
- Feedback submission and admin export
- Scraper run analytics in admin

## Tech Stack

- Backend: Django, Django REST Framework, SimpleJWT
- Frontend: React + TypeScript + Vite
- Databases: MySQL (default + scraper data)
- Scraping: Playwright + requests

## Project Structure

- frontend: React app (UI and user flows)
- backend: Django app (APIs, admin, scraper, auth)

## Quick Start

### Backend

1. Go to backend:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Install browser for scraper:

   ```bash
   playwright install chromium
   ```

4. Configure environment variables in root `.env` (see `.env.example`).

5. Run migrations:

   ```bash
   python manage.py migrate
   ```

6. Initialize scraper tables:

   ```bash
   python manage.py init_scraper_tables
   ```

7. Start backend:

   ```bash
   python manage.py runserver
   ```

### Frontend

1. Go to frontend:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start frontend:

   ```bash
   npm run dev
   ```

## Scheduler

To run scraping automatically at 10:00 AM and 6:00 PM (Linux cron):

```cron
0 10,18 * * * /bin/bash /path/to/RegIntel/backend/scripts/run_website_scraper.sh
```

Manual trigger is also available in admin dashboard via `Run Scraper Now`.

## Admin Access

- Admin URL: `/admin/`
- Use a superuser account (`python manage.py createsuperuser`)

## Notes for Deployment

- Frontend must use environment-based API URLs (not localhost)
- Backend CORS must allow your deployed frontend domain
- Set production DB credentials via environment variables

