# Deployment Guide

ReadLedger runs as a Docker container on a Hetzner VPS (the `infra-setup`
platform, app name `readledger`), with PostgreSQL behind PgBouncer on the same
server. Cloudflare sits in front of `readledger.app`.

It moved off Vercel + Supabase on 2026-10-01; see `docs/vps-migration-plan.md`
for the history and the post-cutover checklist.

---

## How a deploy works

Pushing to `master` deploys (`.github/workflows/deploy.yml`):

1. **Unit tests** run (`pnpm test:run`).
2. **The image is built** from `Dockerfile` (Next.js standalone output, non-root,
   `TZ=UTC`) and pushed to `ghcr.io/hugoogb/readledger` tagged with the commit SHA
   and `latest`.
3. **CI joins the tailnet** as `tag:ci` and connects to the VPS over Tailscale
   SSH (no SSH key).
4. On the server, in `/srv/apps/readledger`:
   - `docker compose pull`
   - **migrations** run first via the image's `/migrate` CLI
     (`prisma migrate deploy` against `DIRECT_URL`; PgBouncer's transaction
     pooling can't run them)
   - `docker compose up -d --wait` starts the new container and waits for
     `GET /health` (which checks Postgres)
5. CI checks `https://readledger.app/health` through Cloudflare.

Deploys never run in parallel and are never cancelled mid-way.

Work happens on `develop`; merge to `master` to ship.

### Rolling back

Run the **deploy** workflow manually (`workflow_dispatch`) with `tag` set to the
commit SHA of an image that already exists. It skips the build and redeploys
that image. Migrations are not reversed, so roll back only to a version whose
code works with the current schema.

### Repository secrets

| Secret | Purpose |
|--------|---------|
| `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_SECRET` | Join the tailnet as `tag:ci` |
| `VPS_HOST` | The server's tailnet IP (`100.x.y.z`) |

---

## Environment variables

They live in `/srv/apps/readledger/.env` on the server; `new-app.sh` from
`infra-setup` generates the database URLs. See `.env.example` for local
development.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Runtime queries, through PgBouncer (transaction pooling) |
| `DIRECT_URL` | Direct Postgres connection, used by migrations |
| `AUTH_SECRET` | HMAC key for login codes, at least 32 characters (`openssl rand -base64 48`) |
| `BREVO_API_KEY` | Brevo transactional email API key for login codes |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | Sender, e.g. `hello@readledger.app` / `ReadLedger` |

There are no `NEXT_PUBLIC_` variables: nothing is exposed to the browser.

---

## DNS and edge

- `readledger.app` uses Cloudflare nameservers; app DNS records come from the
  `infra-setup` platform scripts, not hand-made in Cloudflare.
- `www` → apex is a Cloudflare Redirect Rule (308), not app code.
- The origin only admits Cloudflare, which sets `CF-Connecting-IP`; the app uses
  it for rate limiting (`actions/auth.ts`).

---

## Verify a deploy

1. `https://readledger.app/health` returns 200.
2. Sign in with an email code (check Brevo if no email arrives).
3. The dashboard, a series page and Statistics load.
4. MangaDex search works when adding a series.
5. Response headers include `Content-Security-Policy` and
   `Strict-Transport-Security` (set in `proxy.ts`).

---

## Local development

```bash
cp .env.example .env   # fill in DATABASE_URL / DIRECT_URL / AUTH_SECRET
pnpm install
pnpm db:migrate:deploy
pnpm dev
```

Without `BREVO_API_KEY`, login codes are printed to the server log.

---

## Troubleshooting

### The container never turns healthy

`/health` checks Postgres, so look at the database first
(`docker compose logs readledger`). The image listens on `::` (dual-stack)
because Alpine resolves `localhost` to `::1`; don't change `HOSTNAME`.

### `prisma generate` fails during the build

`prisma.config.ts` requires `DIRECT_URL` to be set even though `generate` never
connects; the Dockerfile and CI pass a placeholder.

### Large imports fail

Imports are capped at 5 MB / 10,000 rows (`lib/import.ts`). The Server Action
body limit in `next.config.ts` (`serverActions.bodySizeLimit`) must stay above
that cap.
