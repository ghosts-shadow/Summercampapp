# Deployment Guide (Vercel)

This app is built to deploy on **Vercel** with a hosted PostgreSQL database.

## 1. Provision a PostgreSQL database

Use any managed Postgres. Popular free options:

- **Neon** — <https://neon.tech>
- **Supabase** — <https://supabase.com>
- **Vercel Postgres** — from the Vercel dashboard → Storage

Copy two connection strings:

- **Pooled** connection → `DATABASE_URL` (used at runtime by serverless functions)
- **Direct** (non-pooled) connection → `DIRECT_URL` (used for migrations)

> If your provider exposes only one URL, use it for both. With Neon, append
> `?sslmode=require` and use the `-pooler` host for `DATABASE_URL`.

## 2. Push your code to GitHub/GitLab/Bitbucket

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 3. Import the project into Vercel

1. Go to <https://vercel.com/new> and import your repository.
2. Framework preset: **Next.js** (auto-detected).
3. Build command is already configured (`prisma generate && next build` via
   `vercel.json` / `package.json`). No change needed.

## 4. Set environment variables in Vercel

Project → **Settings → Environment Variables**:

| Variable             | Value                                                |
| -------------------- | ---------------------------------------------------- |
| `DATABASE_URL`       | Pooled Postgres connection string                    |
| `DIRECT_URL`         | Direct (non-pooled) Postgres connection string       |
| `AUTH_SECRET`        | `openssl rand -base64 32`                            |
| `AUTH_TRUST_HOST`    | `true`                                               |
| `NEXTAUTH_URL`       | Your production URL (e.g. `https://your-app.vercel.app`) |
| `SEED_ADMIN_EMAIL`   | Admin email for seeding                              |
| `SEED_ADMIN_PASSWORD`| Strong admin password                               |
| `SEED_ADMIN_NAME`    | Admin display name                                   |
| `CRON_SECRET`        | (optional) random string to enable ranking snapshots |

Set them for **Production** (and Preview/Development as needed).

## 5. Apply the database schema

After the first deploy, run migrations against your production database.

**From your machine** (with production `DATABASE_URL`/`DIRECT_URL` in your shell):

```bash
# Option A: versioned migrations (recommended)
npx prisma migrate deploy

# Option B: schema push (no migration history)
npx prisma db push
```

Then optionally seed an admin + demo data:

```bash
npm run db:seed
```

> **Tip:** Generate a migration locally first (`npm run db:migrate`), commit the
> `prisma/migrations` folder, and `prisma migrate deploy` will apply it.
> You can also add `prisma migrate deploy` to the build command if you prefer
> automatic migrations on every deploy.

## 6. Redeploy & verify

- Visit `https://your-app.vercel.app` → landing page.
- `https://your-app.vercel.app/login` → sign in with your seeded admin.
- `https://your-app.vercel.app/leaderboard` → public live leaderboard.
- `https://your-app.vercel.app/api/health` → `{ "status": "ok" }`.

## 7. (Optional) Scheduled ranking snapshots

To capture daily standings into `RankingHistory`, set `CRON_SECRET` and add a
cron to `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 20 * * *" }]
}
```

Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET`. The
endpoint is disabled unless `CRON_SECRET` is set.

## Production checklist

- [ ] `AUTH_SECRET` is a strong, unique value.
- [ ] Admin password changed from the demo default.
- [ ] `DATABASE_URL` uses the **pooled** connection; `DIRECT_URL` the direct one.
- [ ] `NEXTAUTH_URL` matches your real domain.
- [ ] Migrations applied (`prisma migrate deploy`).
- [ ] For multi-instance scale, replace the in-memory rate limiter in
      `src/lib/rate-limit.ts` with Upstash Redis (`@upstash/ratelimit`).

## Scaling notes

- **Connection pooling:** serverless functions open many short-lived
  connections. Always point `DATABASE_URL` at a pooler (PgBouncer / Neon
  pooler / Supabase pooler) and keep `DIRECT_URL` for migrations.
- **Rate limiting:** the bundled limiter is in-memory (per instance). For
  horizontal scale, switch to a shared store — the call sites don't change.
- **Real-time:** the public leaderboard polls `/api/leaderboard` every 10s.
  Swap for SSE/WebSockets if you need sub-second updates.
