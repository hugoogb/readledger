import { ArrowRight, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/content-parts";
import { SiteFooter } from "@/components/marketing/site-footer";
import { FormatStrip } from "@/components/marketing/format-strip";
import { LandingShelf } from "@/components/marketing/landing-shelf";
import { SiteHeader } from "@/components/marketing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Ledger, LedgerRow, LedgerTotal } from "@/components/ui/ledger";
import { guidesFor } from "@/content/guides";
import { getMangaSeries } from "@/lib/content/manga-series";
import { REPOSITORY_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Only the home page declares this: set in the root layout, it would be
// inherited by every route and point them all at the home page.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon-512.png`,
      sameAs: [REPOSITORY_URL],
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

const features = [
  {
    title: "One library for every format",
    body: "Novels, manga, comics, and non-fiction side by side. See what you own, which series volumes are missing, and keep a wishlist of what to buy next.",
  },
  {
    title: "Add in a couple of taps",
    body: "Search by title, author, or ISBN. Book details and covers come from Open Library, and manga from MangaDex, so you rarely type anything yourself.",
  },
  {
    title: "Reading progress",
    body: "Mark books as read, set a yearly reading goal, and keep an eye on the unread pile. Always know where you left off.",
  },
  {
    title: "Spending insights",
    body: "Log what you pay as you go and see totals, averages, and trends, so your hobby never surprises your wallet.",
  },
  {
    title: "Second-hand savings",
    body: "Compare what you paid against retail price and see how much buying used has saved you, with condition and store on every copy.",
  },
  {
    title: "CSV and JSON import",
    body: "Bring your collection over from a spreadsheet and export it whenever you like. Your data stays yours.",
  },
];

// Rendered as visible text, not just markup: each answer targets a question
// collectors actually search for. No FAQPage schema, because Google limits
// that rich result to government and health sites.
const faqs = [
  {
    question: "What is ReadLedger?",
    answer:
      "ReadLedger is a book collection tracker for people who keep physical books: novels, manga, comics, non-fiction. It records which books you own, which you've read, and what you paid for them, then turns that into stats about your collection.",
  },
  {
    question: "Is ReadLedger free?",
    answer:
      "Yes, ReadLedger is free to use. You sign up with your email address, with no credit card and no password to remember.",
  },
  {
    question: "How do I add books to my collection?",
    answer:
      "Search by title, author, or ISBN and add a book in a couple of taps. Book details and covers come from Open Library, and manga series come from MangaDex. Anything the search doesn't find, you can add by hand.",
  },
  {
    question: "Does ReadLedger scan barcodes?",
    answer:
      "Yes, on your phone. Tap Scan when adding a book and point the camera at the ISBN barcode on the back cover, and ReadLedger looks up that edition. You can also type or paste the ISBN.",
  },
  {
    question: "How do I track how much I've spent on books?",
    answer:
      "Log the price you paid for each book, along with the store and its condition. ReadLedger adds it up into totals, averages, and trends in your chosen currency, and shows your savings wherever a retail price is set.",
  },
  {
    question: "Can ReadLedger replace my manga spreadsheet?",
    answer:
      "Yes. You can import your collection from a CSV file instead of retyping it, and you get covers, missing-volume tracking, and spending charts that a spreadsheet makes you build by hand. You can export to CSV or JSON at any time.",
  },
  {
    question: "Does it still work well for manga collectors?",
    answer:
      "Yes. ReadLedger started as a manga tracker. Search MangaDex to add a whole series with its volumes, mark runs as owned or read, and see which volumes you're missing.",
  },
  {
    question: "Is there a ReadLedger mobile app?",
    answer:
      "ReadLedger is a web app designed for phones first, so there's nothing to download and it works on both iPhone and Android as well as desktop. You can also add it to your home screen to open it like an app.",
  },
];

const mangaGuides = guidesFor("manga").slice(0, 4);
const bookGuides = guidesFor("books");

const popularChecklists = [
  "one-piece",
  "jujutsu-kaisen",
  "chainsaw-man",
  "berserk",
  "naruto",
  "vinland-saga",
].flatMap((slug) => getMangaSeries(slug) ?? []);

const steps = [
  {
    title: "Add your books",
    body: "Search by title or ISBN and add books and series in seconds, covers and details included.",
  },
  {
    title: "Track every copy",
    body: "Mark books owned or read, log prices, and note condition as your shelves grow.",
  },
  {
    title: "Get insights",
    body: "Watch spending trends, reading progress, and collection stats come together at a glance.",
  },
];

const ROMAN = ["i.", "ii.", "iii.", "iv.", "v.", "vi."];

const sectionHeading = "font-serif text-[2rem] font-medium leading-tight tracking-[-0.01em] sm:text-[2.5rem]";
const listLink =
  "flex min-h-12 items-center justify-between gap-3 border-b border-border py-3 text-[0.95rem] transition-colors hover:text-accent";
const moreLink = "mt-4 inline-block py-2 text-sm underline underline-offset-4 decoration-border-hover hover:decoration-foreground";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={structuredData} />
      <SiteHeader />

      <main className="px-5 pb-24 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          {/* Hero: copy left, an illustrative shelf and ledger right. */}
          <section className="grid items-center gap-12 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20">
            <div>
              <FormatStrip />
              <h1 className="mt-4 font-serif text-[2.6rem] font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-[4.25rem]">
                A ledger for <em className="text-accent">every book</em> on your shelf.
              </h1>
              <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-foreground-muted">
                ReadLedger is a free book collection tracker. Know exactly which books you own,
                which you&apos;ve read, and what you&apos;ve spent, from novels to manga and
                comics, with stats that work on your phone.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <Link href="/login" className={buttonVariants({ size: "lg" })}>
                  Start your ledger
                  <ArrowRight />
                </Link>
                <Link
                  href="/login"
                  className="py-2 text-center text-sm underline underline-offset-4 decoration-border-hover hover:decoration-foreground"
                >
                  I already have an account
                </Link>
              </div>
              <p className="mt-6 text-sm text-foreground-muted">
                Free to use · Works on your phone, no install · Your data stays yours
              </p>
            </div>

            {/* Illustrative only, not real data: shows the kind of totals the app keeps. */}
            <div className="mx-auto w-full max-w-[30rem] lg:max-w-none">
              <LandingShelf />
              <Ledger className="mt-6">
                <LedgerRow label="Books owned" value="342" />
                <LedgerRow label="Read this year" value="41" />
                <LedgerRow label="Saved buying used" value="$218.40" />
                <LedgerTotal label="Spent in total" value="$1,284.50" />
              </Ledger>
            </div>
          </section>

          {/* Features */}
          <section className="mt-24 sm:mt-32">
            <h2 className={sectionHeading}>A book tracker for your whole shelf</h2>
            <p className="mt-3 max-w-[36rem] text-foreground-muted">
              What you own, what you&apos;ve read, and what you&apos;ve spent, always in sync.
            </p>
            <ol className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ title, body }, i) => (
                <li key={title} className="grid grid-cols-[2.25rem_1fr] border-t border-border py-5 lg:block lg:border-t-2 lg:border-foreground lg:pt-4">
                  <span className="font-serif text-lg italic text-gilt">{ROMAN[i]}</span>
                  <div>
                    <h3 className="font-medium lg:mt-1">{title}</h3>
                    <p className="mt-1 text-[0.95rem] leading-relaxed text-foreground-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* How it works */}
          <section className="mt-24 sm:mt-32">
            <h2 className={sectionHeading}>Up and running in minutes</h2>
            <ol className="mt-10 grid gap-x-10 sm:grid-cols-3">
              {steps.map(({ title, body }, i) => (
                <li key={title} className="border-t border-border py-5">
                  <span className="figure text-3xl text-accent">{i + 1}</span>
                  <h3 className="mt-2 font-medium">{title}</h3>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-foreground-muted">{body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Manga stays first-class: crawl paths into the checklists and manga guides. */}
          <section className="mt-24 sm:mt-32">
            <h2 className={sectionHeading}>For manga collectors</h2>
            <p className="mt-3 max-w-[40rem] text-foreground-muted">
              ReadLedger started as a manga tracker. Add a whole series from MangaDex, mark runs
              as owned or read, and see which volumes you&apos;re missing.
            </p>
            <div className="mt-10 grid gap-12 md:grid-cols-2">
              <div>
                <h3 className="font-serif text-xl font-medium">Manga volume checklists</h3>
                <p className="mt-1 text-[0.95rem] text-foreground-muted">
                  See how many volumes a series has and tick off what you own. No account needed.
                </p>
                <ul className="mt-4 grid grid-cols-2 gap-x-6 border-t border-border">
                  {popularChecklists.map((series) => (
                    <li key={series.slug}>
                      <Link href={`/manga/${series.slug}`} className={listLink}>
                        {series.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/manga" className={moreLink}>
                  See all checklists
                </Link>
              </div>
              <div>
                <h3 className="font-serif text-xl font-medium">Manga guides</h3>
                <p className="mt-1 text-[0.95rem] text-foreground-muted">
                  Practical advice on tracking, budgeting, and buying used.
                </p>
                <ul className="mt-4 border-t border-border">
                  {mangaGuides.map((guide) => (
                    <li key={guide.slug}>
                      <Link href={`/guides/${guide.slug}`} className={listLink}>
                        {guide.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/guides" className={moreLink}>
                  See all guides
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ: native <details> keeps the answers in the HTML and needs no JS. */}
          <section className="mt-24 max-w-[48rem] sm:mt-32">
            <h2 className={sectionHeading}>Frequently asked questions</h2>
            <div className="mt-8 border-t border-border">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group border-b border-border">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                    <h3 className="font-medium">{question}</h3>
                    <ChevronDown className="size-5 shrink-0 text-foreground-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 leading-relaxed text-foreground-muted">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Crawl paths into the general guides and the /books page. */}
          <section className="mt-24 max-w-[48rem] sm:mt-32">
            <h2 className="font-serif text-2xl font-medium">Guides for book collectors</h2>
            <p className="mt-2 text-foreground-muted">
              Practical advice on cataloging your shelves and keeping track of what they cost.
            </p>
            <ul className="mt-4 border-t border-border">
              {bookGuides.map((guide) => (
                <li key={guide.slug}>
                  <Link href={`/guides/${guide.slug}`} className={listLink}>
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-6">
              <Link href="/books" className={moreLink}>
                How ReadLedger tracks books
              </Link>
              <Link href="/guides" className={moreLink}>
                See all guides
              </Link>
            </div>
          </section>

          {/* Closing CTA */}
          <section className="mt-24 border-t-2 border-foreground pt-10 sm:mt-32">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className={sectionHeading}>Start tracking your collection today</h2>
                <p className="mt-3 max-w-[36rem] text-lg text-foreground-muted">
                  Free to start, no clutter. Bring order to your shelves in a few taps.
                </p>
              </div>
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Create your free account
                <ArrowRight />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
