import { describe, expect, it } from "vitest";
import { isNavActive } from "@/components/ui/nav-items";

describe("isNavActive", () => {
  it("matches Home only on the dashboard itself", () => {
    expect(isNavActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavActive("/dashboard/library", "/dashboard")).toBe(false);
  });

  it("keeps a section active on its sub-pages", () => {
    expect(isNavActive("/dashboard/library/abc", "/dashboard/library")).toBe(true);
  });

  it("doesn't match a sibling that shares a prefix", () => {
    expect(isNavActive("/dashboard/library-x", "/dashboard/library")).toBe(false);
  });
});
