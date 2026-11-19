import {
  getCollectionGrowth,
  getConditionDistribution,
  getFormatBreakdown,
  getPublisherBreakdown,
  getStatusDistribution,
  getUndatedOwnedCount,
} from "@/actions/statistics";
import { CollectionGrowth } from "@/components/charts/collection-growth";
import { ConditionDistribution } from "@/components/charts/condition-distribution";
import { FormatBreakdown } from "@/components/charts/format-breakdown";
import { PublisherBreakdown } from "@/components/charts/publisher-breakdown";
import { StatusDistribution } from "@/components/charts/status-distribution";
import { ChartCard } from "./chart-card";
import { UndatedNote } from "./undated-note";

export async function CollectionTab() {
  const [statusDist, growth, publishers, conditions, undated, formats] = await Promise.all([
    getStatusDistribution(),
    getCollectionGrowth(),
    getPublisherBreakdown(),
    getConditionDistribution(),
    getUndatedOwnedCount(),
    getFormatBreakdown(),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Only meaningful once the library mixes formats. */}
      {formats.length > 1 && (
        <ChartCard title="By Format">
          <FormatBreakdown data={formats} />
        </ChartCard>
      )}
      <ChartCard title="Status Distribution">
        <StatusDistribution data={statusDist} />
      </ChartCard>
      <ChartCard title="Collection Growth">
        <CollectionGrowth data={growth} />
        <UndatedNote count={undated} kind="purchase" />
      </ChartCard>
      <ChartCard title="By Publisher">
        <PublisherBreakdown data={publishers} />
      </ChartCard>
      <ChartCard title="Condition Distribution">
        <ConditionDistribution data={conditions} />
      </ChartCard>
    </div>
  );
}
