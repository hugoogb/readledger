import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({ Newsreader: () => ({ variable: "" }) }));
vi.mock("next/font/local", () => ({ default: () => ({ variable: "" }) }));

import { viewport } from "@/app/layout";

describe("viewport", () => {
  it("extends under the iPhone safe areas so env() insets apply", () => {
    expect(viewport.viewportFit).toBe("cover");
  });
});
