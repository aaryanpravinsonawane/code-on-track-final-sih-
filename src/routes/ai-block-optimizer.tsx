import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  CloudRain,
  Gauge,
  MapPinned,
  Route as RouteIcon,
  ShieldAlert,
  TrainFront,
  Zap,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { useLiveSimulation } from "@/lib/liveSimulation";
import { useTrackwise } from "@/lib/trackwise/store";
import { SECTIONS, TASKS, TRAINS } from "@/lib/trackwise/data";

export const Route = createFileRoute("/ai-block-optimizer")({
  component: AIBlockOptimizer,
});

const inputs = [
  { label: "Train schedules", value: `${TRAINS.length} movements loaded`, icon: TrainFront },
  { label: "Track occupancy", value: "Live corridor telemetry", icon: RouteIcon },
  { label: "Maintenance blocks", value: `${TASKS.length} tasks queued`, icon: ShieldAlert },
  { label: "Signal conditions", value: "Signal network synchronized", icon: Zap },
  { label: "Congestion data", value: "4 high-use sections", icon: Gauge },
  { label: "Weather conditions", value: "Monsoon watch · Moderate", icon: CloudRain },
];

function AIBlockOptimizer() {
  const live = useLiveSimulation();
  const { plan, generating, generate } = useTrackwise();
  const [recommendation, setRecommendation] = useState("Run analysis to generate a route-aware block allocation.");
  const [analyzing, setAnalyzing] = useState(false);
  const conflicts = live.trains.filter((train) => train.delay_minutes > 15).length;
  const risk = Math.min(92, 28 + live.kpi.active_blocks * 9 + conflicts * 4);
  const confidence = Math.max(72, 96 - conflicts * 3);

  const analyze = async () => {
    setAnalyzing(true);
    await generate();
    setRecommendation("Prioritize S2 overnight block; route freight movements through S3 and preserve platform 2 for the delayed express.");
    setAnalyzing(false);
  };

  return (
    <MainShell title="AI BLOCK OPTIMIZER" subtitle="Decision support for safe, explainable maintenance block allocation across the division">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><BrainCircuit className="size-6" /></div>
          <div><p className="font-semibold">Optimization engine ready</p><p className="text-xs text-muted-foreground">{SECTIONS.length} sections · {live.trains.length} live trains · simulation mode</p></div>
        </div>
        <button onClick={analyze} disabled={analyzing || generating} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          <BrainCircuit className="size-4" /> {analyzing || generating ? "Analyzing corridor..." : "Run AI optimization"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Risk score" value={risk} unit="/100" icon={ShieldAlert} tone={risk > 65 ? "warn" : "success"} hint="Conflict and weather exposure" />
        <KpiCard label="Delay score" value={Math.round(live.kpi.avg_delay)} unit=" min" icon={AlertTriangle} tone="warn" hint="Current average delay" />
        <KpiCard label="Route confidence" value={confidence} unit="%" icon={CheckCircle2} tone="success" hint="Recommendation certainty" />
        <KpiCard label="Active conflicts" value={conflicts} icon={RouteIcon} tone={conflicts ? "danger" : "success"} hint="Requires controller review" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_1.4fr]">
        <Panel title="Optimization inputs">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {inputs.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-panel-muted p-3"><Icon className="size-4 text-primary" /><div><p className="text-xs font-semibold">{label}</p><p className="text-[11px] text-muted-foreground">{value}</p></div><CheckCircle2 className="ml-auto size-4 text-success" /></div>)}
          </div>
        </Panel>
        <Panel title="AI recommendation" right={<span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-bold text-success">EXPLAINABLE OUTPUT</span>}>
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4"><div className="flex gap-3"><MapPinned className="mt-0.5 size-5 shrink-0 text-primary" /><p className="text-sm leading-6">{recommendation}</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[{ title: "Best route", value: "S2 → S3", detail: "Least occupied path" }, { title: "Alternative", value: "S1 → S4", detail: "+8 min expected" }, { title: "Travel impact", value: plan ? `-${plan.metrics.estimatedDelayReductionMin} min` : "-14 min", detail: "Estimated delay" }].map((item) => <div key={item.title} className="rounded-lg border border-border p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.title}</p><p className="mt-1 font-display text-xl font-bold text-primary">{item.value}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p></div>)}
          </div>
        </Panel>
      </div>

      <Panel title="Route conflict detection" className="mt-4">
        <div className="grid gap-3 md:grid-cols-3">
          {[{ label: "Track overlap", count: 1, detail: "S2 · 10:30-11:15" }, { label: "Maintenance conflict", count: 2, detail: "TMS-014 · S3 block" }, { label: "Signal conflict", count: 0, detail: "All interlockings clear" }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border p-3"><div className={`flex size-9 items-center justify-center rounded-lg ${item.count ? "bg-warn/10 text-warn-foreground" : "bg-success/10 text-success"}`}><AlertTriangle className="size-4" /></div><div><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div><span className="ml-auto font-display text-xl font-bold">{item.count}</span></div>)}
        </div>
      </Panel>
    </MainShell>
  );
}