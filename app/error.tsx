"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageMessage } from "@/components/ui/page-message";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageMessage
      eyebrow="Something went wrong"
      title="This page didn't load"
      body={
        <>
          {process.env.NODE_ENV === "development"
            ? error.message || "An unexpected error occurred. Please try again."
            : "An unexpected error occurred. Please try again."}
          {error.digest && <p className="mt-2 text-xs">Digest: {error.digest}</p>}
        </>
      }
    >
      <Button onClick={reset}>Try again</Button>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Go home
      </Link>
    </PageMessage>
  );
}
