import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const linkClass =
  "whitespace-nowrap px-2 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-border px-5 sm:px-6">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center" aria-label="ReadLedger home">
          <Logo size={28} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/books" className={`hidden md:block ${linkClass}`}>
            Books
          </Link>
          <Link href="/manga" className={`hidden md:block ${linkClass}`}>
            Manga checklists
          </Link>
          <Link href="/guides" className={`hidden md:block ${linkClass}`}>
            Guides
          </Link>
          <Link href="/login" className={`max-[359px]:hidden ${linkClass} text-foreground`}>
            Sign in
          </Link>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            <span className="sm:hidden">Get started</span>
            <span className="hidden sm:inline">Start your ledger</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
