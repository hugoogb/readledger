import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ throttleOpenLibrary: vi.fn(async () => {}) }));

import {
  OpenLibraryError,
  buildOpenLibraryCoverUrl,
  extractDescription,
  getBookDetails,
  guessFormat,
  lookupIsbn,
  mapSearchDoc,
  parseWorkKey,
  searchBooks,
} from "@/lib/openlibrary-api";
import { OPENLIBRARY_COVER_URL } from "@/lib/covers";

describe("buildOpenLibraryCoverUrl", () => {
  it("builds cover-ID URLs only", () => {
    const url = buildOpenLibraryCoverUrl(14856017, "L");
    expect(url).toBe("https://covers.openlibrary.org/b/id/14856017-L.jpg");
    expect(OPENLIBRARY_COVER_URL.test(url)).toBe(true);
    expect(buildOpenLibraryCoverUrl(1, "M")).toBe("https://covers.openlibrary.org/b/id/1-M.jpg");
  });

  it.each([undefined, null, -1, 0, 1.5, "12", NaN])("returns '' for %s", (id) => {
    expect(buildOpenLibraryCoverUrl(id, "L")).toBe("");
  });
});

describe("parseWorkKey", () => {
  it("accepts work keys with or without the /works/ prefix", () => {
    expect(parseWorkKey("/works/OL893414W")).toBe("OL893414W");
    expect(parseWorkKey("OL893414W")).toBe("OL893414W");
  });

  it.each(["/books/OL7524304M", "/works/../x", "OLW", "", 12, null])("rejects %s", (key) => {
    expect(parseWorkKey(key)).toBeNull();
  });
});

describe("extractDescription", () => {
  it("reads a plain string or a {type, value} object", () => {
    expect(extractDescription({ description: " A desert planet. " })).toBe("A desert planet.");
    expect(extractDescription({ description: { type: "/type/text", value: "Spice." } })).toBe("Spice.");
  });

  it("returns null when missing, empty or not text", () => {
    expect(extractDescription({})).toBeNull();
    expect(extractDescription({ description: "  " })).toBeNull();
    expect(extractDescription({ description: { value: 3 } })).toBeNull();
    expect(extractDescription(null)).toBeNull();
  });

  it("caps the description at 2000 characters", () => {
    expect(extractDescription({ description: "x".repeat(2500) })).toHaveLength(2000);
  });
});

describe("guessFormat", () => {
  it("guesses COMIC from comic / graphic novel subjects", () => {
    expect(guessFormat(["Fiction", "Comic books, strips, etc."])).toBe("COMIC");
    expect(guessFormat(["Graphic novels"])).toBe("COMIC");
    expect(guessFormat(["Bandes dessinées"])).toBe("COMIC");
  });

  it("defaults to NOVEL", () => {
    expect(guessFormat(["Fiction", "Science fiction"])).toBe("NOVEL");
    expect(guessFormat([])).toBe("NOVEL");
  });
});

describe("mapSearchDoc", () => {
  const doc = {
    key: "/works/OL893414W",
    title: "Dune",
    author_name: ["Frank Herbert"],
    first_publish_year: 1965,
    cover_i: 11481354,
    number_of_pages_median: 607,
    subject: Array.from({ length: 15 }, (_, i) => `Subject ${i}`),
  };

  it("maps a full doc", () => {
    expect(mapSearchDoc(doc)).toEqual({
      key: "OL893414W",
      title: "Dune",
      authors: ["Frank Herbert"],
      year: 1965,
      coverImage: "https://covers.openlibrary.org/b/id/11481354-L.jpg",
      coverImageSmall: "https://covers.openlibrary.org/b/id/11481354-M.jpg",
      pages: 607,
      subjects: doc.subject.slice(0, 10),
      isbn: null,
      formatGuess: "NOVEL",
      source: "openlibrary",
      editionTitle: null,
    });
  });

  it("handles missing cover, authors, year, pages and subjects", () => {
    const result = mapSearchDoc({ key: "/works/OL1W", title: "Untitled draft" });
    expect(result).toMatchObject({
      authors: [],
      year: null,
      coverImage: "",
      coverImageSmall: "",
      pages: null,
      subjects: [],
    });
  });

  it("returns null without a work key or title", () => {
    expect(mapSearchDoc({ ...doc, key: undefined })).toBeNull();
    expect(mapSearchDoc({ ...doc, title: "" })).toBeNull();
    expect(mapSearchDoc("nope")).toBeNull();
  });

  it("carries the ISBN when given", () => {
    expect(mapSearchDoc(doc, "9780441013593")?.isbn).toBe("9780441013593");
  });
});

