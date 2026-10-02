"use client";

import { toggleWishlist } from "@/actions/wishlist";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { unwrap } from "@/lib/unwrap";

type WishlistActionsProps = {
  volume: {
    id: string;
    volumeNumber: number;
    coverImage?: string | null;
  };
};

export function WishlistActions({ volume }: WishlistActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Optimistically collapse the chip on click; the server revalidation then
  // removes it for good. Restored only if the action fails.
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    startTransition(async () => {
      try {
        unwrap(await toggleWishlist(volume.id));
        // One tap removes the chip, so a mis-tap while scrolling is easy:
        // offer an undo that toggles it back.
        toast.success(`Volume ${volume.volumeNumber} removed from wishlist`, {
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                unwrap(await toggleWishlist(volume.id));
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to undo");
              }
            },
          },
        });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update wishlist");
        setRemoving(false);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      aria-label={`Remove volume ${volume.volumeNumber} from wishlist`}
      className={`group relative flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary/50 border border-border hover:border-error/50 hover:bg-error/5 transition-all duration-200 cursor-pointer disabled:cursor-default ${
        removing ? "opacity-0 scale-90 pointer-events-none" : "opacity-100"
      }`}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-muted" />
      ) : (
        <Heart className="w-3.5 h-3.5 text-error fill-error group-hover:scale-110 transition-transform" />
      )}
      <span className="text-sm font-semibold">Vol. {volume.volumeNumber}</span>
    </button>
  );
}
