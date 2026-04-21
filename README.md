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
