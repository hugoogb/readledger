import {
  getSpendingOverTime,
  getStoreBreakdown,
  getUndatedOwnedCount,
} from "@/actions/statistics";
import { SpendingOverTime } from "@/components/charts/spending-over-time";
import { StoreBreakdown } from "@/components/charts/ranked-bar-chart";
import { ChartCard } from "./chart-card";
import { UndatedNote } from "./undated-note";

export async function MoneyTab() {
  const [spending, stores, undated] = await Promise.all([
    getSpendingOverTime(),
    getStoreBreakdown(),
    getUndatedOwnedCount(),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Spending Over Time">
        <SpendingOverTime data={spending} />
        <UndatedNote count={undated} kind="purchase" />
      </ChartCard>
      <ChartCard title="By Store">
        <StoreBreakdown data={stores} />
      </ChartCard>
    </div>
  );
}
