"use client";

import { useTheme } from "@/hooks/use-theme";
import { useSyncExternalStore, type CSSProperties } from "react";
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
      position={isPhone ? "top-center" : "bottom-right"}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      style={
        {
          "--normal-bg": "var(--background-secondary)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--background-secondary)",
          "--success-text": "var(--success)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--background-secondary)",
          "--error-text": "var(--error)",
          "--error-border": "var(--border)",
          "--border-radius": "8px",
        } as CSSProperties
      }
    />
  );
}
