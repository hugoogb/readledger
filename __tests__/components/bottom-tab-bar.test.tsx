import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/wishlist" }));

const modalProps = vi.fn();
vi.mock("@/components/series/add-series-modal", () => ({
  AddSeriesModal: (props: { open: boolean }) => {
    modalProps(props);
    return null;
  },
}));

import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { AddBookProvider } from "@/components/series/add-book-provider";

describe("BottomTabBar", () => {
  it("links every section and marks the current one", () => {
    render(
      <AddBookProvider>
        <BottomTabBar />
      </AddBookProvider>,
    );
    for (const name of ["Home", "Library", "Wishlist", "Stats"]) {
      expect(screen.getByRole("link", { name })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: "Wishlist" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });

  it("opens the add-a-book flow from the centre button", () => {
    render(
      <AddBookProvider>
        <BottomTabBar />
      </AddBookProvider>,
    );
    expect(modalProps).toHaveBeenLastCalledWith(expect.objectContaining({ open: false }));
    fireEvent.click(screen.getByRole("button", { name: "Add a book" }));
    expect(modalProps).toHaveBeenLastCalledWith(expect.objectContaining({ open: true }));
  });
});
