import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openlibrary-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/openlibrary-api")>()),
  lookupIsbn: vi.fn(),
}));
vi.mock("@/lib/googlebooks-api", () => ({ lookupIsbnGoogle: vi.fn() }));

import { lookupIsbnGoogle } from "@/lib/googlebooks-api";
import { lookupIsbnAnySource } from "@/lib/isbn-lookup";
import { OpenLibraryError, lookupIsbn, type BookSearchResult } from "@/lib/openlibrary-api";

const book = (source: BookSearchResult["source"]) => ({ key: "k", title: "T", source }) as BookSearchResult;
const ISBN = "9788408172177";

beforeEach(() => vi.clearAllMocks());

describe("lookupIsbnAnySource", () => {
  it("uses Open Library when it finds the book", async () => {
    vi.mocked(lookupIsbn).mockResolvedValue(book("openlibrary"));
    expect((await lookupIsbnAnySource(ISBN))?.source).toBe("openlibrary");
    expect(lookupIsbnGoogle).not.toHaveBeenCalled();
  });

  it("falls back to Google on a miss", async () => {
    vi.mocked(lookupIsbn).mockResolvedValue(null);
    vi.mocked(lookupIsbnGoogle).mockResolvedValue(book("googlebooks"));
    expect((await lookupIsbnAnySource(ISBN))?.source).toBe("googlebooks");
    expect(lookupIsbnGoogle).toHaveBeenCalledWith(ISBN);
  });

  it("falls back to Google when Open Library errors", async () => {
    vi.mocked(lookupIsbn).mockRejectedValue(new OpenLibraryError());
    vi.mocked(lookupIsbnGoogle).mockResolvedValue(book("googlebooks"));
    expect((await lookupIsbnAnySource(ISBN))?.source).toBe("googlebooks");
  });

  it("rethrows the Open Library error when Google also misses", async () => {
    vi.mocked(lookupIsbn).mockRejectedValue(new OpenLibraryError());
    vi.mocked(lookupIsbnGoogle).mockResolvedValue(null);
    await expect(lookupIsbnAnySource(ISBN)).rejects.toBeInstanceOf(OpenLibraryError);
  });

  it("returns null when neither source knows it", async () => {
    vi.mocked(lookupIsbn).mockResolvedValue(null);
    vi.mocked(lookupIsbnGoogle).mockResolvedValue(null);
    expect(await lookupIsbnAnySource(ISBN)).toBeNull();
  });

  it("shares one lookup between concurrent callers for the same ISBN", async () => {
    let finish: (b: BookSearchResult | null) => void = () => {};
    vi.mocked(lookupIsbn).mockReturnValue(new Promise((resolve) => (finish = resolve)));

    const first = lookupIsbnAnySource(ISBN);
    const second = lookupIsbnAnySource(ISBN);
    finish(book("openlibrary"));

    expect(await first).toBe(await second);
    expect(lookupIsbn).toHaveBeenCalledTimes(1);
  });

  it("looks up again once the previous lookup has settled", async () => {
    vi.mocked(lookupIsbn).mockResolvedValue(book("openlibrary"));
    await lookupIsbnAnySource(ISBN);
    await lookupIsbnAnySource(ISBN);
    expect(lookupIsbn).toHaveBeenCalledTimes(2);
  });
});
