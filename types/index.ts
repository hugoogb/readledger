import type { Series, Volume, UserStore } from "@/lib/generated/prisma/browser";

export type VolumeWithStore = Volume & {
  store?: UserStore | null;
};

export type SeriesDefaults = {
  retailPrice?: number | null;
};

/** The subset of a series the grid card and list sorts need. */
export type SeriesCardData = Pick<
  Series,
  "id" | "title" | "author" | "status" | "format" | "publishing" | "coverImage" | "totalVolumes"
> & {
  volumes: Pick<Volume, "owned" | "read">[];
};
