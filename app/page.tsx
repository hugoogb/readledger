import {
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  BookMarked,
  BookOpen,
  ChevronDown,
  Heart,
  Library,
  PiggyBank,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/content-parts";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { guides } from "@/content/guides";
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
    title: "Collection management",
    body: "Track every volume across all your series. See what you own, what's missing, and what to buy next.",
    icon: Library,
    iconClass: "text-accent",
    tileClass: "bg-accent/10 border-accent/20",
  },
  {
    title: "Reading progress",
    body: "Mark volumes as read, set a yearly reading goal, and watch completion rates climb. Always know where you left off.",
    icon: BarChart3,
    iconClass: "text-success",
    tileClass: "bg-success/10 border-success/20",
  },
  {
    title: "Spending insights",
    body: "Log what you pay as you go and see totals, averages, and trends, so your hobby never surprises your wallet.",
    icon: Wallet,
    iconClass: "text-warning",
    tileClass: "bg-warning/10 border-warning/20",
  },
  {
    title: "Second-hand savings",
    body: "Compare what you paid against retail price and see how much buying used has saved you, with condition and store on every volume.",
    icon: PiggyBank,
    iconClass: "text-success",
    tileClass: "bg-success/10 border-success/20",
  },
  {
    title: "Wishlist",
    body: "Keep a list of the volumes you want next, with an estimate of what they'll cost, and stop buying duplicates.",
    icon: Heart,
    iconClass: "text-accent",
    tileClass: "bg-accent/10 border-accent/20",
  },
  {
    title: "CSV and JSON import",
    body: "Bring your collection over from a spreadsheet and export it whenever you like. Your data stays yours.",
    icon: ArrowRightLeft,
    iconClass: "text-warning",
    tileClass: "bg-warning/10 border-warning/20",
  },
];

// Rendered as visible text, not just markup: each answer targets a question
// collectors actually search for. No FAQPage schema, because Google limits
// that rich result to government and health sites.
const faqs = [
  {
    question: "What is ReadLedger?",
    answer:
      "ReadLedger is a manga collection tracker for people who collect physical volumes. It records which volumes you own, which you've read, and what you paid for them, then turns that into stats about your collection.",
  },
  {
    question: "Is ReadLedger free?",
    answer:
      "Yes, ReadLedger is free to use. You sign up with your email address, with no credit card and no password to remember.",
  },
  {
    question: "Can ReadLedger replace my manga spreadsheet?",
    answer:
      "Yes. You can import your collection from a CSV file instead of retyping it, and you get covers, missing-volume tracking, and spending charts that a spreadsheet makes you build by hand. You can export to CSV or JSON at any time.",
  },
  {
    question: "How do I track how much I've spent on manga?",
    answer:
      "Log the price you paid for each volume, along with the store and its condition. ReadLedger adds it up into totals, averages, and trends in your chosen currency, and shows your savings wherever a retail price is set.",
  },
  {
    question: "How do I add a series to my collection?",
    answer:
      "Search for the title and add it in a couple of taps. Series details and cover art come from MangaDex, so you don't have to enter them yourself.",
  },
  {
    question: "Is there a ReadLedger mobile app?",
    answer:
      "ReadLedger is a web app designed for phones first, so there's nothing to download and it works on both iPhone and Android as well as desktop. You can also add it to your home screen to open it like an app.",
  },
];

// Faux dashboard stats shown in the product preview. These are illustrative,
// not real data — they mirror the layout of the actual /dashboard so visitors
// see what the app looks like before signing up.
const previewStats = [
  { label: "Volumes", value: "342", icon: Library },
  { label: "Series", value: "28", icon: BookMarked },
  { label: "Read", value: "76%", icon: BookOpen },
  { label: "Spent", value: "$1,284", icon: Wallet },
];

// A pattern of "owned" (true) vs "missing" (false) volume spines for the
// preview collection shelf.
const previewSpines = [
  true, true, true, true, false, true, true, false, true, true,
  true, false, true, true, true, true, true, true, false, true,
  true, true, false, true, true, true, false, true, true, true,
];

