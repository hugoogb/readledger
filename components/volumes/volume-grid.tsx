"use client";

import { useState, useTransition } from "react";
import type { Volume } from "@/lib/generated/prisma/browser";
import { toggleVolumeRead } from "@/actions/volumes";
import {
  BookOpen,
  Check,
  Package,
  BookMarked,
  ShoppingBag,
} from "lucide-react";
import { VolumeDetailsModal } from "./volume-details-modal";
import Image from "next/image";
import { formatCurrency } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type SeriesDefaults = {
  retailPrice?: number | null;
};

type VolumeGridProps = {
  volumes: Volume[];
  totalVolumes: number | null;
  seriesDefaults?: SeriesDefaults;
};

const storeLabels: Record<string, string> = {
  AMAZON: "Amazon",
  VINTED: "Vinted",
  WALLAPOP: "Wallapop",
  ABACUS: "Abacus",
  CASA_DEL_LIBRO: "CdL",
  NA: "N/A",
};

function VolumeCell({
  volume,
  seriesDefaults,
}: {
  volume: Volume;
  seriesDefaults?: SeriesDefaults;
}) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      try {
        await toggleVolumeRead(volume.id);
        window.dispatchEvent(new CustomEvent("stats-update"));
        toast.success(`Volume ${volume.volumeNumber} updated`);
      } catch {
        toast.error("Failed to update volume");
      }
    });
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const isOwned = volume.owned;
  const isRead = volume.read;
  const hasCover = !!volume.coverImage;

  return (
    <>
      <div
        className={`
          group relative aspect-3/4 rounded-xl overflow-hidden cursor-pointer
          transition-all duration-200
          ${isPending ? "opacity-50" : ""}
          ${
            isOwned
              ? isRead
                ? "ring-2 ring-success/60 shadow-md shadow-success/20"
                : "ring-2 ring-accent/60 shadow-md shadow-accent/20"
              : "ring-1 ring-border hover:ring-border-hover"
          }
        `}
        onClick={handleOpenModal}
      >
        {/* Background */}
        <div
          className={`
            absolute inset-0
            ${
              isOwned
                ? isRead
                  ? "bg-linear-to-br from-success/15 to-background-tertiary"
                  : "bg-linear-to-br from-accent/15 to-background-tertiary"
                : "bg-background-tertiary"
            }
          `}
        />

        {/* Cover Image */}
        {hasCover && (
          <Image
            width={192}
            height={256}
            src={volume.coverImage!}
            alt={`Volume ${volume.volumeNumber}`}
            className="absolute inset-0 object-cover"
          />
        )}

        {/* Volume Number */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            ${hasCover ? "bg-black/30" : ""}
          `}
        >
          <span
            className={`
              text-2xl font-bold
              ${
                hasCover
                  ? "text-white drop-shadow-md"
                  : isOwned
                    ? isRead
                      ? "text-success"
                      : "text-accent"
                    : "text-foreground-muted/50"
              }
            `}
          >
            {volume.volumeNumber}
          </span>
        </div>

        {/* Status Badge - Top Right */}
        {isOwned && (
          <div className="absolute top-1 right-1 z-10">
            <Badge
              size="sm"
              variant={isRead ? "success" : "default"}
              className="gap-0.5 uppercase font-bold"
            >
              {isRead ? (
                <>
                  <BookMarked className="w-2.5 h-2.5" />
                  Read
                </>
              ) : (
                <>
                  <Package className="w-2.5 h-2.5" />
                  Owned
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Price badge */}
        {volume.pricePaid != null && isOwned && (
          <div className="absolute top-1 left-1 z-10">
            <Badge
              size="sm"
              variant="secondary"
              className="bg-black/60 text-white border-none"
            >
              {formatCurrency(volume.pricePaid)}
            </Badge>
          </div>
        )}

        {/* Store badge - Bottom Left */}
        {volume.store && isOwned && (
          <div className="absolute bottom-1 left-1 z-10">
            <Badge
              size="sm"
              variant="secondary"
              className="bg-black/60 text-white/80 border-none gap-0.5"
            >
              <ShoppingBag className="w-2.5 h-2.5" />
              {storeLabels[volume.store]}
            </Badge>
          </div>
        )}

        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-1 right-1 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isOwned ? (
            <Button
              size="icon"
              onClick={handleOpenModal}
              disabled={isPending}
              variant={isOwned ? "default" : "secondary"}
              className="w-7 h-7 rounded-md bg-white text-background hover:bg-white/90"
              title={isOwned ? "Edit volume" : "Mark as owned"}
            >
              <Package className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleToggleRead}
              disabled={isPending}
              variant={isRead ? "success" : "secondary"}
              className={`w-7 h-7 rounded-md ${!isRead ? "bg-white text-background hover:bg-white/90" : ""}`}
              title={isRead ? "Mark as unread" : "Mark as read"}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {showModal && (
        <VolumeDetailsModal
          volume={volume}
          seriesDefaults={seriesDefaults}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

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
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
      {volumeSlots.map((volume, index) =>
        volume ? (
          <VolumeCell
            key={volume.id}
            volume={volume}
            seriesDefaults={seriesDefaults}
          />
        ) : (
          <EmptyVolumeCell key={index} volumeNumber={index + 1} />
        ),
      )}
    </div>
  );
}
