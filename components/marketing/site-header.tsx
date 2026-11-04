import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const linkClass =
  "text-sm font-medium text-foreground-muted hover:text-foreground transition-colors px-2 py-2";

export function SiteHeader() {
  return (
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
          {/* On phones these two live in the footer, to keep the header on one line. */}
          <Link href="/manga" className={`hidden md:block ${linkClass}`}>
            Checklists
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
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 px-3 sm:px-4 rounded-xl transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
