import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Activity, CheckCircle2, Clock, TrainFront, Zap } from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { Panel } from "@/components/trackwise/shared";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { departmentHealth, platforms, tracks } from "@/lib/trackwise/operations";
import { LiveOperationsFeed } from "@/components/realtime/LiveOperationsFeed";
import { useLiveSimulation } from "@/lib/liveSimulation";

export const Route = createFileRoute("/live-operations")({
  component: LiveOperations,
});

function LiveOperations() {
  const [heartbeat, setHeartbeat] = useState(0);
  const live = useLiveSimulation();
  useEffect(() => {
    const timer = window.setInterval(() => setHeartbeat((value) => value + 1), 3000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <MainShell
      title="LIVE OPERATIONS"
      subtitle={`NDG Integrated Control Room · simulation heartbeat ${heartbeat + 1}`}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Running Trains"
          value={live.kpi.running_trains}
          icon={TrainFront}
          tone="success"
        />
        <KpiCard label="Delayed Trains" value={live.kpi.delayed_trains} icon={Clock} tone="warn" />
        <KpiCard
          label="Track Occupancy"
          value={live.tracks.filter((track) => track.occupancy !== "Free").length}
          icon={Activity}
        />
        <KpiCard label="Active Incidents" value={7} icon={AlertTriangle} tone="danger" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="LIVE TRAIN MOVEMENTS">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3">Train</th>
                  <th className="px-3 py-3">Movement</th>
                  <th className="px-3 py-3">Platform</th>
                  <th className="px-3 py-3">Delay</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {live.trains.slice(0, 6).map((train, index) => (
                  <tr key={train.number} className="border-b border-border/70 hover:bg-accent/50">
                    <td className="px-3 py-3 font-mono font-semibold">{train.number}</td>
                    <td className="px-3 py-3">
                      {train.status} · KM {train.position_km}
                    </td>
                    <td className="px-3 py-3">P-{index + 1}</td>
                    <td
                      className={`px-3 py-3 ${train.delay_minutes ? "text-amber-500" : "text-emerald-500"}`}
                    >
                      {train.delay_minutes
                        ? `+${train.delay_minutes} min · pred ${train.delay_prediction_minutes}`
                        : "On time"}
                    </td>
                    <td className="px-3 py-3 text-emerald-500">Running</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="DEPARTMENT HEALTH">
          <div className="space-y-3">
            {[
              { name: "Signals", health: live.kpi.signal_health, status: "Telemetry" },
              { name: "Tracks", health: live.kpi.track_health, status: "Telemetry" },
              {
                name: "Traction",
                health: Math.round(
                  (live.trains.filter((train) => train.traction_status === "Healthy").length /
                    live.trains.length) *
                    100,
                ),
                status: "Telemetry",
              },
            ].map((department) => (
              <div
                key={department.name}
                className="rounded-md border border-border bg-panel-muted p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{department.name}</span>
                  <span className="text-xs text-muted-foreground">{department.status}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${
                      department.health >= 95
                        ? "bg-emerald-500"
                        : department.health >= 85
                          ? "bg-amber-500"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${department.health}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs font-mono">{department.health}%</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-4">
        <LiveOperationsFeed />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Panel title="ALERT FEED">
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              <span>
                {live.signals.find((signal) => signal.status === "Red")?.alert ??
                  "All signals reporting clear"}
              </span>
            </div>
            <div className="flex gap-2">
              <Clock className="size-4 text-amber-500" />
              <span>
                {live.trains.find((train) => train.delay_minutes > 10)?.name ??
                  "All trains within delay threshold"}
              </span>
            </div>
            <div className="flex gap-2">
              <Zap className="size-4 text-amber-500" />
              <span>
                {live.trains.some((train) => train.traction_status === "Attention")
                  ? "Traction attention detected"
                  : "Traction telemetry nominal"}
              </span>
            </div>
          </div>
        </Panel>
        <Panel title="SYSTEM HEALTH">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Signals</span>
              <b className="text-emerald-500">{live.kpi.signal_health}%</b>
            </div>
            <div className="flex justify-between">
              <span>OHE</span>
              <b className="text-amber-500">
                {Math.round(
                  (live.trains.filter((train) => train.traction_status === "Healthy").length /
                    live.trains.length) *
                    100,
                )}
                %
              </b>
            </div>
            <div className="flex justify-between">
              <span>Operations</span>
              <b className="text-emerald-500">{live.kpi.operations_efficiency}%</b>
            </div>
          </div>
        </Panel>
        <Panel title="CONTROL MODE">
          <div className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <div>
              <p className="font-semibold">Simulation Active</p>
              <p className="text-xs text-muted-foreground">No safety-critical control connected</p>
            </div>
          </div>
        </Panel>
      </div>
    </MainShell>
  );
}
