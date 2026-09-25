import { createFileRoute } from "@tanstack/react-router";
import { Activity, BarChart3, ShieldCheck, TrainFront } from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { useLiveSimulation } from "@/lib/liveSimulation";

export const Route = createFileRoute("/drm")({ component: DRMDashboard });

function DRMDashboard() {
  const live = useLiveSimulation();

  return (
    <MainShell
      title="DRM — DIVISIONAL PERFORMANCE DASHBOARD"
      subtitle="Central Division · Executive overview of railway operations and maintenance"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Active trains" value={live.trains.length} icon={TrainFront} hint="Live corridor movements" />
        <KpiCard label="Average delay" value={Math.round(live.kpi.avg_delay)} unit=" min" icon={Activity} tone="warn" hint="Across monitored trains" />
        <KpiCard label="Track health" value={live.kpi.track_health} unit="%" icon={ShieldCheck} tone="success" hint="Division average" />
        <KpiCard label="Network availability" value={94} unit="%" icon={BarChart3} tone="success" hint="Operational assets" />
      </div>
      <Panel title="Executive action queue" className="mt-4">
        <div className="grid gap-3 md:grid-cols-3">
          {["Review AI block allocation for S2", "Approve high-risk maintenance windows", "Monitor signal recovery at NDG"].map((item, index) => (
            <div key={item} className="rounded-lg border border-border bg-panel-muted p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority {index + 1}</p>
              <p className="mt-2 text-sm font-semibold">{item}</p>
              <p className="mt-2 text-xs text-muted-foreground">Requires executive review</p>
            </div>
          ))}
        </div>
      </Panel>
    </MainShell>
  );
}