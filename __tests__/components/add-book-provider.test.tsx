import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let pathname = "/dashboard";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const getAddBookOptions = vi.fn(async () => ({
  publishers: [{ id: "p1", name: "Viz Media" }],
  booksFirst: false,
}));
vi.mock("@/actions/series", () => ({ getAddBookOptions: () => getAddBookOptions() }));

const modalProps = vi.fn();
vi.mock("@/components/series/add-series-modal", () => ({
  AddSeriesModal: (props: { open: boolean; booksFirst: boolean }) => {
    modalProps(props);
    return null;
  },
}));

import { AddBookButton, AddBookProvider } from "@/components/series/add-book-provider";

describe("AddBookProvider", () => {
  it("closes the add flow when the reader navigates away", () => {
    const { rerender } = render(
      <AddBookProvider>
        <AddBookButton />
      </AddBookProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add a book" }));
    expect(modalProps).toHaveBeenLastCalledWith(expect.objectContaining({ open: true }));

    // A back swipe or link changes the route while the sheet is open.
    pathname = "/dashboard/wishlist";
    act(() => {
      rerender(
        <AddBookProvider>
          <AddBookButton />
        </AddBookProvider>,
      );
    });
    expect(modalProps).toHaveBeenLastCalledWith(expect.objectContaining({ open: false }));
  });

  it("keeps the search order it learned for the next opening", async () => {
    pathname = "/dashboard";
    const tree = (
      <AddBookProvider>
        <AddBookButton />
      </AddBookProvider>
    );
    const { rerender } = render(tree);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add a book" }));
    });
    expect(modalProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, booksFirst: false }),
    );

    // Close, then reopen while the next options request is still in flight.
    getAddBookOptions.mockImplementationOnce(() => new Promise(() => {}));
    pathname = "/dashboard/library";
    act(() => rerender(tree));
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Add a book" }));
    });
    expect(modalProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, booksFirst: false }),
    );
  });
});
