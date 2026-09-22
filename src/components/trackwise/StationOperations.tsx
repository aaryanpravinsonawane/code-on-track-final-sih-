import { useEffect, useState } from "react";
import { Activity, CheckCircle2, MapPin, Radio, Zap } from "lucide-react";
import { Panel } from "@/components/trackwise/shared";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Button } from "@/components/ui/button";
import { platforms, signals, traction, tracks, type Health } from "@/lib/trackwise/operations";

const healthClass: Record<Health, string> = {
  Healthy: "text-emerald-500",
  Warning: "text-amber-500",
  Critical: "text-destructive",
};

export function StationOperationsPage({
  mode,
}: {
  mode: "master" | "platforms" | "tracks" | "signals" | "traction" | "workstations";
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 4000);
    return () => window.clearInterval(timer);
  }, []);

  if (mode === "master") {
    return <StationMasterOverview tick={tick} />;
  }
  if (mode === "workstations") {
    return <WorkstationView />;
  }

  const config = {
    platforms: {
      title: "PLATFORM STATUS",
      subtitle: "Live platform allocation and train berth monitoring",
      icon: Radio,
    },
    tracks: {
      title: "TRACK OCCUPANCY",
      subtitle: "Track circuit states, train counts and condition monitoring",
      icon: Activity,
    },
    signals: {
      title: "SIGNAL STATUS",
      subtitle: "Interlocking aspects and failure alerts across NDG station",
      icon: CheckCircle2,
    },
    traction: {
      title: "TRACTION STATUS",
      subtitle: "OHE voltage, feeder state and substation health",
      icon: Zap,
    },
  }[mode];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Assets Monitored"
          value={mode === "platforms" ? 6 : mode === "tracks" ? 6 : mode === "signals" ? 12 : 5}
          icon={config.icon}
          hint={`Auto-refresh ${tick % 2 === 0 ? "nominal" : "verified"}`}
        />
        <KpiCard
          label="Healthy"
          value={mode === "signals" ? 10 : mode === "traction" ? 2 : mode === "platforms" ? 4 : 4}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Attention"
          value={mode === "signals" ? 2 : mode === "traction" ? 3 : 2}
          icon={Activity}
          tone="warn"
        />
        <KpiCard
          label="Last Sync"
          value={tick + 1}
          unit="s"
          icon={Radio}
          hint="Simulation heartbeat"
        />
      </div>
      <Panel title={config.title}>
        {mode === "platforms" && <PlatformTable />}
        {mode === "tracks" && <TrackTable />}
        {mode === "signals" && <SignalTable />}
        {mode === "traction" && <TractionTable />}
      </Panel>
    </div>
  );
}

function StationMasterOverview({ tick }: { tick: number }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Train Movements"
          value={8 + (tick % 2)}
          icon={Activity}
          hint="At station today"
        />
        <KpiCard label="Platforms Active" value={4} icon={Radio} hint="Of 6 platforms" />
        <KpiCard label="Track Occupancy" value={3} icon={MapPin} hint="Sections occupied" />
        <KpiCard label="OHE Availability" value={98} unit="%" icon={Zap} tone="success" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="CONTROL ROOM STATUS">
          <div className="grid gap-3 sm:grid-cols-2">
            {["Station Master Console", "TMS Console", "TDMS Console", "SMMS Console"].map(
              (name, index) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-md border border-border bg-panel-muted p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">WS-0{index + 1} · Control Room</p>
                  </div>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              ),
            )}
          </div>
        </Panel>
        <Panel title="NEXT MOVEMENTS">
          <div className="space-y-2">
            {platforms.slice(0, 4).map((platform) => (
              <div
                key={platform.id}
                className="flex items-center justify-between border-b border-border py-2 text-sm"
              >
                <span className="font-mono font-semibold">{platform.id}</span>
                <span className="flex-1 px-3 truncate">{platform.train}</span>
                <span className={platform.delay ? "text-amber-500" : "text-emerald-500"}>
                  {platform.delay ? `+${platform.delay} min` : "On time"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PlatformTable() {
  return (
    <DataTable
      headers={["Platform", "State", "Assigned Train", "Delay", "ETA"]}
      rows={platforms.map((item) => [
        item.id,
        item.status,
        item.train,
        item.delay ? `+${item.delay} min` : "On time",
        item.eta,
      ])}
    />
  );
}
function TrackTable() {
  return (
    <DataTable
      headers={["Track ID", "Occupancy", "Train Count", "Track Condition"]}
      rows={tracks.map((item) => [item.id, item.occupancy, String(item.trains), item.condition])}
    />
  );
}
function SignalTable() {
  return (
    <DataTable
      headers={["Signal ID", "Aspect", "Last Updated", "Failure Alerts"]}
      rows={signals.map((item) => [item.id, item.status, item.updated, item.alert])}
    />
  );
}
function TractionTable() {
  return (
    <DataTable
      headers={["Asset", "OHE Voltage", "Feeder Status", "Substation", "Power Health"]}
      rows={traction.map((item) => [
        item.id,
        item.voltage ? `${item.voltage} kV` : "-",
        item.feeder,
        item.substation,
        item.health,
      ])}
    />
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[0]}
              className="cursor-pointer border-b border-border/70 transition-colors hover:bg-accent/50"
            >
              {row.map((cell, index) => (
                <td
                  key={`${row[0]}-${index}`}
                  className={`px-3 py-3 ${index === 0 ? "font-mono font-semibold" : ""} ${cell === "Critical" || cell === "Red" || cell === "Blocked" || cell === "Tripped" ? "text-destructive" : cell === "Warning" || cell === "Yellow" || cell.includes("+") ? "text-amber-500" : cell === "Healthy" || cell === "Green" || cell === "Free" || cell === "Online" || cell === "On time" ? "text-emerald-500" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkstationView() {
  const workstations = [
    "Station Master Console",
    "TMS Console",
    "TDMS Console",
    "SMMS Console",
    "COA Console",
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="ROOM MAPPING">
        <div className="grid gap-3 sm:grid-cols-2">
          {workstations.map((name, index) => (
            <Button key={name} variant="outline" className="h-auto justify-start gap-3 p-4">
              <MapPin className="size-5 text-primary" />
              <span className="text-left">
                <span className="block font-semibold">{name}</span>
                <span className="text-xs text-muted-foreground">
                  Control Room · WS-0{index + 1}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </Panel>
      <Panel title="LOCATION TELEMETRY">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Station</span>
            <strong>NDG · Nandgaon Jn</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Building</span>
            <strong>Operations Building A</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Floor / Room</span>
            <strong>Ground Floor · CR-01</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location accuracy</span>
            <strong className="text-emerald-500">Available</strong>
          </div>
        </div>
      </Panel>
    </div>
  );
}
