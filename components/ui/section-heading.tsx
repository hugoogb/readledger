import Link from "next/link";

type SectionHeadingProps = {
  title: string;
  action?: { href: string; label: string };
  as?: "h2" | "h3";
};

export function SectionHeading({ title, action, as: Tag = "h2" }: SectionHeadingProps) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <Tag className="font-serif text-[1.2rem] font-medium leading-tight lg:text-xl">{title}</Tag>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 py-2 text-sm text-foreground-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
