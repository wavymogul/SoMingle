# SoMingle

> **Connect Better. Experience More.**
> The future of social connection, community, networking, and experiences.

SoMingle is a premium, mobile-first research & waitlist platform built to
understand why events feel worse than they used to — and to design a new
category of curated social experiences around what people *actually* want.

This repository contains the marketing site, a multi-step research survey, a
waitlist capture flow, and an admin dashboard for reviewing responses.

## ✨ Features

- **High-conversion landing page** — hero, problem breakdown, vision, research
  CTA, testimonial wall, and waitlist capture.
- **6-step research survey** (`/survey`) with an animated progress bar,
  conditional questions, checkboxes, scale sliders, and validation.
- **Waitlist system** with idempotent email capture.
- **Admin dashboard** (`/admin`) — password-gated, with live stats, insight
  charts (most-wanted experiences, desired outcomes), full response detail
  views, and CSV export.
- **Serverless persistence** via Netlify Blobs (with a local JSON-file fallback
  for `next dev`) — submissions are stored with no external database to manage.
- Dark-mode-by-default premium UI: glassmorphism, brand gradients (purple,
  blue, pink, gold), Framer Motion animations, smooth scrolling.
- SEO-ready: metadata, Open Graph, `robots.txt`, and `sitemap.xml`.

## 🧱 Tech Stack

| Layer      | Choice                                  |
| ---------- | --------------------------------------- |
| Framework  | Next.js 14 (App Router) + TypeScript    |
| Styling    | Tailwind CSS                            |
| Animation  | Framer Motion                           |
| Icons      | lucide-react                            |
| Storage    | Netlify Blobs (JSON-file fallback)      |
| Hosting    | Netlify (`@netlify/plugin-nextjs`)      |

## 🚀 Getting Started

```bash
npm install
cp .env.example .env    # then edit ADMIN_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Landing page: `/`
- Research survey: `/survey`
- Admin dashboard: `/admin` (uses `ADMIN_PASSWORD`, default `somingle-admin`)

## ⚙️ Configuration

| Variable               | Description                                          | Default               |
| ---------------------- | ---------------------------------------------------- | --------------------- |
| `ADMIN_PASSWORD`       | Password for the `/admin` dashboard.                 | `somingle-admin`      |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO metadata & sitemap.       | `https://somingle.io` |
| `SOMINGLE_DB_PATH`     | (Local dev only) location for the JSON fallback store.| `./data`             |

> **Storage:** On Netlify, survey and waitlist submissions are written to
> **Netlify Blobs** automatically — no database or credentials to configure.
> For local `next dev`, data falls back to JSON files under `./data`. Running
> `netlify dev` locally exercises the same Blobs path as production.

## ☁️ Deploy to Netlify

This repo is preconfigured for Netlify via `netlify.toml` and
`@netlify/plugin-nextjs`. To deploy from the dashboard:

1. Push this branch to GitHub (already done).
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → connect GitHub → pick this repository.
3. Netlify auto-detects the settings from `netlify.toml` (build command
   `npm run build`, Next.js runtime plugin). Leave them as-is.
4. Under **Environment variables**, add `ADMIN_PASSWORD` (and optionally
   `NEXT_PUBLIC_SITE_URL`).
5. Click **Deploy**. Every push to the production branch redeploys automatically.

Netlify Blobs is enabled out of the box for Next.js sites — no extra setup.

## 📡 API

| Method | Route           | Purpose                                  |
| ------ | --------------- | ---------------------------------------- |
| `POST` | `/api/survey`   | Store a survey response.                 |
| `POST` | `/api/waitlist` | Add an email to the waitlist (upsert).   |
| `GET`  | `/api/admin`    | Fetch all data (requires admin password).|

## 🏗️ Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
  app/
    page.tsx            # landing page
    survey/page.tsx     # multi-step survey
    admin/page.tsx      # admin dashboard
    api/                # survey, waitlist, admin routes
    sitemap.ts, robots.ts
  components/            # UI sections, survey, admin
  lib/                  # db, types, survey options
```
