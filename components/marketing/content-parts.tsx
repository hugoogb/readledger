import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

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
    <div className="max-w-[40rem] text-[1.0625rem] text-foreground/85 leading-relaxed [&>p]:mt-4 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-[1.75rem] [&_h2]:font-medium [&_h2]:leading-tight [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-border-hover hover:[&_a]:decoration-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:text-foreground">
      {children}
    </div>
  );
}

/** Scrolls inside its own box so a wide table never widens the phone viewport. */
export function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto border-y border-border">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead className="text-foreground">
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col" className="eyebrow px-3 py-2.5 font-medium">
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
    <aside className="mt-14 border-t-2 border-foreground pt-6">
      <h2 className="font-serif text-2xl font-medium text-foreground">{title}</h2>
      <p className="mt-2 max-w-[40rem] text-foreground-muted">{body}</p>
      <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "mt-5")}>
        Create your free account
        <ArrowRight />
      </Link>
    </aside>
  );
}
