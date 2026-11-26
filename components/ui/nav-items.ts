import { ChartColumn, Heart, House, Library, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; shortLabel: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", shortLabel: "Home", icon: House },
  { href: "/dashboard/library", label: "Library", shortLabel: "Library", icon: Library },
  { href: "/dashboard/wishlist", label: "Wishlist", shortLabel: "Wishlist", icon: Heart },
  { href: "/dashboard/statistics", label: "Statistics", shortLabel: "Stats", icon: ChartColumn },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
