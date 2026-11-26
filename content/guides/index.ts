import type { ComponentType } from "react";
import { BestAppsGuide, bestAppsMeta } from "./best-apps";
import { BookSpendingGuide, bookSpendingMeta } from "./book-spending";
import { BuyingUsedGuide, buyingUsedMeta } from "./buying-used";
import { CatalogHomeLibraryGuide, catalogHomeLibraryMeta } from "./catalog-home-library";
import { CollectionCostGuide, collectionCostMeta } from "./collection-cost";
import { HowToTrackGuide, howToTrackMeta } from "./how-to-track";
import { SpreadsheetGuide, spreadsheetMeta } from "./spreadsheet-template";
import { SpreadsheetVsAppGuide, spreadsheetVsAppMeta } from "./spreadsheet-vs-app";

export type Guide = {
  slug: string;
  kind: string;
  audience: "books" | "manga";
  title: string;
  heading: string;
  description: string;
  published: string;
  updated: string;
  Body: ComponentType;
};

export const guides: Guide[] = [
  { ...catalogHomeLibraryMeta, audience: "books", Body: CatalogHomeLibraryGuide },
  { ...bookSpendingMeta, audience: "books", Body: BookSpendingGuide },
  { ...howToTrackMeta, audience: "manga", Body: HowToTrackGuide },
  { ...bestAppsMeta, audience: "manga", Body: BestAppsGuide },
  { ...spreadsheetMeta, audience: "manga", Body: SpreadsheetGuide },
  { ...spreadsheetVsAppMeta, audience: "manga", Body: SpreadsheetVsAppGuide },
  { ...collectionCostMeta, audience: "manga", Body: CollectionCostGuide },
  { ...buyingUsedMeta, audience: "manga", Body: BuyingUsedGuide },
];

export function guidesFor(audience: Guide["audience"]): Guide[] {
  return guides.filter((guide) => guide.audience === audience);
}

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
