"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="max-w-md w-full text-center space-y-6 relative z-10 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-error" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-foreground-muted">
            {process.env.NODE_ENV === "development"
              ? error.message || "An unexpected error occurred. Please try again."
              : "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p className="text-xs text-foreground-muted/60 mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-border-hover rounded-xl font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
