RegIntel – Professional Regulatory Intelligence Platform

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