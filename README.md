# ReadLedger 📚

ReadLedger is a premium Manga Collection Tracker built for serious collectors. Track every volume you own, monitor your reading progress, and get insights into your spending habits with a beautiful, modern interface.

## ✨ Features

- **Intelligent Search**: Find and add manga series instantly using the Jikan (MyAnimeList) API.
- **Collection Tracking**: Detailed volume management (owned, read, missing).
- **Financial Insights**: Track how much you spend and see your savings compared to retail prices.
- **Beautiful Dashboard**: Overview of your entire collection with modern visualizations.
- **Production Ready**: Built with Next.js 15, Prisma, and Supabase Auth.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (hosted on Supabase)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Validation**: [Zod](https://zod.dev/)

## 🛠️ Getting Started

### 1. Prerequisites

- Node.js 20+
- A Supabase project

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Installation

```bash
npm install
```

### 4. Database Setup

Push the schema to your database:

```bash
npx prisma db push
```

### 5. Running Locally

```bash
npm run dev
```

## 📦 Deployment

This project is optimized for deployment on **Vercel**.

1. Create a new project on Vercel.
2. Link your GitHub repository.
3. Add the environment variables from your `.env` file.
4. Deploy!

## 📄 License

MIT
