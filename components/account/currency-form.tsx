"use client";

import { updateCurrency } from "@/actions/user-settings";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { unwrap } from "@/lib/unwrap";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "EUR", label: "Euro (€)" },
  { code: "USD", label: "US dollar ($)" },
  { code: "GBP", label: "British pound (£)" },
  { code: "JPY", label: "Japanese yen (¥)" },
  { code: "MXN", label: "Mexican peso (MX$)" },
  { code: "ARS", label: "Argentine peso (ARS)" },
  { code: "CLP", label: "Chilean peso (CLP)" },
  { code: "COP", label: "Colombian peso (COP)" },
  { code: "BRL", label: "Brazilian real (R$)" },
  { code: "CAD", label: "Canadian dollar (CA$)" },
  { code: "AUD", label: "Australian dollar (A$)" },
  { code: "CHF", label: "Swiss franc (CHF)" },
];

export function CurrencyForm({ initialCurrency }: { initialCurrency: string }) {
  const router = useRouter();
  const [currency, setCurrency] = useState(initialCurrency);
  const [isPending, startTransition] = useTransition();

  const options = CURRENCIES.some((c) => c.code === initialCurrency)
    ? CURRENCIES
    : [{ code: initialCurrency, label: initialCurrency }, ...CURRENCIES];

  function handleChange(next: string) {
    const previous = currency;
    setCurrency(next);
    startTransition(async () => {
      try {
        unwrap(await updateCurrency(next));
        toast.success("Currency updated");
        router.refresh();
      } catch (err) {
        setCurrency(previous);
        toast.error(err instanceof Error ? err.message : "Failed to update currency");
      }
    });
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="currency">Currency</Label>
      <Select
        id="currency"
        value={currency}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="sm:w-72"
      >
        {options.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </Select>
      <p className="text-xs text-foreground-muted">
        Used to display prices. Amounts aren&apos;t converted.
      </p>
    </div>
  );
}