describe("network", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  it("searchBooks sends the User-Agent and fields, and maps results", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ numFound: 25, docs: [{ key: "/works/OL1W", title: "Dune" }, { title: "no key" }] }),
    );

    const page = await searchBooks("dune messiah", 2);

    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://openlibrary.org/search.json");
    expect(parsed.searchParams.get("q")).toBe("dune messiah");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.get("limit")).toBe("10");
    expect(parsed.searchParams.get("fields")).toContain("cover_i");
    expect(init.headers["User-Agent"]).toBe("ReadLedger (https://readledger.app; hello@readledger.app)");
    expect(page.data.map((b) => b.key)).toEqual(["OL1W"]);
    expect(page.pagination).toEqual({ currentPage: 2, hasNextPage: true });
  });

  it("searchBooks reports no next page on the last page", async () => {
    fetchMock.mockResolvedValueOnce(json({ numFound: 20, docs: [] }));
    const page = await searchBooks("last page query", 2);
    expect(page.pagination.hasNextPage).toBe(false);
  });

  it("searchBooks caches by normalised query", async () => {
    fetchMock.mockResolvedValueOnce(json({ numFound: 0, docs: [] }));
    await searchBooks("Cached Query", 1);
    await searchBooks("  cached query ", 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("searchBooks throws OpenLibraryError on a failed response or network error", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 503));
    await expect(searchBooks("down", 1)).rejects.toBeInstanceOf(OpenLibraryError);
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(searchBooks("offline", 1)).rejects.toBeInstanceOf(OpenLibraryError);
  });

  it("lookupIsbn queries isbn: and prefers the matched edition's cover", async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        numFound: 1,
        docs: [
          {
            key: "/works/OL893414W",
            title: "Dune",
            author_name: ["Frank Herbert"],
            cover_i: 11481354,
            editions: { docs: [{ key: "/books/OL17952222M", cover_i: 14856017 }] },
          },
        ],
      }),
    );

    const book = await lookupIsbn("9780441013593");

    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("q")).toBe("isbn:9780441013593");
    expect(book).toMatchObject({
      key: "OL893414W",
      isbn: "9780441013593",
      coverImage: "https://covers.openlibrary.org/b/id/14856017-L.jpg",
    });
  });

  it("keeps the work title and exposes the matched edition's title separately", async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        numFound: 1,
        docs: [
          {
            key: "/works/OL9W",
            title: "Cien años de soledad",
            editions: { docs: [{ title: "Cien años de soledad. - 4. edición" }] },
          },
        ],
      }),
    );
    const book = await lookupIsbn("9788497592208");
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("fields")).toContain("editions.title");
    expect(book?.title).toBe("Cien años de soledad");
    expect(book?.editionTitle).toBe("Cien años de soledad. - 4. edición");
  });

  it("lookupIsbn falls back to the work cover and returns null when nothing matches", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ numFound: 1, docs: [{ key: "/works/OL2W", title: "X", cover_i: 5, editions: { docs: [{}] } }] }),
    );
    expect((await lookupIsbn("0441013597"))?.coverImage).toBe(
      "https://covers.openlibrary.org/b/id/5-L.jpg",
    );
    fetchMock.mockResolvedValueOnce(json({ numFound: 0, docs: [] }));
    expect(await lookupIsbn("080442957X")).toBeNull();
  });

  it("getBookDetails follows a work redirect once", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ type: { key: "/type/redirect" }, location: "/works/OL893414W" }))
      .mockResolvedValueOnce(json({ description: { type: "/type/text", value: "Arrakis." } }));

    expect(await getBookDetails("OL893415W")).toEqual({ description: "Arrakis." });
    expect(fetchMock.mock.calls[1][0]).toBe("https://openlibrary.org/works/OL893414W.json");
  });

  it("getBookDetails returns no description when Open Library fails", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 500));
    expect(await getBookDetails("OL999W")).toEqual({ description: null });
  });
});
