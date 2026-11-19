"use client";

import { toggleVolumeRead, updateVolume } from "@/actions/volumes";
import { toggleWishlist } from "@/actions/wishlist";
import { useFormatCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { VolumeDetailsModal } from "@/components/volumes/volume-details-modal";
import { conditionLabels } from "@/lib/constants";
import { unwrap } from "@/lib/unwrap";
import type { VolumeWithStore } from "@/types";
import { formatShortDate, todayInputValue } from "@/utils/date";
import { BookMarked, Check, Heart, Package, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

type UserStore = { id: string; name: string };

type BookPanelProps = {
  /** The book's single volume row. */
  volume: VolumeWithStore;
  title: string;
  retailPrice: number | null;
  stores: UserStore[];
};

type Flags = Pick<VolumeWithStore, "owned" | "read" | "wishlist">;
type Field = keyof Flags;

type EditingState = { focusField?: "readDate" } | null;

/**
 * A standalone book's own panel: large owned/read toggles (the same server
 * actions as a volume cell) and the copy's details, instead of a volume grid.
 */
export function BookPanel({ volume, title, retailPrice, stores }: BookPanelProps) {
  const router = useRouter();
  const formatCurrency = useFormatCurrency();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<EditingState>(null);

  // Instant feedback; reconciles when the server data refreshes. Owning a
  // book takes it off the wishlist, as the server does.
  const [flags, toggleOptimistic] = useOptimistic<Flags, Field>(
    { owned: volume.owned, read: volume.read, wishlist: volume.wishlist },
    (state, field) => {
      const next = { ...state, [field]: !state[field] };
      if (field === "owned" && next.owned) next.wishlist = false;
      return next;
    },
  );

  const run = (field: Field, action: () => Promise<void>) => {
    startTransition(async () => {
      toggleOptimistic(field);
      try {
        await action();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  };

  const handleOwned = () =>
    run("owned", async () => {
      if (volume.owned) {
        // Clears the purchase details but keeps "read": you can have read a
        // book you've since given away.
        unwrap(
          await updateVolume(volume.id, {
            owned: false,
            pricePaid: null,
            condition: null,
            storeId: null,
            purchaseDate: null,
          }),
        );
        toast.success(`${title} removed from your collection`);
      } else {
        unwrap(
          await updateVolume(volume.id, {
            owned: true,
            purchaseDate: new Date(todayInputValue()),
          }),
        );
        toast.success(`${title} marked as owned`, {
          action: { label: "Add details", onClick: () => setEditing({}) },
        });
      }
      router.refresh();
    });

  const handleRead = () =>
    run("read", async () => {
      const willBeRead = !volume.read;
      unwrap(await toggleVolumeRead(volume.id, todayInputValue()));
      toast.success(
        `${title} marked as ${willBeRead ? "read" : "unread"}`,
        willBeRead
          ? {
              action: {
                label: "Change date",
                onClick: () => setEditing({ focusField: "readDate" }),
              },
            }
          : undefined,
      );
    });

  const handleWishlist = () =>
    run("wishlist", async () => {
      const willBeWishlisted = !volume.wishlist;
      unwrap(await toggleWishlist(volume.id));
      toast.success(
        willBeWishlisted ? `${title} added to wishlist` : `${title} removed from wishlist`,
      );
    });

  const saved =
    retailPrice != null && volume.pricePaid != null && retailPrice > volume.pricePaid
      ? retailPrice - volume.pricePaid
      : null;

  const details = [
    {
      label: "Paid",
      value:
        volume.pricePaid != null
          ? `${formatCurrency(volume.pricePaid)}${saved ? ` (saved ${formatCurrency(saved)})` : ""}`
          : null,
    },
    { label: "Condition", value: volume.condition ? conditionLabels[volume.condition] : null },
    {
      label: "Bought",
      value:
        [volume.purchaseDate && formatShortDate(volume.purchaseDate), volume.store?.name]
          .filter(Boolean)
          .join(" · ") || null,
    },
    { label: "Read", value: volume.readDate ? formatShortDate(volume.readDate) : null },
    { label: "ISBN", value: volume.isbn },
    { label: "Notes", value: volume.notes },
  ].filter((d): d is { label: string; value: string } => Boolean(d.value));

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      {editing && (
        <VolumeDetailsModal
          volume={volume}
          label={title}
          seriesDefaults={{ retailPrice }}
          stores={stores}
          isOpen
          focusField={editing.focusField}
          onClose={() => setEditing(null)}
        />
      )}

      <div className={`grid gap-3 ${flags.owned ? "grid-cols-2" : "grid-cols-[1fr_1fr_auto]"}`}>
        <Button
          variant={flags.owned ? "default" : "secondary"}
          onClick={handleOwned}
          aria-pressed={flags.owned}
          className="h-14 text-base"
        >
          {flags.owned ? <Check /> : <Package />}
          {flags.owned ? "Owned" : "Not owned"}
        </Button>
        <Button
          variant={flags.read ? "success" : "secondary"}
          onClick={handleRead}
          aria-pressed={flags.read}
          className="h-14 text-base"
        >
          {flags.read ? <Check /> : <BookMarked />}
          {flags.read ? "Read" : "Unread"}
        </Button>
        {/* Wishlisting is for books you don't own yet. */}
        {!flags.owned && (
        <Button
          variant="secondary"
          size="icon"
          onClick={handleWishlist}
          aria-pressed={flags.wishlist}
          aria-label={flags.wishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={`h-14 w-14 ${flags.wishlist ? "bg-error text-white hover:bg-error/90" : ""}`}
        >
          <Heart className={flags.wishlist ? "fill-current" : ""} />
        </Button>
        )}
      </div>

      {details.length > 0 ? (
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          {details.map((d) => (
            <div key={d.label} className="contents">
              <dt className="text-foreground-muted">{d.label}</dt>
              <dd className="font-medium min-w-0 wrap-break-word">{d.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-6 text-sm text-foreground-muted">
          No details yet. Add what you paid, where you bought it and when you read it.
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={() => setEditing({})} className="gap-2">
          <Pencil className="w-4 h-4" />
          Edit details
        </Button>
      </div>
    </div>
  );
}
