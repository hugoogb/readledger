"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  LogOut,
  User,
  TrendingUp,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { getSeriesStats } from "@/actions/series";
import { ProgressBar } from "./progress-bar";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/currency";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/series", label: "My Series", icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-background-secondary border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xl font-bold">ReadLedger</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Stats Section */}
      <div className="px-6 py-4 border-t border-border">
        <SidebarStats />
      </div>

      {/* Footer */}

      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function SidebarStats() {
  const [stats, setStats] = useState<{
    progress: number;
    owned: number;
    total: number;
    spent: number;
  } | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    const fetchStats = () => {
      getSeriesStats().then((s) =>
        setStats({
          progress: s.collectionProgress,
          owned: s.totalVolumesOwned,
          total: s.totalExpectedVolumes,
          spent: s.totalSpent,
        }),
      );
    };

    fetchStats();

    // Listen for custom update events
    window.addEventListener("stats-update", fetchStats);
    return () => window.removeEventListener("stats-update", fetchStats);
  }, [pathname]);

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Collection
          </span>
          <span className="text-[10px] font-bold text-accent">
            {stats.progress.toFixed(0)}%
          </span>
        </div>
        <ProgressBar value={stats.progress} variant="accent" size="sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-background-tertiary/50 border border-border/50">
          <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider">
            Owned
          </p>
          <p className="text-sm font-semibold">{stats.owned}</p>
        </div>
        <div className="p-2 rounded-lg bg-background-tertiary/50 border border-border/50">
          <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider">
            Spent
          </p>
          <p className="text-sm font-semibold">{formatCurrency(stats.spent)}</p>
        </div>
      </div>
    </div>
  );
}
