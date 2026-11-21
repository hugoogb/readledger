import Link from "next/link";
import { CoverImage } from "./cover-image";

export type CoverShelfItem = {
  key: string;
  href: string;
  title: string;
  caption: string;
  coverImage: string | null;
};

type CoverShelfProps = {
  items: CoverShelfItem[];
  emptyText: string;
};

/**
 * A row of covers. Phones scroll it sideways; from lg it becomes a six-column
 * grid so wider screens show more books, not bigger cards.
 */
export function CoverShelf({ items, emptyText }: CoverShelfProps) {
  if (items.length === 0) {
    return <p className="py-6 text-sm text-foreground-muted">{emptyText}</p>;
  }

  return (
    <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-0">
      {items.map((item) => (
        <li key={item.key} className="w-[72px] shrink-0 snap-start lg:w-auto">
          <Link href={item.href} className="group relative block">
            <CoverImage
              src={item.coverImage}
              title={item.title}
              sizes="(min-width: 1024px) 160px, 72px"
              className="transition-transform group-hover:-translate-y-0.5"
            />
            <span className="sr-only">{item.title}</span>
            <span className="mt-1.5 block truncate text-xs text-foreground-muted">{item.caption}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
