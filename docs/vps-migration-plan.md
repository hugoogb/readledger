# ReadLedger: Supabase → VPS migration + email-OTP auth

Status: **draft plan** · Author: Hugo · Date: 2026-09-30

## 0. TL;DR

- **Move the whole app** (Next.js + Postgres) to the VPS, not just the backend. With server actions + Prisma, "the backend" *is* the Next.js server — splitting it means exposing Postgres to the internet and paying a network round-trip per query.
- **Replace Supabase Auth with a custom email-OTP implementation** (two new tables, no auth library). One login flow for everyone: enter email → receive 6-digit code → in. Register and login pages merge.
- **Data migration is a plain `pg_dump`/`pg_restore` of the `public` schema** (small dataset → a 15–30 min maintenance window is enough, no replication needed). User IDs stay identical, so no data needs remapping.
- **No passwords are migrated.** Existing users sign in by email code and land on their existing account.
- All users will be logged out once at cutover. Tell them beforehand.

---

## 1. What the app uses today (audit)

| Area | Current | Notes |
|---|---|---|
| Hosting | Vercel (`readledger.app`) | `@vercel/analytics` in `app/layout.tsx`, CSP allows `va.vercel-scripts.com` |
| Database | Supabase Postgres via Prisma 7 + `@prisma/adapter-pg` | Runtime **and** migrations use `DIRECT_URL` (session pooler). `DATABASE_URL` is unused |
| Schema | 5 tables: `users`, `series`, `volumes`, `publishers`, `user_stores` + `_prisma_migrations` | 3 Prisma migrations, no triggers/functions/RLS in them |
| Auth | Supabase email + password (`@supabase/ssr`) | `actions/auth.ts`, `lib/supabase/{server,middleware,client}.ts`, `lib/auth.ts`, `proxy.ts`, `app/login`, `app/register` |
| User link | `public.users.id` = `auth.users.id` (UUID as TEXT) | Row created lazily in `getCurrentUser()`, copying `user_metadata.name` |
| Storage/Realtime/Edge fns | **Not used** | Covers are MangaDex URLs |
| Rate limiting | In-memory (`lib/rate-limit.ts`) | Barely works on serverless; works properly on a single VPS process |
| Dead code | `lib/supabase/client.ts` | Not imported anywhere |

**Blast radius of the auth swap:** `actions/auth.ts`, `lib/auth.ts`, `lib/supabase/*`, `proxy.ts`, `app/login/page.tsx`, `app/register/page.tsx`, `lib/validations.ts` (auth schemas), `prisma/schema.prisma`. The 10 files that call `requireUser()`/`getCurrentUser()` stay unchanged because the function signatures are kept.

### RLS

RLS is **enabled** on the Supabase tables (confirmed). The `public` schema is not exposed through the anon key.

The `ENABLE ROW LEVEL SECURITY` flags will come across in the dump. On the VPS they're harmless, because the app role owns the tables and so bypasses RLS. Any Supabase policies that reference `auth.uid()` would fail to restore, so strip those (see §5.2).

---

## 2. Decision: whole app vs backend only

