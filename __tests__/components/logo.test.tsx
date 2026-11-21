import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo, LogoMark } from "@/components/ui/logo";

describe("Logo", () => {
  it("shows the wordmark with a decorative mark", () => {
    const { container } = render(<Logo />);
    expect(screen.getByText("ReadLedger")).toBeTruthy();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("sizes the mark", () => {
    const { container } = render(<LogoMark size={24} />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("24");
  });
});
