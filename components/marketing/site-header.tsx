import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// whitespace-nowrap: at 375px phones and at tablet widths (all nav links showing)
// "Sign in" and "Get started" would otherwise wrap onto two lines.
const linkClass =
  "text-sm font-medium text-foreground-muted hover:text-foreground transition-colors px-2 py-2 whitespace-nowrap";

export function SiteHeader() {
  return (
    <header className="relative z-10 px-5 sm:px-6 py-4">
      <nav className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Logo size={28} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          {/* On phones these live in the footer, to keep the header on one line. */}
          <Link href="/books" className={`hidden md:block ${linkClass}`}>
            Books
          </Link>
          <Link href="/manga" className={`hidden md:block ${linkClass}`}>
            Manga
          </Link>
          <Link href="/guides" className={`hidden md:block ${linkClass}`}>
            Guides
          </Link>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link href="/login" className={linkClass}>
            Sign in
          </Link>
          <Link
            href="/login"
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 px-3 sm:px-4 rounded-xl transition-colors whitespace-nowrap"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
