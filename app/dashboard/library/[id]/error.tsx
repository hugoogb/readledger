"use client";

import { ErrorPage } from "@/components/ui/error-page";

export default function DetailError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPage
      {...props}
      title="This title didn't load"
      message="Could not load this series. It may have been deleted or you may not have access."
      back={{ href: "/dashboard/library", label: "Back to library" }}
    />
  );
}
