import { DoubleRule } from "@/components/ui/double-rule";

// Spine colours from the palette and heights (% of the shelf). The null is the
// "missing volume" gap, which is what ReadLedger is good at showing.
const SPINES: (readonly [string, number] | null)[] = [
  ["#1f4a3a", 78],
  ["#7b2d26", 92],
  ["#1d1b18", 70],
  ["#b8913a", 84],
  ["#2f3e5c", 96],
  ["#5d4a6b", 66],
  ["#3c5a3f", 88],
  ["#8a3a2c", 74],
  ["#6b5532", 90],
  null,
  ["#7b2d26", 62],
  ["#1f4a3a", 94],
  ["#b8913a", 76],
  ["#3a2f28", 86],
];

/** Decorative bookshelf on a double rule, with one missing volume. */
export function LandingShelf() {
  return (
    <div aria-hidden="true">
      <div className="flex h-28 items-end gap-[3px] px-1 sm:h-40 sm:gap-[5px]">
        {SPINES.map((spine, i) =>
          spine ? (
            <div
              key={i}
              className="relative flex-1 rounded-t-[2px] after:absolute after:inset-x-0 after:top-[12%] after:h-[2px] after:bg-white/25"
              style={{ backgroundColor: spine[0], height: `${spine[1]}%` }}
            />
          ) : (
            <div
              key={i}
              className="h-[58%] flex-1 rounded-t-[2px] border border-b-0 border-dashed border-foreground-muted/60"
            />
          ),
        )}
      </div>
      <DoubleRule />
    </div>
  );
}
