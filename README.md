# LibraryHub — Smart Library Management System

> **Your Library, Smarter and Simpler.**

LibraryHub is a full-stack library management platform (React + Express + MongoDB) with role-based access for **administrators, librarians and students**. It covers the catalogue, borrow requests, issue and return, renewals, fines, notifications, dashboards and reports.

## Contents
1. [Problem statement](#problem-statement) · 2. [Features](#features) · 3. [Roles](#user-roles) · 4. [Tech stack](#technology-stack) · 5. [Architecture](#architecture) · 6. [Folder structure](#folder-structure) · 7. [Local setup](#local-setup) · 8. [Environment variables](#environment-variables) · 9. [Database, seed and first admin](#database-seed-and-first-admin) · 10. [Running](#running-the-app) · 11. [API](#api-reference) · 12. [Testing](#testing) · 13. [Deployment](#deployment) · 14. [Security](#security-considerations) · 15. [Troubleshooting](#troubleshooting) · 16. [Known limitations](#known-limitations) · 17. [Future work](#future-enhancements) · 18. [Screenshots](#screenshots) · 19. [License](#license)

## Problem statement
Schools, colleges and small libraries often run on paper registers or spreadsheets, which makes inventory, due dates and fines error-prone. LibraryHub keeps one consistent record of books, loans and fines, and lets students self-serve while staff approve and process transactions.

## Features
- **Public site:** landing page with real featured books and live statistics (never fabricated), searchable catalogue (search, category/availability filters, sorting, pagination, grid/list), book details.
- **Auth:** student registration, login/logout, session restore, change password, forgot/reset password, deactivated-account checks, rate limiting.
- **Students:** request books, cancel pending requests, view loans/history/fines, request renewals, notifications, profile.
- **Librarians/Admins:** approve or reject requests, issue books directly, process returns, review renewals, manage books (add/edit/remove), look up members, record fine payments, reports with CSV export.
- **Admins only:** create staff accounts, change roles, activate/deactivate accounts, waive fines, admin dashboard with charts.
- **Business rules (server-side):** borrowing limit, no duplicate loans, overdue block, optional unpaid-fine block, fines computed from stored policy (rate, grace days, max fine), atomic inventory updates, audit log.
- **UX:** responsive layout with collapsible sidebar, skeleton loaders, empty/error states, toasts, confirmation dialogs, 404 and 403 pages.

## User roles
| Role | Can do |
|---|---|
| `STUDENT` | Browse, request/cancel, view own loans/fines/requests, request renewals, edit own name/phone |
| `LIBRARIAN` | Everything operational: requests, issue/return, renewals, books, student lookup, fine payments, reports |
| `ADMIN` | Librarian powers + manage members/roles/status, waive fines, admin dashboard |

Public registration always creates a `STUDENT`; sending a `role` field is rejected. The first admin is created from the command line (see below).

## Technology stack
React 18 · Vite · React Router · Axios · Recharts · Lucide · plain CSS (one stylesheet per page/component) · Node.js ≥ 20 · Express · MongoDB + Mongoose · JWT (HttpOnly cookie) · bcryptjs · Zod · Helmet · express-rate-limit · Vitest + React Testing Library · Node's built-in test runner + Supertest + mongodb-memory-server.

## Architecture
```
Browser (React SPA)  ──HTTPS + cookie──►  Express API  ──►  MongoDB
  pages → services (Axios)                routes → controllers → services → models
```
- **Controllers** are thin; **services** hold workflows (approve, issue, return, fines, renewals, reports).
- **Inventory safety without transactions:** every state change is an *atomic conditional update* (e.g. `availableCopies > 0` → `$inc -1`; `status: 'issued'` → `'returned'`), with compensating rollback if a later step fails. This works on a standalone MongoDB and on Atlas. Unique/partial indexes back this up (one active loan per student+book, one pending request per student+book, one fine and one payment per loan/fine).
- **Overdue** is derived (`status = issued` and `dueDate` before today), never stored, so it cannot contradict the loan status.
- **Dates:** borrowing is date-based and evaluated in **UTC calendar days**.

## Folder structure
```
LibraryHub/
├── client/            React app (src/pages, components, layouts, services, hooks, context, css, utils)
├── server/
│   ├── config/        env validation, DB connection
│   ├── controllers/   request handlers
│   ├── services/      business logic
│   ├── models/        Mongoose schemas
│   ├── routes/        Express routers
│   ├── middleware/    auth, validation, errors
│   ├── validators/    Zod schemas
│   ├── jobs/          due-date notification job
│   ├── scripts/       createAdmin, seed, runDueDateJob
│   ├── tests/         node:test suites
│   ├── app.js  server.js
├── render.yaml        optional Render blueprint
├── vercel.json        SPA fallback (also in client/)
└── package.json       helper scripts
```

## Local setup
**Prerequisites:** Node.js 20+, npm, and MongoDB (local Community Server, Docker, or a free Atlas cluster).
```bash
npm run install:all          # installs server and client dependencies
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env: set JWT_SECRET (32+ random chars) and MONGODB_URI
```
Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Environment variables
**server/.env**
| Variable | Purpose |
|---|---|
| `PORT` | API port (Render injects its own) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | Mongo connection string (**required**) |
| `JWT_SECRET` | ≥ 32 characters (**required**) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `CLIENT_URL` | Allowed frontend origin(s), comma separated (**required**) |
| `COOKIE_SECURE` | `true` in production (HTTPS) |
| `COOKIE_SAME_SITE` | `lax` locally; see deployment notes for production |
| `FINE_PER_DAY`, `DEFAULT_BORROW_DAYS`, `MAX_BORROWED_BOOKS` | Initial defaults, copied into the settings document on first use |
| `ENABLE_JOBS` | `true` runs the due-date job every 6 hours inside the server |

The server refuses to start if a required variable is missing. **client/.env:** `VITE_API_URL=http://localhost:5000/api`.

> Fine rate, borrow days and limits are stored in the `LibrarySettings` document (created from the env defaults on first use). Changing env values later does not change an existing settings document. There is no settings screen yet; edit the document directly (see Known limitations).

## Database, seed and first admin
```bash
# 1. Create the first administrator (credentials come from your shell, never from source code)
cd server
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='ChangeMe123' ADMIN_NAME='Your Name' npm run create-admin

# 2. Optional, DEVELOPMENT ONLY: demo books, demo librarian/students, sample loans
npm run seed          # prints the generated demo password once
npm run seed:remove   # removes exactly the demo data the seed created
```
The seed refuses to run when `NODE_ENV=production` unless `ALLOW_SEED=true`, and never drops collections. Demo accounts use the domain `demo.libraryhub.local`. Book ISBNs and Open Library cover links in the seed data were written by hand — verify them; covers fall back to a placeholder if they fail.

## Running the app
```bash
npm run dev:server    # http://localhost:5000  (health: /api/health)
npm run dev:client    # http://localhost:5173
```
**Password reset without email:** no email provider is integrated. In development the reset link is printed in the server console after "Forgot password". In production no link is exposed; an administrator would need to create a new temporary password for the user (or you can add an email provider).

## API reference
Base path `/api`. Responses: `{ success, message, data, pagination? }`; errors: `{ success:false, message, errors[] }`. All state-changing requests need the header `X-Requested-With: LibraryHub` (the client sets it).

| Area | Endpoints | Access |
|---|---|---|
| Health | `GET /health` | public |
| Public | `GET /public/stats` | public |
| Auth | `POST /auth/register, /login, /logout, /change-password, /forgot-password, /reset-password` · `GET /auth/me` · `PATCH /auth/profile` | public / authenticated |
| Books | `GET /books`, `GET /books/categories`, `GET /books/:id` | public |
| | `POST /books`, `PUT /books/:id`, `DELETE /books/:id` | staff |
| Members | `GET /members`, `GET /members/:id` | staff (librarians see students only) |
| | `POST /members`, `PATCH /members/:id`, `/:id/status`, `/:id/role` | admin |
| Requests | `POST /requests`, `GET /requests/my`, `PATCH /requests/:id/cancel` | student |
| | `GET /requests`, `PATCH /requests/:id/approve`, `/reject` | staff |
| | `GET /requests/:id` | owner or staff |
| Issues | `GET /issues/my` | student |
| | `GET /issues`, `POST /issues`, `PATCH /issues/:id/return` | staff |
| | `GET /issues/:id` | owner or staff |
| Renewals | `POST /renewals`, `GET /renewals/my` | student |
| | `GET /renewals`, `PATCH /renewals/:id/approve`, `/reject` | staff |
| Fines | `GET /fines/my` | student |
| | `GET /fines`, `POST /fines/:id/payments` | staff |
| | `PATCH /fines/:id/waive` | admin |
| | `GET /fines/:id` | owner or staff |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | authenticated (own only) |
| Dashboards | `GET /dashboard/admin` (admin), `/librarian` (staff), `/student` (student) | |
| Reports | `GET /reports/borrowing, /inventory, /fines, /categories` (`?from=&to=&format=csv` where applicable) | staff |

List endpoints accept `page`, `limit` (max 50) and filters; book search accepts `q, category, author, availability, year, sort`.

## Testing
```bash
npm test                      # server + client
npm --prefix server test      # node:test, in-memory MongoDB (downloads a MongoDB binary on first run)
npm --prefix client test      # Vitest + React Testing Library
```
Server suites: auth, books, borrowing (race conditions, double return), finance (payments, waivers, renewals), admin (members, dashboards, reports, notifications, job idempotency), plus pure unit tests for fine calculation and CSV escaping. Tests use an isolated in-memory database — never your real one.

**Verification status of this delivery:** the code was authored in an environment without npm registry access. Only `node --check` syntax checks, the dependency-free unit tests (fine calculation, CSV escaping) and an import-resolution scan of the client were executed. **The database-backed server tests, the client tests, the client build and the running application have not been executed.** Run the commands above after installing and fix anything they reveal.

## Deployment
Order: **MongoDB Atlas → Render (API) → Vercel (client)**.

### 1. MongoDB Atlas
1. Create a free cluster, then a **database user** (username + strong password).
2. **Network Access:** allow Render's outbound IPs, or `0.0.0.0/0` for a portfolio project (understand the trade-off).
3. **Connect → Drivers:** copy the `mongodb+srv://…` string, insert your password and a database name (e.g. `/libraryhub`).
4. A deployed server cannot use `localhost` — that points at the server itself, not your machine.

### 2. Render (backend)
1. New **Web Service** from your GitHub repo, **Root Directory** `server`, **Build** `npm install`, **Start** `npm start`, **Health Check Path** `/api/health` (or use `render.yaml`).
2. Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (long random), `CLIENT_URL=https://<your-vercel-app>.vercel.app`, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE` (see below), optional `ENABLE_JOBS=true`.
3. Deploy, open `https://<service>.onrender.com/api/health` and expect `"database":"connected"`. Logs are under the service's **Logs** tab.
4. Create the admin: use Render's **Shell** (paid) or run `create-admin` locally with `MONGODB_URI` pointed at Atlas.

### 3. Vercel (frontend)
1. Import the repo, **Root Directory** `client`, framework Vite, build `npm run build`, output `dist`.
2. Environment variable `VITE_API_URL` (see cookie options below). Redeploy after changing it — Vite bakes it in at build time.
3. `client/vercel.json` rewrites every route to `index.html`, so deep links like `/student/books` work on refresh.

### Cookies across Vercel and Render (important)
The auth cookie is HttpOnly. A frontend on `*.vercel.app` and an API on `*.onrender.com` are *different sites*, so the cookie is third-party and **may be blocked by browsers** (Safari and some Chrome settings). Choose one:
- **Recommended — same-origin proxy:** add an API rewrite *before* the catch-all in `client/vercel.json`:
  ```json
  { "rewrites": [
      { "source": "/api/:path*", "destination": "https://<service>.onrender.com/api/:path*" },
      { "source": "/(.*)", "destination": "/index.html" } ] }
  ```
  Set `VITE_API_URL=/api`, `COOKIE_SAME_SITE=lax`, `COOKIE_SECURE=true`. The cookie is then first-party.
- **Custom domain:** serve both from one parent domain (`app.example.com`, `api.example.com`) with `COOKIE_SAME_SITE=lax`.
- **Cross-site as-is:** `COOKIE_SAME_SITE=none` + `COOKIE_SECURE=true` + `VITE_API_URL=https://<service>.onrender.com/api`. Works where third-party cookies are allowed; test in your target browsers.

### Free-tier notes
Free Render services sleep when idle, so the first request can take around a minute (cold start). The in-process job only runs while the service is awake; for dependable reminders use a scheduler that runs `npm run job:due-dates` (e.g. a Render Cron Job). Hosting terms change — check current limits.

### Production checklist
- [ ] Strong `JWT_SECRET`, real `MONGODB_URI` (not localhost)
- [ ] `COOKIE_SECURE=true`, cookie strategy chosen and tested
- [ ] `CLIENT_URL` equals the exact deployed frontend origin (no trailing slash)
- [ ] `VITE_API_URL` correct and frontend redeployed
- [ ] Admin created; seed **not** run
- [ ] `/api/health` reports connected; deep links work on refresh
- [ ] No `.env` committed

## Security considerations
bcrypt password hashing · HttpOnly cookie sessions · CORS allow-list with credentials (no wildcard) · CSRF defence via required custom header · Helmet · rate limiting (global and stricter on auth routes) · Zod validation with strict schemas (unknown fields such as `role` rejected) · escaped search patterns · ownership enforced from the session, never from client-sent IDs · generic login errors · hashed single-use reset tokens · audit log · no secrets in responses or logs.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Server exits: "Missing required environment variables" | Create `server/.env` from the example |
| Login works but `/me` returns 401 on the deployed site | Third-party cookie blocked — use the proxy or custom-domain option |
| CORS error | `CLIENT_URL` must exactly match the browser origin |
| 403 "Missing required request header" | Requests must send `X-Requested-With: LibraryHub` (the bundled client does) |
| Blank page on refresh at a nested URL | Ensure `vercel.json` is in the client root |
| `MongoServerSelectionError` | Check Atlas network access and credentials |
| Tests hang on first run | `mongodb-memory-server` is downloading a MongoDB binary |

## Known limitations
- Not run end-to-end in the authoring environment (see verification status).
- No email delivery; reset links only appear in the development console. No push notifications.
- No settings screen: library policy lives in the `LibrarySettings` document.
- Renewal does not check reservations (reservations are not implemented). No lost-book workflow, wishlist, QR/barcode, dark mode or multi-branch support.
- Payments are recorded manually and in full (no gateway, no partial payments). Fines are generated at return time; an overdue book that is not yet returned has no fine record until it is returned.
- The audit log has no viewer screen (entries appear in "Recent activity").
- CSV export only; no PDF.
- Notifications are polled every minute, not pushed.

## Future enhancements
Settings screen, email provider, reservations, audit-log viewer, dark mode, barcode scanning, PDF receipts, multi-branch.

## Screenshots
_None included. After running the app locally, add your own screenshots here (e.g. `docs/landing.png`)._

## License
Choose a license before publishing (MIT is common for portfolio projects) and add a `LICENSE` file.
