"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAddBook } from "@/components/series/add-book-provider";
import { isNavActive, NAV_ITEMS, type NavItem } from "./nav-items";

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
        active ? "text-accent" : "text-foreground-muted hover:text-foreground"
      }`}
    >
      <Icon className="size-5" aria-hidden="true" />
      {item.shortLabel}
    </Link>
  );
}

/** Phone navigation: four sections around a central "Add a book" button. */
export function BottomTabBar() {
  const pathname = usePathname();
  const { open } = useAddBook();
  const [home, library, wishlist, stats] = NAV_ITEMS;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background-secondary pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center px-2 pt-1.5 pb-1">
        <Tab item={home} active={isNavActive(pathname, home.href)} />
        <Tab item={library} active={isNavActive(pathname, library.href)} />
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={open}
            aria-label="Add a book"
            className="flex size-11 cursor-pointer items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <Plus className="size-5" aria-hidden="true" />
          </button>
        </div>
        <Tab item={wishlist} active={isNavActive(pathname, wishlist.href)} />
        <Tab item={stats} active={isNavActive(pathname, stats.href)} />
      </div>
    </nav>
  );
}
