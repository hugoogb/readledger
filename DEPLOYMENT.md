# Deployment Guide

ReadLedger is designed for deployment on **Vercel** with a **Supabase** PostgreSQL database.

---

## Prerequisites

- [Vercel](https://vercel.com/) account
- [Supabase](https://supabase.com/) project (free tier works)

---

## 1. Supabase Setup

### Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Choose a region close to your Vercel deployment (e.g., `eu-central-1` for Europe)
3. Set a strong database password — you'll need it for the connection strings

### Get your credentials

From **Project Settings > API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

From **Project Settings > Database > Connection string**:
- **Session mode** (port 5432) → `DIRECT_URL`
- **Transaction mode** (port 6543) → `DATABASE_URL`

### Enable auth

Supabase Auth is used for email/password authentication. It works out of the box — no additional configuration needed beyond the environment variables above.

---

## 2. Environment Variables

Set these in your Vercel project settings (**Settings > Environment Variables**):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `DATABASE_URL` | PostgreSQL connection (transaction pooler, port 6543) | `postgresql://postgres.abc123:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL connection (session mode, port 5432) | `postgresql://postgres.abc123:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres` |

`NODE_ENV` is set automatically by Vercel (`production` for production deployments).

> **Note:** `NEXT_PUBLIC_` variables are exposed to the browser. The Supabase anon key is safe to expose — it only grants access governed by Row Level Security policies.

---

## 3. Deploy to Vercel

### Option A: Import from GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `hugoogb/readledger` repository
3. Vercel auto-detects Next.js — no framework configuration needed
4. Add the environment variables from the table above
5. Deploy

### Option B: Vercel CLI

```bash
pnpm i -g vercel
vercel
```

Follow the prompts to link your project and set environment variables.

### Build configuration

Vercel uses these defaults (no `vercel.json` needed):

- **Build command:** `pnpm build` (runs `prisma generate && next build`)
- **Output directory:** `.next`
- **Install command:** `pnpm install`
- **Node.js version:** 20.x

---

## 4. Database Migrations

After the first deployment, run migrations to create the database tables:

```bash
# Locally (with DIRECT_URL set in .env)
pnpm db:migrate:deploy
```

Or add it as a Vercel build step by updating the build command:

```
prisma migrate deploy && prisma generate && next build
```

---

## 5. Verify Deployment

After deploying, check:

1. **Homepage loads** — visit your Vercel URL
2. **Auth works** — register a new account, then log in
3. **Dashboard loads** — navigate to `/dashboard`
4. **MangaDex search** — try adding a series via search
5. **Security headers** — open DevTools > Network, check response headers for `Content-Security-Policy`, `Strict-Transport-Security`, etc.

---

## Custom Domain

1. In Vercel, go to **Settings > Domains**
2. Add your domain (e.g., `readledger.app`)
3. Configure DNS as instructed by Vercel
4. HTTPS is automatic

---

## Troubleshooting

### Build fails with `prisma generate` error

Ensure `@prisma/engines`, `esbuild`, and `prisma` are in the `pnpm.onlyBuiltDependencies` list in `package.json`. This is already configured.

### `/_global-error` prerender failure

This is a known Next.js 16 issue triggered by `NODE_ENV=development` during build. On Vercel, `NODE_ENV=production` is set automatically. For local builds, use:

```bash
NODE_ENV=production pnpm build
```

### Database connection errors

- Verify `DIRECT_URL` uses port **5432** (session mode, for migrations)
- Verify `DATABASE_URL` uses port **6543** with `?pgbouncer=true` (transaction pooler, for runtime queries)
- Check that the database password doesn't contain unescaped special characters

### Auth redirects not working

The `proxy.ts` middleware handles auth session refresh and route protection. Ensure:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
- The Supabase project has email auth enabled (default)
