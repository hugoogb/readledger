import { getWishlistVolumes, getWishlistStats } from "@/actions/wishlist";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { Heart, Package, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { WishlistActions } from "@/components/wishlist/wishlist-actions";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Volumes you want to buy",
};

export default async function WishlistPage() {
  const [groups, stats] = await Promise.all([
    getWishlistVolumes(),
    getWishlistStats(),
  ]);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-1">Wishlist</h1>
        <p className="text-foreground-muted">
          Volumes you want to add to your collection
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in stagger-1">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-error" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.count}</p>
            <p className="text-sm text-foreground-muted">Wishlisted volumes</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.seriesCount}</p>
            <p className="text-sm text-foreground-muted">Series</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.estimatedCost)}
            </p>
            <p className="text-sm text-foreground-muted">Estimated cost</p>
          </div>
        </div>
      </div>

      {/* Wishlist Groups */}
      {groups.length === 0 ? (
        <div className="text-center py-16 animate-fade-in stagger-2">
          <Heart className="w-16 h-16 text-foreground-muted/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No wishlisted volumes</h3>
          <p className="text-foreground-muted">
            Click the heart icon on any volume to add it to your wishlist
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group, idx) => (
            <div
              key={group.series.id}
              className="glass rounded-2xl p-6 animate-fade-in"
              style={{ animationDelay: `${(idx + 2) * 0.05}s` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <Link
                  href={`/dashboard/series/${group.series.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0 hover:text-accent transition-colors"
                >
                  {group.series.coverImage ? (
                    <Image
                      width={40}
                      height={56}
                      src={group.series.coverImage}
                      alt={group.series.title}
                      className="w-10 h-14 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded-lg bg-background-tertiary flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-foreground-muted/30" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">
                      {group.series.title}
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      {group.volumes.length} volume
                      {group.volumes.length !== 1 ? "s" : ""} wishlisted
                    </p>
                  </div>
                </Link>
                {group.series.retailPrice && (
                  <Badge variant="secondary" className="shrink-0">
                    ~{formatCurrency(group.series.retailPrice * group.volumes.length)}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {group.volumes.map((vol) => (
                  <WishlistActions key={vol.id} volume={vol} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
