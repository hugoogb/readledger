"use client";

import { memo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SeriesDefaults, VolumeWithStore } from "@/types";
import { formatCurrency } from "@/utils/currency";
import {
  BookMarked,
  Check,
  Heart,
  Package,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { VolumeDetailsModal } from "./volume-details-modal";

type UserStore = { id: string; name: string };

type VolumeCellProps = {
  volume: VolumeWithStore;
  seriesDefaults?: SeriesDefaults;
  stores?: UserStore[];
  onToggleRead: (volume: VolumeWithStore) => void;
  onToggleWishlist: (volume: VolumeWithStore) => void;
};

export const VolumeCell = memo(function VolumeCell({
  volume,
  seriesDefaults,
  stores,
  onToggleRead,
  onToggleWishlist,
}: VolumeCellProps) {
  const [showModal, setShowModal] = useState(false);

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleRead(volume);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(volume);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const isOwned = volume.owned;
  const isRead = volume.read;
  const isWishlisted = volume.wishlist && !isOwned;
  const hasCover = !!volume.coverImage;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenModal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpenModal(e as unknown as React.MouseEvent);
          }
        }}
        className={`
          group relative aspect-3/4 rounded-xl overflow-hidden cursor-pointer
          transition-all duration-200 w-full text-left bg-transparent p-0
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
          ${
            isOwned
              ? isRead
                ? "ring-2 ring-success/60 shadow-md shadow-success/20"
                : "ring-2 ring-accent/60 shadow-md shadow-accent/20"
              : "ring-1 ring-border hover:ring-border-hover"
          }
        `}
        aria-label={`Volume ${volume.volumeNumber}${isOwned ? (isRead ? ", owned and read" : ", owned") : ", not owned"}`}
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
            fill
            src={volume.coverImage!}
            alt={`Volume ${volume.volumeNumber}`}
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 11vw, 11vw"
            className="object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
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
        {isOwned ? (
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
        ) : isWishlisted ? (
          <div className="absolute top-1 right-1 z-10">
            <Badge
              size="sm"
              variant="destructive"
              className="gap-0.5 uppercase font-bold"
            >
              <Heart className="w-2.5 h-2.5 fill-current" />
              Want
            </Badge>
          </div>
        ) : null}

        {/* Price badge */}
        {volume.pricePaid != null && isOwned && (
          <div className="hidden lg:block absolute top-1 left-1 z-10">
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
          <div className="hidden lg:block absolute bottom-1 left-1 z-10">
            <Badge
              size="sm"
              variant="secondary"
              className="bg-black/60 text-white/80 border-none gap-0.5"
            >
              <ShoppingBag className="w-2.5 h-2.5" />
              {volume.store.name}
            </Badge>
          </div>
        )}

        {/* Action Buttons - Bottom Right.
            On touch devices there's no hover, so the buttons are always
            visible; on sm+ pointers they reveal on hover/focus to keep covers
            clean. */}
        <div className="flex absolute bottom-1 right-1 z-20 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          {!isOwned ? (
            <>
              <Button
                size="icon-sm"
                onClick={handleToggleWishlist}
                variant="secondary"
                className={`rounded-md ${isWishlisted ? "bg-error text-white hover:bg-error/90" : ""}`}
                aria-label={`${isWishlisted ? "Remove" : "Add"} volume ${volume.volumeNumber} ${isWishlisted ? "from" : "to"} wishlist`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`}
                />
              </Button>
              <Button
                size="icon-sm"
                onClick={handleOpenModal}
                variant="secondary"
                className="rounded-md"
                aria-label={`Mark volume ${volume.volumeNumber} as owned`}
              >
                <Package className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <Button
              size="icon-sm"
              onClick={handleToggleRead}
              variant={isRead ? "success" : "secondary"}
              className="rounded-md"
              aria-label={`Mark volume ${volume.volumeNumber} as ${isRead ? "unread" : "read"}`}
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
          stores={stores}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
},
(prev, next) =>
  prev.volume.id === next.volume.id &&
  prev.volume.owned === next.volume.owned &&
  prev.volume.read === next.volume.read &&
  prev.volume.wishlist === next.volume.wishlist &&
  prev.volume.pricePaid === next.volume.pricePaid &&
  prev.volume.coverImage === next.volume.coverImage &&
  prev.volume.store?.id === next.volume.store?.id,
);
