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

Existing tools didn’t fully address this workflow, so ReadLedger was built as a focused solution for manga collectors.

---

## 🚀 Features

- 📚 Track owned volumes
- ✅ Mark reading progress
- 💰 Monitor total spending
- 💸 Track second-hand savings
- 📊 View collection statistics
- ⚡ Fast, responsive UI

---

## 🧠 Tech Stack

ReadLedger is a modern full-stack web application built with:

- **Frontend:** Next.js + React
- **Backend / Database:** Supabase
- **ORM:** Prisma
- **Language:** TypeScript

This architecture provides:

- Real-time database capabilities
- Type-safe data access
- Scalable backend infrastructure
- Optimized frontend performance

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

And update with your values

### 4️⃣ Database Setup

```bash
pnpm db:migrate
pnpm db:generate
```

### 5️⃣ Start development server

```bash
pnpm dev
```

## 📊 Project Goals

ReadLedger is designed to evolve into:

- A richer analytics platform for collectors
- Support for multiple series & formats
- Advanced statistics & visualizations
- Improved UX & performance

## 🤝 Contributions

Feedback, ideas, and contributions are welcome.
If you’d like to improve ReadLedger:

1. Fork the repo
2. Create a feature branch
3. Open a pull request

## 📄 License

MIT
