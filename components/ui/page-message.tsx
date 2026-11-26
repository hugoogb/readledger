import type { ReactNode } from "react";

type PageMessageProps = {
  eyebrow?: string;
  title: string;
  body: ReactNode;
  children?: ReactNode;
};

export function PageMessage({ eyebrow, title, body, children }: PageMessageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 font-serif text-3xl font-medium leading-tight">{title}</h1>
        <div className="mt-3 leading-relaxed text-foreground-muted">{body}</div>
        <div className="double-rule mt-6" aria-hidden="true" />
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  );
}
