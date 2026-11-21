import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const ISBN = "9788468471549";

vi.mock("@/actions/openlibrary", () => ({
  searchBooks: vi.fn(async () => ({
    ok: true,
    data: {
      data: [{ key: "OL1W", title: "ONE PIECE 3", authors: [], year: null, coverImage: "", coverImageSmall: "", pages: null, subjects: [], isbn: ISBN, formatGuess: "COMIC", source: "openlibrary", editionTitle: null }],
      pagination: { currentPage: 1, hasNextPage: false },
    },
  })),
}));
vi.mock("@/actions/mangadex", () => ({ searchManga: vi.fn() }));
vi.mock("@/actions/series", () => ({
  getExistingMangadexIds: vi.fn(async () => []),
  getExistingOpenLibraryKeys: vi.fn(async () => []),
  isIsbnInLibrary: vi.fn(async () => false),
}));
vi.mock("@/actions/isbn-volume", () => ({
  resolveIsbnVolume: vi.fn(async () => ({
    ok: true,
    data: { kind: "existing", seriesId: "s1", seriesTitle: "One Piece", volumeNumber: 3, owned: false, isbn: ISBN, byIsbn: false },
  })),
  markVolumeOwnedByIsbn: vi.fn(),
  listMultiVolumeSeries: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { LibrarySearch } from "@/components/series/library-search";

describe("LibrarySearch with an ISBN", () => {
  it("puts the volume card after the book result, so the book row never moves", async () => {
    await act(async () => {
      render(
        <LibrarySearch
          query={ISBN}
          onQueryChange={vi.fn()}
          booksFirst
          onSelectManga={vi.fn()}
          onSelectBook={vi.fn()}
          onAddManually={vi.fn()}
          onAddManuallyWithIsbn={vi.fn()}
          onStartNewSeries={vi.fn()}
          onClose={vi.fn()}
        />,
      );
    });

    const books = screen.getByRole("region", { name: "Books" });
    const card = screen.getByRole("region", { name: "Volume match" });
    expect(books.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
