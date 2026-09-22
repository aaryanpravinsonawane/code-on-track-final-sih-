import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BatteryCharging,
  CalendarClock,
  Gauge,
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";
import { TASKS } from "@/lib/trackwise/data";
import { StationMapCanvas } from "@/components/trackwise/StationMapCanvas";
import { useLiveSimulation } from "@/lib/liveSimulation";

export const Route = createFileRoute("/tdms")({
  component: TDMSDashboard,
});

function TDMSDashboard() {
  const { user } = useTrackwise();
  const live = useLiveSimulation();

  const tractionTasks = TASKS.filter((t) => t.department === "TRD");
  const healthy = tractionTasks.filter(
    (t) => t.criticality === "Low" || t.criticality === "Medium",
  ).length;
  const attention = tractionTasks.filter((t) => t.criticality === "High").length;
  const critical = tractionTasks.filter((t) => t.criticality === "Critical").length;
  const maintenanceDue = tractionTasks.filter((t) => t.overdueDays > 0).length;

  return (
    <MainShell
      title="TDMS — TRACTION DISTRIBUTION MANAGEMENT SYSTEM"
      subtitle={`${user?.station || "NDG"} Station · ${user?.division || "Central Division"} · TRD Department`}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard
          label="OHE Assets"
          value={live.trains.length * 4}
          icon={Zap}
          hint="Live corridor assets"
        />
        <KpiCard label="Substations" value={3} icon={BatteryCharging} hint="Active substations" />
        <KpiCard label="Feeders" value={8} icon={ShieldCheck} hint="Power feeders" />
        <KpiCard
          label="Active Faults"
          value={live.trains.filter((train) => train.traction_status === "Attention").length}
          icon={AlertTriangle}
          tone="warn"
          hint="Current faults"
        />
        <KpiCard
          label="Power Availability"
          value={Math.round(
            (live.trains.filter((train) => train.traction_status === "Healthy").length /
              live.trains.length) *
              100,
          )}
          unit="%"
          icon={Gauge}
          tone="success"
          hint="Live traction availability"
        />
        <KpiCard
          label="Maintenance Work"
          value={maintenanceDue}
          icon={CalendarClock}
          tone="warn"
          hint="Pending tasks"
        />
      </div>

      {/* OHE Network Visualization */}
      <Panel title="OHE NETWORK" className="mb-4">
        <StationMapCanvas />
      </Panel>

      {/* Asset Table */}
      <Panel title="ASSET STATUS" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-muted-foreground">Asset ID</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Type</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Location</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Voltage</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Load</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Health</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">
                  Last Inspection
                </th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  id: "OHE-001",
                  type: "OHE Section",
                  location: "S1 · NDG-KRP",
                  voltage: "25kV",
                  load: "450A",
                  health: "Good",
                  status: "Operational",
                },
                {
                  id: "OHE-002",
                  type: "OHE Section",
                  location: "S2 · KRP-STP",
                  voltage: "25kV",
                  load: "380A",
                  health: "Good",
                  status: "Operational",
                },
                {
                  id: "SS-001",
                  type: "Substation",
                  location: "NDG",
                  voltage: "25kV",
                  load: "850A",
                  health: "Good",
                  status: "Operational",
                },
                {
                  id: "SS-002",
                  type: "Substation",
                  location: "STP",
                  voltage: "25kV",
                  load: "720A",
                  health: "Warning",
                  status: "Operational",
                },
                {
                  id: "FD-001",
                  type: "Feeder",
                  location: "S1",
                  voltage: "25kV",
                  load: "450A",
                  health: "Good",
                  status: "Operational",
                },
                {
                  id: "FD-002",
                  type: "Feeder",
                  location: "S2",
                  voltage: "25kV",
                  load: "380A",
                  health: "Warning",
                  status: "Maintenance",
                },
              ].map((asset) => (
                <tr key={asset.id} className="border-b border-border hover:bg-panel-muted">
                  <td className="p-3 font-mono font-semibold">{asset.id}</td>
                  <td className="p-3">{asset.type}</td>
                  <td className="p-3">{asset.location}</td>
                  <td className="p-3 font-mono">{asset.voltage}</td>
                  <td className="p-3 font-mono">{asset.load}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        asset.health === "Good"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-warn/10 text-warn-foreground"
                      }`}
                    >
                      {asset.health}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">2026-09-15</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        asset.status === "Operational"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-warn/10 text-warn-foreground"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Fault Table */}
      <Panel title="FAULT STATUS">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-muted-foreground">Fault ID</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Asset</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Location</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Severity</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Detected</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Technician</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">ETA</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {tractionTasks.slice(0, 4).map((task) => (
                <tr key={task.id} className="border-b border-border hover:bg-panel-muted">
                  <td className="p-3 font-mono font-semibold">{task.id}</td>
                  <td className="p-3">{task.assetType}</td>
                  <td className="p-3">{task.section}</td>
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
                  <td className="p-3 text-muted-foreground">2026-09-18</td>
                  <td className="p-3">{task.requiredResources[0] || "Unassigned"}</td>
                  <td className="p-3 text-muted-foreground">
                    {task.overdueDays > 0 ? `${task.overdueDays}d overdue` : "On schedule"}
                  </td>
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
