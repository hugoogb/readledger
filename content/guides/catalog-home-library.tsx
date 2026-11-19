import Link from "next/link";

export const catalogHomeLibraryMeta = {
  slug: "how-to-catalog-your-home-library",
  kind: "Guide",
  title: "How to Catalog Your Home Library",
  heading: "How to catalog your home library, one shelf at a time",
  description:
    "A practical way to catalog the books you own: what to record for each book, how to handle series and editions, and how to get through a full bookcase in an afternoon.",
  published: "2026-11-19",
  updated: "2026-11-19",
};

export function CatalogHomeLibraryGuide() {
  return (
    <>
      <p>
        Most people start cataloging their books after buying one they already owned, or after lending
        one out and forgetting who has it. A catalog doesn’t need to be a project. You need one list,
        a few details per book, and a habit of adding new books when they arrive.
      </p>

      <h2>1. Decide what counts as one entry</h2>
      <p>Settle this before you add anything, so your counts mean something later:</p>
      <ul>
        <li>
          <strong>A standalone book is one entry.</strong> A novel, a cookbook, a biography: one title,
          one entry.
        </li>
        <li>
          <strong>A series is one entry with numbered volumes.</strong> This matters for manga, comics,
          and long fantasy series, where the useful question is “which volume am I missing?” See{" "}
          <Link href="/guides/how-to-track-your-manga-collection">how to track a manga collection</Link>{" "}
          for omnibus editions and numbering that differs between countries.
        </li>
        <li>
          <strong>Two editions are two entries.</strong> If you own a paperback and a special hardcover
          of the same book, list both. They have different prices, conditions, and ISBNs.
        </li>
      </ul>

      <h2>2. Record the few details you’ll actually use</h2>
      <p>Long forms get abandoned halfway through the first shelf. These cover nearly every question:</p>
      <ul>
        <li>
          <strong>Owned or not.</strong> It sounds obvious, but it’s what lets you keep a wishlist in the
          same place.
        </li>
        <li>
          <strong>Read or not.</strong> Most readers own more unread books than they think.
        </li>
        <li>
          <strong>Price paid and store.</strong> The only way to know what your reading really costs.
        </li>
        <li>
          <strong>Condition.</strong> Worth it if you buy used or collect special editions.
        </li>
        <li>
          <strong>ISBN.</strong> The 10 or 13 digit number on the back cover or the copyright page. It
          identifies the exact edition, which a title alone can’t do.
        </li>
        <li>
          <strong>Notes.</strong> A good place for “lent to Sam in March”.
        </li>
      </ul>
      <p>
        Skip page counts, genres, and shelf locations unless you know you’ll use them. You can always
        add detail later, and it’s much harder to make yourself fill in fields you don’t care about.
      </p>

      <h2>3. Pick where the list lives</h2>
      <p>
        You’ll need your list most in a bookshop, so judge each option by how quickly you can answer
        “do I own this?” on your phone.
      </p>
      <ul>
        <li>
          <strong>A spreadsheet</strong> is free and flexible, but you type every title, author, and
          price yourself, and it’s awkward on a small screen. Our{" "}
          <Link href="/guides/manga-spreadsheet-vs-notion-vs-app">spreadsheet vs Notion vs app</Link>{" "}
          comparison covers the tradeoffs.
        </li>
        <li>
          <strong>A tracker app</strong> fills in the details for you. In ReadLedger you search by title,
          author, or ISBN, and the book’s details and cover come from Open Library (manga comes from
          MangaDex). You then mark it owned or read and add what you paid.
        </li>
      </ul>
      <p>
        ReadLedger doesn’t scan barcodes, so you type or paste the ISBN. If scanning matters to you, our{" "}
        <Link href="/guides/best-manga-collection-tracker-apps">tracker app comparison</Link> lists apps
        that do.
      </p>

      <h2>4. Catalog one shelf at a time</h2>
      <p>The first pass is the only hard part. This order keeps it moving:</p>
      <ol>
        <li>Take one shelf’s books down and stack them next to you.</li>
        <li>
          Add each book, then put it back. Searching by ISBN is quickest for recent books, and the title
          works better for older ones printed before ISBNs were common.
        </li>
        <li>For series, add the series once and mark the whole run as owned, then un-mark the gaps.</li>
        <li>Mark what you’ve read as you go, while the book is in your hand.</li>
        <li>
          Skip prices you can’t remember. Start logging from your next purchase, and your spending numbers
          will be useful within a few months.
        </li>
      </ol>
      <p>
        A shelf of 30 to 40 books takes about as long as an episode of something. Stop between shelves,
        and you’ll know exactly where to pick up.
      </p>

      <h2>5. Keep it current</h2>
      <p>
        A catalog goes stale the first time you skip a new book. Add each book when it arrives, before it
        reaches the shelf, and mark it read when you finish it. Put books you want on a wishlist instead of
        a note on your phone, so you can check it in the shop and stop buying duplicates.
      </p>

      <h2>Common questions</h2>
      <h3>I already have a list. Do I have to start again?</h3>
      <p>
        No. ReadLedger imports CSV and JSON files, so you can bring a spreadsheet over. The{" "}
        <Link href="/guides/manga-collection-spreadsheet-template">spreadsheet template</Link> shows the
        column names the importer reads.
      </p>
      <h3>Should I catalog e-books too?</h3>
      <p>
        Only if you’d otherwise buy the same book twice. Most people keep physical and digital books apart,
        and a note on the entry is enough to tell them apart.
      </p>
    </>
  );
}
