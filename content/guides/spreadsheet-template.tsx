import Link from "next/link";
import { DataTable } from "@/components/marketing/content-parts";

export const TEMPLATE_PATH = "/manga-collection-template.csv";

export const spreadsheetMeta = {
  slug: "manga-collection-spreadsheet-template",
  kind: "Guide",
  title: "Free Manga Collection Spreadsheet Template (CSV)",
  heading: "Free manga collection spreadsheet template",
  description:
    "Download a free manga collection spreadsheet template for Excel or Google Sheets. See which columns to use, formulas for totals, and when to move to an app.",
  published: "2026-11-04",
  updated: "2026-11-04",
};

export function SpreadsheetGuide() {
  return (
    <>
      <p>
        A spreadsheet is a good way to start tracking manga: it’s free, flexible, and entirely yours.
        The usual mistake is giving each series one row, which works until you need to know which
        volumes are missing. This template uses one row per volume instead.
      </p>
      <p>
        <a href={TEMPLATE_PATH} download>
          <strong>Download the template (CSV)</strong>
        </a>
        . It opens in Excel, Google Sheets, Numbers, and LibreOffice.
      </p>

      <h2>The columns</h2>
      <DataTable
        head={["Column", "What goes in it", "Example"]}
        rows={[
          ["series_title", "Series name, spelled the same every time", "Vinland Saga"],
          ["volume_number", "Whole number", "4"],
          ["owned", "yes or no", "yes"],
          ["read", "yes or no", "no"],
          ["wishlist", "yes or no", "no"],
          ["price_paid", "What you actually paid", "7.50"],
          ["store", "Where you bought it", "Local bookshop"],
          ["condition", "NEW, LIKE_NEW, VERY_GOOD, GOOD, ACCEPTABLE, or POOR", "VERY_GOOD"],
          ["purchase_date", "YYYY-MM-DD", "2026-03-14"],
          ["read_date", "YYYY-MM-DD", "2026-04-02"],
          ["notes", "Anything else, such as the edition", "2-in-1 edition"],
          ["isbn", "Optional", ""],
        ]}
      />

      <h2>Formulas worth adding</h2>
      <p>
        Assuming the template’s column order, these work in both Excel and Google Sheets. Put them on a
        separate sheet, and in Excel refer to the data sheet by name.
      </p>
      <ul>
        <li>
          <strong>Volumes owned:</strong> <code>=COUNTIF(C:C,&quot;yes&quot;)</code>
        </li>
        <li>
          <strong>Volumes read:</strong> <code>=COUNTIF(D:D,&quot;yes&quot;)</code>
        </li>
        <li>
          <strong>Total spent:</strong> <code>=SUM(F:F)</code>
        </li>
        <li>
          <strong>Average price per volume:</strong> <code>=AVERAGE(F:F)</code>
        </li>
        <li>
          <strong>Owned in one series:</strong>{" "}
          <code>=COUNTIFS(A:A,&quot;Vinland Saga&quot;,C:C,&quot;yes&quot;)</code>
        </li>
      </ul>

      <h2>Fill it in faster</h2>
      <ul>
        <li>
          Look up the total for each series first. Our <Link href="/manga">volume checklists</Link> list
          the count for popular titles.
        </li>
        <li>Type volumes 1 and 2, then drag the fill handle to number the rest of the run.</li>
        <li>Paste the same series name down the first column, because a misspelling splits a series in two.</li>
        <li>Freeze the header row and add a filter, so you can narrow down to one series on a phone.</li>
      </ul>

      <h2>When a spreadsheet stops being enough</h2>
      <p>
        Spreadsheets start to strain at a few hundred rows, especially on a phone. Typical signs are
        checking your list in a shop and giving up, or having formulas break after you sort a column.
        Charts also have to be built by hand. Our{" "}
        <Link href="/guides/manga-spreadsheet-vs-notion-vs-app">comparison of spreadsheets, Notion, and apps</Link>{" "}
        goes through the tradeoffs.
      </p>

      <h2>Moving your spreadsheet into ReadLedger</h2>
      <p>
        This template uses the same column names as ReadLedger’s importer, so your work carries over if
        you switch. Export your sheet as CSV, then import it from your account. You’ll see a preview
        before anything is saved, along with any rows that need fixing. You can also export to CSV or
        JSON at any time, so you won’t be locked in.
      </p>
    </>
  );
}
