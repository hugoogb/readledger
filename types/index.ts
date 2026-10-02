import type { Series, Volume, Publisher, UserStore } from "@/lib/generated/prisma/browser";

export type VolumeWithStore = Volume & {
  store?: UserStore | null;
};

export type SeriesWithVolumes = Series & {
  publisher?: Publisher | null;
  volumes: Volume[];
};

export type SeriesWithFullVolumes = Series & {
  publisher?: Publisher | null;
  volumes: VolumeWithStore[];
};

export type SeriesDefaults = {
  retailPrice?: number | null;
};

/** The subset of a series the grid card and list sorts need. */
export type SeriesCardData = Pick<
  Series,
  "id" | "title" | "author" | "status" | "publishing" | "coverImage" | "totalVolumes"
> & {
  volumes: Pick<Volume, "owned" | "read">[];
};
