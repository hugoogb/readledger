import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/utils/currency";

/** Server components: formatCurrency bound to the signed-in user's currency. */
export async function getFormatCurrency() {
  const currency = (await getCurrentUser())?.currency ?? "EUR";
  return (amount: number) => formatCurrency(amount, currency);
}
