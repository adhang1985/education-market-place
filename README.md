# TutorHub – Education Marketplace

A single Next.js app (React UI + API Route Handlers) on MongoDB, built from the *TutorHub Expanded Marketplace* wireframes. Students find teachers and post learning requirements. Teachers preview those requirements as leads and unlock student contacts with Pro credits. Admins approve teachers and watch the platform.

## Screens → routes

| Wireframe | Route |
|---|---|
| 1. Homepage | `/` |
| 2. Student Search (filters, sort, facet counts) | `/search` |
| 3. Student Requirement Form (3-step) | `/post-requirement` |
| 4. Teacher Profile (About / Subjects / Reviews / Gallery) | `/teachers/:id` |
| 5. Teacher Dashboard (stats, recent leads, subscription, views chart) | `/teacher` (+ `/profile`, `/leads`, `/subscription`, `/reviews`) |
| 6. Pro Subscription | `/for-teachers` |
| 7 & 11. Lead Preview / Contact Unlock | `/leads/:id` |
| 8. Admin Dashboard (stats, user growth, approvals, quick actions) | `/admin` (+ `/users`, `/approvals`, `/requirements`, `/subscriptions`, `/reports`) |
| 9. Explore Marketplace Categories | `/categories` |
| 10. Category Leads & Requirements | `/leads` |
| Extra: student area (my requirements, saved teachers) | `/student` |

## Business rules

- **Privacy first:** before a lead is unlocked, teachers see only the category, goal, budget, mode, schedule and approximate area. The phone number is masked, and name, email and full address are hidden.
- **Unlocking** requires an *approved* teacher on an *active Pro* plan with credits left, plus the student's **consent**. One credit is spent atomically, and re-opening a lead you already unlocked is free.
- **Pro plan:** ₹299 for 30 days with 10 unlocks. Renewing early adds 30 days and 10 credits. Checkout is a **mock** in `src/server/services/subscription.js`; plug in Razorpay or Stripe there.
- **Bad leads:** teachers can request a replacement for a duplicate or invalid lead. An admin then refunds the credit or dismisses the report.
- **Teacher approval:** new teachers start as `pending` and don't appear in search until an admin approves them.
- **Search ranking:** "Relevance" lists active Pro teachers first (priority visibility), then sorts by rating.

## Getting started

Requires Node 22.9+ (for `--env-file-if-exists` in `npm run seed`).

```bash
npm install
cp .env.example .env.local   # then set MONGO_URI and JWT_SECRET
npm run dev                  # http://localhost:3000 – pages and /api from one server
```

**Database:** set `MONGO_URI` in `.env.local` to a local MongoDB (`brew install mongodb-community`) or a MongoDB Atlas connection string. If the database is empty, demo data is seeded on the first request.

If `MONGO_URI` is **empty or unset**, the app starts an in-memory MongoDB instead (via `mongodb-memory-server`). It downloads a ~70 MB `mongod` binary the first time, which can fail behind corporate proxies. Its data resets on every restart.

```bash
npm run seed                 # wipe & re-seed the database in MONGO_URI
npm run build && npm start   # production server on :3000
```

`npm run build` doesn't need the database: every page that reads data renders on request.

In production, set these in your host's environment:
- `MONGO_URI` – your production database.
- `JWT_SECRET` – a long random value.
- `NEXT_PUBLIC_SITE_URL` – the public domain, used for canonical URLs, `sitemap.xml`, `robots.txt` and Open Graph tags.
- `SEED_ON_EMPTY=false` – so an empty database is never filled with demo data.

## SEO

- **Server-rendered public pages** with real data and per-page `<title>`, description, canonical and Open Graph tags: home, `/search` (titles like "Physics Teachers in Delhi"), `/categories`, `/teachers/:id`, `/leads`, `/for-teachers`.
- **Structured data (JSON-LD):** Organization + WebSite search box on the home page; Person, Offer (hourly fee) and AggregateRating + breadcrumbs on teacher profiles.
- **`/sitemap.xml`** lists static pages, category searches and every approved teacher. **`/robots.txt`** blocks dashboards, auth pages and the API.
- **`noindex`:** dashboards, login, lead details (they expire and belong to students), and filtered search combinations (sort, price, experience…), which point to the clean landing URL as canonical.
- Server Components read data straight from the services in `src/server` – no HTTP round-trip. Auth is a token in `localStorage`, so personalised parts (favourites, unlocked leads, dashboards) load in the browser after the page renders.
- Profile views are counted from the browser (`POST /api/teachers/:id/view`), so server renders and crawlers don't inflate a teacher's stats.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | neha@tutorhub.com | student123 |
| Teacher (Pro, 8/10 credits) | priya@tutorhub.com | teacher123 |
| Teacher (free plan) | sneha@tutorhub.com | teacher123 |
| Admin | admin@tutorhub.com | admin123 |

The login page has one-click buttons for these.

## Project structure

```
src/
  app/
    (site)/           Public pages – Server Components: data, metadata, JSON-LD (+ footer layout)
    (dashboard)/      /teacher, /student, /admin – client-side role guard, noindex
    api/              Route Handlers – one thin route.js per endpoint, wrapping a service
    sitemap.js, robots.js, layout.jsx, globals.css
  server/             Server-only code
    db.js             Mongo connection (cached across hot reloads, in-memory fallback, auto-seed)
    auth.js           JWT sign/verify
    http.js           route() wrapper: DB connect, auth, role checks, JSON errors
    data.js           Plain-JSON data loaders for Server Components
    services/         Business logic: auth, catalog, teachers, teacherSelf, requirements, leads,
                      subscription, admin
    models/           User (student/teacher/admin + teacher profile + subscription),
                      Requirement, Unlock, Review, ProfileView, Payment
    seed.js           Demo data (teachers, students, leads, reviews, views, payments)
  views/              Page UIs (Client Components): Home, Search, Categories, PostRequirement,
                      TeacherProfile, Auth, Subscription, Leads, LeadDetail, StudentDashboard, teacher/*, admin/*
  components/         Navbar, Footer, Cards, DashboardLayout, LineChart, Icon, ui, NavLink, RequireRole, JsonLd
  lib/                api (browser fetch client), site config, utils, useSearchParamsState
scripts/seed.mjs      npm run seed
```

## API overview

All endpoints live under `src/app/api` and return JSON. Send `Authorization: Bearer <token>` for authenticated calls.

`/api/auth` register · login · me
`/api/teachers` search (`q, subject, studentClass, category, mode(s), location, experience, minPrice, maxPrice, rating, sort, page`) · featured · subjects · `:id` · `:id/view` · `:id/reviews` · `:id/favorite`
`/api/teacher` dashboard · profile · availability · reviews · unlocks (teacher only)
`/api/requirements` create · mine · `:id` patch consent/status (student only)
`/api/leads` list · `:id` · `:id/unlock` · `:id/report`
`/api/subscription` plan · subscribe · cancel
`/api/admin` stats · users · users/:id (delete) · users/:id/status · requirements · requirements/:id · reports · reports/:id/resolve · subscriptions
`/api` categories · stats · favorites · health
# Education_Market_Place