const popularChecklists = [
  "one-piece",
  "jujutsu-kaisen",
  "chainsaw-man",
  "berserk",
  "naruto",
  "vinland-saga",
].flatMap((slug) => getMangaSeries(slug) ?? []);

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={structuredData} />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
      </div>

      <SiteHeader />

      {/* Hero */}
      <main className="relative z-10 px-5 sm:px-6 pt-12 sm:pt-20 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              <Sparkles className="w-3.5 h-3.5" />
              Built for manga collectors
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Your manga collection,
              <span className="gradient-text"> beautifully tracked</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-foreground-muted leading-relaxed">
              ReadLedger is a free manga collection tracker. Know exactly which
              volumes you own, which you&apos;ve read, and what you&apos;ve spent
              — all in one place, with insights that actually look good on your
              phone.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                Start tracking — it&apos;s free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto border border-border hover:border-border-hover text-foreground font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-5 text-sm text-foreground-muted">
              Free to use · Works great on mobile · Your data stays yours
            </p>
          </div>

          {/* Product preview */}
          <div className="mt-16 sm:mt-20 max-w-4xl mx-auto animate-fade-in stagger-2">
            <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-accent/10">
              {/* App chrome */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background-tertiary/40">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-error/60" />
                  <span className="w-3 h-3 rounded-full bg-warning/60" />
                  <span className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 text-center text-xs text-foreground-muted truncate">
                  readledger · dashboard
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6">
                {/* Stat tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previewStats.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border bg-background-secondary p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground-muted">
                          {label}
                        </span>
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="mt-2 text-xl sm:text-2xl font-bold">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collection shelf */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">
                      Your collection
                    </span>
                    <span className="text-xs text-foreground-muted">
                      28 series
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                    {previewSpines.map((owned, i) => (
                      <div
                        key={i}
                        className={
                          owned
                            ? "h-12 sm:h-16 rounded-md bg-linear-to-b from-accent/80 to-accent-hover/80"
                            : "h-12 sm:h-16 rounded-md border border-dashed border-border bg-background-tertiary/40"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <section className="mt-24 sm:mt-32">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold">
                A manga tracker for your whole shelf
              </h2>
              <p className="mt-3 text-foreground-muted">
                Your volumes, reading, and spending, always in sync.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ title, body, icon: Icon, iconClass, tileClass }) => (
                <div key={title} className="glass rounded-2xl p-6 animate-fade-in">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${tileClass}`}
                  >
                    <Icon className={`w-6 h-6 ${iconClass}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-foreground-muted">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="mt-24 sm:mt-32">
            <h2 className="text-3xl font-bold text-center mb-12">
              Up and running in minutes
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center animate-fade-in stagger-1">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Add your series</h3>
                <p className="text-foreground-muted">
                  Search manga titles and add them to your collection in
                  seconds — covers and details included.
                </p>
              </div>

              <div className="text-center animate-fade-in stagger-2">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Track volumes</h3>
                <p className="text-foreground-muted">
                  Mark volumes owned or read, log prices, and note condition as
                  your shelf grows.
                </p>
              </div>

              <div className="text-center animate-fade-in stagger-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Get insights</h3>
                <p className="text-foreground-muted">
                  Watch spending trends, reading progress, and collection stats
                  come together at a glance.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ: native <details> keeps the answers in the HTML and needs no JS. */}
          <section className="mt-24 sm:mt-32 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="glass group rounded-2xl">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold [&::-webkit-details-marker]:hidden">
                    <h3>{question}</h3>
                    <ChevronDown className="w-5 h-5 shrink-0 text-foreground-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-foreground-muted">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Crawl paths into the checklists and guides. */}
          <section className="mt-24 sm:mt-32 grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">Manga volume checklists</h2>
              <p className="mt-2 text-foreground-muted">
                See how many volumes a series has and tick off what you own. No
                account needed.
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {popularChecklists.map((series) => (
                  <li key={series.slug}>
                    <Link
                      href={`/manga/${series.slug}`}
                      className="flex min-h-12 items-center rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-medium transition-colors hover:border-border-hover"
                    >
                      {series.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/manga" className="mt-4 inline-block py-1 text-sm font-medium text-accent underline">
                See all checklists
              </Link>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Guides for collectors</h2>
              <p className="mt-2 text-foreground-muted">
                Practical advice on tracking, budgeting, and buying used.
              </p>
              <ul className="mt-4 space-y-2">
                {guides.slice(0, 4).map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="flex min-h-12 items-center rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-medium transition-colors hover:border-border-hover"
                    >
                      {guide.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/guides" className="mt-4 inline-block py-1 text-sm font-medium text-accent underline">
                See all guides
              </Link>
            </div>
          </section>

          {/* Closing CTA */}
          <div className="mt-24 sm:mt-32 animate-fade-in">
            <div className="glass rounded-3xl px-6 py-12 sm:py-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-accent/10 to-transparent pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <TrendingUp className="w-10 h-10 text-accent mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Start tracking your collection today
                </h2>
                <p className="mt-4 text-foreground-muted text-lg">
                  Free to start, no clutter. Bring order to your manga shelf in
                  a few taps.
                </p>
                <Link
                  href="/login"
                  className="mt-8 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-lg shadow-accent/20"
                >
                  Create your free account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
