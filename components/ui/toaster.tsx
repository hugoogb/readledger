"use client";

import { useTheme } from "@/hooks/use-theme";
import { useSyncExternalStore } from "react";
import { Toaster as Sonner } from "sonner";

const PHONE_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(PHONE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function Toaster() {
  const { resolvedTheme } = useTheme();
  const isPhone = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );

  return (
    <Sonner
      // On phones, bottom toasts cover the bottom-sheet Save/Confirm buttons.
      position={isPhone ? "top-center" : "bottom-right"}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
    />
  );
}
