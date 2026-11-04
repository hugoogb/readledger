import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Our own static data, but "<" is escaped so it can't close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail plus its BreadcrumbList markup. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: `${SITE_URL}${item.href}`,
          })),
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-foreground-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              {i < items.length - 1 ? (
                <Link href={item.href} className="py-1 hover:text-foreground transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span aria-current="page" className="py-1 text-foreground">
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** Long-form text styling, since the project doesn't use the typography plugin. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-foreground-muted leading-relaxed [&>p]:mt-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_a]:text-accent [&_a]:underline [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:text-foreground">
      {children}
    </div>
  );
}

/** Scrolls inside its own box so a wide table never widens the phone viewport. */
export function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead className="bg-background-tertiary/40 text-foreground">
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-3 py-2 font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-border">
              {row.map((cell, c) => (
                <td key={c} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SignUpCta({ title, body }: { title: string; body: string }) {
  return (
    <aside className="glass mt-12 rounded-2xl p-6 text-center">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-foreground-muted">{body}</p>
      <Link
        href="/login"
        className="mt-5 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition-colors"
      >
        Create your free account
        <ArrowRight className="w-5 h-5" />
      </Link>
    </aside>
  );
}
