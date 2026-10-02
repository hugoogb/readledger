type PricedVolume = { owned: boolean; pricePaid: number | null };

/**
 * Savings versus retail, counted only over volumes where both prices are
 * known. An owned volume with no recorded price (or a series with no retail
 * price) is left out entirely, rather than counting as 100% saved or as pure
 * overspend.
 */
export function comparableSavings(
  volumes: PricedVolume[],
  retailPrice: number | null,
) {
  if (!retailPrice) return { retailValue: 0, paid: 0, savings: 0 };

  let retailValue = 0;
  let paid = 0;
  for (const v of volumes) {
    if (!v.owned || v.pricePaid == null) continue;
    retailValue += retailPrice;
    paid += v.pricePaid;
  }

  return { retailValue, paid, savings: retailValue - paid };
}
