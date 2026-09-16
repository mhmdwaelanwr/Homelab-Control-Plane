import { MetricAreaChart } from '@/components/dashboard/MetricAreaChart';
import type { RealtimePayload } from '@/types/api';

type DashboardChartsSectionProps = {
  cpuHistory: RealtimePayload['cpu']['history'];
  ramHistory: RealtimePayload['ram']['history'];
  storageHistory: RealtimePayload['storage']['history'];
};

export function DashboardChartsSection({ cpuHistory, ramHistory, storageHistory }: DashboardChartsSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <MetricAreaChart title="CPU history" subtitle="Recent processor utilization" points={cpuHistory} color="#5cd7c7" />
      <MetricAreaChart title="RAM history" subtitle="Recent memory utilization" points={ramHistory} color="#6da4ff" />
      <MetricAreaChart title="Storage history" subtitle="Recent disk utilization" points={storageHistory} color="#ffb24a" />
    </div>
  );
}
