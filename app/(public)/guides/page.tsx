import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/content-parts";
import { guides } from "@/content/guides";
import { contentMetadata } from "@/lib/content/metadata";

const PATH = "/guides";

export const metadata: Metadata = contentMetadata({
  title: "Manga Collecting Guides and App Comparisons",
  description:
    "Practical guides to tracking and budgeting a manga collection, buying used volumes, and choosing between spreadsheets, Notion, and tracker apps.",
  path: PATH,
});

export default function GuidesPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: PATH },
        ]}
      />
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        Manga collecting guides and comparisons
      </h1>
      <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
        Practical advice on tracking your shelf, spending less, and picking the right tools.
      </p>
      <ul className="mt-8 space-y-3">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guides/${guide.slug}`}
              className="glass block rounded-2xl p-5 transition-colors hover:border-border-hover"
            >
              <span className="text-xs font-medium text-accent">{guide.kind}</span>
              <h2 className="mt-1 text-lg font-semibold">{guide.heading}</h2>
              <p className="mt-1 text-sm text-foreground-muted">{guide.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
