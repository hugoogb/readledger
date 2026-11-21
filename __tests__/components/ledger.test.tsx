import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Ledger, LedgerRow, LedgerTotal } from "@/components/ui/ledger";

describe("LedgerRow", () => {
  it("shows a zero value rather than hiding it", () => {
    render(
      <Ledger>
        <LedgerRow label="Books owned" value={0} />
      </Ledger>,
    );
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("becomes a link when given an href", () => {
    render(<LedgerRow label="Reading" value={3} href="/x" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/x");
  });

  it("truncates the label and never squeezes the figure", () => {
    render(<LedgerRow label="A very long label" value="¥1,234,567" />);
    expect(screen.getByText("A very long label").closest(".truncate")).toBeTruthy();
    expect(screen.getByText("¥1,234,567").className).toContain("shrink-0");
  });
});

describe("LedgerRow note", () => {
  it("keeps the note readable instead of cutting it off with the label", () => {
    render(<LedgerRow label="Read in 2026" note="+40 vs this point in 2025" value={80} />);
    expect(screen.getByText("+40 vs this point in 2025").closest(".truncate")).toBeNull();
  });
});

describe("LedgerTotal", () => {
  it("closes the total with the double rule", () => {
    const { container } = render(<LedgerTotal label="Spent" value="€12.00" />);
    expect(screen.getByText("Spent")).toBeTruthy();
    expect(screen.getByText("€12.00")).toBeTruthy();
    expect(container.querySelector(".double-rule")).toBeTruthy();
  });
});
