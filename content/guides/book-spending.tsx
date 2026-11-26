import Link from "next/link";
import { DataTable } from "@/components/marketing/content-parts";

export const bookSpendingMeta = {
  slug: "how-much-do-you-spend-on-books",
  kind: "Guide",
  title: "How Much Do You Spend on Books? How to Find Out",
  heading: "How much do you spend on books? How to find out and keep track",
  description:
    "Work out what your reading really costs: how to total a year of book purchases, the costs people forget, and simple ways to spend less without reading less.",
  published: "2026-11-19",
  updated: "2026-11-19",
};

const BOOKS_PER_YEAR = 24;
const NEW_PRICE = 15;
const USED_PRICE = 9;

const scenarios = [
  { label: "All new", newBooks: BOOKS_PER_YEAR },
  { label: "Half new, half used", newBooks: BOOKS_PER_YEAR / 2 },
  { label: "All used", newBooks: 0 },
];

export function BookSpendingGuide() {
  const rows = scenarios.map(({ label, newBooks }) => {
    const usedBooks = BOOKS_PER_YEAR - newBooks;
    const total = newBooks * NEW_PRICE + usedBooks * USED_PRICE;
    return [label, `${newBooks} new, ${usedBooks} used`, total.toLocaleString("en-US")];
  });

  return (
    <>
      <p>
        Ask a reader what they spend on books and you’ll usually get a guess, and usually a low one.
        Purchases are spread across a bookshop here, an online order there, and a few impulse buys,
        so nobody sees the total. Getting a real number takes about half an hour.
      </p>

      <h2>Total up the last twelve months</h2>
      <ol>
        <li>
          Open the order history of each online store you use. Most keep years of it, with prices and
          dates.
        </li>
        <li>Search your card statements for bookshops, and dig out any receipts you’ve kept.</li>
        <li>Add everything up, including shipping, and count how many books it bought.</li>
        <li>Divide the total by the number of books. That’s your average price per book.</li>
      </ol>
      <p>
        The average is the number worth remembering. Once you know it, “should I buy this series?” becomes
        simple multiplication.
      </p>

      <h2>A worked example</h2>
      <p>
        Say you buy 24 books a year. This table assumes 15 per book new and 9 used, in whatever currency you
        pay in. These are illustrative numbers, not market prices, so swap in your own average.
      </p>
      <DataTable head={["How you buy", "Books", "Year total"]} rows={rows} />
      <p>
        Buying half your books used saves about a fifth of the yearly total here, without reading a single
        book less.
      </p>

      <h2>Costs that are easy to overlook</h2>
      <ul>
        <li>
          <strong>Shipping on single orders:</strong> one book at a time online can add a lot to your average.
        </li>
        <li>
          <strong>Series:</strong> starting a long series is a commitment to every volume after it. For manga,
          see <Link href="/guides/how-much-does-a-manga-collection-cost">what a manga series costs to complete</Link>.
        </li>
        <li>
          <strong>Special editions:</strong> hardcovers and collector’s editions can cost several times the
          paperback.
        </li>
        <li>
          <strong>Duplicates:</strong> a book you already owned is the most expensive book on your shelf, because
          it bought you nothing.
        </li>
        <li>
          <strong>The unread pile:</strong> money spent on books you haven’t read yet isn’t wasted, but it’s spent
          early. If the pile keeps growing, you’re buying faster than you read.
        </li>
      </ul>

      <h2>Ways to spend less without reading less</h2>
      <ul>
        <li>
          <strong>Buy used.</strong> It’s the biggest saving available. Our{" "}
          <Link href="/guides/buying-used-manga-condition-guide">guide to buying used</Link> is written for
          manga, but the condition checks apply to any book.
        </li>
        <li>
          <strong>Use the library for one-time reads.</strong> Buy the books you’ll reread or lend out.
        </li>
        <li>
          <strong>Keep a wishlist.</strong> Knowing exactly what you want stops impulse buys and duplicates,
          and makes a good deal easy to spot.
        </li>
        <li>
          <strong>Match buying to reading.</strong> A yearly reading goal next to your owned-but-unread count
          tells you whether you need more books or just more time.
        </li>
      </ul>

      <h2>Keep track as you go</h2>
      <p>
        Reconstructing a year of spending once is fine. Doing it every year isn’t. Log the price when a book
        arrives, which takes seconds, and the total builds itself. A spreadsheet does the job. ReadLedger keeps
        the price, store, and condition on each book, turns them into totals, averages, and trends, and shows
        how much you’ve saved wherever you’ve set a retail price. To get started, see{" "}
        <Link href="/guides/how-to-catalog-your-home-library">how to catalog your home library</Link>.
      </p>
    </>
  );
}
