# 0007. Auth and security

Status: accepted

### Current user is read-only and request-cached

Where: `lib/auth/index.ts` (`getCurrentUser`)

`getCurrentUser` is wrapped in React `cache` so layouts, pages and actions share one database lookup per request. It only reads the session cookie; the sliding refresh lives in `proxy.ts` because only there can cookies be set.

### OTP hashes are bound to the email

Where: `lib/auth/otp.ts` (`hashOtp`)

A login code is stored as an HMAC of `email:code` keyed with `AUTH_SECRET`, so a code is valid only for the address it was issued to and the database never holds a usable code.

### OTP issuing is serialised per email

Where: `lib/auth/otp.ts` (`issueOtp`)

Issuing takes a Postgres advisory transaction lock keyed on the email, so parallel requests for one address cannot slip past the cooldown and hourly limits or leave two live codes.

### OTP attempts are counted atomically and codes are single-use

Where: `lib/auth/otp.ts` (`consumeOtp`)

The attempt counter is incremented and the live code fetched in one UPDATE ... RETURNING, so parallel guesses cannot exceed `OTP_MAX_ATTEMPTS`. Timestamps are stored as UTC `timestamp without time zone`, hence the explicit `NOW() AT TIME ZONE 'UTC'`. The final `updateMany` on `consumedAt: null` stops two concurrent correct submissions from both succeeding.

### Session cookie uses the \_\_Host- prefix in production

Where: `lib/auth/session.ts` (`SESSION_COOKIE`)

The `__Host-` prefix requires Secure, Path=/ and no Domain, so sibling subdomains such as staging cannot set or overwrite the cookie. Browsers reject the prefix over plain http, so development uses the unprefixed name.

### Clearing the session cookie repeats its attributes

Where: `lib/auth/session.ts` (`clearedSessionCookieOptions`)

A `__Host-` cookie can only be overwritten by a Set-Cookie carrying the same Secure and Path attributes, so a bare delete-by-name is ignored by browsers in production. Logout expires the cookie with the full option set and `maxAge: 0`.

### Sliding session expiry is opt-in and the caller sets the cookie

Where: `lib/auth/session.ts` (`validateSession`)

With `refresh`, a session not seen for a day gets its expiry pushed out, and the caller must re-set the cookie with the returned `expiresAt`. Only code that can write cookies (`proxy.ts`) passes `refresh`.

### Login code leads the email subject

Where: `lib/email.ts` (`otpEmail`)

The code comes first in the subject line so it can be read from a phone notification without opening the email, which matters because ReadLedger is used mostly on phones.

### Security headers and CSP allowances

Where: `proxy.ts` (`securityHeaders`)

`camera=(self)` is allowed for the add modal's barcode scanner and stays blocked for embeds. The CSP allows `unsafe-eval` only outside production, because Next.js needs it for React Refresh in development. `img-src` is same-origin because covers are served through `/_next/image`, so a new cover host needs an `images.remotePatterns` entry rather than a CSP change.

### A failed session check does not log the user out

Where: `proxy.ts` (`resolveSession`)

When the session lookup throws because the database is unreachable, the proxy returns an `unknown` state and neither redirects nor clears the cookie. Pages call `requireUser()` and surface the error themselves, so an outage does not sign everyone out.

### The proxy looks up the session only on redirecting routes

Where: `proxy.ts` (`proxy`)

The session lookup is a database query, so the proxy runs it only for protected routes and the logged-out entry routes that redirect on auth state. Every other request skips it.

### Client IP comes from CF-Connecting-IP

Where: `actions/auth.ts` (`clientIp`)

The client IP used for OTP rate limiting is read from `CF-Connecting-IP`, because the VPS origin firewall admits only Cloudflare, which overwrites that header on every request, and the edge Caddy passes it through untouched. `X-Real-IP` is the fallback and `X-Forwarded-For` is never used, since its left-most entry is client-controlled and would let callers dodge the limit.

### OTP email is sent without awaiting

Where: `actions/auth.ts` (`sendOtp`)

The email send is not awaited so the response looks the same whether or not the address has an account and does not depend on the provider's latency. This is safe only because the app runs on a long-lived Node server, not serverless.

### Accounts are matched by email

Where: `actions/auth.ts` (`verifyOtp`)

Sign-in upserts the user by email, so accounts created before OTP sign-in are matched by address and new addresses get an account on first sign-in.

### Publisher and store ids are checked for ownership

Where: `services/ownership.ts` (`assertOwnedPublisher`, `assertOwnedStore`)

Publishers and stores are per-user, so ids from someone else are rejected before linking them to a series or volume. Otherwise a crafted id could link another user's row and leak its name.
