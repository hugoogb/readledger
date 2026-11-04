import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { REPOSITORY_URL } from "@/lib/site";

const linkClass = "hover:text-foreground transition-colors py-1";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border px-5 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6 text-sm text-foreground-muted">
            <ThemeToggle />
            <Link href="/manga" className={linkClass}>
              Volume checklists
            </Link>
            <Link href="/guides" className={linkClass}>
              Guides
            </Link>
            <a href={REPOSITORY_URL} rel="noopener" className={linkClass}>
              GitHub
            </a>
            <Link href="/login" className={linkClass}>
              Sign in
            </Link>
          </div>
        </div>
        {/* MangaDex's API policy requires this credit. */}
        <p className="text-center sm:text-left text-xs text-foreground-muted">
          Series data from{" "}
          <a href="https://mangadex.org" rel="noopener" className="underline hover:text-foreground">
            MangaDex
          </a>
          . ReadLedger is not affiliated with MangaDex or any publisher.
        </p>
      </div>
    </footer>
  );
}
