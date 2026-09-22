import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, TimerReset, TriangleAlert } from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { GanttChart } from "@/components/trackwise/GanttChart";
import { Panel } from "@/components/trackwise/shared";
import { RESOURCES, TASKS, TRAINS, WINDOWS, fmt } from "@/lib/trackwise/data";
import { conflictingTrains, getEngine } from "@/lib/trackwise/engine";
import { useTrackwise } from "@/lib/trackwise/store";
import type { OptimizationResult } from "@/lib/trackwise/types";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — TRACKWISE" },
      {
        name: "description",
        content:
          "Simulate train delays of +15, +30 or +60 minutes, detect resulting block conflicts and re-optimize the maintenance plan with before/after comparison.",
      },
      { property: "og:title", content: "What-If Delay Simulator — TRACKWISE" },
      {
        property: "og:description",
        content: "Delay injection, conflict detection and simulated re-optimization of block plans.",
      },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const { plan, generate, log, setDelays } = useTrackwise();
  const [trainId, setTrainId] = useState(TRAINS[0]!.id);
  const [delay, setDelay] = useState(30);
  const [after, setAfter] = useState<OptimizationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [impacted, setImpacted] = useState<string[]>([]);

  const train = TRAINS.find((t) => t.id === trainId)!;

  const runSim = async () => {
    setBusy(true);
    const base = plan ?? (await generate({}));
    const delays = { [trainId]: delay };

    const hit = base.blocks
      .filter((b) => conflictingTrains([train], b.section, b.start, b.end, delays).length > 0)
      .map((b) => b.id);
    setImpacted(hit);

    const result = await getEngine().optimize({
      trains: TRAINS,
      tasks: TASKS,
      windows: WINDOWS.map((w) => ({ ...w })),
      resources: RESOURCES,
      delays,
    });
    setAfter(result);
    setDelays(delays);
    log(
      "What-if simulation",
      `${trainId} delayed +${delay} min → ${hit.length} block conflict(s), plan re-optimized to ${result.metrics.blocksPlanned} blocks`,
    );
    setBusy(false);
  };

  const beforeBlocks = plan?.blocks ?? [];
  const sel = "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <MainShell
      title="WHAT-IF DELAY SIMULATOR"
      subtitle="Inject a simulated train delay and observe the effect on the coordinated block plan"
    >
      <Panel title="Scenario" className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            Scenario type
            <select className={`mt-1 block ${sel}`} defaultValue="Train Delay">
              <option>Train Delay</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Affected train
            <select value={trainId} onChange={(e) => setTrainId(e.target.value)} className={`mt-1 block ${sel}`}>
              {TRAINS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.name} ({t.section})
                </option>
              ))}
            </select>
          </label>
          <div className="text-xs text-muted-foreground">
            Delay
            <div className="mt-1 flex gap-2">
              {[15, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDelay(d)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    delay === d ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
                  }`}
                >
                  +{d} minutes
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={runSim}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <TimerReset className="size-4" />}
            Run Simulation
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Original path: {train.id} occupies {train.section} {fmt(train.arrival)}–{fmt(train.departure)}. With
          +{delay} min the path shifts to {fmt(train.arrival + delay)}–{fmt(train.departure + delay)}.
        </p>
      </Panel>

      {after && (
        <>
          {impacted.length > 0 ? (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              <TriangleAlert className="size-4" />
              Conflict detected — delayed {train.id} now fouls block(s) {impacted.join(", ")}. Re-optimization
              executed.
            </div>
          ) : (
            <div className="mb-4 rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
              No block conflict from this delay — the plan remains feasible, re-optimization confirms it.
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Before — original plan">
              <BlockList blocks={beforeBlocks} highlight={impacted} />
            </Panel>
            <Panel title="After — re-optimized plan">
              <BlockList blocks={after.blocks} />
              <p className="mt-3 rounded-md border border-border bg-panel-muted p-3 text-xs text-muted-foreground">
                <b className="text-foreground">Reason for rescheduling:</b>{" "}
                {impacted.length > 0
                  ? `the delayed path of ${train.id} plus a 10-minute planning margin overlapped the original window, so the planner shifted the block start to the first clear instant after the train clears ${train.section}.`
                  : `the delayed path of ${train.id} stays clear of every planned block, so the planner re-confirmed the existing allocation and re-balanced remaining tasks across the declared windows.`}{" "}
                Bundled tasks are preserved and train conflicts remain at {after.metrics.conflicts}.
              </p>
            </Panel>
          </div>

          <Panel title="Timeline after simulation" className="mt-4">
            <GanttChart blocks={after.blocks} delays={{ [trainId]: delay }} />
          </Panel>
        </>
      )}
    </MainShell>
  );
}

function BlockList({ blocks, highlight = [] }: { blocks: { id: string; section: string; start: number; end: number; taskIds: string[]; utilization: number }[]; highlight?: string[] }) {
  if (!blocks.length)
    return <p className="text-sm text-muted-foreground">No plan available — generate one first.</p>;
  return (
    <ul className="space-y-2">
      {blocks.map((b) => (
        <li
          key={b.id}
          className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm ${
            highlight.includes(b.id) ? "border-danger bg-danger/8" : "border-border bg-panel-muted"
          }`}
        >
          <span className="font-mono text-xs font-semibold">{b.id}</span>
          <span className="font-semibold">{b.section}</span>
          <span className="flex items-center gap-1 font-mono text-xs">
            {fmt(b.start)} <ArrowRight className="size-3" /> {fmt(b.end)}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {b.taskIds.length} tasks · {b.utilization}% utilization
          </span>
        </li>
      ))}
    </ul>
  );
}
