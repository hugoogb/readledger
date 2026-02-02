"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, BookOpen, ChevronLeft, ChevronRight, Library } from "lucide-react";
import {
  searchMangaPaginated,
  formatMangaForSeries,
  type MangaSearchResult,
  type PaginatedSearchResult,
} from "@/lib/manga-api";
import { getExistingMangadexIds } from "@/actions/series";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type MangaSearchProps = {
  onSelect: (data: ReturnType<typeof formatMangaForSeries>) => void;
};

export function MangaSearch({ onSelect }: MangaSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedSearchResult["pagination"]>({
    lastVisiblePage: 1,
    hasNextPage: false,
    currentPage: 1,
  });
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());

  const performSearch = useCallback(async (searchQuery: string, page: number) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setPagination({ lastVisiblePage: 1, hasNextPage: false, currentPage: 1 });
      return;
    }

    setIsLoading(true);

    try {
      const result = await searchMangaPaginated(searchQuery, page);
      setResults(result.data);
      setPagination(result.pagination);

      // Check which results are already in collection
      const mangadexIds = result.data.map((m) => m.id);
      if (mangadexIds.length > 0) {
        const existing = await getExistingMangadexIds(mangadexIds);
        setExistingIds(new Set(existing));
      }
    } catch {
      toast.error("Failed to search manga. Please try again.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search — reset page on query change
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      performSearch(query, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Immediate search on page change (not query change)
  useEffect(() => {
    if (currentPage > 1) {
      performSearch(query, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleSelect = (manga: MangaSearchResult) => {
    if (existingIds.has(manga.id)) return;
    const formatted = formatMangaForSeries(manga);
    onSelect(formatted);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a manga series..."
          autoFocus
          className="pl-11 pr-11"
          icon={<Search className="w-5 h-5" />}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted animate-spin" />
        )}
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
        {results.length === 0 && query.length >= 2 && !isLoading && (
          <p className="text-sm text-foreground-muted text-center py-4">
            No results found for &quot;{query}&quot;
          </p>
        )}

        {results.map((manga) => {
          const isInCollection = existingIds.has(manga.id);
          const isOngoing = manga.status === "ongoing";

          return (
            <button
              key={manga.id}
              onClick={() => handleSelect(manga)}
              disabled={isInCollection}
              className={`group w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left border ${
                isInCollection
                  ? "opacity-60 cursor-not-allowed border-border bg-background-secondary"
                  : "cursor-pointer hover:bg-background-tertiary border-transparent hover:border-border"
              }`}
            >
              {manga.coverImageSmall ? (
                <Image
                  width={48}
                  height={64}
                  src={manga.coverImageSmall}
                  alt={manga.title}
                  className="rounded-lg object-cover shrink-0 shadow-sm transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-12 h-16 rounded-lg bg-background-secondary flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-foreground-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                  {manga.title}
                </h4>
                {manga.authors.length > 0 && (
                  <p className="text-sm text-foreground-muted truncate">
                    {manga.authors.join(", ")}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {isInCollection && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="bg-accent/15 text-accent border-none gap-1"
                    >
                      <Library className="w-3 h-3" />
                      In collection
                    </Badge>
                  )}
                  {manga.lastVolume && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="bg-accent/10 hover:bg-accent/20 text-accent border-none"
                    >
                      {manga.lastVolume} vols
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    size="sm"
                    className={
                      isOngoing
                        ? "bg-success/10 hover:bg-success/20 text-success border-none"
                        : "bg-foreground-muted/10 hover:bg-foreground-muted/20 text-foreground-muted border-none"
                    }
                  >
                    {manga.status.charAt(0).toUpperCase() + manga.status.slice(1)}
                  </Badge>
                  {manga.year && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="bg-foreground-muted/10 text-foreground-muted border-none"
                    >
                      {manga.year}
                    </Badge>
                  )}
                  {manga.score && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="bg-warning/10 hover:bg-warning/20 text-warning border-none"
                    >
                      ★ {manga.score}
                    </Badge>
                  )}
                  {manga.demographic && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="bg-accent/10 text-accent border-none"
                    >
                      {manga.demographic.charAt(0).toUpperCase() + manga.demographic.slice(1)}
                    </Badge>
                  )}
                  {manga.genres.slice(0, 3).map((genre) => (
                    <Badge
                      key={genre.id}
                      variant="outline"
                      size="sm"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination controls */}
      {results.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || isLoading}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-foreground-muted">
            Page {pagination.currentPage} of {pagination.lastVisiblePage}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!pagination.hasNextPage || isLoading}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {query.length < 2 && (
        <p className="text-sm text-foreground-muted text-center py-4 italic">
          Type at least 2 characters to search...
        </p>
      )}
    </div>
  );
}
