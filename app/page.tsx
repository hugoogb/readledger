import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  Library,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Faux dashboard stats shown in the product preview. These are illustrative,
// not real data — they mirror the layout of the actual /dashboard so visitors
// see what the app looks like before signing up.
const previewStats = [
  { label: "Volumes", value: "342", icon: Library },
  { label: "Series", value: "28", icon: BookMarked },
  { label: "Read", value: "76%", icon: BookOpen },
  { label: "Spent", value: "$1,284", icon: Wallet },
];

// A pattern of "owned" (true) vs "missing" (false) volume spines for the
// preview collection shelf.
const previewSpines = [
  true, true, true, true, false, true, true, false, true, true,
  true, false, true, true, true, true, true, true, false, true,
  true, true, false, true, true, true, false, true, true, true,
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-5 sm:px-6 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/readledger-logo.webp"
              alt="ReadLedger logo"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <span className="text-lg sm:text-xl font-bold">ReadLedger</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link
              href="/login"
              className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors px-2 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 px-3 sm:px-4 rounded-xl transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-5 sm:px-6 pt-12 sm:pt-20 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              <Sparkles className="w-3.5 h-3.5" />
              Built for manga collectors
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Your manga collection,
              <span className="gradient-text"> beautifully tracked</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-foreground-muted leading-relaxed">
              Know exactly which volumes you own, which you&apos;ve read, and
              what you&apos;ve spent — all in one place, with insights that
              actually look good on your phone.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                Start tracking — it&apos;s free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto border border-border hover:border-border-hover text-foreground font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-5 text-sm text-foreground-muted">
              Free to use · Works great on mobile · Your data stays yours
            </p>
          </div>

          {/* Product preview */}
          <div className="mt-16 sm:mt-20 max-w-4xl mx-auto animate-fade-in stagger-2">
            <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-accent/10">
              {/* App chrome */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background-tertiary/40">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-error/60" />
                  <span className="w-3 h-3 rounded-full bg-warning/60" />
                  <span className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 text-center text-xs text-foreground-muted truncate">
                  readledger · dashboard
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6">
                {/* Stat tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previewStats.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border bg-background-secondary p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground-muted">
                          {label}
                        </span>
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="mt-2 text-xl sm:text-2xl font-bold">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collection shelf */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">
                      Your collection
                    </span>
                    <span className="text-xs text-foreground-muted">
                      28 series
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                    {previewSpines.map((owned, i) => (
                      <div
                        key={i}
                        className={
                          owned
                            ? "h-12 sm:h-16 rounded-md bg-linear-to-b from-accent/80 to-accent-hover/80"
                            : "h-12 sm:h-16 rounded-md border border-dashed border-border bg-background-tertiary/40"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-24 sm:mt-32">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold">Everything in one shelf</h2>
              <p className="mt-3 text-foreground-muted">
                Three views of your collection, always in sync.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-6 animate-fade-in stagger-1">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <Library className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Collection management
                </h3>
                <p className="text-foreground-muted">
                  Track every volume across all your series. See what you own,
                  what&apos;s missing, and what to buy next.
                </p>
              </div>

              <div className="glass rounded-2xl p-6 animate-fade-in stagger-2">
                <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Reading progress</h3>
                <p className="text-foreground-muted">
                  Mark volumes as read and watch completion rates climb. Always
                  know where you left off.
                </p>
              </div>

              <div className="glass rounded-2xl p-6 animate-fade-in stagger-3">
                <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Spending insights</h3>
                <p className="text-foreground-muted">
                  Log prices as you go and see totals, averages, and trends —
                  so your hobby never surprises your wallet.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-24 sm:mt-32">
            <h2 className="text-3xl font-bold text-center mb-12">
              Up and running in minutes
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center animate-fade-in stagger-1">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Add your series</h3>
                <p className="text-foreground-muted">
                  Search manga titles and add them to your collection in
                  seconds — covers and details included.
                </p>
              </div>

              <div className="text-center animate-fade-in stagger-2">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Track volumes</h3>
                <p className="text-foreground-muted">
                  Mark volumes owned or read, log prices, and note condition as
                  your shelf grows.
                </p>
              </div>

              <div className="text-center animate-fade-in stagger-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Get insights</h3>
                <p className="text-foreground-muted">
                  Watch spending trends, reading progress, and collection stats
                  come together at a glance.
                </p>
              </div>
            </div>
          </div>

          {/* Closing CTA */}
          <div className="mt-24 sm:mt-32 animate-fade-in">
            <div className="glass rounded-3xl px-6 py-12 sm:py-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-accent/10 to-transparent pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <TrendingUp className="w-10 h-10 text-accent mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Start tracking your collection today
                </h2>
                <p className="mt-4 text-foreground-muted text-lg">
                  Free to start, no clutter. Bring order to your manga shelf in
                  a few taps.
                </p>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-lg shadow-accent/20"
                >
                  Create your free account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-5 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/readledger-logo.webp"
              alt="ReadLedger logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold">ReadLedger</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-sm text-foreground-muted">
            <ThemeToggle />
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="hover:text-foreground transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
