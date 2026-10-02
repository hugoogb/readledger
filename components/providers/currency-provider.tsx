"use client";

import { formatCurrency } from "@/utils/currency";
import { createContext, useCallback, useContext, type ReactNode } from "react";

const CurrencyContext = createContext("EUR");

/** Provides the signed-in user's currency to client components. */
export function CurrencyProvider({ currency, children }: { currency: string; children: ReactNode }) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/** formatCurrency bound to the user's currency. */
export function useFormatCurrency() {
  const currency = useCurrency();
  return useCallback((amount: number) => formatCurrency(amount, currency), [currency]);
}
