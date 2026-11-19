import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, SignUpCta } from "@/components/marketing/content-parts";
import { FormatStrip } from "@/components/marketing/format-strip";
import { guidesFor } from "@/content/guides";
import { contentMetadata } from "@/lib/content/metadata";
import { SITE_URL } from "@/lib/site";

const PATH = "/books";
const TITLE = "Book Collection Tracker: Catalog the Books You Own";
const DESCRIPTION =
  "Catalog every book you own, from novels to manga and comics, with what you paid, its condition, and whether you've read it. Free, and it works on your phone.";

export const metadata: Metadata = contentMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const tracked = [
  ["Owned and read", "Which books are on your shelf, and which of them you’ve actually read."],
  ["Price, store, and condition", "What you paid, where you bought it, and what shape it was in."],
  ["ISBN and notes", "The exact edition you own, and room for “lent to Sam in March”."],
  ["Series volumes", "For manga, comics, and long series: which volumes you have and which are missing."],
  ["Wishlist", "The books you want next, with an estimate of what they’ll cost."],
];

const sectionClass = "mt-10";
const headingClass = "text-2xl font-bold";
const bodyClass = "mt-3 text-foreground-muted leading-relaxed";
const linkClass = "text-accent underline";

export default function BooksPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
          isPartOf: { "@id": `${SITE_URL}/#website` },
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Book collection tracker", href: PATH },
        ]}
      />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        A book collection tracker for everything on your shelves
      </h1>
      <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
        ReadLedger keeps a record of every book you own, and of each copy: whether you’ve read it, what you
        paid, where you bought it, and its condition. It’s free and runs in your phone’s browser, so
        there’s nothing to install.
      </p>
      <FormatStrip className="mt-6" />
      <Link
        href="/login"
        className="mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors"
      >
        Start your library, free
        <ArrowRight className="w-5 h-5" />
      </Link>

      <section className={sectionClass}>
        <h2 className={headingClass}>What it tracks</h2>
        <dl className="mt-4 grid sm:grid-cols-2 gap-3">
          {tracked.map(([label, detail]) => (
            <div key={label} className="rounded-xl border border-border bg-background-secondary p-4">
              <dt className="font-semibold">{label}</dt>
              <dd className="mt-1 text-sm text-foreground-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Add books by searching, not typing</h2>
        <p className={bodyClass}>
          Search by title, author, or ISBN. Book details and covers come from Open Library, and manga
          comes from MangaDex with its volume count, so a long series is set up in one go. Anything the
          search doesn’t find, you can add by hand.
        </p>
        <p className={bodyClass}>
          To add a specific edition on your phone, tap Scan and point the camera at the ISBN barcode on
          the back cover. You can also type or paste the ISBN.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>See what your reading costs</h2>
        <p className={bodyClass}>
          Log the price when a book arrives and ReadLedger adds it up into totals, averages, and trends in
          your currency. Set a retail price and it shows how much buying used has saved you. Not sure where
          to start? See{" "}
          <Link href="/guides/how-much-do-you-spend-on-books" className={linkClass}>
            how much you spend on books
          </Link>
          .
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Read what you own</h2>
        <p className={bodyClass}>
          Set a yearly reading goal and mark books read as you finish them. Because ReadLedger knows what you
          own and what you’ve read, the unread pile is right there, which is a good thing to check before
          buying more.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Bring your spreadsheet</h2>
        <p className={bodyClass}>
          Already keep a list? Import it from a CSV or JSON file instead of retyping it, and export
          whenever you like. Your data stays yours.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Guides</h2>
        <ul className="mt-4 space-y-2">
          {guidesFor("books").map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="flex min-h-12 items-center rounded-xl border border-border bg-background-secondary px-4 py-3 font-medium transition-colors hover:border-border-hover"
              >
                {guide.heading}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-foreground-muted">
          Collect manga? Try the free{" "}
          <Link href="/manga" className={linkClass}>
            manga volume checklists
          </Link>
          .
        </p>
      </section>

      <SignUpCta
        title="Catalog your books with ReadLedger"
        body="Novels, manga, and comics in one library, with reading progress and spending stats. Free, and it works on your phone."
      />
    </>
  );
}
