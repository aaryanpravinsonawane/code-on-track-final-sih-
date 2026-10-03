import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  Timer,
  TrainFront,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { TASKS } from "@/lib/trackwise/data";
import { priorityBand } from "@/lib/trackwise/engine";
import type { CorridorMetrics, CorridorSnapshot } from "@/lib/trackwise/corridor";

type KpiRoute = "/live-operations" | "/alerts" | "/incidents" | "/planner" | "/maintenance";

interface KpiDef {
  key: string;
  title: string;
  value: number;
  support: string;
  icon: LucideIcon;
  color: string;
  series: number[];
  to: KpiRoute;
}

function Spark({ values, color }: { values: number[]; color: string }) {
  const w = 96;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const y = (v: number) => (max === min ? h / 2 : h - 3 - ((v - min) / (max - min)) * (h - 8));
  const pts = values.map(
    (v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${y(v).toFixed(1)}`,
  );
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-24 shrink-0" aria-hidden="true">
      <polygon points={`${pts.join(" ")} ${w},${h} 0,${h}`} fill={color} fillOpacity={0.14} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CommandKpis({
  snapshot,
  history,
}: {
  snapshot: CorridorSnapshot;
  history: CorridorMetrics[];
}) {
  const { trains, blocks, metrics: m } = snapshot;
  const onTime = trains.filter((t) => t.state === "ontime").length;
  const held = trains.filter((t) => t.state === "held").length;
  const delayed = trains.filter((t) => t.delay > 10);
  const critical = trains.filter((t) => t.state === "critical").length;
  const avgDelay = delayed.length
    ? Math.round(delayed.reduce((s, t) => s + t.delay, 0) / delayed.length)
    : 0;
  const pendingOrders = TASKS.filter((t) => t.status === "Pending" || t.status === "Deferred");
  const highPriority = TASKS.filter((t) => priorityBand(t) === "High").length;

  const cards: KpiDef[] = [
    {
      key: "trains",
      title: "Active Trains",
      value: m.trains,
      support: `${onTime} on time · ${held} held`,
      icon: TrainFront,
      color: "var(--primary)",
      series: history.map((h) => h.trains),
      to: "/live-operations",
    },
    {
      key: "delays",
      title: "Delays",
      value: m.delays,
      support: delayed.length ? `${critical} critical · avg +${avgDelay} min` : "No delayed trains",
      icon: Timer,
      color: "var(--st-delayed)",
      series: history.map((h) => h.delays),
      to: "/alerts",
    },
    {
      key: "incidents",
      title: "Incidents",
      value: m.incidents,
      support: `${m.criticalIncidents} critical · ${m.incidents - m.criticalIncidents} other open`,
      icon: TriangleAlert,
      color: "var(--st-critical)",
      series: history.map((h) => h.incidents),
      to: "/incidents",
    },
    {
      key: "blocks",
      title: "Track Blocks",
      value: m.blocks,
      support: blocks.length ? blocks.map((b) => b.place).join(" · ") : "No active blocks",
      icon: CalendarClock,
      color: "var(--st-block)",
      series: history.map((h) => h.blocks),
      to: "/planner",
    },
    {
      key: "maintenance",
      title: "Maintenance",
      value: pendingOrders.length,
      support: `${highPriority} high priority · blocks ${m.blockProgress}% done`,
      icon: Wrench,
      color: "var(--st-ontime)",
      series: history.map((h) => h.blockProgress),
      to: "/maintenance",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <Link
          key={c.key}
          to={c.to}
          style={{ "--kpi": c.color } as CSSProperties}
          className="group relative block min-w-0 overflow-hidden rounded-md border border-border bg-panel p-3 transition-colors hover:border-[var(--kpi)]"
        >
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: c.color }} />
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {c.title}
            </p>
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-md"
              style={{
                background: `color-mix(in oklch, ${c.color} 16%, transparent)`,
                color: c.color,
              }}
            >
              <c.icon className="size-4" />
            </span>
          </div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p className="font-display text-3xl font-bold leading-none tabular-nums">{c.value}</p>
            <Spark values={c.series} color={c.color} />
          </div>
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{c.support}</p>
        </Link>
      ))}
    </div>
  );
}
