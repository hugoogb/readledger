import Link from "next/link";
import { DataTable } from "@/components/marketing/content-parts";
import { formatVolumeCount, getMangaSeries } from "@/lib/content/manga-series";

export const collectionCostMeta = {
  slug: "how-much-does-a-manga-collection-cost",
  kind: "Guide",
  title: "How Much Does a Manga Collection Cost?",
  heading: "How much does a manga collection cost?",
  description:
    "How to work out what a manga series will cost to complete, with worked examples for long and short series, and practical ways to spend less on your collection.",
  published: "2026-11-04",
  updated: "2026-11-04",
};

// An assumption for the worked examples, labelled as such on the page. It isn't
// a measured market price.
const EXAMPLE_PRICE = 10;
const EXAMPLE_USED_PRICE = 6;
const EXAMPLE_SLUGS = ["death-note", "demon-slayer", "jujutsu-kaisen", "naruto", "one-piece"];

export function CollectionCostGuide() {
  const rows = EXAMPLE_SLUGS.flatMap((slug) => {
    const series = getMangaSeries(slug);
    if (!series) return [];
    return [
      [
        <Link key={slug} href={`/manga/${slug}`}>
          {series.title}
        </Link>,
        formatVolumeCount(series),
        `${(series.volumes * EXAMPLE_PRICE).toLocaleString("en-US")}${series.exact ? "" : "+"}`,
        `${(series.volumes * EXAMPLE_USED_PRICE).toLocaleString("en-US")}${series.exact ? "" : "+"}`,
      ],
    ];
  });

  return (
    <>
      <p>
        The cost of a manga collection comes down to simple multiplication: <strong>volumes × average
        price paid</strong>. Prices vary a lot by country, publisher, and format, so the most useful number
        is your own average, not someone else’s total.
      </p>

      <h2>What a series costs to complete</h2>
      <p>
        To compare series, this table assumes a round price of 10 per volume in your currency, and 6 per
        volume if you buy used at 40% off. These are illustrative numbers, not market prices, so swap in
        what you actually pay in your country.
      </p>
      <DataTable
        head={["Series", "Volumes", "At 10 each", "At 6 each"]}
        rows={rows}
      />
      <p>
        A “+” means the series may have more volumes. Each <Link href="/manga">volume checklist</Link> has a
        calculator: enter your average price and tick what you own to see the cost of what’s left.
      </p>

      <h2>Work out your own average</h2>
      <ol>
        <li>Gather your last 10 to 20 purchases from receipts or order emails.</li>
        <li>Add them up, including shipping if you paid it, and divide by the number of volumes.</li>
        <li>Multiply by the volumes you still need.</li>
      </ol>
      <p>
        Shipping is the part most people forget, and buying one volume at a time online can add a
        surprising amount to your average.
      </p>

      <h2>Costs that are easy to overlook</h2>
      <ul>
        <li>
          <strong>Long-running series:</strong> an ongoing series is an open-ended commitment, and at a few
          volumes a year, that adds up.
        </li>
        <li>
          <strong>Out-of-print volumes:</strong> the last few volumes you need can cost more than the rest,
          so buy the hard-to-find ones when you see them at a fair price.
        </li>
        <li>
          <strong>Shelf space:</strong> it’s free until it isn’t. Long runs take up more room than people
          expect.
        </li>
      </ul>

      <h2>Ways to spend less</h2>
      <ul>
        <li>
          <strong>Buy used.</strong> It’s the biggest saving available. See{" "}
          <Link href="/guides/buying-used-manga-condition-guide">what to check when buying used manga</Link>.
        </li>
        <li>
          <strong>Look for lots and box sets.</strong> Bundles often beat buying singles, though check whether
          the numbering or size matches what you already own.
        </li>
        <li>
          <strong>Consider omnibuses.</strong> Editions that combine volumes can be cheaper per volume, if you
          don’t mind a mismatched shelf.
        </li>
        <li>
          <strong>Keep a wishlist.</strong> Knowing exactly what you need keeps you from buying duplicates and
          makes it easier to spot a good deal.
        </li>
      </ul>

      <h2>Keep track as you go</h2>
      <p>
        You can’t manage what you don’t measure, and logging the price takes seconds when a volume arrives. A{" "}
        <Link href="/guides/manga-collection-spreadsheet-template">spreadsheet</Link> does the job. ReadLedger
        builds the totals, averages, and trends for you, and shows how much you’ve saved against retail
        wherever you’ve set a retail price.
      </p>
    </>
  );
}
