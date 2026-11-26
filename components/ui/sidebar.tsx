"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { AddBookButton } from "@/components/series/add-book-provider";
import { Logo } from "@/components/ui/logo";
import { isNavActive, NAV_ITEMS } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();
  const profileActive =
    isNavActive(pathname, "/dashboard/profile") || isNavActive(pathname, "/dashboard/settings");

  return (
    <div className="flex h-full flex-col px-3 py-5">
      <Link href="/dashboard" className="px-2.5" aria-label="ReadLedger home">
        <Logo size={26} />
      </Link>

      <AddBookButton className="mt-6 mb-5 w-full" />

      <nav aria-label="Main navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-3 rounded-md px-2.5 text-sm transition-colors ${
                    active
                      ? "bg-background text-foreground shadow-[inset_2px_0_0_var(--accent)]"
                      : "text-foreground-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <Link
          href="/dashboard/profile"
          aria-current={profileActive ? "page" : undefined}
          className={`flex min-h-10 items-center gap-3 rounded-md px-2.5 text-sm transition-colors ${
            profileActive
              ? "bg-background text-foreground shadow-[inset_2px_0_0_var(--accent)]"
              : "text-foreground-muted hover:bg-background hover:text-foreground"
          }`}
        >
          <UserRound className="size-5" aria-hidden="true" />
          Profile &amp; settings
        </Link>
        <div className="px-1.5">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
