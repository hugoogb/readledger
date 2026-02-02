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
