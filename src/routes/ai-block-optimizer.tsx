import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  MapPinned,
  Route as RouteIcon,
  ShieldAlert,
  TrainFront,
} from "lucide-react";
import { toast } from "sonner";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { BlockWorkflowTable } from "@/components/trackwise/BlockWorkflowTable";
import { useTrackwise } from "@/lib/trackwise/store";
import { fmt, RESOURCES, TRAINS } from "@/lib/trackwise/data";

export const Route = createFileRoute("/ai-block-optimizer")({
  component: AIBlockOptimizer,
});

function AIBlockOptimizer() {
  const { blockRequests, lastBlockOptimization, demoMode, runBlockOptimization } = useTrackwise();
  const [analyzing, setAnalyzing] = useState(false);
  const activeRequests = blockRequests.filter(
    (request) => ["Submitted", "AI Validated"].includes(request.status) || request.replan_required,
  );
  const inputs = [
    {
      label: "Block requests",
      value: `${blockRequests.length} requests · ${activeRequests.length} eligible`,
      icon: ShieldAlert,
    },
    {
      label: "Train paths",
      value: `${TRAINS.length} simulated train paths checked for overlap`,
      icon: TrainFront,
    },
    { label: "Resources", value: `${RESOURCES.length} listed machines and crews`, icon: RouteIcon },
    {
      label: "Section and track windows",
      value: "Requested start/end windows per section and track",
      icon: MapPinned,
    },
    {
      label: "Safety constraints",
      value: "Conflicts are flagged, never auto-approved",
      icon: AlertTriangle,
    },
  ];
  const conflicts = lastBlockOptimization
    ? lastBlockOptimization.conflicts.train_paths.length +
      lastBlockOptimization.conflicts.resources.length +
      lastBlockOptimization.unscheduled.length
    : 0;

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const result = await runBlockOptimization();
      if (result.solver_mode === "ortools-cp-sat") {
        toast.success(
          `CP-SAT returned ${result.solver_status}; ${result.metrics.scheduled} requests scheduled.`,
        );
      } else {
        toast.warning("Demo heuristic ran; no OR-Tools solver result is being presented.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Optimization failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <MainShell
      title="AI BLOCK OPTIMIZER"
      subtitle="Decision support for safe, explainable maintenance block allocation across the division"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BrainCircuit className="size-6" />
          </div>
          <div>
            <p className="font-semibold">Maintenance block scheduling</p>
            <p className="text-xs text-muted-foreground">
              {blockRequests.length} requests · {TRAINS.length} simulated train paths ·{" "}
              {RESOURCES.length} listed resources
            </p>
          </div>
        </div>
        <button
          onClick={analyze}
          disabled={analyzing}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <BrainCircuit className="size-4" />{" "}
          {analyzing ? "Analyzing corridor..." : "Run block optimization"}
        </button>
      </div>
      <div className="mb-4 border-l-2 border-warn bg-warn/10 px-3 py-2 text-xs text-warn-foreground">
        {demoMode
          ? "SIMULATED DATA · Browser optimizer is a deterministic heuristic; it is not an OR-Tools result."
          : "Backend-connected mode · Solver status below is returned by the backend."}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Eligible requests"
          value={activeRequests.length}
          icon={ShieldAlert}
          hint="Submitted or replan-flagged"
        />
        <KpiCard
          label="Scheduled"
          value={lastBlockOptimization?.metrics.scheduled ?? "—"}
          icon={CheckCircle2}
          tone="success"
          hint={lastBlockOptimization?.solver_status ?? "Run optimization"}
        />
        <KpiCard
          label="Train conflicts avoided"
          value={lastBlockOptimization?.metrics.train_conflicts_avoided ?? "—"}
          icon={TrainFront}
          hint="Against requested windows"
        />
        <KpiCard
          label="Resource utilization"
          value={
            lastBlockOptimization ? `${lastBlockOptimization.metrics.resource_utilization}%` : "—"
          }
          icon={RouteIcon}
          tone={conflicts ? "warn" : "success"}
          hint={conflicts ? `${conflicts} conflict(s) or unscheduled` : "No reported blockers"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_1.4fr]">
        <Panel title="Optimization inputs">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {inputs.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-border bg-panel-muted p-3"
              >
                <Icon className="size-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{value}</p>
                </div>
                <CheckCircle2 className="ml-auto size-4 text-success" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Optimization reasoning"
          right={
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
              {lastBlockOptimization?.solver_mode === "ortools-cp-sat"
                ? `CP-SAT · ${lastBlockOptimization.solver_status}`
                : lastBlockOptimization?.solver_mode === "demo-heuristic"
                  ? "DEMO HEURISTIC"
                  : "NOT RUN"}
            </span>
          }
        >
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div className="flex gap-3">
              <MapPinned className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-2 text-sm leading-6">
                {lastBlockOptimization?.reasoning.map((reason) => <p key={reason}>{reason}</p>) ?? (
                  <p>
                    Run optimization to evaluate submitted block requests, train paths, and
                    resources.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Bundles",
                value: lastBlockOptimization?.bundles.length ?? "—",
                detail: "Compatible work packages",
              },
              {
                title: "Unscheduled",
                value: lastBlockOptimization?.unscheduled.length ?? "—",
                detail: "Needs review or a new window",
              },
              {
                title: "Resources",
                value: lastBlockOptimization
                  ? `${lastBlockOptimization.metrics.resource_utilization}%`
                  : "—",
                detail: "Utilization estimate",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-primary">{item.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="ORIGINAL REQUEST WINDOWS">
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-bold uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Request</th>
                  <th className="py-2 pr-3">Section / Track</th>
                  <th className="py-2 pr-3">Window</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeRequests.map((request) => (
                  <tr key={request.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">
                      <span className="font-mono text-xs">{request.id}</span>
                      <p className="text-xs text-muted-foreground">{request.title}</p>
                    </td>
                    <td className="py-2 pr-3">
                      {request.section} · {request.track}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {fmt(request.window_start)}–{fmt(request.window_end)}
                    </td>
                    <td className="py-2 text-xs">{request.status}</td>
                  </tr>
                ))}
                {activeRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                      No submitted requests are awaiting optimization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="OPTIMIZED SCHEDULE">
          {lastBlockOptimization ? (
            <div className="space-y-2">
              {lastBlockOptimization.schedule.map((item) => (
                <div
                  key={item.request_id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-panel-muted px-3 py-2 text-xs"
                >
                  <span className="font-mono font-semibold">{item.request_id}</span>
                  <span>
                    {item.department} · {item.section}/{item.track}
                  </span>
                  <span className="font-mono">
                    {fmt(item.start)}–{fmt(item.end)}
                  </span>
                  <span className="ml-auto rounded bg-primary/10 px-2 py-1 text-primary">
                    {item.bundle_id}
                  </span>
                </div>
              ))}
              {lastBlockOptimization.unscheduled.map((item) => (
                <div
                  key={item.request_id}
                  className="rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-xs"
                >
                  <b>{item.request_id}</b> · {item.reason}
                </div>
              ))}
              {lastBlockOptimization.schedule.length === 0 &&
                lastBlockOptimization.unscheduled.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No schedule has been generated.
                  </p>
                )}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Run optimization to generate an approval candidate.
            </p>
          )}
          {lastBlockOptimization && (
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold">Approval-ready output</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastBlockOptimization.solver_mode === "ortools-cp-sat"
                  ? "Actual solver result; requests in the Submitted state move to AI Validated when scheduled."
                  : "Simulated demo output only; it has not been validated by OR-Tools."}
              </p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="CONFLICT ASSESSMENT" className="mt-4">
        {!lastBlockOptimization ? (
          <p className="text-sm text-muted-foreground">
            Conflict results appear after optimization.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-semibold">
                Train-path overlaps in requested windows (
                {lastBlockOptimization.conflicts.train_paths.length})
              </p>
              {lastBlockOptimization.conflicts.train_paths.map((item) => (
                <p
                  key={`${item.request_id}-${item.train_id}`}
                  className="mt-1 text-xs text-muted-foreground"
                >
                  {item.request_id} × Train {item.train_id}
                </p>
              ))}
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-semibold">
                Resource conflicts ({lastBlockOptimization.conflicts.resources.length})
              </p>
              {lastBlockOptimization.conflicts.resources.length ? (
                lastBlockOptimization.conflicts.resources.map((item, index) => (
                  <p key={index} className="mt-1 text-xs text-muted-foreground">
                    {JSON.stringify(item)}
                  </p>
                ))
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  No resource conflict reported by this run.
                </p>
              )}
            </div>
          </div>
        )}
      </Panel>
      <div className="mt-4">
        <BlockWorkflowTable />
      </div>
    </MainShell>
  );
}
