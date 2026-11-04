import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, JsonLd, SignUpCta } from "@/components/marketing/content-parts";
import { VolumeChecklist } from "@/components/manga/volume-checklist";
import {
  MANGA_DATA_CHECKED_ON,
  formatVolumeCount,
  getMangaSeries,
  mangaSeries,
  relatedSeries,
  statusLabel,
  type MangaSeries,
} from "@/lib/content/manga-series";
import { contentMetadata } from "@/lib/content/metadata";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return mangaSeries.map(({ slug }) => ({ slug }));
}

const checkedOn = new Date(`${MANGA_DATA_CHECKED_ON}T00:00:00Z`).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function byline(series: MangaSeries) {
  return series.authors.join(" and ");
}

/** The direct answer, so it can be quoted for "how many volumes" searches. */
function volumeAnswer(series: MangaSeries) {
  if (series.exact) {
    return `${series.title} has ${series.volumes} volumes in its original Japanese release, and the series is finished.`;
  }
  if (series.status === "completed") {
    return `${series.title} has at least ${series.volumes} volumes in its original Japanese release. The series is listed as finished, but we could not confirm its final count.`;
  }
  return `${series.title} has at least ${series.volumes} volumes in its original Japanese release, and the count can grow while the series is ${series.status === "hiatus" ? "on hiatus" : "still running"}.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const series = getMangaSeries((await params).slug);
  if (!series) return {};
  // Subtitles are dropped so that search results don't cut the title off.
  const shortTitle = series.title.split(":")[0];
  return contentMetadata({
    title: `${shortTitle} Volume Checklist (${formatVolumeCount(series)} Volumes)`,
    description: `How many volumes of ${shortTitle} are there? ${series.exact ? "" : "At least "}${series.volumes} in Japan. Tick off the ones you own and estimate the cost to finish your set.`,
    path: `/manga/${series.slug}`,
  });
}

export default async function MangaSeriesPage({ params }: Props) {
  const series = getMangaSeries((await params).slug);
  if (!series) notFound();

  const facts = [
    ["Volumes", formatVolumeCount(series)],
    ["Status", statusLabel(series)],
    ["First published", series.year ? String(series.year) : null],
    ["Demographic", series.demographic],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));

  const faqs = [
    { question: `How many volumes of ${series.title} are there?`, answer: volumeAnswer(series) },
    {
      question: `Is ${series.title} finished?`,
      answer:
        series.status === "completed"
          ? `Yes. ${series.title} is listed as finished.`
          : `Not yet. ${series.title} is listed as ${statusLabel(series).toLowerCase()}, so more volumes may follow.`,
    },
    {
      question: "Does this count match English editions?",
      answer:
        "Not always. This list follows the Japanese volume numbering. English releases can trail behind it, and omnibus or deluxe editions combine several volumes into one book, so compare against the edition you collect.",
    },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BookSeries",
          name: series.title,
          url: `${SITE_URL}/manga/${series.slug}`,
          author: series.authors.map((name) => ({ "@type": "Person", name })),
          ...(series.year ? { startDate: String(series.year) } : {}),
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Volume checklists", href: "/manga" },
          { name: series.title, href: `/manga/${series.slug}` },
        ]}
      />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        {series.title} volume checklist
      </h1>
      <p className="mt-2 text-foreground-muted">By {byline(series)}</p>
      <p className="mt-4 text-lg leading-relaxed">{volumeAnswer(series)}</p>

      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-background-secondary p-3">
            <dt className="text-xs text-foreground-muted">{label}</dt>
            <dd className="mt-1 font-semibold capitalize">{value}</dd>
          </div>
        ))}
      </dl>

      <VolumeChecklist slug={series.slug} title={series.title} volumes={series.volumes} />

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Collecting {series.title}</h2>
        <p className="mt-3 text-foreground-muted leading-relaxed">{series.note}</p>
        <p className="mt-3 text-foreground-muted leading-relaxed">
          Planning the rest of your set? See{" "}
          <Link href="/guides/how-much-does-a-manga-collection-cost" className="text-accent underline">
            how to budget for a manga collection
          </Link>{" "}
          and{" "}
          <Link href="/guides/buying-used-manga-condition-guide" className="text-accent underline">
            what to check when buying used
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">{series.title} FAQ</h2>
        <div className="mt-4 space-y-5">
          {faqs.map(({ question, answer }) => (
            <div key={question}>
              <h3 className="font-semibold">{question}</h3>
              <p className="mt-1 text-foreground-muted leading-relaxed">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <SignUpCta
        title={`Keep your ${series.title} collection in one place`}
        body="ReadLedger tracks owned and read volumes, what you paid, and condition, for free, across every device."
      />

      <section className="mt-10">
        <h2 className="text-xl font-bold">More volume checklists</h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2">
          {relatedSeries(series).map((other) => (
            <li key={other.slug}>
              <Link
                href={`/manga/${other.slug}`}
                className="flex min-h-12 items-center rounded-xl border border-border bg-background-secondary px-4 py-3 font-medium transition-colors hover:border-border-hover"
              >
                {other.title} checklist
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/manga" className="text-accent underline">
            See all {mangaSeries.length} checklists
          </Link>
        </p>
      </section>

      <p className="mt-10 text-xs text-foreground-muted">
        Series data from{" "}
        <a
          href={`https://mangadex.org/title/${series.mangadexId}`}
          rel="noopener"
          className="underline"
        >
          MangaDex
        </a>
        , with counts for running series checked against Wikipedia on {checkedOn}. Counts can lag
        behind new releases.
      </p>
    </>
  );
}
