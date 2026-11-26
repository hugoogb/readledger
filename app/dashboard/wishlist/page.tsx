import { getWishlistVolumes } from "@/actions/wishlist";
import { wishlistStats } from "@/services/wishlist";
import { Badge } from "@/components/ui/badge";
import { getFormatCurrency } from "@/lib/currency";
import { volumeLabel } from "@/lib/format";
import { CoverImage } from "@/components/books/cover-image";
import { Ledger, LedgerRow, LedgerTotal } from "@/components/ui/ledger";
import Link from "next/link";
import type { Metadata } from "next";
import { WishlistActions } from "@/components/wishlist/wishlist-actions";
import { plural } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Books you want to buy",
};

export default async function WishlistPage() {
  const [groups, formatCurrency] = await Promise.all([
    getWishlistVolumes(),
    getFormatCurrency(),
  ]);
  const stats = wishlistStats(groups);

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium mb-1">Wishlist</h1>
        <p className="text-foreground-muted">
          Books you want to add to your collection
        </p>
      </div>

      <Ledger className="mb-10 max-w-[40rem]">
        <LedgerRow label="Wishlisted books" value={stats.count} />
        <LedgerRow label="Titles" value={stats.seriesCount} />
        <LedgerTotal label="Estimated cost" value={formatCurrency(stats.estimatedCost)} />
      </Ledger>

      {groups.length === 0 ? (
        <div className="border-t-2 border-foreground py-8">
          <h3 className="font-serif text-2xl font-medium">No wishlisted books</h3>
          <p className="mt-1 text-foreground-muted">
            Tap the heart on any book or volume to add it to your wishlist
          </p>
        </div>
      ) : (
        <div className="border-t border-border">
          {groups.map((group) => (
            <div key={group.series.id} className="border-b border-border py-5">
              <div className="flex items-center gap-4 mb-4">
                <Link
                  href={`/dashboard/library/${group.series.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0 hover:text-accent transition-colors"
                >
                  <div className="w-12 shrink-0">
                    <CoverImage src={group.series.coverImage} title={group.series.title} sizes="48px" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg font-medium leading-snug truncate">
                      {group.series.title}
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      {group.series.standalone
                        ? "Wishlisted"
                        : `${plural(group.volumes.length, "volume")} wishlisted`}
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
                  <WishlistActions
                    key={vol.id}
                    volume={vol}
                    chipLabel={group.series.standalone ? "Remove" : `Vol. ${vol.volumeNumber}`}
                    name={volumeLabel(group.series.title, vol.volumeNumber, group.series.standalone)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
