"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageMessage } from "@/components/ui/page-message";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  /** Shown in production; development shows the error's own message. */
  message: string;
  back: { href: string; label: string };
};

/** Body of a route's error.tsx: what failed, a retry and a way back. */
export function ErrorPage({ error, reset, title, message, back }: ErrorPageProps) {
  return (
    <PageMessage
      eyebrow="Something went wrong"
      title={title}
      body={
        <>
          {process.env.NODE_ENV === "development" ? error.message || message : message}
          {error.digest && <p className="mt-2 text-xs">Digest: {error.digest}</p>}
        </>
      }
    >
      <Button onClick={reset}>Try again</Button>
      <Link href={back.href} className={buttonVariants({ variant: "outline" })}>
        {back.label}
      </Link>
    </PageMessage>
  );
}
