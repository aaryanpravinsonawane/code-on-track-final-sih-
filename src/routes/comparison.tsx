import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MainShell } from "@/components/trackwise/MainShell";
import { ChartBox } from "@/components/trackwise/ChartBox";
import { Panel } from "@/components/trackwise/shared";
import { TRADITIONAL_BASELINE } from "@/lib/trackwise/data";
import { useTrackwise } from "@/lib/trackwise/store";

export const Route = createFileRoute("/comparison")({
  head: () => ({
    meta: [
      { title: "Before vs After — TRACKWISE Simulation Results" },
      {
        name: "description",
        content:
          "Comparison of traditional department-wise block planning against TRACKWISE coordinated block planning using representative simulated data.",
      },
      { property: "og:title", content: "Traditional vs TRACKWISE Coordinated Planning" },
      {
        property: "og:description",
        content: "Simulation results using representative data — blocks, window hours, conflicts and utilization.",
      },
    ],
  }),
  component: ComparisonPage,
});

function ComparisonPage() {
  const { plan } = useTrackwise();

  const tw = {
    blocks: plan?.metrics.blocksPlanned ?? 6,
    windowHours: plan?.metrics.totalWindowHours ?? 21,
    conflicts: plan?.metrics.conflicts ?? 1,
    utilization: plan?.metrics.avgUtilization ?? 86,
  };

  const chart = [
    { metric: "Blocks", Traditional: TRADITIONAL_BASELINE.blocks, TRACKWISE: tw.blocks },
    { metric: "Window hours", Traditional: TRADITIONAL_BASELINE.windowHours, TRACKWISE: tw.windowHours },
    { metric: "Conflicts", Traditional: TRADITIONAL_BASELINE.conflicts, TRACKWISE: tw.conflicts },
    { metric: "Utilization %", Traditional: TRADITIONAL_BASELINE.utilization, TRACKWISE: tw.utilization },
  ];

  return (
    <MainShell
      title="BEFORE VS AFTER"
      subtitle="SIMULATION RESULTS USING REPRESENTATIVE DATA — not actual Indian Railways statistics"
    >
      <div className="mb-4 rounded-md border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-semibold text-warn-foreground">
        SIMULATION RESULTS USING REPRESENTATIVE DATA. These figures are produced by a prototype model on
        synthetic timetable and maintenance data and do not represent real railway performance.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Traditional Planning (department-wise)">
          <Rows
            rows={[
              ["Separate blocks", TRADITIONAL_BASELINE.blocks],
              ["Total maintenance window", `${TRADITIONAL_BASELINE.windowHours} hours`],
              ["Conflicts", TRADITIONAL_BASELINE.conflicts],
              ["Block utilization", `${TRADITIONAL_BASELINE.utilization}%`],
            ]}
          />
        </Panel>
        <Panel title="TRACKWISE Simulation (coordinated)">
          <Rows
            good
            rows={[
              ["Coordinated blocks", tw.blocks],
              ["Total maintenance window", `${tw.windowHours} hours`],
              ["Conflicts", tw.conflicts],
              ["Block utilization", `${tw.utilization}%`],
            ]}
          />
        </Panel>
      </div>

      <Panel title="Comparison chart" className="mt-4">
        <ChartBox height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Traditional" fill="var(--color-muted-foreground)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="TRACKWISE" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </Panel>
    </MainShell>
  );
}

function Rows({ rows, good }: { rows: [string, string | number][]; good?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map(([k, v]) => (
        <li key={k} className="flex items-center justify-between py-3">
          <span className="text-sm text-muted-foreground">{k}</span>
          <span className={`font-display text-2xl font-bold ${good ? "text-success" : "text-foreground"}`}>{v}</span>
        </li>
      ))}
    </ul>
  );
}
