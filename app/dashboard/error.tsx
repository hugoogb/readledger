"use client";

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-error" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard Error</h1>
          <p className="text-foreground-muted">
            {error.message || "Failed to load the dashboard. Please try again."}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-background-tertiary rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Link>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
