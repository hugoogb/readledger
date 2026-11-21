"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Time-of-day greeting and today's date in the reader's own timezone. The
 * server render says "Welcome back"; the client swaps in local time.
 */
export function Greeting({ name }: { name: string | null }) {
  const greeting = useSyncExternalStore(
    subscribe,
    () => greetingFor(new Date()),
    () => "Welcome back",
  );
  const today = useSyncExternalStore(
    subscribe,
    () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    () => "",
  );

  return (
    <header>
      <h1 className="font-serif text-[1.75rem] font-medium leading-tight lg:text-[2.125rem]">
        {greeting}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-0.5 min-h-5 text-sm text-foreground-muted">{today}</p>
    </header>
  );
}
