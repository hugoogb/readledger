"use client";

import {
  listMultiVolumeSeries,
  markVolumeOwnedByIsbn,
  resolveIsbnVolume,
  type VolumeMatch,
} from "@/actions/isbn-volume";
import { Button } from "@/components/ui/button";
import { unwrap } from "@/lib/unwrap";
import { MAX_VOLUMES } from "@/lib/validations";
import { Library, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type NewSeriesMatch = Extract<VolumeMatch, { kind: "new" }>;

type VolumeMatchCardProps = {
  isbn: string;
  onStartNewSeries: (match: NewSeriesMatch, volumeNumber: number) => void;
  onDone: () => void;
};

type SeriesOption = { id: string; title: string };

/**
 * Shown above the book result for an ISBN query: "this looks like Vol. N of
 * <series>". Nothing changes until the user confirms; the volume number and
 * the series can be corrected first.
 */
export function VolumeMatchCard({ isbn, onStartNewSeries, onDone }: VolumeMatchCardProps) {
  const router = useRouter();
  const [match, setMatch] = useState<VolumeMatch | null | undefined>(undefined);
  const [volumeNumber, setVolumeNumber] = useState(1);
  const [series, setSeries] = useState<SeriesOption | null>(null);
  const [options, setOptions] = useState<SeriesOption[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    resolveIsbnVolume(isbn)
      .then((result) => {
        if (!current) return;
        const data = result.ok ? result.data : null;
        setMatch(data);
        if (data) setVolumeNumber(data.volumeNumber);
        if (data?.kind === "existing") setSeries({ id: data.seriesId, title: data.seriesTitle });
      })
      .catch(() => current && setMatch(null));
    return () => {
      current = false;
    };
  }, [isbn]);

  if (match === undefined) {
    return <div aria-hidden="true" className="h-28 rounded-xl bg-background-tertiary animate-pulse" />;
  }
  if (match === null) return null;

  const openPicker = async () => {
    setPicking(true);
    if (options) return;
    const result = await listMultiVolumeSeries();
    setOptions(result.ok ? result.data : []);
  };

  const confirm = async () => {
    if (!series) return;
    setSaving(true);
    try {
      unwrap(await markVolumeOwnedByIsbn(series.id, volumeNumber, isbn));
      toast.success(`Vol. ${volumeNumber} of ${series.title} marked as owned`);
      router.refresh();
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't mark the volume as owned");
      setSaving(false);
    }
  };

  const alreadyOwned = match.kind === "existing" && match.owned;

  const stepper = (
    <div className="flex items-center gap-1" role="group" aria-label="Volume number">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="min-h-11 min-w-11"
        aria-label="Previous volume"
        disabled={volumeNumber <= 1}
        onClick={() => setVolumeNumber((n) => Math.max(1, n - 1))}
      >
        <Minus />
      </Button>
      <span className="w-12 text-center text-lg font-semibold tabular-nums" aria-live="polite">
        {volumeNumber}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="min-h-11 min-w-11"
        aria-label="Next volume"
        disabled={volumeNumber >= MAX_VOLUMES}
        onClick={() => setVolumeNumber((n) => Math.min(MAX_VOLUMES, n + 1))}
      >
        <Plus />
      </Button>
    </div>
  );

  return (
    <section
      aria-label="Volume match"
      className="space-y-3 rounded-xl border border-accent/20 bg-accent/5 p-4"
    >
      <div className="flex items-start gap-3">
        <Library className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        {match.kind === "new" ? (
          <p className="text-sm">
            Add <strong>{match.manga.title}</strong>
            {match.totalVolumes ? ` (${match.totalVolumes} vols)` : ""} and mark Vol. {volumeNumber} owned
          </p>
        ) : alreadyOwned ? (
          <p className="text-sm">
            Vol. {volumeNumber} of <strong>{series?.title}</strong> is already in your library
          </p>
        ) : (
          <p className="text-sm">
            Mark Vol. <strong>{volumeNumber}</strong> of <strong>{series?.title}</strong> as owned
          </p>
        )}
      </div>

      {match.kind === "existing" && picking && (
        <select
          aria-label="Series"
          className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          value={series?.id ?? ""}
          disabled={!options}
          onChange={(e) => {
            const picked = options?.find((o) => o.id === e.target.value);
            if (picked) setSeries(picked);
          }}
        >
          {(options ?? (series ? [series] : [])).map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
      )}

      {!alreadyOwned ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {stepper}
          <div className="flex gap-2">
            {match.kind === "existing" && !picking && (
              <Button type="button" variant="ghost" className="min-h-11" onClick={openPicker}>
                Change series
              </Button>
            )}
            {match.kind === "new" ? (
              <Button type="button" className="min-h-11" onClick={() => onStartNewSeries(match, volumeNumber)}>
                Add series
              </Button>
            ) : (
              <Button type="button" className="min-h-11" loading={saving} onClick={confirm}>
                Mark as owned
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
