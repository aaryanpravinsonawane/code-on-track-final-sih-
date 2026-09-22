import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  MapPin,
  ShieldCheck,
  Signal,
  TrainFront,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";
import { TASKS } from "@/lib/trackwise/data";
import { StationMapCanvas } from "@/components/trackwise/StationMapCanvas";
import { useLiveSimulation } from "@/lib/liveSimulation";

export const Route = createFileRoute("/smms")({
  component: SMMSDashboard,
});

function SMMSDashboard() {
  const { user } = useTrackwise();
  const live = useLiveSimulation();

  const signalTasks = TASKS.filter((t) => t.department === "S&T");
  const healthy = signalTasks.filter(
    (t) => t.criticality === "Low" || t.criticality === "Medium",
  ).length;
  const warning = signalTasks.filter((t) => t.criticality === "High").length;
  const failed = signalTasks.filter((t) => t.criticality === "Critical").length;
  const maintenanceDue = signalTasks.filter((t) => t.overdueDays > 0).length;

  return (
    <MainShell
      title="SMMS — SIGNAL MAINTENANCE & MANAGEMENT SYSTEM"
      subtitle={`${user?.station || "NDG"} Station · ${user?.division || "Central Division"} · S&T Department`}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard
          label="Total Signals"
          value={live.signals.length}
          icon={Signal}
          hint="Live signal telemetry"
        />
        <KpiCard
          label="Healthy Signals"
          value={live.signals.filter((signal) => signal.status === "Green").length}
          icon={ShieldCheck}
          tone="success"
          hint="Normal operation"
        />
        <KpiCard
          label="Warning"
          value={live.signals.filter((signal) => signal.status === "Yellow").length}
          icon={AlertTriangle}
          tone="warn"
          hint="Attention needed"
        />
        <KpiCard
          label="Failed"
          value={live.signals.filter((signal) => signal.status === "Red").length}
          icon={AlertTriangle}
          tone="danger"
          hint="Critical failures"
        />
        <KpiCard
          label="Maintenance Due"
          value={maintenanceDue}
          icon={CalendarClock}
          tone="warn"
          hint="Overdue tasks"
        />
        <KpiCard
          label="Active Signal Incidents"
          value={live.signals.filter((signal) => signal.status === "Red").length}
          icon={TrainFront}
          tone="danger"
          hint="Current incidents"
        />
      </div>

      {/* Signal Failure Alert */}
      <Panel title="SIGNAL FAILURE" className="mb-4 border-destructive/50">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="text-sm font-semibold text-destructive">S-204</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-semibold text-foreground">KM 104/7</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Severity</p>
              <p className="text-sm font-semibold text-destructive">CRITICAL</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Train Impact</p>
              <p className="text-sm font-semibold text-foreground">3 approaching movements</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-destructive/20">
            <p className="text-xs text-muted-foreground mb-1">Recommended Action</p>
            <p className="text-sm font-semibold text-foreground">
              Immediate signal engineering response. Protect affected movements per authorized
              railway procedures.
            </p>
          </div>
        </div>
      </Panel>

      {/* Railway Signal Map */}
      <Panel title="RAILWAY SIGNAL MAP" className="mb-4">
        <StationMapCanvas />
      </Panel>

      {/* Signal Cards */}
      <Panel title="SIGNAL STATUS" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: "S-204",
              type: "Colour Light",
              location: "KM 104/7",
              state: "Red",
              health: "Failed",
              lastInspection: "2026-09-10",
              fault: "Lamp failure",
              team: "Signal Crew 1",
            },
            {
              id: "S-205",
              type: "Colour Light",
              location: "KM 105/2",
              state: "Green",
              health: "Good",
              lastInspection: "2026-09-15",
              fault: "None",
              team: "Signal Crew 2",
            },
            {
              id: "S-206",
              type: "Distant",
              location: "KM 106/1",
              state: "Yellow",
              health: "Warning",
              lastInspection: "2026-09-12",
              fault: "Sighting issue",
              team: "Signal Crew 1",
            },
            {
              id: "S-207",
              type: "Shunting",
              location: "KM 107/3",
              state: "Green",
              health: "Good",
              lastInspection: "2026-09-16",
              fault: "None",
              team: "Signal Crew 2",
            },
            {
              id: "S-208",
              type: "Colour Light",
              location: "KM 108/5",
              state: "Green",
              health: "Good",
              lastInspection: "2026-09-14",
              fault: "None",
              team: "Signal Crew 1",
            },
            {
              id: "S-209",
              type: "Point Indicator",
              location: "KM 109/2",
              state: "Yellow",
              health: "Warning",
              lastInspection: "2026-09-11",
              fault: "Point machine issue",
              team: "Signal Crew 2",
            },
          ].map((signal) => (
            <div key={signal.id} className="p-4 bg-panel-muted rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-semibold">{signal.id}</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    signal.health === "Failed"
                      ? "bg-destructive/10 text-destructive"
                      : signal.health === "Warning"
                        ? "bg-warn/10 text-warn-foreground"
                        : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {signal.health}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground">{signal.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-foreground">{signal.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current State</span>
                  <span className="text-foreground">{signal.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Inspection</span>
                  <span className="text-foreground">{signal.lastInspection}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fault</span>
                  <span
                    className={signal.fault === "None" ? "text-emerald-500" : "text-destructive"}
                  >
                    {signal.fault}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Team</span>
                  <span className="text-foreground">{signal.team}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Maintenance Tasks Table */}
      <Panel title="MAINTENANCE TASKS">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-muted-foreground">Task ID</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Asset Type</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Section</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Work Type</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Duration</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Criticality</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Assigned Team</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {signalTasks.slice(0, 5).map((task) => (
                <tr key={task.id} className="border-b border-border hover:bg-panel-muted">
                  <td className="p-3 font-mono font-semibold">{task.id}</td>
                  <td className="p-3">{task.assetType}</td>
                  <td className="p-3">{task.section}</td>
                  <td className="p-3">{task.workType}</td>
                  <td className="p-3">{task.duration} min</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        task.criticality === "Critical"
                          ? "bg-destructive/10 text-destructive"
                          : task.criticality === "High"
                            ? "bg-warn/10 text-warn-foreground"
                            : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {task.criticality}
                    </span>
                  </td>
                  <td className="p-3">{task.requiredResources[0] || "Unassigned"}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-warn/10 text-warn-foreground">
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </MainShell>
  );
}
