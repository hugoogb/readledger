import Link from "next/link";
import { DataTable } from "@/components/marketing/content-parts";

export const buyingUsedMeta = {
  slug: "buying-used-manga-condition-guide",
  kind: "Guide",
  title: "Buying Used Manga: Condition Guide and Checklist",
  heading: "Buying used manga: a condition guide and checklist",
  description:
    "What to check before buying second-hand manga, what condition grades like Very Good and Acceptable mean in practice, and how to work out whether a deal is really good.",
  published: "2026-11-04",
  updated: "2026-11-04",
};

export function BuyingUsedGuide() {
  return (
    <>
      <p>
        Second-hand volumes are the cheapest way to build a collection, especially for finished series that
        people sell off in one go. A used copy is only a bargain if you know what you’re getting, though, and
        since condition labels are not standardized, it’s worth checking for yourself.
      </p>

      <h2>What to check in person</h2>
      <ol>
        <li>
          <strong>Spine:</strong> look for creases, cracks, and fading. Sun fading is hard to spot on one
          volume, but it stands out next to the rest of your set.
        </li>
        <li>
          <strong>Binding:</strong> open the book gently and check that no pages are loose. Older glued
          paperbacks can come apart.
        </li>
        <li>
          <strong>Page edges and color:</strong> some yellowing is normal with age. Dark or uneven spots can
          point to moisture or poor storage.
        </li>
        <li>
          <strong>Smell:</strong> a musty smell suggests damp, and it’s difficult to remove. Smoke is another
          one to watch for.
        </li>
        <li>
          <strong>Water damage:</strong> wavy pages are a giveaway, even if they’ve since dried out.
        </li>
        <li>
          <strong>Writing and stickers:</strong> check the first pages for names, and the cover for price
          stickers that may tear when removed.
        </li>
        <li>
          <strong>Edition:</strong> make sure the size, printing, and cover design match the rest of your set.
        </li>
      </ol>

      <h2>What condition grades usually mean</h2>
      <p>
        Sellers use these terms loosely, so treat this as a guide and ask when unsure. These are the same
        grades ReadLedger uses, so your records stay consistent.
      </p>
      <DataTable
        head={["Grade", "What to expect"]}
        rows={[
          ["New", "Unread and unmarked, as sold in a shop"],
          ["Like New", "Read once or twice, with no visible wear"],
          ["Very Good", "Light shelf wear, clean pages, and a tight binding"],
          ["Good", "Clearly read: spine creases or minor marks, but complete and solid"],
          ["Acceptable", "Heavy wear, and possibly writing or yellowing, but still readable"],
          ["Poor", "Damaged or loose. Only worthwhile as a cheap stopgap"],
        ]}
      />

      <h2>Buying online</h2>
      <ul>
        <li>Ask for photos of the spine and of the page edges, not just the front cover.</li>
        <li>Include shipping in your price, because it can wipe out a low listing price.</li>
        <li>Combine orders from one seller, since bundles often ship for much less per volume.</li>
        <li>Check whether listings show the actual copy or just a stock image.</li>
        <li>For lots, get a list of volume numbers, and compare it with your checklist before you pay.</li>
      </ul>

      <h2>Is it actually a good deal?</h2>
      <p>
        Compare the total price, including shipping, against the retail price of the same volume. For example,
        a volume with a retail price of 10 that costs you 4 plus 2 shipping saves you 4, or 40%. A mixed lot
        only counts as a deal for the volumes you really need, so subtract anything you’ll end up reselling.
      </p>
      <p>
        If you log prices, the savings add up in a way you can see. ReadLedger compares what you paid against
        a series’ retail price, counting only volumes where both prices are known, so it doesn’t overstate
        your savings. To plan the wider budget, see{" "}
        <Link href="/guides/how-much-does-a-manga-collection-cost">how much a manga collection costs</Link>.
      </p>

      <h2>Taking care of what you buy</h2>
      <p>
        Keep volumes upright and out of direct sunlight, and don’t pack them so tightly that spines bend when
        you pull one out. Avoid damp spaces like basements and exterior walls. For gaps in a long run, keep a{" "}
        <Link href="/manga">volume checklist</Link> on your phone so you can act fast when you spot a missing
        volume.
      </p>
    </>
  );
}
