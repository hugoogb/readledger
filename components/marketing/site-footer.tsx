import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { REPOSITORY_URL } from "@/lib/site";

const linkClass = "py-2 transition-colors hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border px-5 py-10 sm:px-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Logo size={24} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-foreground-muted">
            <Link href="/books" className={linkClass}>
              Books
            </Link>
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
            <ThemeToggle />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-foreground-muted">
          Manga data from{" "}
          <a href="https://mangadex.org" rel="noopener" className="underline underline-offset-2 hover:text-foreground">
            MangaDex
          </a>{" "}
          and book data from{" "}
          <a href="https://openlibrary.org" rel="noopener" className="underline underline-offset-2 hover:text-foreground">
            Open Library
          </a>{" "}
          and{" "}
          <a href="https://books.google.com" rel="noopener" className="underline underline-offset-2 hover:text-foreground">
            Google Books
          </a>
          . ReadLedger is not affiliated with MangaDex, Open Library, Google or any publisher. Built by{" "}
          <a href="https://hugoogb.dev/" rel="author" className="underline underline-offset-2 hover:text-foreground">
            Hugo García Benjumea
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
