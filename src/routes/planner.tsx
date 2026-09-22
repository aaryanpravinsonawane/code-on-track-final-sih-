import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { DeptTag, Panel } from "@/components/trackwise/shared";
import { TASKS, fmt } from "@/lib/trackwise/data";
import { canApprove, useTrackwise } from "@/lib/trackwise/store";
import { AIOperationsCenter } from "@/components/trackwise/AIOperationsCenter";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Block Planner — TRACKWISE Simulation" },
      {
        name: "description",
        content:
          "Generate an optimized, conflict-checked maintenance block plan that bundles compatible Engineering, S&T and TRD tasks into shared corridor blocks.",
      },
      { property: "og:title", content: "AI Block Planner — TRACKWISE" },
      {
        property: "og:description",
        content: "Rule-based block optimization with full explainability for every recommendation.",
      },
    ],
  }),
  component: PlannerPage,
});

const STAGES = [
  "Reading timetable…",
  "Checking maintenance requirements…",
  "Checking available windows…",
  "Detecting conflicts…",
  "Finding compatible tasks…",
  "Optimizing block allocation…",
];

function PlannerPage() {
  const { plan, planStatus, generate, setPlanStatus, role, delays } = useTrackwise();
  const [stage, setStage] = useState(-1);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = async () => {
    setRunning(true);
    setStage(0);
    timers.current.forEach(clearTimeout);
    timers.current = STAGES.map((_, i) => setTimeout(() => setStage(i), i * 550));
    await new Promise((r) => setTimeout(r, STAGES.length * 550));
    await generate(delays);
    setStage(STAGES.length);
    setRunning(false);
  };

  return (
    <MainShell
      title="AI BLOCK PLANNER"
      subtitle="Deterministic rule-based optimization — no language model is used for scheduling"
    >
      <Panel className="mb-4">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-3 rounded-lg bg-primary px-10 py-5 font-display text-lg font-bold tracking-wide text-primary-foreground shadow-panel transition hover:bg-primary/90 disabled:opacity-70"
          >
            {running ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
            Generate Optimized Plan
          </button>
          <p className="max-w-xl text-xs text-muted-foreground">
            Runs the local heuristic bundler over 20 simulated trains, 30 maintenance tasks and 9
            declared windows. The same contract can be served by a FastAPI + OR-Tools CP-SAT solver.
          </p>

          {stage >= 0 && (
            <ul className="w-full max-w-md space-y-1.5 text-left">
              {STAGES.map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                    i < stage
                      ? "border-success/30 bg-success/8 text-success"
                      : i === stage
                        ? "border-primary/40 bg-primary/8 text-primary"
                        : "border-border text-muted-foreground opacity-60"
                  }`}
                >
                  {i < stage ? (
                    <Check className="size-4" />
                  ) : i === stage ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span className="size-4" />
                  )}
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <AIOperationsCenter />

      {plan && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Blocks Planned" value={plan.metrics.blocksPlanned} />
            <Stat label="Tasks Bundled" value={plan.metrics.tasksBundled} />
            <Stat label="Avg Block Utilization" value={`${plan.metrics.avgUtilization}%`} />
            <Stat label="Train Conflicts" value={plan.metrics.conflicts} tone={plan.metrics.conflicts ? "danger" : "success"} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {plan.blocks.map((b) => (
              <Panel key={b.id} title={`Block ${b.id} · Section ${b.section}`} right={<span className="font-mono text-sm font-semibold">{fmt(b.start)}–{fmt(b.end)}</span>}>
                <div className="flex flex-wrap gap-2">
                  {b.departments.map((d) => (
                    <DeptTag key={d} dept={d} />
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">
                    Utilization <b className="text-foreground">{b.utilization}%</b> · Tasks bundled{" "}
                    <b className="text-foreground">{b.taskIds.length}</b> · Conflicts{" "}
                    <b className={b.trainConflicts ? "text-danger" : "text-success"}>{b.trainConflicts}</b>
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {b.taskIds.map((id) => {
                    const t = TASKS.find((x) => x.id === id)!;
                    return (
                      <li key={id} className="flex flex-wrap items-center gap-2 rounded-md bg-panel-muted px-3 py-2 text-sm">
                        <span className="font-mono text-xs font-semibold">{t.id}</span>
                        <DeptTag dept={t.department} />
                        <span className="flex-1">{t.workType}</span>
                        <span className="text-xs text-muted-foreground">{t.duration} min</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 rounded-md border border-success/25 bg-success/8 p-3">
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-success">Why selected</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-foreground">
                    {b.reasonsAccepted.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </Panel>
            ))}
          </div>

          {plan.rejected.length > 0 && (
            <Panel title={`Not scheduled in this plan (${plan.rejected.length})`} className="mt-4">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {plan.rejected.map((r) => {
                  const t = TASKS.find((x) => x.id === r.taskId)!;
                  return (
                    <div key={r.taskId} className="rounded-md border border-danger/25 bg-danger/6 p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold">{t.id}</span>
                        <DeptTag dept={t.department} />
                        <span className="text-xs text-muted-foreground">{t.section}</span>
                      </div>
                      <p className="mt-1 text-sm">{t.workType}</p>
                      <p className="mt-2 text-[11px] font-bold tracking-[0.08em] uppercase text-danger">
                        Why rejected
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs">
                        {r.reasons.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          <Panel title="Approval Workflow" className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Current plan status:{" "}
                <b className="text-foreground capitalize">{planStatus}</b> · acting as <b className="text-foreground">{role}</b>
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  disabled={!canApprove(role)}
                  onClick={() => setPlanStatus("approved", `${plan.metrics.blocksPlanned} blocks authorised for simulation`)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-success px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Check className="size-4" /> Approve Plan
                </button>
                <button
                  disabled={!canApprove(role)}
                  onClick={() => setPlanStatus("modified", "Plan returned to planner for adjustment")}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Modify
                </button>
                <button
                  disabled={!canApprove(role)}
                  onClick={() => setPlanStatus("rejected", "Plan rejected by controller")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50"
                >
                  <X className="size-4" /> Reject
                </button>
              </div>
            </div>
            {!canApprove(role) && (
              <p className="mt-2 text-xs text-warn-foreground">
                Only Admin and Controller roles can action a plan. Switch role in the header.
              </p>
            )}
          </Panel>
        </>
      )}
    </MainShell>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="panel-card p-4">
      <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-primary"}`}>
        {value}
      </p>
    </div>
  );
}
