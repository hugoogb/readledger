export function formatCurrency(amount: number, currency: string = "EUR") {
  const locale = currency === "EUR" ? "es-ES" : undefined;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
