"use client";

import { ErrorPage } from "@/components/ui/error-page";

export default function LibraryError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPage
      {...props}
      title="Your library didn't load"
      message="Could not load your library. Please try again."
      back={{ href: "/dashboard", label: "Go back" }}
    />
  );
}
