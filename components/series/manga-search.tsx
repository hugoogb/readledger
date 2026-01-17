"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, BookOpen } from "lucide-react";
import {
  searchManga,
  formatMangaForSeries,
  type MangaSearchResult,
} from "@/lib/manga-api";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type MangaSearchProps = {
  onSelect: (data: ReturnType<typeof formatMangaForSeries>) => void;
};

export function MangaSearch({ onSelect }: MangaSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchManga(searchQuery);
      setResults(data);
    } catch {
      setError("Failed to search. Please try again.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (manga: MangaSearchResult) => {
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

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
        {results.length === 0 && query.length >= 2 && !isLoading && (
          <p className="text-sm text-foreground-muted text-center py-4">
            No results found for &quot;{query}&quot;
          </p>
        )}

        {results.map((manga) => (
          <button
            key={manga.mal_id}
            onClick={() => handleSelect(manga)}
            className="group cursor-pointer w-full flex items-start gap-3 p-3 rounded-xl hover:bg-background-tertiary transition-all text-left border border-transparent hover:border-border"
          >
            {manga.images.jpg.small_image_url ? (
              <Image
                width={48}
                height={64}
                src={manga.images.jpg.small_image_url}
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
                {manga.title_english || manga.title}
              </h4>
              {manga.authors.length > 0 && (
                <p className="text-sm text-foreground-muted truncate">
                  {manga.authors.map((a) => a.name).join(", ")}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                {manga.volumes && (
                  <Badge variant="secondary" size="sm" className="bg-accent/10 hover:bg-accent/20 text-accent border-none">
                    {manga.volumes} vols
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  size="sm"
                  className={manga.publishing
                    ? "bg-success/10 hover:bg-success/20 text-success border-none"
                    : "bg-foreground-muted/10 hover:bg-foreground-muted/20 text-foreground-muted border-none"
                  }
                >
                  {manga.publishing ? "Publishing" : "Finished"}
                </Badge>
                {manga.score && (
                  <Badge variant="secondary" size="sm" className="bg-warning/10 hover:bg-warning/20 text-warning border-none">
                    ★ {manga.score}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {query.length < 2 && (
        <p className="text-sm text-foreground-muted text-center py-4 italic">
          Type at least 2 characters to search...
        </p>
      )}
    </div>
  );
}
