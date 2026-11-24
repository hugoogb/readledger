"use client";

import { ErrorPage } from "@/components/ui/error-page";

export default function DashboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPage
      {...props}
      title="The dashboard didn't load"
      message="Failed to load the dashboard. Please try again."
      back={{ href: "/dashboard", label: "Go back" }}
    />
  );
}
