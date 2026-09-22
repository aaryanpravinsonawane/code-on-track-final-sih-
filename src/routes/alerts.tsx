import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  MoreHorizontal,
  ShieldCheck,
  TrainFront,
  XCircle,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { UnifiedDataLayer } from "@/lib/trackwise/unified-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/alerts")({
  component: AlertCenter,
});

function AlertCenter() {
  const [filter, setFilter] = useState("All");
  type AlertRecord = ReturnType<typeof UnifiedDataLayer.generateAlerts>[number];
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const alerts = UnifiedDataLayer.generateAlerts();

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH").length;
  const mediumCount = alerts.filter((a) => a.severity === "MEDIUM").length;
  const lowCount = alerts.filter((a) => a.severity === "LOW").length;

  const filteredAlerts =
    filter === "All" ? alerts : alerts.filter((a) => a.severity === filter || a.status === filter);

  const acknowledge = (alert: AlertRecord) => {
    setAcknowledged((current) => new Set(current).add(alert.id));
    setSelectedAlert({ ...alert, status: "Acknowledged" });
  };
  const viewOnMap = (alert: AlertRecord) => {
    sessionStorage.setItem("trackwise_map_focus", alert.asset || alert.location);
    navigate({ to: "/station-map" });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "HIGH":
        return "bg-warn/10 text-warn-foreground border-warn/20";
      case "MEDIUM":
        return "bg-primary/10 text-primary border-primary/20";
      case "LOW":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-destructive/10 text-destructive";
      case "Acknowledged":
        return "bg-warn/10 text-warn-foreground";
      case "Assigned":
        return "bg-primary/10 text-primary";
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-500";
      default:
        return "bg-muted-foreground/10 text-muted-foreground";
    }
  };

  return (
    <MainShell
      title="ALERT & NOTIFICATION CENTER"
      subtitle="Centralized alert management for all railway operational systems"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard
          label="CRITICAL"
          value={criticalCount}
          icon={AlertTriangle}
          tone="danger"
          hint="Immediate attention"
        />
        <KpiCard
          label="HIGH"
          value={highCount}
          icon={ShieldCheck}
          tone="warn"
          hint="High priority"
        />
        <KpiCard label="MEDIUM" value={mediumCount} icon={Clock} hint="Standard priority" />
        <KpiCard label="LOW" value={lowCount} icon={CheckCircle2} hint="Low priority" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Alerts List */}
        <div className="lg:col-span-2">
          <Panel
            title="ALERTS"
            right={
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="All">All</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                  <option value="Open">Open</option>
                  <option value="Acknowledged">Acknowledged</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            }
          >
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAlert?.id === alert.id
                      ? "bg-primary/10 border-primary"
                      : getSeverityColor(alert.severity)
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs text-muted-foreground">{alert.sourceSystem}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-6">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedAlert(alert)}>
                          <Eye className="size-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => acknowledge(alert)}>
                          <CheckCircle2 className="size-4 mr-2" />
                          Acknowledge
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => viewOnMap(alert)}>
                          <MapPin className="size-4 mr-2" />
                          View on Map
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2">{alert.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {alert.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrainFront className="size-3" />
                      {alert.affectedTrains.length} trains
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(alert.timestamp).toLocaleTimeString("en-GB")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(alert.status)}`}
                    >
                      {acknowledged.has(alert.id) ? "Acknowledged" : alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Alert Detail */}
        <div>
          <Panel title="ALERT DETAILS">
            {selectedAlert ? (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-5 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{selectedAlert.description}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Source System</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedAlert.sourceSystem}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Station</p>
                    <p className="text-sm font-semibold text-foreground">{selectedAlert.station}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedAlert.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asset</p>
                    <p className="text-sm font-semibold text-foreground">{selectedAlert.asset}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Department</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedAlert.assignedDepartment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Affected Trains</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAlert.affectedTrains.map((train: string) => (
                        <span
                          key={train}
                          className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono"
                        >
                          {train}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedAlert.timestamp).toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="sm" onClick={() => acknowledge(selectedAlert)}>
                    <CheckCircle2 className="size-4 mr-2" />
                    Acknowledge Alert
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => viewOnMap(selectedAlert)}
                  >
                    <MapPin className="size-4 mr-2" />
                    View on Map
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: "/work-orders" })}
                  >
                    <ShieldCheck className="size-4 mr-2" />
                    Create Work Order
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Select an alert to view details</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </MainShell>
  );
}
