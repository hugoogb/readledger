"use client";

import { useTheme } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";

const themes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          suppressHydrationWarning
          key={value}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          className={`p-2.5 rounded-[5px] transition-colors cursor-pointer ${
            theme === value
              ? "bg-background-tertiary text-foreground"
              : "text-foreground-muted hover:text-foreground"
          }`}
          aria-label={`Switch to ${label} theme`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
