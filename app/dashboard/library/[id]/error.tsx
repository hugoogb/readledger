"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageMessage } from "@/components/ui/page-message";

export default function DetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageMessage
      eyebrow="Something went wrong"
      title="This title didn't load"
      body={
        <>
          {process.env.NODE_ENV === "development"
            ? error.message || "Could not load this series. It may have been deleted or you may not have access."
            : "Could not load this series. It may have been deleted or you may not have access."}
          {error.digest && <p className="mt-2 text-xs">Digest: {error.digest}</p>}
        </>
      }
    >
      <Button onClick={reset}>Try again</Button>
      <Link href="/dashboard/library" className={buttonVariants({ variant: "outline" })}>
        Back to library
      </Link>
    </PageMessage>
  );
}
