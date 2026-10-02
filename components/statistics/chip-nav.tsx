"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ChipNavProps = {
  items: { value: string; label: string; href: string }[];
  active: string;
  label: string;
};

/**
 * Horizontally scrollable row of URL-backed chips (tabs, year filters).
 * Navigation runs in a transition so the row dims while the next view loads.
 */
export function ChipNav({ items, active, label }: ChipNavProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <nav
      aria-label={label}
      aria-busy={isPending}
      className={`flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <Button
            key={item.value}
            variant={isActive ? "default" : "secondary"}
            aria-current={isActive ? "page" : undefined}
            onClick={() => startTransition(() => router.push(item.href))}
            className="whitespace-nowrap h-10"
          >
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
