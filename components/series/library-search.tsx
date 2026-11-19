"use client";

import { searchBooks } from "@/actions/openlibrary";
import { searchManga } from "@/actions/mangadex";
import { getExistingMangadexIds, getExistingOpenLibraryKeys } from "@/actions/series";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseIsbnQuery } from "@/lib/isbn";
import {
  formatMangaForSeries,
  type FormattedMangaData,
  type MangaSearchResult,
} from "@/lib/manga-api";
import type { BookSearchResult } from "@/lib/openlibrary-api";
import { BookOpen, ChevronLeft, ChevronRight, Edit3, Library, Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type LibrarySearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  /** Show Open Library books above MangaDex manga (see booksFirstInSearch). */
  booksFirst: boolean;
  onSelectManga: (data: FormattedMangaData) => void;
  onSelectBook: (book: BookSearchResult) => void;
  onAddManually: () => void;
};

const MIN_QUERY = 2;

/**
 * One search box over MangaDex and Open Library. Each source has its own
 * section with its own loading, empty and error state, so one source failing
 * never hides the other. An ISBN only searches Open Library.
 */
export function LibrarySearch({
  query,
  onQueryChange,
  booksFirst,
  onSelectManga,
  onSelectBook,
  onAddManually,
}: LibrarySearchProps) {
  const [debounced, setDebounced] = useState(query.trim());

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searching = debounced.length >= MIN_QUERY;
  const isbn = parseIsbnQuery(debounced);

  const books = <BookResults key={`b:${debounced}`} query={debounced} isbn={isbn} onSelect={onSelectBook} />;
  const manga = <MangaResults key={`m:${debounced}`} query={debounced} onSelect={onSelectManga} />;

  return (
    <div className="space-y-5">
      <Input
        type="search"
        enterKeyHint="search"
        aria-label="Search by title, author or ISBN"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by title, author or ISBN"
        autoFocus
        className="pl-11"
        icon={<Search className="w-5 h-5" />}
      />

      {searching ? (
        isbn ? (
          books
        ) : booksFirst ? (
          <>
            {books}
            {manga}
          </>
        ) : (
          <>
            {manga}
            {books}
          </>
        )
      ) : (
        <p className="text-sm text-foreground-muted text-center py-2">
          Find books on Open Library and manga on MangaDex.
        </p>
      )}

      <div className="border-t border-border pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onAddManually}
          className="w-full h-auto min-h-12 justify-start gap-3 whitespace-normal px-4 py-2.5 text-left"
        >
          <Edit3 className="w-5 h-5 shrink-0 text-accent" />
          <span>
            <span className="block font-semibold">Add manually</span>
            <span className="block text-sm font-normal text-foreground-muted">
              Can&apos;t find it? Type in the details yourself
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}

// --- Shared section plumbing ---

type PageResult<T> = { items: T[]; hasNextPage: boolean; existing: Set<string> };

type PagedSearch<T> =
  | { status: "loading"; page: number }
  | { status: "error"; page: number; message: string }
  | ({ status: "done"; page: number } & PageResult<T>);

/** Fetches `page` of a section; the caller remounts it (via key) per query. */
function usePagedSearch<T>(fetchPage: (page: number) => Promise<PageResult<T>>) {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<PagedSearch<T>>({ status: "loading", page: 1 });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", page });
    fetchPage(page).then(
      (result) => !cancelled && setState({ status: "done", page, ...result }),
      (err: unknown) =>
        !cancelled &&
        setState({
          status: "error",
          page,
          message: err instanceof Error ? err.message : "Search failed. Please try again.",
        }),
    );
    return () => {
      cancelled = true;
    };
    // fetchPage is recreated every render; the query is fixed per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, attempt]);

  return { state, setPage, retry: () => setAttempt((a) => a + 1) };
}

function SearchSection<T>({
  title,
  source,
  sourceUrl,
  search: { state, setPage, retry },
  emptyText,
  renderItem,
}: {
  title: string;
  source: string;
  sourceUrl: string;
  search: ReturnType<typeof usePagedSearch<T>>;
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <section aria-label={title} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {title}{" "}
          <span className="font-normal text-foreground-muted">
            · from{" "}
            <a href={sourceUrl} target="_blank" rel="noopener" className="underline hover:text-foreground">
              {source}
            </a>
          </span>
        </h3>
        {state.status === "loading" && (
          <Loader2 className="w-4 h-4 text-foreground-muted animate-spin" aria-label="Loading" />
        )}
      </div>

      {state.status === "error" ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
          <p className="text-sm text-foreground-muted">{state.message}</p>
          <Button variant="outline" size="sm" type="button" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : state.status === "done" && state.items.length === 0 ? (
        <p className="text-sm text-foreground-muted px-1 py-2">{emptyText}</p>
      ) : state.status === "done" ? (
        <>
          <div className="space-y-1.5">
            {state.items.map(renderItem)}
          </div>
          {(state.page > 1 || state.hasNextPage) && (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setPage(state.page - 1)}
                disabled={state.page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-xs text-foreground-muted">Page {state.page}</span>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setPage(state.page + 1)}
                disabled={!state.hasNextPage}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="h-16 rounded-xl bg-background-tertiary/60 animate-pulse" />
      )}
    </section>
  );
}

function ResultButton({
  title,
  subtitle,
  cover,
  inLibrary,
  onClick,
  children,
}: {
  title: string;
  subtitle?: string;
  cover: string;
  inLibrary: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inLibrary}
      className={`group w-full flex items-start gap-3 p-2.5 rounded-xl transition-colors text-left border ${
        inLibrary
          ? "opacity-60 cursor-not-allowed border-border bg-background-secondary"
          : "cursor-pointer border-transparent hover:bg-background-tertiary hover:border-border"
      }`}
    >
      {cover ? (
        <Image
          width={48}
          height={64}
          src={cover}
          alt=""
          className="w-12 h-16 rounded-lg object-cover shrink-0 shadow-sm bg-background-tertiary"
        />
      ) : (
        <div className="w-12 h-16 rounded-lg bg-background-tertiary flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-foreground-muted" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
          {title}
        </h4>
        {subtitle && <p className="text-sm text-foreground-muted truncate">{subtitle}</p>}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {inLibrary && (
            <Badge variant="secondary" size="sm" className="bg-accent/15 text-accent border-none gap-1">
              <Library className="w-3 h-3" />
              In library
            </Badge>
          )}
          {children}
        </div>
      </div>
    </button>
  );
}

const mutedBadge = "bg-foreground-muted/10 text-foreground-muted border-none";

// --- Sources ---

function BookResults({
  query,
  isbn,
  onSelect,
}: {
  query: string;
  isbn: string | null;
  onSelect: (book: BookSearchResult) => void;
}) {
  const search = usePagedSearch<BookSearchResult>(async (page) => {
    const result = await searchBooks(query, page);
    if (!result.ok) throw new Error(result.error);
    const keys = result.data.data.map((b) => b.key);
    const existing = keys.length > 0 ? await getExistingOpenLibraryKeys(keys) : [];
    return {
      items: result.data.data,
      hasNextPage: result.data.pagination.hasNextPage,
      existing: new Set(existing),
    };
  });
  const existing = search.state.status === "done" ? search.state.existing : new Set<string>();

  return (
    <SearchSection
      title="Books"
      source="Open Library"
      sourceUrl="https://openlibrary.org"
      search={search}
      emptyText={isbn ? `No book found for ISBN ${isbn}` : `No books found for "${query}"`}
      renderItem={(book) => {
        const inLibrary = existing.has(book.key);
        return (
          <ResultButton
            key={book.key}
            title={book.title}
            subtitle={book.authors.slice(0, 3).join(", ") || undefined}
            cover={book.coverImageSmall}
            inLibrary={inLibrary}
            onClick={() => !inLibrary && onSelect(book)}
          >
            {book.formatGuess === "COMIC" && (
              <Badge variant="secondary" size="sm" className="bg-accent/10 text-accent border-none">
                Comic
              </Badge>
            )}
            {book.year && (
              <Badge variant="secondary" size="sm" className={mutedBadge}>
                {book.year}
              </Badge>
            )}
            {book.pages && (
              <Badge variant="secondary" size="sm" className={mutedBadge}>
                {book.pages} pages
              </Badge>
            )}
          </ResultButton>
        );
      }}
    />
  );
}

function MangaResults({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (data: FormattedMangaData) => void;
}) {
  const search = usePagedSearch<MangaSearchResult>(async (page) => {
    let result;
    try {
      result = await searchManga(query, page);
    } catch {
      // Server action errors arrive without a usable message in production.
      throw new Error("MangaDex search failed. Please try again.");
    }
    const ids = result.data.map((m) => m.id);
    const existing = ids.length > 0 ? await getExistingMangadexIds(ids) : [];
    return {
      items: result.data,
      hasNextPage: result.pagination.hasNextPage,
      existing: new Set(existing),
    };
  });
  const existing = search.state.status === "done" ? search.state.existing : new Set<string>();

  return (
    <SearchSection
      title="Manga"
      source="MangaDex"
      sourceUrl="https://mangadex.org"
      search={search}
      emptyText={`No manga found for "${query}"`}
      renderItem={(manga) => {
        const inLibrary = existing.has(manga.id);
        return (
          <ResultButton
            key={manga.id}
            title={manga.title}
            subtitle={manga.authors.join(", ") || undefined}
            cover={manga.coverImageSmall}
            inLibrary={inLibrary}
            onClick={() => !inLibrary && onSelect(formatMangaForSeries(manga))}
          >
            {manga.lastVolume && (
              <Badge variant="secondary" size="sm" className="bg-accent/10 text-accent border-none">
                {manga.lastVolume} vols
              </Badge>
            )}
            <Badge
              variant="secondary"
              size="sm"
              className={
                manga.status === "ongoing" ? "bg-success/10 text-success border-none" : mutedBadge
              }
            >
              {manga.status.charAt(0).toUpperCase() + manga.status.slice(1)}
            </Badge>
            {manga.year && (
              <Badge variant="secondary" size="sm" className={mutedBadge}>
                {manga.year}
              </Badge>
            )}
            {manga.score && (
              <Badge variant="secondary" size="sm" className="bg-warning/10 text-warning border-none">
                ★ {manga.score}
              </Badge>
            )}
          </ResultButton>
        );
      }}
    />
  );
}
