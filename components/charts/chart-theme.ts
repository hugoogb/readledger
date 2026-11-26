import type { CSSProperties } from "react";

export const TOOLTIP_BOX: CSSProperties = {
  backgroundColor: "var(--color-background-secondary)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  color: "var(--color-foreground)",
  padding: "0.5rem 0.75rem",
};

export const TOOLTIP_CONTENT: CSSProperties = {
  backgroundColor: "var(--color-background-secondary)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  color: "var(--color-foreground)",
  boxShadow: "none",
};

export const AXIS_TICK = { fill: "var(--color-foreground-muted)", fontSize: 12 };
