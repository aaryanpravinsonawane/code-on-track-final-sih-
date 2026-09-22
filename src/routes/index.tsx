import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  CalendarClock,
  Gauge,
  ListChecks,
  Sparkles,
  Timer,
  TrainFront,
  TriangleAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MainShell } from "@/components/trackwise/MainShell";
import { ChartBox } from "@/components/trackwise/ChartBox";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { NetworkMap } from "@/components/trackwise/NetworkMap";
import { RailwayKpiGrid } from "@/components/trackwise/RailwayAnalytics";
import { DeptTag, Panel, PriorityTag } from "@/components/trackwise/shared";
import { RESOURCES, SECTIONS, TASKS, TRAINS, WINDOWS, fmt } from "@/lib/trackwise/data";
import { conflictingTrains, priorityBand, priorityScore } from "@/lib/trackwise/engine";
import { useTrackwise } from "@/lib/trackwise/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Railway Management System — Integrated Operations Dashboard" },
      {
        name: "description",
        content:
          "Integrated railway operations, maintenance & management dashboard with AI-powered prioritization and optimization.",
      },
      { property: "og:title", content: "TRACKWISE — Railway Operations Command Center" },
      {
        property: "og:description",
        content:
          "ONE WORKPLACE. CONNECTED RAILWAY OPERATIONS. Integrated TMS, TDMS, SMMS, COA with AI prioritization.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { plan } = useTrackwise();
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const pending = TASKS.filter((t) => t.status === "Pending" || t.status === "Deferred");
  const high = TASKS.filter((t) => priorityBand(t) === "High");
  const conflicts = WINDOWS.reduce(
    (s, w) => s + (conflictingTrains(TRAINS, w.section, w.start, w.end).length > 0 ? 1 : 0),
    0,
  );
  const assetAvailability = Math.round(
    (RESOURCES.reduce((s, r) => s + r.available, 0) / RESOURCES.reduce((s, r) => s + r.total, 0)) * 100,
  );

  const bySection = SECTIONS.map((s) => ({
    section: s.id,
    Engineering: TASKS.filter((t) => t.section === s.id && t.department === "Engineering").length,
    "S&T": TASKS.filter((t) => t.section === s.id && t.department === "S&T").length,
    TRD: TASKS.filter((t) => t.section === s.id && t.department === "TRD").length,
  }));

  const byType = ["Superfast", "Express", "Passenger", "Suburban", "Freight"].map((k) => ({
    name: k,
    value: TRAINS.filter((t) => t.type === k).length,
  }));
  const PIE = ["var(--color-primary)", "var(--color-info)", "var(--color-snt)", "var(--color-eng)", "var(--color-muted-foreground)"];

  const topTasks = [...TASKS].sort((a, b) => priorityScore(b) - priorityScore(a)).slice(0, 6);

  return (
    <MainShell
    title="RAILWAY MANAGEMENT SYSTEM"
      subtitle="Integrated TMS · TDMS · SMMS · COA · Station Master · AI Priority Engine"
    >
      <RailwayKpiGrid />
      <div className="mt-4" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Stations" value={5} icon={TrainFront} hint="Across railway division" />
        <KpiCard label="Active Trains" value={TRAINS.length} icon={TrainFront} hint="Scheduled on corridor today" />
        <KpiCard label="Delayed Trains" value={2} icon={AlertTriangle} tone="warn" hint="Currently delayed >15 min" />
        <KpiCard label="Critical Incidents" value={1} icon={TriangleAlert} tone="danger" hint="Requires immediate attention" />
        <KpiCard label="Track Defects" value={8} icon={TriangleAlert} tone="warn" hint="Across all sections" />
        <KpiCard label="Signal Faults" value={3} icon={AlertTriangle} tone="warn" hint="Active signal issues" />
        <KpiCard label="Traction Faults" value={2} icon={BatteryCharging} tone="warn" hint="OHE/traction issues" />
        <KpiCard label="Active Maintenance Blocks" value={plan?.metrics.blocksPlanned ?? 0} icon={CalendarClock} hint={plan ? "From latest optimization" : "Run the planner"} />
        <KpiCard label="Open Work Orders" value={pending.length} icon={ListChecks} hint={`Across 3 departments · ${SECTIONS.length} sections`} />
        <KpiCard label="AI Recommendations" value={6} icon={Sparkles} tone="success" hint="Pending operator review" />
        <KpiCard label="Block Utilization" value={plan?.metrics.avgUtilization ?? 0} unit="%" icon={Gauge} tone="success" hint="Average across planned blocks" />
        <KpiCard label="Asset Availability" value={assetAvailability} unit="%" icon={BatteryCharging} hint="Crew and machinery pool" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="Operational Health"
          right={
            <Link
              to="/planner"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="size-3.5" /> Open Block Planner
            </Link>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-panel-muted rounded-lg">
              <p className="text-2xl font-bold text-emerald-500">98%</p>
              <p className="text-xs text-muted-foreground mt-1">Track</p>
            </div>
            <div className="text-center p-3 bg-panel-muted rounded-lg">
              <p className="text-2xl font-bold text-emerald-500">96%</p>
              <p className="text-xs text-muted-foreground mt-1">Signal</p>
            </div>
            <div className="text-center p-3 bg-panel-muted rounded-lg">
              <p className="text-2xl font-bold text-amber-500">94%</p>
              <p className="text-xs text-muted-foreground mt-1">Traction</p>
            </div>
            <div className="text-center p-3 bg-panel-muted rounded-lg">
              <p className="text-2xl font-bold text-emerald-500">97%</p>
              <p className="text-xs text-muted-foreground mt-1">Operations</p>
            </div>
          </div>
          <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-3xl font-bold text-primary">96%</p>
            <p className="text-sm text-muted-foreground mt-1">Overall Operational Health</p>
          </div>
        </Panel>

        <Panel title="Train Mix (simulated)">
          <ChartBox height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {byType.map((_, i) => (
                    <Cell key={i} fill={PIE[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Division Network / Live Asset Status"
          right={
            <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              LIVE TELEMETRY · 12 sec ago
            </span>
          }
        >
          <div className="rounded-xl border border-border/70 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_45%),var(--color-panel-muted)] p-4 sm:p-6">
            <NetworkMap onSelectStation={setSelectedStation} selectedStation={selectedStation} />
            {selectedStation && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm">
                <span><strong className="text-cyan-700 dark:text-cyan-300">{selectedStation}</strong> selected for station-level monitoring.</span>
                <Link to="/station-master" className="font-semibold text-primary hover:underline">Open Station Master →</Link>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Maintenance Demand by Section & Department">
          <ChartBox height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySection}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" />
                <XAxis dataKey="section" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Engineering" stackId="a" fill="var(--color-eng)" />
                <Bar dataKey="S&T" stackId="a" fill="var(--color-snt)" />
                <Bar dataKey="TRD" stackId="a" fill="var(--color-trd)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="Highest Priority Pending Work">
          <ul className="divide-y divide-border">
            {topTasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                <span className="font-mono text-xs font-semibold">{t.id}</span>
                <DeptTag dept={t.department} />
                <span className="flex-1 truncate">{t.workType}</span>
                <span className="text-xs text-muted-foreground">
                  {t.section} · {t.duration} min · {t.overdueDays}d overdue
                </span>
                <PriorityTag task={t} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Declared Maintenance Windows (simulated low-density periods)">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {WINDOWS.map((w) => {
              const c = conflictingTrains(TRAINS, w.section, w.start, w.end);
              return (
                <div key={w.id} className="rounded-md border border-border bg-panel-muted p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold">{w.section}</span>
                    <span className="font-mono text-xs">
                      {fmt(w.start)}–{fmt(w.end)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{w.label}</p>
                  <p className={`mt-1 text-[11px] font-semibold ${c.length ? "text-danger" : "text-success"}`}>
                    {c.length ? `${c.length} train conflict(s): ${c.map((x) => x.id).join(", ")}` : "No train conflict"}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </MainShell>
  );
}
