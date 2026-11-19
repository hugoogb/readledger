"use server";

import { withResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { parseIsbnQuery } from "@/lib/isbn";
import {
  getBookDetails as fetchBookDetails,
  lookupIsbn,
  searchBooks as searchOpenLibrary,
  type BookSearchPage,
} from "@/lib/openlibrary-api";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Both actions go through the shared 1 req/s Open Library throttle, so they
// require a session and bounded inputs to keep anonymous callers off it.
// They return ActionResult values so the add modal can show an Open Library
// failure in the Books section without breaking the Manga section.
const searchInput = z.object({
  query: z.string().trim().min(2).max(200),
  page: z.number().int().min(1).max(100),
});

const workKeyInput = z.string().regex(/^OL\d+W$/, "Invalid Open Library work");

function limit(userId: string) {
  checkRateLimit(`openlibrary:${userId}`, 30, 60_000);
}

/** Title/author search, or an exact edition lookup when the query is an ISBN. */
export const searchBooks = withResult(
  async (query: string, page: number = 1): Promise<BookSearchPage> => {
    const user = await requireUser();
    const input = searchInput.parse({ query, page });
    limit(user.id);

    const isbn = parseIsbnQuery(input.query);
    if (!isbn) return searchOpenLibrary(input.query, input.page);

    const book = await lookupIsbn(isbn);
    return {
      data: book ? [book] : [],
      pagination: { currentPage: 1, hasNextPage: false },
    };
  },
);

/** Description for the selected work; null when Open Library can't say. */
export const getBookDetails = withResult(async (workKey: string) => {
  const user = await requireUser();
  const key = workKeyInput.parse(workKey);
  limit(user.id);
  return fetchBookDetails(key);
});
