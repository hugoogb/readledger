import { BookOpen, ArrowRight, Library, BarChart3, Wallet } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-bold">ReadLedger</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-accent hover:bg-accent-hover text-white font-medium py-2 px-4 rounded-xl transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
              Track your manga
              <span className="text-accent"> collection</span>
            </h1>
            <p className="mt-6 text-xl text-foreground-muted leading-relaxed">
              Keep track of every volume you own, what you&apos;ve read, and
              your spending. Beautiful insights for manga collectors.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Start tracking
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto border border-border hover:border-border-hover text-foreground font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Sign in to continue
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-24 grid sm:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 animate-fade-in stagger-1">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <Library className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Collection Management
              </h3>
              <p className="text-foreground-muted">
                Track every volume across all your manga series. See what you
                own, what&apos;s missing, and what&apos;s next.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 animate-fade-in stagger-2">
              <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reading Progress</h3>
              <p className="text-foreground-muted">
                Monitor your reading progress with visual stats. See completion
                rates and reading history.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 animate-fade-in stagger-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Spending Insights</h3>
              <p className="text-foreground-muted">
                Track your manga spending. See totals, averages, and trends
                across your collection.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
