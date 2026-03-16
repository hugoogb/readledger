# Contributing to ReadLedger

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- **Node.js** 20+
- **pnpm** (package manager)
- **Supabase** account (free tier works) for PostgreSQL and auth

## Setup

```bash
git clone https://github.com/hugoogb/readledger.git
cd readledger
pnpm install
cp .env.example .env   # Fill in your Supabase credentials
pnpm db:migrate        # Run database migrations
pnpm db:generate       # Generate Prisma client
pnpm dev               # Start dev server at http://localhost:3000
```

See `.env.example` for the required environment variables (Supabase URL, anon key, database URLs).

## Project Structure

```
app/            Next.js App Router (pages, layouts, error boundaries)
actions/        Server actions — thin wrappers: auth → validate → service → revalidate
services/       Business logic layer — testable, framework-agnostic functions
components/     React components (UI primitives, charts, modals, forms)
lib/            Shared utilities (auth, cache, errors, logger, validations, MangaDex API)
hooks/          Custom React hooks
utils/          Pure utility functions (currency, date formatting)
__tests__/      Test suite (Vitest)
prisma/         Database schema and migrations
```

## Development Workflow

1. Create a branch from `master`
2. Make your changes
3. Run `pnpm test:run` and `NODE_ENV=production pnpm build` to verify
4. Commit using **conventional commits**:
   - `feat:` new feature
   - `fix:` bug fix
   - `refactor:` code restructuring
   - `test:` adding or updating tests
   - `docs:` documentation changes
   - `chore:` tooling, dependencies, config
5. Open a pull request against `master`

## Code Style

- **TypeScript** strict mode throughout
- **Tailwind CSS** for styling (no CSS modules or styled-components)
- **Zod** for input validation (schemas in `lib/validations.ts`)
- **Server actions** should be thin — business logic goes in `services/`
- **Custom errors** (`NotFoundError`, `UnauthorizedError`, `ValidationError`) from `lib/errors.ts`
- Prefer simple functions over classes; match existing patterns

## Testing

```bash
pnpm test          # Watch mode
pnpm test:run      # Single run (CI)
```

- **Framework:** Vitest with jsdom environment
- **Mock pattern:** Import `prismaMock` from `__tests__/__mocks__/prisma.ts` to mock database calls
- **Test location:** Mirror source structure under `__tests__/` (e.g., `__tests__/services/series.test.ts`)

Example test structure:

```typescript
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import { vi, beforeEach } from "vitest";
import { createSeries } from "@/services/series";

beforeEach(() => vi.clearAllMocks());

describe("createSeries", () => {
  it("creates a series with the correct userId", async () => {
    prismaMock.series.create.mockResolvedValue({ id: "1", title: "Test" });
    const result = await createSeries("user-1", { title: "Test", /* ... */ });
    expect(prismaMock.series.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1" }) })
    );
  });
});
```

## Architecture Notes

- **Service layer** (`services/`): Pure business logic. Accepts `userId` as first parameter, throws custom errors, no framework dependencies.
- **Action layer** (`actions/`): `"use server"` wrappers that handle `requireUser()`, rate limiting, Zod validation, and `revalidatePath()`.
- **Rate limiting:** Mutations are limited to 30 requests/min per user via `lib/rate-limit.ts`.
- **MangaDex API:** Public API integration in `lib/manga-api.ts` with TTL cache and request throttling.
- **Security headers:** CSP, HSTS, X-Frame-Options applied in `proxy.ts` middleware.
