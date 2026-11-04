import type { ComponentType } from "react";
import { BestAppsGuide, bestAppsMeta } from "./best-apps";
import { BuyingUsedGuide, buyingUsedMeta } from "./buying-used";
import { CollectionCostGuide, collectionCostMeta } from "./collection-cost";
import { HowToTrackGuide, howToTrackMeta } from "./how-to-track";
import { SpreadsheetGuide, spreadsheetMeta } from "./spreadsheet-template";
import { SpreadsheetVsAppGuide, spreadsheetVsAppMeta } from "./spreadsheet-vs-app";

export type Guide = {
  slug: string;
  kind: string;
  title: string;
  heading: string;
  description: string;
  published: string;
  /** Change only when the content really changes: it feeds the sitemap's lastmod. */
  updated: string;
  Body: ComponentType;
};

export const guides: Guide[] = [
  { ...howToTrackMeta, Body: HowToTrackGuide },
  { ...bestAppsMeta, Body: BestAppsGuide },
  { ...spreadsheetMeta, Body: SpreadsheetGuide },
  { ...spreadsheetVsAppMeta, Body: SpreadsheetVsAppGuide },
  { ...collectionCostMeta, Body: CollectionCostGuide },
  { ...buyingUsedMeta, Body: BuyingUsedGuide },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
