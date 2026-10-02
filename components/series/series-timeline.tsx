import { seriesTimeline } from "@/lib/reading-stats";
import { formatShortDate } from "@/utils/date";

type SeriesTimelineProps = {
  volumes: Parameters<typeof seriesTimeline>[0];
};

/** Collecting and reading milestones for one series; hides unknown steps. */
export function SeriesTimeline({ volumes }: SeriesTimelineProps) {
  const t = seriesTimeline(volumes);

  const steps = [
    { label: "Started collecting", value: t.startedCollecting && formatShortDate(t.startedCollecting) },
    { label: "First read", value: t.firstRead && formatShortDate(t.firstRead) },
    { label: "Last read", value: t.lastRead && formatShortDate(t.lastRead) },
    { label: "Pace", value: t.pacePerWeek !== null ? `${t.pacePerWeek} vol/week` : null },
    {
      label: "Buy → read",
      value:
        t.averageBuyToRead !== null
          ? `${t.averageBuyToRead} day${t.averageBuyToRead !== 1 ? "s" : ""} avg`
          : null,
    },
  ].filter((s): s is { label: string; value: string } => Boolean(s.value));

  if (steps.length === 0) return null;

  return (
    <dl className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-6 gap-y-3 text-sm">
      {steps.map((s) => (
        <div key={s.label}>
          <dt className="text-xs text-foreground-muted uppercase font-bold tracking-wider">
            {s.label}
          </dt>
          <dd className="font-medium mt-0.5">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
