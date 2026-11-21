import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ throttleGoogleBooks: vi.fn(async () => {}) }));

import { lookupIsbnGoogle, mapGoogleVolume } from "@/lib/googlebooks-api";

const item = {
  id: "abc",
  volumeInfo: {
    title: "La sombra del viento",
    authors: ["Carlos Ruiz Zafón"],
    publishedDate: "2017-03-01",
    pageCount: 576,
    categories: ["Fiction"],
    imageLinks: {
      thumbnail: "http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&edge=curl",
    },
  },
};

const json = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

describe("mapGoogleVolume", () => {
  it("maps a volume", () => {
    expect(mapGoogleVolume(item, "9788408172177")).toEqual({
      key: "abc",
      title: "La sombra del viento",
      authors: ["Carlos Ruiz Zafón"],
      year: 2017,
      coverImage: "https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1",
      coverImageSmall: "https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1",
      pages: 576,
      subjects: ["Fiction"],
      isbn: "9788408172177",
      formatGuess: "NOVEL",
      source: "googlebooks",
      editionTitle: null,
    });
  });

  it("appends the subtitle and tolerates missing fields", () => {
    const book = mapGoogleVolume({ id: "x", volumeInfo: { title: "Dune", subtitle: "Edición" } }, "1");
    expect(book).toMatchObject({ title: "Dune: Edición", authors: [], year: null, coverImage: "", pages: null });
  });

  it("rejects a result whose identifiers don't include the scanned ISBN", () => {
    const other = { ...item, volumeInfo: { ...item.volumeInfo, industryIdentifiers: [{ type: "ISBN_13", identifier: "9780000000002" }] } };
    expect(mapGoogleVolume(other, "9788497592208")).toBeNull();
  });

  it("accepts a match on the ISBN-10 form", () => {
    const ten = { ...item, volumeInfo: { ...item.volumeInfo, industryIdentifiers: [{ type: "ISBN_10", identifier: "8497592204" }] } };
    expect(mapGoogleVolume(ten, "9788497592208")?.key).toBe("abc");
  });

  it("returns null without an id or title", () => {
    expect(mapGoogleVolume({ volumeInfo: { title: "X" } }, "1")).toBeNull();
    expect(mapGoogleVolume({ id: "x", volumeInfo: {} }, "1")).toBeNull();
  });
});

describe("lookupIsbnGoogle", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.GOOGLE_BOOKS_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    delete process.env.GOOGLE_BOOKS_API_KEY;
  });

  it("sends the key and isbn: query", async () => {
    fetchMock.mockResolvedValueOnce(json({ totalItems: 1, items: [item] }));
    const book = await lookupIsbnGoogle("9788408172177");
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("q")).toBe("isbn:9788408172177");
    expect(url.searchParams.get("key")).toBe("test-key");
    expect(book?.key).toBe("abc");
  });

  it("returns null without a key", async () => {
    delete process.env.GOOGLE_BOOKS_API_KEY;
    expect(await lookupIsbnGoogle("9788408172178")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null on upstream error", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 429));
    expect(await lookupIsbnGoogle("9788408172179")).toBeNull();
  });

  it("returns null when totalItems is 0", async () => {
    fetchMock.mockResolvedValueOnce(json({ totalItems: 0 }));
    expect(await lookupIsbnGoogle("9788408172180")).toBeNull();
  });
});
