import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
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

export const Route = createFileRoute("/incidents")({
  component: IncidentCenter,
});

function IncidentCenter() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const navigate = useNavigate();

  const viewOnMap = (location: string) => {
    sessionStorage.setItem(
      "trackwise_map_focus",
      location.includes("Platform") ? "P2" : location.includes("Signal") ? "S4" : "OHE-02",
    );
    navigate({ to: "/station-map" });
  };

  const incidents = UnifiedDataLayer.generateIncidents();

  const openCount = incidents.filter((i) => i.status === "Open").length;
  const inProgressCount = incidents.filter((i) => i.status === "In Progress").length;
  const resolvedCount = incidents.filter((i) => i.status === "Resolved").length;

  return (
    <MainShell
      title="CROSS-DEPARTMENT INCIDENT VIEW"
      subtitle="Unified incident management correlating events from TMS, TDMS, SMMS, and COA"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard
          label="Open Incidents"
          value={openCount}
          icon={AlertTriangle}
          tone="danger"
          hint="Requires attention"
        />
        <KpiCard
          label="In Progress"
          value={inProgressCount}
          icon={Clock}
          tone="warn"
          hint="Being resolved"
        />
        <KpiCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle2}
          tone="success"
          hint="Successfully resolved"
        />
        <KpiCard
          label="Total Affected Trains"
          value={12}
          icon={TrainFront}
          hint="Across all incidents"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Incidents List */}
        <div className="lg:col-span-2">
          <Panel title="UNIFIED INCIDENTS">
            <div className="space-y-2">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedIncident?.id === incident.id
                      ? "bg-primary/10 border-primary"
                      : incident.severity === "CRITICAL"
                        ? "bg-destructive/10 border-destructive/20 hover:bg-destructive/20"
                        : "bg-panel-muted border-border hover:bg-panel-muted/80"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          incident.severity === "CRITICAL"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-warn text-warn-foreground"
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-xs text-muted-foreground">{incident.id}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-6">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewOnMap(incident.location)}>
                          <Eye className="size-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MapPin className="size-4 mr-2" />
                          View on Map
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ShieldCheck className="size-4 mr-2" />
                          Assign Department
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2">UNIFIED INCIDENT</p>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <span className="ml-1 font-semibold">{incident.location}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Affected Trains:</span>
                      <span className="ml-1 font-semibold">{incident.affectedTrains}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Affected Assets:</span>
                      <span className="ml-1 font-semibold">{incident.affectedAssets}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-1 font-semibold">{incident.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {incident.relatedSystems.map((system) => (
                      <span
                        key={system}
                        className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold"
                      >
                        {system} ✓
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Incident Detail */}
        <div>
          <Panel title="INCIDENT DETAILS">
            {selectedIncident ? (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-5 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">
                      {selectedIncident.severity}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">UNIFIED INCIDENT</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Incident ID</p>
                    <p className="text-sm font-semibold text-foreground">{selectedIncident.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedIncident.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Related Systems</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIncident.relatedSystems.map((system: string) => (
                        <span
                          key={system}
                          className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold"
                        >
                          {system} ✓
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Impact</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIncident.impact.map((impact: string) => (
                        <span
                          key={impact}
                          className="inline-flex items-center px-2 py-1 rounded bg-warn/10 text-warn-foreground text-xs"
                        >
                          {impact}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Affected Trains</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedIncident.affectedTrains}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Affected Assets</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedIncident.affectedAssets}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Departments</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIncident.assignedDepartments.map((dept: string) => (
                        <span
                          key={dept}
                          className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Timeline</p>
                  <div className="space-y-2">
                    {selectedIncident.timeline.map((item: any, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex flex-col items-center">
                          <div className="size-2 rounded-full bg-primary" />
                          {index < selectedIncident.timeline.length - 1 && (
                            <div className="w-0.5 h-6 bg-border" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-mono font-semibold">{item.time}</p>
                          <p className="text-xs text-muted-foreground">{item.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    <ShieldCheck className="size-4 mr-2" />
                    Assign Department
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => viewOnMap(selectedIncident.location)}
                  >
                    <MapPin className="size-4 mr-2" />
                    View on Map
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Select an incident to view details</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </MainShell>
  );
}