| | **Whole app on VPS (recommended)** | Backend only (Vercel + DB/auth on VPS) |
|---|---|---|
| DB exposure | Postgres on a private Docker network, never public | Postgres must be public (Vercel has no static IPs on Hobby, so you can't allowlist) |
| Latency | App↔DB over localhost (<1 ms) | Every query crosses the internet; dashboard pages do several |
| Connections | One long-lived `pg` pool | Serverless connection storms → need PgBouncer |
| Rate limiting / OTP throttling | In-memory limiter actually works | Needs Redis/DB store |
| Email sending | Can fire-and-forget (not awaiting the send avoids timing leaks) | Needs `waitUntil` |
| Cost | One VPS (~€5–8/mo) | VPS + Vercel |
| You lose | Preview deploys, global edge CDN, zero-ops | — |

The things you lose are small for this app. Users are mostly in one region (EUR, Spanish stores), and you can put Cloudflare in front later if you want a CDN.

---

## 3. Target architecture

```
                   ┌──────────────── existing Hetzner VPS (already running other apps) ─┐
 users ──HTTPS──▶  │  existing reverse proxy  ──▶  readledger app (Next.js standalone)  │
                   │                                     │  Prisma / pg pool             │
                   │                                     ▼                               │
                   │                     postgres (readledger DB, not exposed publicly)  │
                   │  backup cron: pg_dump ─▶ offsite                                    │
                   └────────────────────────────────────────────────────────────────────┘
 app ──HTTPS──▶ Brevo transactional API ──▶ user inbox
```

The VPS is already set up and hosting other apps, so ReadLedger plugs into what's there:
- **Reverse proxy:** add a `readledger.app` route to the existing one. The app only needs to be reachable on an internal port or Docker network.
- **Postgres:** give ReadLedger its own container, or its own database + role on an existing instance. Either way it gets a dedicated role that owns only its DB, and is not exposed publicly.
- **Backups:** add the ReadLedger DB to the existing backup routine if there is one. If not, add a nightly `pg_dump -Fc` → offsite.

- **Deploy:** GitHub Actions builds the Docker image (a Next build is too memory-hungry for a small VPS) → pushes to GHCR → SSHes in and runs `docker compose pull && docker compose up -d`. A one-off `migrate` service runs `prisma migrate deploy` before `app` starts.
  - If you'd rather have a UI and preview environments, Dokploy or Coolify give you that on the same VPS. It's optional.
- **Postgres major:** match or exceed Supabase's (check with `select version();`, likely 15 or 17). Use a `pg_dump` client ≥ the server version.
- **TZ=UTC** everywhere (container + Postgres). Columns are `timestamp(3)` *without* time zone, so the values are only correct if every writer uses UTC.

---

## 4. New auth design (custom email OTP)

Decided: **custom implementation**, no auth library. The auth surface is one method (an email code), and a custom version fits the existing schema without changes to `users`.

### Flow (mobile-first)
1. `/login` step 1: email field only → `sendOtp(email)`. The response is **always** the same, "If that address is valid, we sent a code", whether or not the account exists (prevents account enumeration).
2. Step 2 on the same page: one input with `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength=6`, `pattern="\d{6}"`. It auto-submits on the 6th digit and accepts a pasted code. There's also a "Resend" button (30 s cooldown) and "Use a different email". The email is kept in client state and sent as a hidden field.
3. `verifyOtp(email, code)` → session cookie → `/dashboard`.
4. If the email has no account yet, one is created with `name = null` (the UI already shows "Anonymous"). The app then shows a one-time "What should we call you?" prompt (skippable), and the name is editable in **Settings**.
5. `/register` redirects to `/login`, so old links keep working.

Email via Brevo: subject **"123456 is your ReadLedger code"** (so the code is visible in the phone notification and iOS Mail autofill picks it up). It has plain-text + HTML parts, says the code expires in 10 minutes, and ends with "didn't request this? ignore it".

### Schema (one migration, `prisma migrate dev --create-only`, then hand-edited)

`users` needs **no structural change**. Existing `id`s stay, and so does the nullable `name`. The only data fix is normalising emails.

```prisma
model OtpCode {
  id         String    @id @default(uuid())
  email      String                       // lower-cased
  codeHash   String                       // HMAC-SHA256(AUTH_SECRET, email + ":" + code), hex
  attempts   Int       @default(0)
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  @@index([email, createdAt])
  @@map("otp_codes")
}

model Session {
  id         String   @id @default(uuid())
  tokenHash  String   @unique              // SHA-256 of the cookie token, hex
  userId     String
  expiresAt  DateTime
  lastSeenAt DateTime @default(now())
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}
// User gets: sessions Session[]
```

Backfill SQL, appended to the same migration (safe to run on any environment):
```sql
UPDATE users SET email = lower(trim(email)) WHERE email <> lower(trim(email));
```

### Security rules (the parts that must be exactly right)
| Concern | Rule |
|---|---|
| Code generation | `crypto.randomInt(0, 1_000_000)`, zero-padded to 6 digits. Never `Math.random` |
| Code storage | Store only an HMAC of the code, with `AUTH_SECRET` as the key and bound to the email, so a DB leak exposes no live codes |
| One live code per email | `sendOtp` deletes that email's unconsumed codes and inserts the new one in a single transaction |
| Expiry | 10 minutes |
| Attempt limit | Checked and incremented in **one statement**: `UPDATE otp_codes SET attempts = attempts + 1 WHERE email = $1 AND "consumedAt" IS NULL AND "expiresAt" > now() AND attempts < 5 RETURNING id, "codeHash"`. No row returned → reject. Reading then incrementing would let parallel guesses slip past the limit |
| Comparison | `crypto.timingSafeEqual` on the HMACs |
| Single use | `UPDATE … SET "consumedAt" = now() WHERE id = $1 AND "consumedAt" IS NULL`. Require exactly 1 row updated, so two concurrent correct submissions can't both create sessions |
| Send throttling | Per email: 30 s cooldown and at most 5 codes per hour, counted in `otp_codes` so the limit survives restarts. Per IP: 20 per hour via the existing in-memory `lib/rate-limit.ts` |
| Client IP | Read it only from the header the VPS reverse proxy **overwrites** (e.g. `X-Real-IP`). Never trust the left-most `X-Forwarded-For` value, because the client controls it |
| Enumeration / timing | Same response every time. Brevo is called *without awaiting* (fine on a long-lived Node process), and failures are logged |
| Session token | `crypto.randomBytes(32)` as base64url in the cookie. Only its SHA-256 goes in the DB |
| Cookie | `__Host-rl_session` in production (`rl_session` in dev), with `HttpOnly; Secure; SameSite=Lax; Path=/`, max-age 60 days |
| Sliding expiry | When `lastSeenAt` is more than 1 day old, extend `expiresAt` to now + 60 days and re-set the cookie's max-age |
| CSRF | Next.js server actions compare `Origin` with `Host`, so the reverse proxy must forward `Host` / `X-Forwarded-Host` correctly |
| Cleanup | `sendOtp` opportunistically deletes expired codes and sessions (no cron needed) |
| Sign out | Delete the session row and clear the cookie. "Sign out everywhere" (delete all sessions for the user) is a cheap later addition |

### Where session checks happen
- **`proxy.ts`** (Next 16 proxy runs in the Node runtime, so Prisma is usable there; confirm during implementation): one indexed lookup by `tokenHash`. It:
  - redirects unauthenticated requests away from `/dashboard`;
  - redirects authenticated ones away from `/`, `/login`, `/register`;
  - **clears the cookie when the session is invalid**, so a stale cookie can't cause a redirect loop between `/login` and `/dashboard`;
  - applies the sliding refresh;
  - keeps the existing security headers.
- **`getCurrentUser()`** validates again (defence in depth, since server actions must never rely on the proxy alone) and is wrapped in React `cache()` so one render does one lookup.
- **Speed-up:** today every request makes a network call to Supabase (`auth.getUser()`). After the swap it's a local-DB lookup.

### Files
| File | Change |
|---|---|
| `prisma/schema.prisma` + new migration | `OtpCode`, `Session`, `User.sessions`, email backfill |
| `lib/auth/otp.ts` (new) | generate, hash, `issueOtp`, `verifyOtp` (atomic attempts + consume) |
| `lib/auth/session.ts` (new) | `createSession`, `validateSession`, `revokeSession`, cookie helpers, sliding refresh |
| `lib/auth.ts` | `getCurrentUser`/`requireUser` read the session cookie. Same signatures, so the 10 callers don't change. Lazy-create branch removed |
| `lib/email.ts` (new) | Brevo `fetch` client + OTP template |
| `actions/auth.ts` | `sendOtp`, `verifyOtp`, `signOut` |
| `proxy.ts` | session validation/redirects as above; CSP drops `*.supabase.co` and `va.vercel-scripts.com` |
| `app/login/page.tsx` | two-step form, using the `Button` loading prop |
| `app/register/page.tsx` | redirect to `/login` |
| `app/dashboard/settings/page.tsx`, `actions/user-settings.ts`, dashboard layout | name field in Settings; first-login name prompt |
| `lib/validations.ts` | `emailSchema`, `otpSchema` (replace sign-up/sign-in schemas) |
| `app/layout.tsx`, `package.json` | remove `@vercel/analytics`, `@supabase/ssr`, `@supabase/supabase-js` |
| `lib/supabase/*` | delete |
| `__tests__/lib/auth/*` (new) | OTP hash/verify, attempt limit, expiry, single use, session validate/expire/slide |
| `.env.example`, `README.md`, `DEPLOYMENT.md` | new env vars, remove Supabase |

New env vars:
- `AUTH_SECRET` (32+ random bytes, the HMAC key)
- `BREVO_API_KEY`
- `EMAIL_FROM` (e.g. `ReadLedger <hello@readledger.app>`)
- `DATABASE_URL`: the only DB URL left. `DIRECT_URL` is removed from `lib/prisma.ts` and `prisma.config.ts`.

### Hosting-related code changes (details deferred to the deploy discussion)
- `next.config.ts`: `output: "standalone"`. Add a Dockerfile and a compose service matching the other apps on the VPS, deployed via GitHub Actions.
- `TZ=UTC`, a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, and a volume for `.next/cache`.

### Email provider: Brevo
- **Free plan:** 300 emails/day. Check that against your real login volume.
- **Sending:** use the transactional HTTP API (`POST https://api.brevo.com/v3/smtp/email`, `api-key` header) through a plain `fetch` in `lib/email.ts`, so no SDK is needed. Their SMTP relay would also work, but the API is simpler and gives clearer errors.
- **Domain:** authenticate `readledger.app` in Brevo with its DKIM record and verification code, plus SPF and a DMARC record (`p=none` to start). Send from something like `ReadLedger <hello@readledger.app>`.
- **Before the migration:** confirm the Brevo account has transactional sending activated.
- **Don't self-host SMTP.** VPS IPs have poor sending reputation.

---

## 5. Data migration

### 5.1 Pre-flight checks (read-only, run against Supabase)

```sql
select version();

-- row counts: save the output, it's the post-migration checksum
select 'users' t, count(*) from public.users union all
select 'series', count(*) from public.series union all
select 'volumes', count(*) from public.volumes union all
select 'publishers', count(*) from public.publishers union all
select 'user_stores', count(*) from public.user_stores;

-- emails that would collide after lower-casing (must be 0)
select lower(email), count(*) from public.users group by 1 having count(*) > 1;

-- app users whose email drifted from their auth record (should be 0; no email-change UI exists)
select p.id, p.email, a.email from public.users p
join auth.users a on a.id::text = p.id where lower(a.email) <> lower(p.email);

-- auth users that never got an app row (no data → they'll just be created fresh on first OTP login)
select count(*) from auth.users a left join public.users p on p.id = a.id::text where p.id is null;

-- anything non-Prisma living in public?
select * from pg_policies where schemaname = 'public';
select tgname, tgrelid::regclass from pg_trigger where not tgisinternal
  and tgrelid::regclass::text in ('users','series','volumes','publishers','user_stores');
```

Also run `pnpm prisma migrate status` and
`pnpm prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script`
to detect **schema drift**. The duplicate indexes (`idx_series_userid` alongside `series_userId_idx`) suggest some SQL was once run by hand.

### 5.2 Method
Dump the `public` schema **including `_prisma_migrations`**, so the VPS DB knows the 3 existing migrations are applied. `prisma migrate deploy` will then apply only the new auth migration (with its backfill).

```bash
# from your machine (pg_dump version >= Supabase server version)
pg_dump "$SUPABASE_DIRECT_URL" --schema=public --no-owner --no-privileges -Fc -f readledger-$(date +%F-%H%M).dump

# on the VPS (via SSH tunnel to the postgres container)
psql "$VPS_DB" -c 'drop schema public cascade; create schema public;'
pg_restore --no-owner --no-privileges --schema=public -d "$VPS_DB" readledger-*.dump
docker compose run --rm migrate        # prisma migrate deploy → applies the auth migration only
```

`--no-privileges` strips Supabase's `anon`/`authenticated`/`service_role` grants, since those roles don't exist on the VPS. If you enabled RLS in §1, that also gets restored. That's harmless, because the app role owns the tables, but you can `disable row level security` afterwards for clarity.

### 5.3 Verification (after restore + migrate)
- Row counts match §5.1 exactly.
- Spot checks per user: `select "userId", count(*), sum("pricePaid") from volumes v join series s on s.id = v."seriesId" group by 1;` should match on both sides (diff the two outputs).
- `select count(*) from users where email <> lower(email)` → 0.
- `prisma migrate status` → up to date.
- Log in as **your own account** via OTP → same series/volumes/stats as on production.

---

## 6. Execution phases

### Phase A: Prep (no user impact)
The VPS is already running, so this phase is just the ReadLedger-specific pieces:
1. Create the ReadLedger Postgres DB and role, and add the reverse-proxy route (initially only for `staging.readledger.app`).
2. Set up Brevo and the domain DNS (DKIM/SPF/DMARC). Send test mails to Gmail, Outlook and iCloud and check they don't land in spam.
3. Add the ReadLedger DB to backups. **Do one test restore.**
4. Add uptime monitoring for `readledger.app`, if it isn't already covered.

### Phase B: Build (feature branch off `develop`)
1. Auth swap (§4) + migration with backfill.
2. Docker / compose / CI pipeline (deferred, to be designed separately).
3. Remove Vercel Analytics, update the CSP, update env handling.
4. Run it locally against a **copy of prod data** (dump → local Docker Postgres) with the full test suite plus a manual mobile run-through (iOS Safari code autofill, Android).

### Phase C: Rehearsal on `staging.readledger.app` (VPS)
1. Run the full §5 procedure end-to-end with a fresh prod dump. **Time it**, since that's your maintenance-window estimate.
2. Log in with your account, create/edit/delete data, test import/export, test MangaDex search/covers (`next/image` on the VPS).
3. Test abuse paths: wrong code ×6, expired code, resend spam, two tabs racing.
4. Write down every command you ran; that becomes the cutover runbook.

### Phase D: Announce (≥ 3–5 days before)
- Email all users (`select email from public.users`): the date and time window, "passwords are going away, you'll sign in with a code sent to this email", "your collection stays exactly as it is".
- Optional: a banner in the current app.
- **Lower the DNS TTL for `readledger.app` to 300 s at least 24–48 h before.**

### Phase E: Cutover (low-traffic hour; ~30 min)
1. **Freeze writes on the old app.** Set a `MAINTENANCE=1` env var on Vercel that makes `proxy.ts` return a 503 page, and redeploy. This matters: users on stale DNS will keep hitting Vercel after the switch, and nothing must write to Supabase after the final dump.
2. Final `pg_dump` (§5.2) → restore → `migrate deploy` → verification (§5.3).
3. Start the app on the VPS and log in via the `/etc/hosts` override or the staging hostname.
4. **Go/no-go checkpoint.** If anything is off, turn Vercel maintenance off and you're back to the old state with no data loss.
5. Point the `A`/`AAAA` records to the VPS. The existing reverse proxy has to serve a valid certificate immediately, because `.app` is HSTS-preloaded and browsers refuse plain HTTP. Either pre-issue the certificate with a DNS-01 challenge, or check how quickly your proxy obtains one via HTTP-01 once DNS points at it.
6. Smoke test on your phone over mobile data (a different resolver): login, dashboard, edit a volume.
7. Leave the Vercel deployment in maintenance mode (it now shows a "we've moved, refresh in a minute" page for stale-DNS clients).

### Phase F: After cutover
- **Day 0–2:** watch the logs, OTP email delivery/bounce stats, and error rates.
- **Day 1:** confirm the first nightly backup ran and was restored successfully to a scratch DB.
- **Day 7:** raise the DNS TTL back up.
- **Day 30:** take a final full Supabase dump (both `public` and `auth` schemas) for your archive, then **delete the Supabase project** and the Vercel project, and rotate/remove all Supabase credentials. Update the privacy policy if you have one (the processors change from Supabase/Vercel to your VPS host and email provider).

### Rollback policy
- **Before the DNS switch (E.4):** fully reversible. Turn Vercel maintenance off.
- **After the switch:** fix forward. Rolling back would mean reverse-migrating new writes *and* restoring the password flow, which isn't worth it for this app. That's why the rehearsal (Phase C) and the go/no-go checkpoint are mandatory.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| OTP emails land in spam → users locked out | Verified domain with SPF/DKIM/DMARC; test inboxes in Phase A; reputable provider; plain-text part |
| Someone once registered with another person's email (if Supabase confirmations were off) | With OTP the real mailbox owner gets that account. Acceptable, and arguably more correct |
| Writes to Supabase after the final dump | Maintenance mode on Vercel before the dump (E.1) |
| Schema drift between Supabase and the migrations | `migrate diff` in pre-flight; rehearsal catches the rest |
| VPS dies, no managed backups anymore | Offsite restic backups + a tested restore + provider snapshots |
| Single instance → a few seconds of downtime per deploy | Acceptable. Add `docker rollout` or blue/green later if needed |
| Timestamps shift | `TZ=UTC` in containers and Postgres; compare a few `createdAt` values before and after |
| OTP brute force | 6 digits, 5 attempts per code, hashed storage, 10 min expiry, DB-backed rate limit per IP + email |

---

## 8. Decisions

Decided:
- VPS: the existing Hetzner server (already set up)
- Email: **Brevo**
- Analytics: **dropped** for now
- RLS: already enabled on Supabase
- Auth: **custom email OTP** (§4)
- Deploy: Docker Compose + GitHub Actions (details deferred)

- Hosting scope: **whole app on the VPS**
- Name for new users: **optional prompt after first login**, editable any time in **Settings**

Nothing open.

## 9. Progress

- [x] **Auth swap** (branch `feature/otp-auth`): unit tests, plus end-to-end runs on Postgres 17 and on a local Postgres + PgBouncer (transaction mode) replica of the platform
- [x] **Containerised**: standalone image, `/health`, migrations via `/migrate`, deploy workflow; `vercel.json` disables Vercel git deploys
- [x] **VPS app created**: `new-app.sh readledger --host readledger.app --pages --no-caddy --no-dns`; `.env` has `AUTH_SECRET`, `EMAIL_FROM`, `TZ`
- [x] **Rehearsal on real data**: Supabase dump restored into the VPS DB (RLS policies, `ROW SECURITY` and `rls_auto_enable()` excluded from the TOC); counts and per-user aggregates identical; auth migration applied; container healthy (not yet routed)
- [x] Cloudflare zone `readledger.app` active, Vercel nameservers → Cloudflare. Temporary DNS-only apex A → Vercel (76.76.21.21) until cutover; `cf_add_record` replaces it in place
- [x] Origin certificate (CSR generated on the box, key never left it) → `/srv/edge/certs/readledger.app.{pem,key}`, valid to 2041
- [x] Platform scripts synced to the VPS (the box was behind infra-setup master). Caddy block for `readledger.app` added with `caddy_add_site`.
- [x] **www → apex is a Cloudflare Redirect Rule**, not app code. It lives in zone `readledger.app` → Rules → Redirect Rules → "www -> apex": `(http.host eq "www.readledger.app")` → `concat("https://readledger.app", http.request.uri.path)`, **308**, query string preserved. It only fires for a proxied `www` record, so `www` gets an A record via `cf_add_record` like any app host. That record never reaches the origin, which is why Caddy has no `www` block.
- [ ] Cloudflare token (account-owned, id 89f785d1…) Zone Resources += `readledger.app` (dashboard only; MCP cannot manage tokens)
- [ ] `www` proxied A record via `cf_add_record` (needs the token scope). This makes the redirect rule live.
- [x] Brevo: `readledger.app` authenticated (DKIM, brevo-code, SPF, DMARC); sender `ReadLedger <hello@readledger.app>` active
- [x] Brevo API key in `/srv/apps/readledger/.env`
- [x] **End-to-end on the VPS** (2026-10-01): real code emailed via Brevo from `hello@readledger.app` → received → logged into a migrated account with its data intact
- [ ] GitHub secrets `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `VPS_HOST` (= 100.118.87.75)
- [ ] Cutover (runbook below)

### Cutover runbook (≈15 min)
1. Caddy block for `readledger.app` (+ `www` redirect) with `header_up X-Real-IP {client_ip}`; validate and reload.
2. Freeze: pause the Vercel project.
3. Final dump (`pg_dump --schema=public -Fc`) → drop/recreate `public` in the VPS DB → `pg_restore -L` with the filtered TOC → `migrate deploy` → restart.
4. Verify: counts + per-user aggregates rounded to cents (`round(sum(...)::numeric, 2)`; raw float sums differ by summation order).
5. DNS: apex A → VPS, proxied; `www` proxied. Log in with a real emailed code.
6. Merge `feature/otp-auth` → `master` (CI deploy takes over).
7. Day 30: archive a final Supabase dump, delete the Supabase project, remove the domain from the Vercel project.

**Gotchas found during the rehearsal:**
- The platform's compose healthcheck probes `localhost`, which resolves to `::1` in Alpine. The image therefore sets `HOSTNAME=::`; with `0.0.0.0` the container never goes healthy.
- `pg_restore` must skip the `POLICY`, `ROW SECURITY`, `rls_auto_enable` and `SCHEMA public` entries.
