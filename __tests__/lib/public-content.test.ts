import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseImport } from "@/lib/import";
import { mangaSeries, relatedSeries } from "@/lib/content/manga-series";
import { guides, guidesFor } from "@/content/guides";
import { SITE_URL } from "@/lib/site";
import { TEMPLATE_PATH } from "@/content/guides/spreadsheet-template";
import sitemap from "@/app/sitemap";

describe("manga series data", () => {
  it("has unique, URL-safe slugs and MangaDex ids", () => {
    const slugs = mangaSeries.map((series) => series.slug);
    const ids = mangaSeries.map((series) => series.mangadexId);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("gives every series a usable count, a credit, and a written note", () => {
    for (const series of mangaSeries) {
      expect(Number.isInteger(series.volumes) && series.volumes > 0, series.slug).toBe(true);
      expect(series.authors.length, series.slug).toBeGreaterThan(0);
      expect(series.note.length, series.slug).toBeGreaterThan(30);
    }
  });

  it("only claims an exact count for finished series", () => {
    for (const series of mangaSeries.filter((item) => item.exact)) {
      expect(series.status, series.slug).toBe("completed");
    }
  });

  it("never links a series page to itself", () => {
    for (const series of mangaSeries) {
      const related = relatedSeries(series);
      expect(related).toHaveLength(4);
      expect(related).not.toContainEqual(series);
    }
  });
});

describe("guides", () => {
  it("have unique slugs and search-friendly titles and descriptions", () => {
    expect(new Set(guides.map((guide) => guide.slug)).size).toBe(guides.length);
    for (const guide of guides) {
      expect(guide.title.length, guide.slug).toBeLessThanOrEqual(60);
      expect(guide.description.length, guide.slug).toBeLessThanOrEqual(170);
    }
  });

  it("keep every original manga guide slug, since they already rank", () => {
    const slugs = guidesFor("manga").map((guide) => guide.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "how-to-track-your-manga-collection",
        "best-manga-collection-tracker-apps",
        "manga-collection-spreadsheet-template",
        "manga-spreadsheet-vs-notion-vs-app",
        "how-much-does-a-manga-collection-cost",
        "buying-used-manga-condition-guide",
      ]),
    );
  });

  it("split into general and manga guides with nothing left out", () => {
    expect(guidesFor("books").length).toBeGreaterThanOrEqual(2);
    expect(guidesFor("books").length + guidesFor("manga").length).toBe(guides.length);
  });
});

describe("spreadsheet template", () => {
  it("imports without errors, since the guide promises it will", () => {
    const csv = readFileSync(join(process.cwd(), "public", TEMPLATE_PATH), "utf8");
    const preview = parseImport(csv, "csv");
    expect(preview.errors).toEqual([]);
    expect(preview.volumeCount).toBe(3);
    expect(preview.rows[1]).toMatchObject({ owned: true, read: false, condition: "VERY_GOOD" });
  });
});

describe("sitemap", () => {
  it("lists every public page exactly once", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength(4 + mangaSeries.length + guides.length);
    expect(urls).toContain(`${SITE_URL}/books`);
  });
});
