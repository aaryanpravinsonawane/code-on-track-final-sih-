import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Activity, CheckCircle2, Clock, TrainFront, Zap } from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { Panel } from "@/components/trackwise/shared";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { departmentHealth, platforms, tracks } from "@/lib/trackwise/operations";
import { LiveOperationsFeed } from "@/components/realtime/LiveOperationsFeed";

export const Route = createFileRoute("/live-operations")({
  component: LiveOperations,
});

function LiveOperations() {
  const [heartbeat, setHeartbeat] = useState(0);
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
        <KpiCard label="Running Trains" value={18} icon={TrainFront} tone="success" />
        <KpiCard label="Delayed Trains" value={4} icon={Clock} tone="warn" />
        <KpiCard
          label="Track Occupancy"
          value={tracks.filter((track) => track.occupancy !== "Free").length}
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
                {platforms.map((platform) => (
                  <tr key={platform.id} className="border-b border-border/70 hover:bg-accent/50">
                    <td className="px-3 py-3 font-mono font-semibold">
                      {platform.train === "-" ? "64022" : platform.train.split(" ")[0]}
                    </td>
                    <td className="px-3 py-3">
                      {platform.train === "-" ? "Approaching NDG" : "At station"}
                    </td>
                    <td className="px-3 py-3">{platform.id}</td>
                    <td
                      className={`px-3 py-3 ${platform.delay ? "text-amber-500" : "text-emerald-500"}`}
                    >
                      {platform.delay ? `+${platform.delay} min` : "On time"}
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
            {departmentHealth.map((department) => (
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
                    className={`h-2 rounded-full ${department.color}`}
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
              <span>Signal S4 failure at North Cabin</span>
            </div>
            <div className="flex gap-2">
              <Clock className="size-4 text-amber-500" />
              <span>Train 12615 running 18 minutes late</span>
            </div>
            <div className="flex gap-2">
              <Zap className="size-4 text-amber-500" />
              <span>Feeder FEED-03 tripped</span>
            </div>
          </div>
        </Panel>
        <Panel title="SYSTEM HEALTH">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Signals</span>
              <b className="text-emerald-500">96%</b>
            </div>
            <div className="flex justify-between">
              <span>OHE</span>
              <b className="text-amber-500">94%</b>
            </div>
            <div className="flex justify-between">
              <span>Operations</span>
              <b className="text-emerald-500">98%</b>
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
