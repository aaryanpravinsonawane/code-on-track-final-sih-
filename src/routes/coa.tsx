import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Gauge,
  MapPin,
  TrainFront,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";
import { TRAINS, fmt } from "@/lib/trackwise/data";

export const Route = createFileRoute("/coa")({
  component: COADashboard,
});

function COADashboard() {
  const { user } = useTrackwise();

  const delayedTrains = TRAINS.filter((t) => t.id === "12951" || t.id === "12841"); // Simulated delayed trains

  return (
    <MainShell
      title="COA — CONTROL OFFICE APPLICATION"
      subtitle={`${user?.station || "NDG"} Station · ${user?.division || "Central Division"} · Control Office`}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard label="Total Trains" value={TRAINS.length} icon={TrainFront} hint="Scheduled today" />
        <KpiCard label="On Time" value={TRAINS.length - delayedTrains.length} icon={Activity} tone="success" hint="Running on schedule" />
        <KpiCard label="Delayed" value={delayedTrains.length} icon={AlertTriangle} tone="warn" hint="Currently delayed" />
        <KpiCard label="Average Delay" value={12} unit=" min" icon={CalendarClock} tone="warn" hint="Across all trains" />
      </div>

      {/* Train Operations Table */}
      <Panel title="TRAIN OPERATIONS" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-muted-foreground">Train No</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Train Name</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Origin</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Destination</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Current Station</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Next Station</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Scheduled</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Actual</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Delay</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Platform</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Track</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {TRAINS.slice(0, 8).map((train) => {
                const isDelayed = delayedTrains.some((t) => t.id === train.id);
                const delayMinutes = isDelayed ? Math.floor(Math.random() * 30) + 5 : 0;
                const stationCode = train.section === "S1" ? "NDG" : train.section === "S2" ? "KRP" : train.section === "S3" ? "STP" : "DVR";
                const nextStationCode = train.section === "S1" ? "KRP" : train.section === "S2" ? "STP" : train.section === "S3" ? "DVR" : "MRG";

                return (
                  <tr key={train.id} className="border-b border-border hover:bg-panel-muted">
                    <td className="p-3 font-mono font-semibold">{train.id}</td>
                    <td className="p-3">{train.name}</td>
                    <td className="p-3">{stationCode}</td>
                    <td className="p-3">{nextStationCode}</td>
                    <td className="p-3">{stationCode}</td>
                    <td className="p-3">{nextStationCode}</td>
                    <td className="p-3 font-mono">{fmt(train.arrival)}</td>
                    <td className="p-3 font-mono">{fmt(train.arrival + delayMinutes)}</td>
                    <td className="p-3">
                      {delayMinutes > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-warn/10 text-warn-foreground">
                          +{delayMinutes} min
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                          On Time
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">P-{Math.floor(Math.random() * 4) + 1}</td>
                    <td className="p-3 font-mono">T-{Math.floor(Math.random() * 3) + 1}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          isDelayed
                            ? "bg-warn/10 text-warn-foreground"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {isDelayed ? "Delayed" : "Running"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Live Train Timeline */}
      <Panel title="LIVE TRAIN TIMELINE" className="mb-4">
        <div className="space-y-3">
          {[
            { time: "06:40", event: "Train 12951 departed NDG", status: "completed" },
            { time: "07:05", event: "Train 12951 approaching KRP", status: "completed" },
            { time: "07:08", event: "Platform P-2 allocated", status: "completed" },
            { time: "07:10", event: "Train 12951 arrived KRP", status: "completed" },
            { time: "07:13", event: "Departure signal cleared", status: "completed" },
            { time: "07:14", event: "Train 12951 departed KRP", status: "in_progress" },
            { time: "07:20", event: "Train 12841 approaching STP", status: "pending" },
            { time: "07:25", event: "Platform P-1 allocation expected", status: "pending" },
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`size-3 rounded-full ${
                    item.status === "completed"
                      ? "bg-emerald-500"
                      : item.status === "in_progress"
                      ? "bg-primary animate-pulse"
                      : "bg-muted-foreground"
                  }`}
                />
                {index < 7 && <div className="w-0.5 h-8 bg-border" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{item.time}</span>
                  <span className="text-sm text-muted-foreground">{item.event}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Train Regulation Panel */}
      <Panel title="TRAIN REGULATION">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-panel-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Caution Orders</p>
            <p className="text-2xl font-bold text-foreground">2</p>
            <p className="text-xs text-muted-foreground mt-1">Active on section</p>
          </div>
          <div className="p-4 bg-panel-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Diversions</p>
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">No active diversions</p>
          </div>
          <div className="p-4 bg-panel-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Stabling</p>
            <p className="text-2xl font-bold text-foreground">3</p>
            <p className="text-xs text-muted-foreground mt-1">Trains stabled</p>
          </div>
          <div className="p-4 bg-panel-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Yarding</p>
            <p className="text-2xl font-bold text-foreground">1</p>
            <p className="text-xs text-muted-foreground mt-1">Active yard operations</p>
          </div>
        </div>
      </Panel>
    </MainShell>
  );
}
