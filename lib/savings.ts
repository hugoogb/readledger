type PricedVolume = { owned: boolean; pricePaid: number | null };

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
