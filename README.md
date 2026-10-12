# LibraryHub — Smart Library Management System
LIVE DEOMO - https://library-hub-library-management-syst.vercel.app
<img width="1911" height="922" alt="image" src="https://github.com/user-attachments/assets/443d9048-2c61-4965-baf3-f9672b5ce20c" />

> **Your Library, Smarter and Simpler.**

LibraryHub is a full-stack library management platform (React + Express + MongoDB) with role-based access for **administrators, librarians and students**. It covers the catalogue, borrow requests, issue and return, renewals, fines, notifications, dashboards and reports.

<img width="1916" height="915" alt="image" src="https://github.com/user-attachments/assets/685f2720-a640-4083-aaa1-fd967d778d00" />


## Contents
1. [Problem statement](#problem-statement) · 2. [Features](#features) · 3. [Roles](#user-roles) · 4. [Tech stack](#technology-stack) · 5. [Architecture](#architecture) · 6. [Folder structure](#folder-structure) · 7. [Local setup](#local-setup) · 8. [Environment variables](#environment-variables) · 9. [Database, seed and first admin](#database-seed-and-first-admin) · 10. [Running](#running-the-app) · 11. [API](#api-reference) · 13. [Deployment](#deployment) · 14. [Security](#security-considerations) · 15. [Troubleshooting](#troubleshooting) · 16. [Known limitations](#known-limitations) · 17. [Future work](#future-enhancements) · 18. [Screenshots](#screenshots) 

## Problem statement
Schools, colleges and small libraries often run on paper registers or spreadsheets, which makes inventory, due dates and fines error-prone. LibraryHub keeps one consistent record of books, loans and fines, and lets students self-serve while staff approve and process transactions.

<img width="1917" height="915" alt="image" src="https://github.com/user-attachments/assets/1ed14b1b-720b-40c2-9039-d4832c4efdfa" />


## Features
- **Public site:** landing page with real featured books and live statistics (never fabricated), searchable catalogue (search, category/availability filters, sorting, pagination, grid/list), book details.

<img width="1917" height="913" alt="image" src="https://github.com/user-attachments/assets/f7c43f07-97f2-4be6-89f1-01e457f9cd0c" />


  
- **Auth:** student registration, login/logout, session restore, change password, forgot/reset password, deactivated-account checks, rate limiting.

<img width="1915" height="922" alt="image" src="https://github.com/user-attachments/assets/9aa63333-b2a8-40ab-a0ec-f4ef56e3d16b" />

- **Students:** request books, cancel pending requests, view loans/history/fines, request renewals, notifications, profile.

<img width="1917" height="913" alt="image" src="https://github.com/user-attachments/assets/8488de3b-b7e6-4425-bd34-73b6425fda9f" />


- **Librarians/Admins:** approve or reject requests, issue books directly, process returns, review renewals, manage books (add/edit/remove), look up members, record fine payments, reports with CSV export.

<img width="1913" height="920" alt="image" src="https://github.com/user-attachments/assets/b66c1e18-15cc-4133-ad34-e3e28ff127b6" />


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

.

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



## Future enhancements
Settings screen, email provider, reservations, audit-log viewer, dark mode, barcode scanning, PDF receipts, multi-branch.

## Screenshots
<img width="1912" height="915" alt="image" src="https://github.com/user-attachments/assets/ddc320bc-2b33-4b4d-8958-6c4c12ad648f" />
<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/7546c5ef-72fc-481b-b55b-8d59955c6cc1" />
<img width="1912" height="926" alt="image" src="https://github.com/user-attachments/assets/1e1be2f1-9170-4950-8dfa-a860de344d50" />
<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/def6eb76-7ecc-473f-9ce6-dd45867208c0" />
<img width="1910" height="917" alt="image" src="https://github.com/user-attachments/assets/d9cef1a9-37a3-43bd-aa3b-8d6cf1362ddb" />
<img width="1912" height="921" alt="image" src="https://github.com/user-attachments/assets/b831b1cf-5e54-41a0-bb3e-a63cd7e8250f" />



