import { BookOpen, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="text-center relative z-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
          <BookOpen className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-foreground-muted mb-2">Page not found</p>
        <p className="text-foreground-muted/70 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-border hover:border-border-hover font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
