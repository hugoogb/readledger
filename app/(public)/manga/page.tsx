import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, SignUpCta } from "@/components/marketing/content-parts";
import { contentMetadata } from "@/lib/content/metadata";
import { formatVolumeCount, mangaSeries, statusLabel } from "@/lib/content/manga-series";
import { SITE_URL } from "@/lib/site";

const PATH = "/manga";

export const metadata: Metadata = contentMetadata({
  title: "Manga Volume Checklists: How Many Volumes Each Series Has",
  description: `Free volume checklists for ${mangaSeries.length} popular manga series. See how many volumes each has, tick off the ones you own, and estimate the cost to finish.`,
  path: PATH,
});

export default function MangaIndexPage() {
  const finished = mangaSeries.filter((series) => series.status === "completed");
  const running = mangaSeries.filter((series) => series.status !== "completed");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Manga volume checklists",
          itemListElement: mangaSeries.map((series, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${series.title} volume checklist`,
            url: `${SITE_URL}/manga/${series.slug}`,
          })),
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Volume checklists", href: PATH },
        ]}
      />
      <h1 className="font-serif text-[2.25rem] font-medium leading-[1.08] tracking-[-0.015em] sm:text-5xl">Manga volume checklists</h1>
      <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
        Pick a series to see how many volumes it has, tick off the ones on your shelf, and work out
        what it would cost to finish the set. No account needed.
      </p>

      <SeriesGroup heading="Finished series" series={finished} />
      <SeriesGroup heading="Still running" series={running} />

      <p className="mt-8 text-sm text-foreground-muted">
        New to tracking? Start with{" "}
        <Link href="/guides/how-to-track-your-manga-collection" className="underline underline-offset-4 decoration-border-hover hover:decoration-foreground">
          how to track your manga collection
        </Link>
        .
      </p>

      <SignUpCta
        title="Track every series in one place"
        body="A ReadLedger account keeps your whole collection together, with reading progress and spending stats."
      />
    </>
  );
}

function SeriesGroup({
  heading,
  series,
}: {
  heading: string;
  series: typeof mangaSeries;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-medium">{heading}</h2>
      <ul className="mt-4 grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
        {series.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/manga/${item.slug}`}
              className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-3 transition-colors hover:text-accent"
            >
              <span>{item.title}</span>
              <span className="shrink-0 text-sm text-foreground-muted">
                {formatVolumeCount(item)} vols
                <span className="sr-only">, {statusLabel(item)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
