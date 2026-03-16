RegIntel – Professional Regulatory Intelligence Platform

## First-Time Local Setup

### 1. Clone and prepare environment files

1. Clone the repository.
2. Copy `.env.example` to `.env` in the repository root.
3. Fill `.env` with your own values:
  - `DJANGO_SECRET_KEY`
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
  - `GEMINI_API_KEY`

### 2. Backend setup (Django)

1. Open a terminal in `backend`.
2. IGNORE
3. Install dependencies:

  pip install -r requirements.txt

4. Install Playwright browser once:

  playwright install chromium

5. Run database migrations:

  python manage.py migrate

6. (Optional) Create admin user:

  python manage.py createsuperuser

7. Start backend server:

  python manage.py runserver

### 3. Frontend setup (React + Vite)

1. Open a new terminal in `frontend`.
2. Install packages:

  npm install

3. Start frontend:

  npm run dev

4. Open the local URL printed by Vite (typically `http://localhost:5173`).

### 4. Scraper setup (optional)

1. Ensure MySQL is running and `.env` DB values are correct.
2. Initialize source and selector tables:

  python manage.py init_scraper_tables

3. Run scraping:

  python manage.py website_scraper

## Pre-Push Security Checklist

1. Confirm `.env` is not staged.
2. Confirm no credentials are hardcoded in source files.
3. Confirm `backend/db.sqlite3`, `frontend/node_modules`, and `frontend/dist` are not staged.
4. Run:

  git status

5. Review staged diff before push:

  git diff --staged

A web‑based professional intelligence system that continuously monitors public regulatory and institutional websites, detects new or changed publications, classifies their relevance, summarizes them, and delivers personalized, action‑oriented alerts to professionals.
-----------------------------------------------------------------------------------------------------------

FRONTEND DEVELOPMENT PACKAGE INSTALLMENT CODES ARE BELOW:

> npm create vite@latest frontend -- --template react-ts

> cd frontend

> npm install -D tailwindcss@3.4.17 postcss autoprefixer

> npx tailwindcss init -p

> npm install react-router-dom lucide-react clsx tailwind-merge class-variance-authority recharts

> npm install -D @types/node
------------------------------------------------------------------------------------------------------------------

Open the newly created tailwind.config.js inside your frontend folder:

Replace its content with this:

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We will add custom REGINTEL colors here later
        sidebar: "#f8f9fa",
      }
    },
  },
  plugins: [],
}

File: Open src/index.css.

replace everything in the file with below:

@tailwind base;
@tailwind components;
@tailwind utilities;

File: Open vite.config.ts
Replace the content with this:

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

tsconfig.app.json (or tsconfig.json if .app doesn't exist).

Look for the "compilerOptions" section and add "baseUrl" and "paths" inside it, like this:

{
  "compilerOptions": {
    // ... keep your existing settings ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  // ... keep the rest of the file ...
}
------------------------------------------------------------------------------------------------------------------
> npm run dev

> npm install react-router-dom 