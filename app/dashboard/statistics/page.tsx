import {
  getSpendingOverTime,
  getStatusDistribution,
  getCollectionGrowth,
  getPublisherBreakdown,
  getStoreBreakdown,
  getConditionDistribution,
} from "@/actions/statistics";
import { SpendingOverTime } from "@/components/charts/spending-over-time";
import { StatusDistribution } from "@/components/charts/status-distribution";
import { CollectionGrowth } from "@/components/charts/collection-growth";
import { PublisherBreakdown } from "@/components/charts/publisher-breakdown";
import { StoreBreakdown } from "@/components/charts/store-breakdown";
import { ConditionDistribution } from "@/components/charts/condition-distribution";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics",
  description: "Collection statistics and insights",
};

export default async function StatisticsPage() {
  const [spending, statusDist, growth, publishers, stores, conditions] = await Promise.all([
    getSpendingOverTime(),
    getStatusDistribution(),
    getCollectionGrowth(),
    getPublisherBreakdown(),
    getStoreBreakdown(),
    getConditionDistribution(),
  ]);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-1">Statistics</h1>
        <p className="text-foreground-muted">
          Insights about your manga collection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Over Time */}
        <div className="glass rounded-2xl p-6 animate-fade-in stagger-1">
          <h2 className="text-lg font-semibold mb-4">Spending Over Time</h2>
          <SpendingOverTime data={spending} />
        </div>

        {/* Status Distribution */}
        <div className="glass rounded-2xl p-6 animate-fade-in stagger-2">
          <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
          <StatusDistribution data={statusDist} />
        </div>

        {/* Collection Growth */}
        <div className="glass rounded-2xl p-6 animate-fade-in stagger-3">
          <h2 className="text-lg font-semibold mb-4">Collection Growth</h2>
          <CollectionGrowth data={growth} />
        </div>

        {/* Publisher Breakdown */}
        <div className="glass rounded-2xl p-6 animate-fade-in stagger-4">
          <h2 className="text-lg font-semibold mb-4">By Publisher</h2>
          <PublisherBreakdown data={publishers} />
        </div>

        {/* Store Breakdown */}
        <div className="glass rounded-2xl p-6 animate-fade-in stagger-5">
          <h2 className="text-lg font-semibold mb-4">By Store</h2>
          <StoreBreakdown data={stores} />
        </div>

        {/* Condition Distribution */}
        <div className="glass rounded-2xl p-6 animate-fade-in stagger-6">
          <h2 className="text-lg font-semibold mb-4">Condition Distribution</h2>
          <ConditionDistribution data={conditions} />
        </div>
      </div>
    </div>
  );
}
