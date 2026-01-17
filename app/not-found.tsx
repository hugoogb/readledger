import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
          <BookOpen className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-foreground-muted mb-8">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Go home
        </Link>
      </div>
    </div>
  );
}
