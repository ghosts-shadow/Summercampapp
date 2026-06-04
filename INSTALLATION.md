# Installation Guide

This guide walks you through running the Summer Camp Management System locally.

## Prerequisites

- **Node.js 18.18+** (or 20+) and npm — <https://nodejs.org>
- A **PostgreSQL 14+** database (choose one option below)
- Git

Verify Node:

```bash
node --version   # v18.18+ or v20+
npm --version
```

---

## 1. Get the code & install dependencies

```bash
cd summercamp
npm install
```

> If you hit a peer-dependency error from npm, retry with
> `npm install --legacy-peer-deps`.

This also runs `prisma generate` automatically (via the `postinstall` script).

## 2. Provision a PostgreSQL database

Pick **one**:

### Option A — Docker (easiest local option)

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` with database `summercamp`
(user `postgres`, password `postgres`).

### Option B — Local PostgreSQL install

Create a database and note your connection string:

```bash
createdb summercamp
# connection string:
# postgresql://USER:PASSWORD@localhost:5432/summercamp?schema=public
```

### Option C — Hosted (Neon / Supabase / Vercel Postgres)

Create a free database and copy its connection string. Use the **pooled**
string for `DATABASE_URL` and the **direct** string for `DIRECT_URL`.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/summercamp?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/summercamp?schema=public"

# Generate a secret:  openssl rand -base64 32
AUTH_SECRET="paste-a-long-random-string-here"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

SEED_ADMIN_EMAIL="admin@stjosephscamp.org"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_ADMIN_NAME="Camp Administrator"
```

> No OpenSSL? Generate a secret with Node:
> `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

> **Note:** If your provider doesn't have a separate pooled/direct URL, set
> `DIRECT_URL` to the same value as `DATABASE_URL`.

## 4. Create the schema

For a quick local start (no migration history):

```bash
npm run db:push
```

Or, to create a versioned migration:

```bash
npm run db:migrate    # prompts for a migration name
```

## 5. Seed demo data

```bash
npm run db:seed
```

This creates 1 admin, 6 staff, 6 groups, ~60 campers, a scoring ledger,
two weeks of attendance, and an initial ranking snapshot.

## 6. Run the app

```bash
npm run dev
```

Open <http://localhost:3000> and sign in:

- **Admin:** `admin@stjosephscamp.org` / `ChangeMe123!`
- **Staff:** `sarah.mitchell@stjosephscamp.org` / `Staff123!`

The public leaderboard is at <http://localhost:3000/leaderboard>.

---

## Useful commands

```bash
npm run db:studio   # browse data in Prisma Studio
npm run db:reset    # drop, recreate, and re-seed (destructive)
npm run lint        # lint the project
npm run build       # production build
```

## Importing campers (CSV)

On the **Campers** page (admin), click **Import** and upload a CSV. A sample
file is provided at [`public/templates/campers-sample.csv`](public/templates/campers-sample.csv).
Expected header:

```
firstName,lastName,age,gender,guardianName,guardianPhone,emergencyContact,medicalNotes,group
```

`group` is matched to an existing group name; unknown or blank groups leave the
camper unassigned. `gender` accepts `MALE`, `FEMALE`, `OTHER`, or blank.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Environment variable not found: DIRECT_URL` | Add `DIRECT_URL` to `.env` (same value as `DATABASE_URL` if you don't use pooling). |
| `Can't reach database server` | Ensure Postgres is running and the URL/port are correct. |
| `AUTH_SECRET` / `MissingSecret` error | Set `AUTH_SECRET` in `.env`. |
| Prisma Client out of date after schema change | Run `npm run db:generate`. |
| Login always fails | Re-run `npm run db:seed`, and confirm the email/password. |
| npm peer-dependency conflict | `npm install --legacy-peer-deps`. |
