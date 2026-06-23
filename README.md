# ⛺ St. Joseph's Cathedral Summer Camp — Management System

A modern, production-ready web application for camp staff to manage campers,
groups, attendance, scoring, and live rankings.

> **Camp:** St. Joseph's Cathedral Summer Camp · **Ages:** 8–18 · **Type:** Day Camp
> **Dates:** July 6 – July 31 · **Hours:** 4:00 PM – 8:00 PM

---

## ✨ Features

- **Dashboard** — live stat cards, score & attendance charts, top groups, recent activity.
- **Camper Management** — full CRUD, search, filter, CSV import, CSV/Excel export, medical & emergency info.
- **Group Management** — colored teams, leaders, member assignment, per-group stats.
- **Attendance** — daily Present / Late / Excused / Absent tracking with history and reports.
- **Scoring** — award or deduct points with categories, reasons, and a complete audit ledger.
- **Rankings** — real-time leaderboard, podium, score gaps, historical snapshots.
- **Public Leaderboard** — read-only, auto-refreshing standings at `/leaderboard`.
- **Staff Directory** — accounts, roles, phone, assigned groups (admin only).
- **Reports** — export campers, scores, rankings, and attendance as CSV or Excel.
- **Role-Based Access** — Admin vs. Staff permissions, protected routes, audit logging.
- **Polish** — dark mode, responsive/mobile-friendly, toasts, loading states, confirmations.

## 🧱 Tech Stack

| Layer       | Technology                                          |
| ----------- | --------------------------------------------------- |
| Framework   | Next.js 15 (App Router) + React 19 + TypeScript     |
| Styling     | Tailwind CSS + shadcn/ui (Radix UI)                 |
| Auth        | Auth.js (NextAuth v5) — credentials + bcrypt, JWT   |
| Database    | PostgreSQL + Prisma ORM                             |
| Validation  | Zod                                                 |
| Charts      | Recharts                                            |
| Exports     | Native CSV + ExcelJS (`.xlsx`)                      |
| Deployment  | Vercel                                              |

## 🔐 Roles

| Capability                          | Admin | Scorer | Staff |
| ----------------------------------- | :---: | :----: | :---: |
| View dashboard & rankings           |  ✅   |   ✅   |  ✅   |
| Award / deduct points (any group)   |  ✅   |   ✅   |  ❌   |
| Record attendance (own group)       |  ✅   |   ❌   |  ✅   |
| Create/edit/delete campers          |  ✅   |   ❌   |  ❌   |
| Create/edit/delete groups & leaders |  ✅   |   ❌   |  ❌   |
| Manage scoring categories           |  ✅   |   ❌   |  ❌   |
| Revert score entries                |  ✅   |   ❌   |  ❌   |
| Manage staff accounts               |  ✅   |   ❌   |  ❌   |
| Export reports (CSV/Excel)          |  ✅   |   ❌   |  ❌   |
| Public leaderboard (`/leaderboard`) | Public — no login required |

> **Scorer** is a dedicated scoring role (e.g. judges): they can award/deduct
> points for any group but cannot manage campers, groups, attendance, or staff.
> **Staff** are group leaders: they record attendance for the group(s) they lead.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create your env file and fill in values (see .env.example)
cp .env.example .env

# 3. (Optional) start a local Postgres with Docker
docker compose up -d

# 4. Create the database schema
npm run db:push        # or: npm run db:migrate

# 5. Seed demo data (admin, staff, groups, campers, scores, attendance)
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

### Default demo credentials (from the seed)

| Role  | Email                                 | Password      |
| ----- | ------------------------------------- | ------------- |
| Admin | `admin@stjosephscamp.org`             | `ChangeMe123!`|
| Staff | `sarah.mitchell@stjosephscamp.org`    | `Staff123!`   |

> ⚠️ Change these immediately in any real deployment. The admin credentials are
> configurable via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

See **[INSTALLATION.md](INSTALLATION.md)** for detailed setup and
**[DEPLOYMENT.md](DEPLOYMENT.md)** for deploying to Vercel.

## 📂 Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # Database schema (models, enums, indexes)
│   └── seed.ts                # Demo data seeder
├── public/
│   └── templates/             # Sample CSV for camper import
├── src/
│   ├── auth.ts                # NextAuth instance (credentials + bcrypt)
│   ├── middleware.ts          # Route protection (must live in src/ with app/)
│   ├── app/
│   │   ├── (dashboard)/       # Authenticated app (layout + pages)
│   │   │   ├── dashboard/     # Stats, charts, recent activity
│   │   │   ├── campers/       # Camper management
│   │   │   ├── groups/        # Group management + [id] detail
│   │   │   ├── attendance/    # Daily attendance
│   │   │   ├── scoring/       # Points + history
│   │   │   ├── rankings/      # Internal leaderboard
│   │   │   ├── staff/         # Staff directory (admin)
│   │   │   └── reports/       # Export center
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth route
│   │   │   ├── leaderboard/   # Public live rankings feed
│   │   │   ├── export/        # CSV/Excel report routes
│   │   │   ├── health/        # Health check
│   │   │   └── cron/          # Ranking snapshot (Vercel Cron)
│   │   ├── leaderboard/       # Public read-only leaderboard
│   │   ├── login/             # Sign-in page
│   │   └── page.tsx           # Landing page
│   ├── components/            # UI (shadcn) + feature components
│   ├── lib/                   # prisma, validations, rankings, export, utils…
│   ├── server/actions/        # Server Actions (campers, groups, …)
│   └── types/                 # Type augmentation (next-auth)
├── .env.example
├── docker-compose.yml
└── vercel.json
```

## 🗄️ Database Models

`User` · `Group` · `Camper` · `Attendance` · `AttendanceRecord` · `ScoreEntry`
· `RankingHistory` · `ActivityLog`, plus enums `Role`, `Gender`,
`AttendanceStatus`. Relationships and indexes are defined in
[`prisma/schema.prisma`](prisma/schema.prisma).

## 📜 Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server                         |
| `npm run build`     | `prisma generate` + production build         |
| `npm run start`     | Start the production server                  |
| `npm run lint`      | Run ESLint                                   |
| `npm run db:push`   | Push the schema to the database (no migration) |
| `npm run db:migrate`| Create & apply a dev migration               |
| `npm run db:deploy` | Apply migrations in production               |
| `npm run db:seed`   | Seed demo data                               |
| `npm run db:studio` | Open Prisma Studio                           |
| `npm run db:reset`  | Reset the database and re-seed               |

## 🛡️ Security

- Passwords hashed with **bcrypt** (cost 12).
- **Protected routes** via middleware + per-action role checks.
- **Input validation** with Zod on every server action and API route.
- **CSRF** handled by Auth.js + Server Actions (same-origin POST).
- **Rate limiting** on login (in-memory; swap for Upstash Redis at scale).
- **Audit logging** of every mutating action to `ActivityLog`.
- Security headers configured in [`next.config.mjs`](next.config.mjs).

## 📤 Reports & Exports

Every report is available as CSV or `.xlsx`:

- `/api/export/campers`
- `/api/export/scores`
- `/api/export/rankings`
- `/api/export/attendance`

Add `?format=csv` or `?format=xlsx`. The Reports page links to all of them.

## 📝 License

MIT — see [LICENSE](LICENSE).
