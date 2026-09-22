import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Gauge,
  MapPin,
  ShieldCheck,
  TrainFront,
  Wrench,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";
import { SECTIONS, TASKS } from "@/lib/trackwise/data";

export const Route = createFileRoute("/tms")({
  component: TMSDashboard,
});

function TMSDashboard() {
  const { user } = useTrackwise();

  const trackTasks = TASKS.filter((t) => t.department === "Engineering");
  const healthy = trackTasks.filter((t) => t.criticality === "Low" || t.criticality === "Medium").length;
  const attention = trackTasks.filter((t) => t.criticality === "High").length;
  const critical = trackTasks.filter((t) => t.criticality === "Critical").length;
  const maintenanceDue = trackTasks.filter((t) => t.overdueDays > 0).length;

  return (
    <MainShell
      title="TMS — TRACK MANAGEMENT SYSTEM"
      subtitle={`${user?.station || "NDG"} Station · ${user?.division || "Central Division"} · Engineering Department`}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard label="Total Track Sections" value={SECTIONS.length} icon={TrainFront} hint="Under management" />
        <KpiCard label="Healthy" value={healthy} icon={ShieldCheck} tone="success" hint="Normal condition" />
        <KpiCard label="Attention Required" value={attention} icon={AlertTriangle} tone="warn" hint="High priority issues" />
        <KpiCard label="Critical" value={critical} icon={AlertTriangle} tone="danger" hint="Immediate action needed" />
        <KpiCard label="Maintenance Due" value={maintenanceDue} icon={CalendarClock} tone="warn" hint="Overdue tasks" />
        <KpiCard label="Active Blocks" value={3} icon={Wrench} hint="Current maintenance blocks" />
      </div>

      {/* Track Map */}
      <Panel title="TRACK MAP" className="mb-4">
        <div className="bg-panel-muted rounded-lg p-8 min-h-[300px] flex items-center justify-center">
          <div className="text-center">
            <MapPin className="size-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Interactive Track Map</p>
            <p className="text-xs text-muted-foreground">
              Track Sections · Kilometer Markers · Track Condition · Defects · Maintenance Zones · Work Teams
            </p>
          </div>
        </div>
      </Panel>

      {/* Track Asset Table */}
      <Panel title="TRACK ASSET" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-muted-foreground">ID</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Section</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">KM</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Condition</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Last Inspection</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Next Inspection</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Risk</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section) => (
                <tr key={section.id} className="border-b border-border hover:bg-panel-muted">
                  <td className="p-3 font-mono font-semibold">{section.id}</td>
                  <td className="p-3">{section.name}</td>
                  <td className="p-3 font-mono">{section.distanceKm} km</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        section.maintenanceStatus === "Overdue"
                          ? "bg-destructive/10 text-destructive"
                          : section.maintenanceStatus === "Pending"
                          ? "bg-warn/10 text-warn-foreground"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {section.maintenanceStatus}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">2026-09-15</td>
                  <td className="p-3 text-muted-foreground">2026-09-22</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        section.maintenanceStatus === "Overdue"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {section.maintenanceStatus === "Overdue" ? "High" : "Low"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                      {section.operationalStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Track Defect Table */}
      <Panel title="TRACK DEFECT">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-muted-foreground">Defect ID</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Location</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Type</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Severity</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Detected</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Assigned Team</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Due Time</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {trackTasks.slice(0, 5).map((task) => (
                <tr key={task.id} className="border-b border-border hover:bg-panel-muted">
                  <td className="p-3 font-mono font-semibold">{task.id}</td>
                  <td className="p-3">{task.section}</td>
                  <td className="p-3">{task.assetType}</td>
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
                  <td className="p-3 text-muted-foreground">{task.overdueDays > 0 ? `${task.overdueDays}d overdue` : "On schedule"}</td>
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
