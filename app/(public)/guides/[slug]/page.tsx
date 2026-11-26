import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, JsonLd, Prose, SignUpCta } from "@/components/marketing/content-parts";
import { getGuide, guides } from "@/content/guides";
import { contentMetadata } from "@/lib/content/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return contentMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: "article",
  });
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const url = `/guides/${guide.slug}`;
  const { Body } = guide;
  const others = guides
    .filter((other) => other.slug !== guide.slug)
    .sort((a, b) => Number(b.audience === guide.audience) - Number(a.audience === guide.audience))
    .slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.heading,
          description: guide.description,
          url: `${SITE_URL}${url}`,
          datePublished: guide.published,
          dateModified: guide.updated,
          image: `${SITE_URL}/opengraph-image`,
          author: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
          publisher: { "@id": `${SITE_URL}/#organization` },
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: guide.title, href: url },
        ]}
      />
      <article>
        <h1 className="font-serif text-[2.25rem] font-medium leading-[1.08] tracking-[-0.015em] sm:text-5xl">{guide.heading}</h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Updated <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
        </p>
        <div className="mt-6">
          <Prose>
            <Body />
          </Prose>
        </div>
      </article>

      <SignUpCta
        title="Track your collection with ReadLedger"
        body="Books, reading progress, and spending in one place. Free, and it works on your phone."
      />

      <section className="mt-10">
        <h2 className="font-serif text-xl font-medium">Keep reading</h2>
        <ul className="mt-3 border-t border-border">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/guides/${other.slug}`}
                className="flex min-h-12 items-center border-b border-border py-3 transition-colors hover:text-accent"
              >
                {other.heading}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
