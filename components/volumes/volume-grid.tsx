"use client";

import type { SeriesDefaults, VolumeWithStore } from "@/types";
import { BookOpen } from "lucide-react";
import { VolumeCell } from "./volume-cell";

type UserStore = { id: string; name: string };

type VolumeGridProps = {
  volumes: VolumeWithStore[];
  totalVolumes: number | null;
  seriesDefaults?: SeriesDefaults;
  stores?: UserStore[];
};

function EmptyVolumeCell({ volumeNumber }: { volumeNumber: number }) {
  return (
    <div
      className="
        aspect-3/4 rounded-xl
        border-2 border-dashed border-border/40
        bg-background-secondary/20
        flex items-center justify-center
      "
    >
      <span className="text-xl font-bold text-foreground-muted/20">
        {volumeNumber}
      </span>
    </div>
  );
}

export function VolumeGrid({
  volumes,
  totalVolumes,
  seriesDefaults,
  stores,
}: VolumeGridProps) {
  const maxVolume =
    totalVolumes || Math.max(...volumes.map((v) => v.volumeNumber), 0);

  const volumeMap = new Map(volumes.map((v) => [v.volumeNumber, v]));

  const volumeSlots = Array.from({ length: maxVolume }, (_, i) => {
    const num = i + 1;
    return volumeMap.get(num) || null;
  });

  if (volumeSlots.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-foreground-muted/50 mx-auto mb-3" />
        <p className="text-foreground-muted">No volumes added yet</p>
        <p className="text-foreground-muted/60 text-sm mt-1">
          Update the series to set the total number of volumes
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
        {volumeSlots.map((volume, index) =>
          volume ? (
            <VolumeCell
              key={volume.id}
              volume={volume}
              seriesDefaults={seriesDefaults}
              stores={stores}
            />
          ) : (
            <EmptyVolumeCell key={index} volumeNumber={index + 1} />
          ),
        )}
      </div>
    </div>
  );
}
