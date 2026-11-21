import { describe, expect, it, vi } from "vitest";

// next/font only works inside the Next.js build; stub it to read the exports.
vi.mock("next/font/google", () => ({ Newsreader: () => ({ variable: "" }) }));
vi.mock("next/font/local", () => ({ default: () => ({ variable: "" }) }));

import { viewport } from "@/app/layout";

describe("viewport", () => {
  // Without viewport-fit=cover, iOS reports env(safe-area-inset-*) as 0 and
  // the home indicator sits on top of the bottom tab bar.
  it("extends under the iPhone safe areas so env() insets apply", () => {
    expect(viewport.viewportFit).toBe("cover");
  });
});
