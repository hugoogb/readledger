"use client";

import { toggleWishlist } from "@/actions/wishlist";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
        await toggleWishlist(volume.id);
        toast.success(`Volume ${volume.volumeNumber} removed from wishlist`);
        router.refresh();
      } catch {
        toast.error("Failed to update wishlist");
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
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary/50 border border-border hover:border-error/50 hover:bg-error/5 transition-all duration-200 cursor-pointer disabled:cursor-default ${
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
