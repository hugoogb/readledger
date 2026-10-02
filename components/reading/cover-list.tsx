import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type CoverListItem = {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  coverImage: string | null;
  /** Right-aligned value, e.g. a count. */
  aside?: string;
};

type CoverListProps = {
  items: CoverListItem[];
  emptyText: string;
};

/** Compact list of cover + title rows linking into series pages. */
export function CoverList({ items, emptyText }: CoverListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-foreground-muted py-6 text-center">{emptyText}</p>;
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-background-tertiary transition-colors"
          >
            {item.coverImage ? (
              <Image
                width={36}
                height={48}
                src={item.coverImage}
                alt=""
                className="w-9 h-12 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-12 rounded-md bg-background-tertiary flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-foreground-muted/50" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{item.title}</p>
              <p className="text-sm text-foreground-muted truncate">{item.subtitle}</p>
            </div>
            {item.aside && (
              <span className="text-sm font-semibold tabular-nums shrink-0">{item.aside}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
