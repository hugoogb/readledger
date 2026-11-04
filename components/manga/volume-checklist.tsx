"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type Saved = { owned: number[]; price: string };

function storageKey(slug: string) {
  return `readledger:checklist:${slug}`;
}

// Browser storage can throw or come back empty (private windows, blocked site
// data). Writes also go to this map, so the checklist still works for the visit.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function readRaw(key: string): string | null {
  const inMemory = memory.get(key);
  if (inMemory !== undefined) return inMemory;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not saved between visits; still usable now.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  // Another tab changed the list, so this tab's copy in memory is out of date.
  const onStorage = (event: StorageEvent) => {
    if (event.key) memory.delete(event.key);
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function parse(raw: string | null, volumes: number): Saved {
  if (!raw) return { owned: [], price: "" };
  try {
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return {
      owned: (Array.isArray(parsed.owned) ? parsed.owned : []).filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= volumes,
      ),
      price: typeof parsed.price === "string" ? parsed.price : "",
    };
  } catch {
    return { owned: [], price: "" };
  }
}

/**
 * The volumes render on the server, so the full list is in the page's HTML.
 * useSyncExternalStore renders the empty server snapshot first, then swaps in
 * saved ticks after hydration without a mismatch.
 */
export function VolumeChecklist({
  slug,
  title,
  volumes,
}: {
  slug: string;
  title: string;
  volumes: number;
}) {
  const key = storageKey(slug);
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  const saved = useMemo(() => parse(raw, volumes), [raw, volumes]);
  const owned = useMemo(() => new Set(saved.owned), [saved.owned]);
  const { price } = saved;

  const update = useCallback(
    (next: Partial<Saved>) => writeRaw(key, JSON.stringify({ ...saved, ...next })),
    [key, saved],
  );

  const numbers = useMemo(() => Array.from({ length: volumes }, (_, i) => i + 1), [volumes]);
  const remaining = volumes - owned.size;
  const pricePerVolume = Number(price.replace(",", "."));
  const showEstimate = price !== "" && Number.isFinite(pricePerVolume) && pricePerVolume >= 0;

  function toggle(volume: number) {
    update({
      owned: owned.has(volume)
        ? saved.owned.filter((n) => n !== volume)
        : [...saved.owned, volume],
    });
  }

  return (
    <section aria-labelledby="checklist-heading" className="glass mt-8 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="checklist-heading" className="text-xl font-bold text-foreground">
          {title} volume list
        </h2>
        <p aria-live="polite" className="text-sm text-foreground-muted">
          {owned.size} of {volumes} owned · {remaining} to go
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Volumes owned"
        aria-valuemin={0}
        aria-valuemax={volumes}
        aria-valuenow={owned.size}
        className="mt-3 h-2 overflow-hidden rounded-full bg-background-tertiary"
      >
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(owned.size / volumes) * 100}%` }}
        />
      </div>

      <ul className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {numbers.map((volume) => (
          <li key={volume}>
            <label className="flex h-12 cursor-pointer select-none items-center justify-center rounded-lg border border-border bg-background-secondary text-sm font-medium text-foreground transition-colors has-checked:border-accent has-checked:bg-accent has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-accent">
              <input
                type="checkbox"
                className="sr-only"
                checked={owned.has(volume)}
                onChange={() => toggle(volume)}
                aria-label={`${title} volume ${volume}`}
              />
              {volume}
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
        <div>
          <label htmlFor="price-per-volume" className="block text-sm font-medium text-foreground">
            Average price per volume
          </label>
          <input
            id="price-per-volume"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 10"
            value={price}
            onChange={(e) => update({ price: e.target.value })}
            // 16px stops iOS Safari zooming the page when the field is focused.
            className="mt-1 h-11 w-32 rounded-lg border border-border bg-background-secondary px-3 text-base text-foreground"
          />
          {showEstimate && (
            <p className="mt-2 text-sm text-foreground-muted">
              About <strong className="text-foreground">{(remaining * pricePerVolume).toFixed(2)}</strong>{" "}
              to finish your set.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => update({ owned: [] })}
          disabled={owned.size === 0}
          className="h-11 rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          Clear ticks
        </button>
      </div>
      <p className="mt-3 text-xs text-foreground-muted">
        Saved in this browser only. Create an account to keep it across devices.
      </p>
    </section>
  );
}
