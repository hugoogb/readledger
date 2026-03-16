# 📚 ReadLedger

**ReadLedger** is a manga collection tracker designed for collectors who want more than just a list of volumes.

It helps you understand your collection through **reading progress, spending analysis, and savings insights**.

---

## ✨ Motivation

ReadLedger started from a simple personal need.

While building my **One Piece** collection, I wanted to answer questions like:

- How many volumes do I own?
- Which ones have I read?
- How much money have I spent in total?
- How much have I saved buying second-hand?

Existing tools didn't fully address this workflow, so ReadLedger was built as a focused solution for manga collectors.

---

## 🚀 Features

- 📚 **Collection management** — Track owned volumes, reading progress, and condition
- 🔍 **MangaDex integration** — Search and import series metadata and cover art
- 💰 **Spending analytics** — Monitor total spending, savings, and average price per volume
- 📊 **Statistics dashboard** — Visual breakdowns by publisher, store, status, and condition
- 📋 **Wishlist** — Track volumes you want to buy with estimated cost
- ⚡ **Bulk operations** — Mark multiple volumes as owned or read at once
- 📥 **CSV import/export** — Back up or migrate your collection data
- 🎨 **Dark/light theme** — System-aware with manual toggle

---

## 🧠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **UI:** [React 19](https://react.dev/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Database:** PostgreSQL via [Supabase](https://supabase.com/)
- **ORM:** [Prisma 7](https://www.prisma.io/)
- **Auth:** Supabase Auth (email/password) with SSR session management
- **Validation:** [Zod 4](https://zod.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Language:** TypeScript

---

## 🏗️ Architecture

```
app/                    # Next.js App Router pages and layouts
actions/                # Server actions (thin wrappers: auth → validate → service → revalidate)
services/               # Business logic layer (testable, framework-agnostic)
components/             # React components (UI primitives, forms, charts, modals)
lib/                    # Shared utilities (auth, cache, errors, logger, validations, manga API)
hooks/                  # Custom React hooks
utils/                  # Pure utility functions (currency, date formatting)
__tests__/              # Vitest test suite
```

Key design decisions:
- **Service layer** separates business logic from Next.js concerns (auth, caching, revalidation)
- **Custom error classes** (`NotFoundError`, `UnauthorizedError`, `ValidationError`) for consistent error handling
- **Structured JSON logging** via `lib/logger.ts`
- **In-memory TTL cache** for MangaDex API responses
- **Security headers** (CSP, HSTS, X-Frame-Options) applied via `proxy.ts` middleware
- **Rate limiting** on mutation actions (30 requests/min per user)

---

## 🌐 Live Application

👉 https://readledger.app

---

## 💻 Repository

👉 https://github.com/hugoogb/readledger

---

## 🛠️ Local Development

### 1️⃣ Clone the repository

```bash
git clone https://github.com/hugoogb/readledger.git
cd readledger
```

### 2️⃣ Install dependencies

```bash
pnpm install
```

### 3️⃣ Configure environment variables

```bash
cp .env.example .env
```

Update with your Supabase project URL, anon key, and database connection string.

### 4️⃣ Database setup

```bash
pnpm db:migrate
pnpm db:generate
```

### 5️⃣ Start development server

```bash
pnpm dev
```

### 🧪 Running tests

```bash
pnpm test          # Watch mode
pnpm test:run      # Single run
```

---

## 📊 Project Goals

ReadLedger is designed to evolve into:

- A richer analytics platform for collectors
- Support for multiple series & formats
- Advanced statistics & visualizations
- Improved UX & performance

---

## 🤝 Contributions

Feedback, ideas, and contributions are welcome.
If you'd like to improve ReadLedger:

1. Fork the repo
2. Create a feature branch
3. Open a pull request

---

## 📄 License

MIT
