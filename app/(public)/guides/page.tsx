import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/content-parts";
import { type Guide, guidesFor } from "@/content/guides";
import { contentMetadata } from "@/lib/content/metadata";

const PATH = "/guides";

export const metadata: Metadata = contentMetadata({
  title: "Book and Manga Collecting Guides and Comparisons",
  description:
    "Practical guides to cataloging your books and tracking what they cost, plus manga guides on budgeting, buying used, and choosing a tracker app.",
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
      <h1 className="font-serif text-[2.25rem] font-medium leading-[1.08] tracking-[-0.015em] sm:text-5xl">
        Book and manga collecting guides
      </h1>
      <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
        Practical advice on tracking your shelves, spending less, and picking the right tools.
      </p>
      <GuideGroup heading="For every book collector" guides={guidesFor("books")} />
      <GuideGroup heading="For manga collectors" guides={guidesFor("manga")} />
    </>
  );
}

function GuideGroup({ heading, guides }: { heading: string; guides: Guide[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-medium">{heading}</h2>
      <ul className="mt-4 border-t border-border">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guides/${guide.slug}`}
              className="group block border-b border-border py-5"
            >
              <span className="eyebrow">{guide.kind}</span>
              <h3 className="mt-1 font-serif text-xl font-medium transition-colors group-hover:text-accent">{guide.heading}</h3>
              <p className="mt-1 text-sm text-foreground-muted">{guide.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
