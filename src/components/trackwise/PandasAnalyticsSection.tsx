import { useEffect, useState } from "react";
import { Activity, Download, Gauge, Signal, TrainFront, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dataAnalyticsService, type AnalyticsSummary } from "@/services/api";
import { ChartBox } from "./ChartBox";
import { KpiCard } from "./KpiCard";
import { Panel } from "./shared";

export function PandasAnalyticsSection() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void dataAnalyticsService
      .summary("daily")
      .then(setSummary)
      .catch(() => setError("Analytics API unavailable; live dashboard data remains available."));
  }, []);
  const download = async () => {
    try {
      const blob = await dataAnalyticsService.exportExcel();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "railway-analytics.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Excel export is unavailable while the analytics API is offline.");
    }
  };
  if (!summary)
    return (
      <section className="mt-4 rounded-md border border-border bg-panel-muted p-4 text-sm text-muted-foreground">
        {error || "Loading analytics..."}
      </section>
    );
  const tms = summary.tms.kpis;
  const smms = summary.smms.kpis;
  const tdms = summary.tdms.kpis;
  const openIssues = summary.department_report.reduce(
    (total, row) => total + Number(row.open ?? 0),
    0,
  );
  return (
    <section className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div>
          <p className="font-display text-sm font-bold tracking-[0.12em] text-primary">
            PANDAS OPERATIONS INTELLIGENCE
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Centralized TMS, SMMS and TDMS processing · {summary.period} report
          </p>
        </div>
        <button
          onClick={() => void download()}
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-accent"
        >
          <Download className="size-4" /> Export Excel
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Track Utilization"
          value={tms.track_utilization_percent ?? 0}
          unit="%"
          icon={TrainFront}
          hint={`${tms.available_tracks ?? 0} available`}
        />
        <KpiCard
          label="Signal Health"
          value={smms.signal_health_percent ?? 0}
          unit="%"
          icon={Signal}
          tone={Number(smms.signal_health_percent) < 90 ? "warn" : "success"}
          hint={`${smms.fault_frequency ?? 0} faults / signal`}
        />
        <KpiCard
          label="Power Efficiency"
          value={tdms.efficiency_score ?? 0}
          unit="%"
          icon={Zap}
          tone="success"
          hint={`${tdms.peak_load ?? 0} MW peak`}
        />
        <KpiCard
          label="Open Issues"
          value={openIssues}
          icon={Activity}
          tone={openIssues > 0 ? "warn" : "success"}
          hint="Across departments"
        />
        <KpiCard
          label="System Performance"
          value={
            Math.round(
              ((Number(tms.track_performance_score ?? 0) +
                Number(smms.maintenance_efficiency ?? 0) +
                Number(tdms.efficiency_score ?? 0)) /
                3) *
                10,
            ) / 10
          }
          unit="%"
          icon={Gauge}
          hint="Composite KPI"
        />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <DataChart
          title="Track Status"
          data={summary.tms.charts.status}
          category="status"
          value="count"
          color="var(--primary)"
        />
        <DataChart
          title="Signal Health"
          data={summary.smms.charts.health}
          category="health"
          value="count"
          color="var(--info)"
        />
        <DataChart
          title="Power Consumption"
          data={summary.tdms.charts.consumption.slice(-12)}
          category="timestamp"
          value="consumption"
          color="var(--rail-orange)"
        />
      </div>
    </section>
  );
}

function DataChart({
  title,
  data,
  category,
  value,
  color,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  category: string;
  value: string;
  color: string;
}) {
  return (
    <Panel title={title}>
      <ChartBox height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
            <XAxis dataKey={category} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey={value} fill={color} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
    </Panel>
  );
}
