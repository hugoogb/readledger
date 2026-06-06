"use client";

import { toggleVolumeRead } from "@/actions/volumes";
import { toggleWishlist } from "@/actions/wishlist";
import type { SeriesDefaults, VolumeWithStore } from "@/types";
import { BookOpen } from "lucide-react";
import { useCallback, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { VolumeCell } from "./volume-cell";

type UserStore = { id: string; name: string };

type VolumeGridProps = {
  volumes: VolumeWithStore[];
  totalVolumes: number | null;
  seriesDefaults?: SeriesDefaults;
  stores?: UserStore[];
};

type OptimisticAction = { id: string; field: "read" | "wishlist" };

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
  const [, startTransition] = useTransition();

  // Optimistic layer over the server-provided volumes. Both this reducer and
  // the server action toggle the boolean, so the UI updates instantly on click
  // and reconciles automatically when revalidatePath refreshes the page data.
  const [optimisticVolumes, applyOptimistic] = useOptimistic(
    volumes,
    (state, action: OptimisticAction) =>
      state.map((v) =>
        v.id === action.id ? { ...v, [action.field]: !v[action.field] } : v,
      ),
  );

  const handleToggleRead = useCallback(
    (volume: VolumeWithStore) => {
      const willBeRead = !volume.read;
      startTransition(async () => {
        applyOptimistic({ id: volume.id, field: "read" });
        try {
          await toggleVolumeRead(volume.id);
          toast.success(
            `Volume ${volume.volumeNumber} marked as ${willBeRead ? "read" : "unread"}`,
          );
        } catch {
          toast.error("Failed to update volume");
        }
      });
    },
    [applyOptimistic],
  );

  const handleToggleWishlist = useCallback(
    (volume: VolumeWithStore) => {
      const willBeWishlisted = !volume.wishlist;
      startTransition(async () => {
        applyOptimistic({ id: volume.id, field: "wishlist" });
        try {
          await toggleWishlist(volume.id);
          toast.success(
            willBeWishlisted
              ? `Volume ${volume.volumeNumber} added to wishlist`
              : `Volume ${volume.volumeNumber} removed from wishlist`,
          );
        } catch {
          toast.error("Failed to update wishlist");
        }
      });
    },
    [applyOptimistic],
  );

  const maxVolume =
    totalVolumes || Math.max(...optimisticVolumes.map((v) => v.volumeNumber), 0);

  const volumeMap = new Map(optimisticVolumes.map((v) => [v.volumeNumber, v]));

  const volumeSlots = Array.from({ length: maxVolume }, (_, i) => {
    const num = i + 1;
    return volumeMap.get(num) || null;
  });

  if (volumeSlots.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-3">
          <BookOpen className="w-7 h-7 text-accent" />
        </div>
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
              onToggleRead={handleToggleRead}
              onToggleWishlist={handleToggleWishlist}
            />
          ) : (
            <EmptyVolumeCell key={index} volumeNumber={index + 1} />
          ),
        )}
      </div>
    </div>
  );
}
