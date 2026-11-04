import Link from "next/link";

export const howToTrackMeta = {
  slug: "how-to-track-your-manga-collection",
  kind: "Guide",
  title: "How to Track Your Manga Collection",
  heading: "How to track your manga collection without losing count",
  description:
    "A simple way to track your manga collection: what to record for each volume, how to handle editions, and how to catalog a full shelf in one afternoon.",
  published: "2026-11-04",
  updated: "2026-11-04",
};

export function HowToTrackGuide() {
  return (
    <>
      <p>
        Most collections start being tracked right after an expensive mistake, usually a duplicate
        volume bought because you were sure you didn’t have it. The fix doesn’t need to be elaborate.
        You need one list, a small set of details per volume, and a habit that takes seconds.
      </p>

      <h2>1. Decide what counts as one item</h2>
      <p>
        Track individual volumes, not just series. “I collect Naruto” can’t tell you that volume 38 is
        missing, while a per-volume list can. Before you add anything, also decide how you’ll treat
        special formats:
      </p>
      <ul>
        <li>
          <strong>Omnibus and 3-in-1 editions:</strong> mark each volume the book contains as owned,
          and add a note about the edition. Otherwise your count won’t match the series total.
        </li>
        <li>
          <strong>Different languages:</strong> numbering can differ between countries.{" "}
          <Link href="/manga/dragon-ball">Dragon Ball</Link> is the classic example: its English release
          splits the Japanese run into two separately numbered series.
        </li>
        <li>
          <strong>Spin-offs and sequels:</strong> track them as their own series, so that a side story
          doesn’t distort the main count.
        </li>
      </ul>

      <h2>2. Record the few details you’ll actually use</h2>
      <p>
        Long forms get abandoned. For each volume, these answer nearly every question a collector asks:
      </p>
      <ul>
        <li>
          <strong>Owned or not.</strong> This is the one field you can’t skip.
        </li>
        <li>
          <strong>Read or not.</strong> Useful as soon as your shelf outgrows your reading pace.
        </li>
        <li>
          <strong>Price paid.</strong> It’s the only way to know what the hobby really costs you.
        </li>
        <li>
          <strong>Store and condition.</strong> Worth adding if you buy second-hand often.
        </li>
      </ul>
      <p>
        Skip the rest unless you have a reason. Page counts and publication dates sound useful, but
        you’ll rarely look them up.
      </p>

      <h2>3. Pick a tool you’ll open on your phone</h2>
      <p>
        You’ll most need your list while standing in a shop, so judge any option by how quickly you can
        answer “do I own volume 12?” on your phone. A notebook can’t be searched, and a big spreadsheet
        is awkward on a small screen. We compare the options in{" "}
        <Link href="/guides/manga-spreadsheet-vs-notion-vs-app">spreadsheet vs Notion vs app</Link>,
        and list specific apps in our{" "}
        <Link href="/guides/best-manga-collection-tracker-apps">tracker app comparison</Link>.
      </p>

      <h2>4. Catalog your shelf in one sitting</h2>
      <p>The first pass is the only hard part, and it goes faster in this order:</p>
      <ol>
        <li>Add every series first, without touching individual volumes.</li>
        <li>Mark whole runs as owned, then un-mark the gaps. It beats ticking volumes one at a time.</li>
        <li>Mark what you’ve read the same way.</li>
        <li>
          Skip old prices you can’t remember. Start logging from your next purchase, and your spending
          data will still be useful within a few months.
        </li>
      </ol>
      <p>
        Want to try it on one series first? Our <Link href="/manga">volume checklists</Link> work
        without an account, and they show how many volumes each series has.
      </p>

      <h2>5. Make updating a two-second habit</h2>
      <p>
        Trackers go stale when updating feels like a chore. Tie it to something you already do: log a
        volume when it arrives, before it goes on the shelf, and mark it as read when you finish it.
        If you fall behind, don’t try to reconstruct every price. Just fix what you own and carry on.
      </p>

      <h2>Common questions</h2>
      <h3>What’s the easiest way to catalog a large collection?</h3>
      <p>
        Work series by series and mark entire runs at once, then correct the gaps. If you already have
        a list, importing it saves the most time: see our{" "}
        <Link href="/guides/manga-collection-spreadsheet-template">spreadsheet template</Link>.
      </p>
      <h3>Should I track digital volumes too?</h3>
      <p>
        Only if you’d otherwise buy them twice. Many collectors keep digital and physical apart, and a
        note on the volume is enough to tell them apart.
      </p>
    </>
  );
}
