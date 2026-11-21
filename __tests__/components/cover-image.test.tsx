import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img src={String(props.src)} alt="" />,
}));

import { CoverImage } from "@/components/books/cover-image";
import { CoverShelf } from "@/components/books/cover-shelf";
import { clothColor } from "@/lib/cloth";

const LONG = "The Extraordinarily Long and Winding Chronicle of a Small Bookshop at the Edge";

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
}

describe("CoverImage", () => {
  it("draws a cloth cover with the title when there is no image", () => {
    render(<CoverImage src={null} title={LONG} sizes="72px" />);
    const placeholder = screen.getByTestId("cover-placeholder");
    expect(placeholder.textContent).toContain(LONG);
    expect(placeholder.style.backgroundColor).toBe(rgb(clothColor(LONG)));
  });

  it("shows the image when there is one", () => {
    const { container } = render(
      <CoverImage src="https://covers.openlibrary.org/b/id/1-M.jpg" title="Dune" sizes="72px" />,
    );
    expect(container.querySelector("img")).toBeTruthy();
    expect(screen.queryByTestId("cover-placeholder")).toBeNull();
  });
});

describe("CoverShelf", () => {
  it("shows the empty text when there are no books", () => {
    render(<CoverShelf items={[]} emptyText="Nothing read yet." />);
    expect(screen.getByText("Nothing read yet.")).toBeTruthy();
  });

  it("links each cover to its series", () => {
    render(
      <CoverShelf
        emptyText=""
        items={[{ key: "1", href: "/dashboard/library/1", title: "Dune", caption: "Novel", coverImage: null }]}
      />,
    );
    expect(screen.getByRole("link").getAttribute("href")).toBe("/dashboard/library/1");
    expect(screen.getByText("Novel")).toBeTruthy();
  });
});
