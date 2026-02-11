"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Heart,
  LayoutDashboard,
  Library,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/series", label: "My Series", icon: Library },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/statistics", label: "Statistics", icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/readledger-logo.webp"
            alt="ReadLedger logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
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
    </>
  );
}

export function SidebarFooter() {
  return (
    <div className="p-4 border-t border-border space-y-1">
      <div className="flex items-center justify-between px-4 py-2">
        <ThemeToggle />
      </div>
      <Link
        href="/dashboard/settings"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
      >
        <Settings className="w-5 h-5" />
        <span className="font-medium">Settings</span>
      </Link>
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
  );
}
