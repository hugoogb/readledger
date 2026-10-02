import { ChipNav } from "@/components/statistics/chip-nav";
import { CollectionTab } from "@/components/statistics/collection-tab";
import { MoneyTab } from "@/components/statistics/money-tab";
import { ReadingTab } from "@/components/statistics/reading-tab";
import { ChartGridSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Statistics",
  description: "Collection statistics and insights",
};

const tabs = [
  { value: "reading", label: "Reading" },
  { value: "collection", label: "Collection" },
  { value: "money", label: "Money" },
] as const;

type Tab = (typeof tabs)[number]["value"];

type Props = {
  searchParams: Promise<{ tab?: string; year?: string }>;
};

export default async function StatisticsPage({ searchParams }: Props) {
  const { tab: tabParam, year } = await searchParams;
  const tab: Tab = tabs.some((t) => t.value === tabParam) ? (tabParam as Tab) : "reading";

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Statistics</h1>
        <p className="text-foreground-muted">
          Insights about your manga collection
        </p>
      </div>

      <div className="mb-6">
        <ChipNav
          label="Statistics sections"
          active={tab}
          items={tabs.map((t) => ({
            value: t.value,
            label: t.label,
            href: `/dashboard/statistics?tab=${t.value}`,
          }))}
        />
      </div>

      {/* Keyed so switching tab/year shows the skeleton instead of stale data. */}
      <Suspense key={`${tab}-${year ?? ""}`} fallback={<ChartGridSkeleton />}>
        {tab === "reading" && <ReadingTab yearParam={year} />}
        {tab === "collection" && <CollectionTab />}
        {tab === "money" && <MoneyTab />}
      </Suspense>
    </div>
  );
}
