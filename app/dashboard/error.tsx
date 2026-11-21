"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageMessage } from "@/components/ui/page-message";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageMessage
      eyebrow="Something went wrong"
      title="The dashboard didn't load"
      body={
        <>
          {process.env.NODE_ENV === "development"
            ? error.message || "Failed to load the dashboard. Please try again."
            : "Failed to load the dashboard. Please try again."}
          {error.digest && <p className="mt-2 text-xs">Digest: {error.digest}</p>}
        </>
      }
    >
      <Button onClick={reset}>Try again</Button>
      <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Go back
      </Link>
    </PageMessage>
  );
}
