"use client";

import { ErrorPage } from "@/components/ui/error-page";

export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPage
      {...props}
      title="This page didn't load"
      message="An unexpected error occurred. Please try again."
      back={{ href: "/", label: "Go home" }}
    />
  );
}
