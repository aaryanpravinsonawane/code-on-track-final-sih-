import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/trackwise/shared";
import { useRealtimeIssues } from "@/hooks/useRealtimeIssues";
import { platforms, signals, tracks, traction } from "@/lib/trackwise/operations";

/**
 * Flat 2D yard map of NDG / Nandgaon Junction.
 * Deterministic simulated geometry + station-level telemetry from the simulated operations data.
 * No map tiles, no 3D: it keeps working offline and is clearly labelled as demo data.
 */

type Severity = "Critical" | "High" | "Medium" | "Low";
type Kind = "Signal" | "Track" | "Traction" | "Platform" | "Maintenance" | "Incident";

interface MapAsset {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  severity: Severity | null;
  status: string;
  description: string;
  location: string;
}

type LayerKey = "signals" | "trains" | "occupancy" | "traction" | "block" | "alerts";

const W = 1000;
const H = 580;
const ROW = {
  loop1: 78,
  up: 122,
  p1: 178,
  p2: 214,
  p3: 250,
  p4: 286,
  p5: 322,
  p6: 358,
  dn: 410,
  loop2: 452,
  y1: 496,
  y2: 528,
} as const;
const PLATFORM_Y = [ROW.p1, ROW.p2, ROW.p3, ROW.p4, ROW.p5, ROW.p6];
const INK = "oklch(0.16 0.05 262)";
const MUTED = "var(--muted-foreground)";

const SEVERITY_COLOR: Record<Severity, string> = {
  Critical: "var(--st-critical)",
  High: "var(--st-held)",
  Medium: "var(--st-delayed)",
  Low: "var(--st-ontime)",
};

const ASPECT_COLOR = {
  Green: "var(--st-ontime)",
  Yellow: "var(--st-delayed)",
  Red: "var(--st-critical)",
} as const;

// Signal posts (x, y). S1..S12 follow the signal register in the operations data.
const SIGNAL_POS: Array<[number, number]> = [
  [112, 108],
  [112, 424],
  [884, 136],
  [884, 424],
  [252, 168],
  [252, 204],
  [252, 240],
  [752, 276],
  [752, 312],
  [752, 348],
  [292, 64],
  [708, 466],
];

const ANCHOR: Record<string, [number, number]> = {
  "UP-MAIN": [600, ROW.up],
  "DN-MAIN": [350, ROW.dn],
  "LOOP-1": [500, ROW.loop1],
  "LOOP-2": [500, ROW.loop2],
  "YARD-1": [880, ROW.y1],
  "YARD-2": [900, ROW.y2],
  "OHE-01": [210, ROW.up - 16],
  "OHE-02": [450, ROW.up - 16],
  "OHE-04": [300, ROW.dn + 16],
  "OHE-05": [700, ROW.dn + 16],
  "FEED-03": [895, 66],
};

// Where reported incidents (realtime database rows) are pinned on the yard map.
const INCIDENT_SLOTS: Array<[number, number]> = [
  [220, 148],
  [360, 148],
  [520, 148],
  [640, 148],
  [760, 148],
  [300, 386],
  [450, 386],
  [620, 386],
  [780, 386],
  [160, 300],
];

// Values other pages store in sessionStorage when "View on map" is used.
const FOCUS_ALIAS: Record<string, string> = {
  "S-204": "S4",
  "S-412": "S8",
  Signal: "S4",
  Track: "UP-MAIN",
  Substation: "FEED-03",
  Platform: "P2",
};

const OCCUPIED = [
  { id: "UP-MAIN", x1: 560, x2: 690, y: ROW.up, blocked: false },
  { id: "DN-MAIN", x1: 240, x2: 340, y: ROW.dn, blocked: false },
  { id: "YARD-1", x1: 830, x2: 950, y: ROW.y1, blocked: false },
  { id: "LOOP-2", x1: 250, x2: 750, y: ROW.loop2, blocked: true },
];

function ladder(from: number, to: number, side: "L" | "R") {
  const dy = Math.abs(to - from);
  const end = side === "L" ? 193 : 807;
  const start = side === "L" ? end - dy : end + dy;
  return `M${start} ${from} L${end} ${to}`;
}

function buildAssets(): MapAsset[] {
  const out: MapAsset[] = [];
  platforms.forEach((p, i) => {
    out.push({
      id: p.id,
      kind: "Platform",
      x: 318,
      y: PLATFORM_Y[i] ?? ROW.p1,
      severity: p.status === "Occupied" && p.delay > 15 ? "High" : null,
      status: p.status,
      description:
        p.status === "Occupied"
          ? `${p.train} · delay +${p.delay} min · ETA ${p.eta}`
          : `Free · next arrival ${p.eta}`,
      location: `NDG · Platform ${p.id.replace("P", "")}`,
    });
  });
  signals.forEach((s, i) => {
    const pos = SIGNAL_POS[i] ?? [500, 300];
    out.push({
      id: s.id,
      kind: "Signal",
      x: pos[0],
      y: pos[1],
      severity: s.status === "Red" ? "Critical" : s.status === "Yellow" ? "Medium" : null,
      status: `${s.status} aspect · updated ${s.updated}`,
      description: s.alert,
      location: `NDG · Signal ${s.id}`,
    });
  });
  tracks.forEach((t) => {
    const pos = ANCHOR[t.id] ?? [500, 300];
    const blocked = t.occupancy === "Blocked";
    out.push({
      id: t.id,
      kind: "Track",
      x: pos[0],
      y: pos[1],
      severity: blocked ? "Critical" : t.condition === "Warning" ? "Medium" : null,
      status: `${t.occupancy}${t.trains ? ` · ${t.trains} train(s)` : ""} · condition ${t.condition}`,
      description: blocked
        ? "Track section blocked — hold movements until cleared"
        : t.condition === "Warning"
          ? "Track condition warning — speed caution advised"
          : "Track circuit healthy",
      location: `NDG · ${t.id}`,
    });
  });
  traction.forEach((t) => {
    const pos = ANCHOR[t.id] ?? [500, 100];
    out.push({
      id: t.id,
      kind: "Traction",
      x: pos[0],
      y: pos[1],
      severity: t.health === "Critical" ? "Critical" : t.health === "Warning" ? "Medium" : null,
      status: `${t.feeder} · ${t.voltage} kV`,
      description:
        t.feeder === "Tripped"
          ? "Feeder tripped — traction supply unavailable"
          : t.feeder === "Maintenance"
            ? "Feeder under maintenance"
            : t.health === "Warning"
              ? "Voltage outside nominal band"
              : "Supply normal",
      location: `NDG · ${t.substation}`,
    });
  });
  out.push({
    id: "BLK-101",
    kind: "Maintenance",
    x: 490,
    y: ROW.loop1,
    severity: null,
    status: "In progress",
    description: "Simulated maintenance block on Loop 1 (track inspection window)",
    location: "NDG · Loop Line 1",
  });
  return out;
}

function trainColor(delay: number) {
  return delay > 15 ? "var(--st-critical)" : delay > 10 ? "var(--st-delayed)" : "var(--st-ontime)";
}

function Legend({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5">{children}</span>;
}

export function StationMapCanvas({ focusAsset }: { focusAsset?: string }) {
  const { issues: reported } = useRealtimeIssues();
  const assets = useMemo(() => {
    const base = buildAssets();
    const sev: Record<string, Severity> = {
      Critical: "Critical",
      High: "High",
      Medium: "Medium",
      Low: "Low",
    };
    reported
      .filter((r) => r.status !== "Resolved")
      .slice(0, INCIDENT_SLOTS.length)
      .forEach((r, i) => {
        const slot = INCIDENT_SLOTS[i] ?? [500, 300];
        base.push({
          id: r.id,
          kind: "Incident",
          x: slot[0],
          y: slot[1],
          severity: sev[r.severity] ?? "Medium",
          status: `${r.status} · ${r.department}`,
          description: r.title,
          location: r.location,
        });
      });
    return base;
  }, [reported]);
  const [selectedId, setSelectedId] = useState<string>(
    () => focusAsset ?? assets.find((a) => a.severity === "Critical")?.id ?? "S4",
  );
  // "View on map" from Incidents / Alerts stores the asset to focus; restore it after mount.
  useEffect(() => {
    if (focusAsset) return;
    const stored = sessionStorage.getItem("trackwise_map_focus");
    if (!stored) return;
    const id = FOCUS_ALIAS[stored] ?? stored;
    if (assets.some((a) => a.id === id)) setSelectedId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    signals: true,
    trains: true,
    occupancy: true,
    traction: true,
    block: true,
    alerts: true,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const selected = assets.find((a) => a.id === selectedId) ?? assets[0];
  const alerts = assets.filter((a) => a.severity !== null);
  const toggle = (k: LayerKey) => setLayers((l) => ({ ...l, [k]: !l[k] }));
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };
  const zoom = (f: number) => setScale((s) => Math.min(2.4, Math.max(0.8, +(s * f).toFixed(2))));
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!panning || !svgRef.current) return;
    const k = W / svgRef.current.getBoundingClientRect().width;
    setOffset((o) => ({ x: o.x + e.movementX * k, y: o.y + e.movementY * k }));
  };

  const layerButtons: Array<[LayerKey, string]> = [
    ["signals", "Signals"],
    ["trains", "Trains"],
    ["occupancy", "Track occupancy"],
    ["traction", "OHE / traction"],
    ["block", "Maintenance block"],
    ["alerts", "Alerts"],
  ];
  const pick = (id: string) => (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedId(id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Panel
        title="NDG Junction · 2D yard map"
        subtitle="Nandgaon Junction · simulated live asset telemetry"
        right={
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-st-delayed/30 bg-st-delayed/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-st-delayed sm:inline-flex">
              Simulated map · demo data
            </span>
            <Button variant="outline" size="sm" onClick={() => zoom(1.2)} aria-label="Zoom in">
              <Plus className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => zoom(1 / 1.2)} aria-label="Zoom out">
              <Minus className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={reset} aria-label="Reset view">
              <RotateCcw className="size-4" />
            </Button>
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Map layers">
          {layerButtons.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={layers[key]}
              onClick={() => toggle(key)}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                layers[key]
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/70">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className={`block h-auto w-full min-w-[720px] touch-none select-none bg-[oklch(0.15_0.045_262)] ${panning ? "cursor-grabbing" : "cursor-grab"}`}
            role="img"
            aria-label="Flat 2D yard map of NDG Nandgaon Junction"
            onPointerDown={(e) => {
              setPanning(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={() => setPanning(false)}
            onPointerCancel={() => setPanning(false)}
            onPointerMove={onPointerMove}
          >
            <defs>
              <pattern id="ym-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" fill="none" stroke="oklch(0.8 0.08 250 / 0.05)" />
              </pattern>
              <pattern
                id="ym-hatch"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="var(--st-block)" fillOpacity="0.14" />
                <rect width="3" height="8" fill="var(--st-block)" fillOpacity="0.55" />
              </pattern>
              <pattern
                id="ym-blocked"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="var(--st-critical)" fillOpacity="0.18" />
                <rect width="3" height="8" fill="var(--st-critical)" fillOpacity="0.8" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#ym-grid)" />

            <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
              {/* Flat base map: land use, road, canal (simulated) */}
              <rect x={10} y={10} width={240} height={52} rx={6} fill="oklch(0.2 0.05 262)" />
              <rect x={750} y={10} width={196} height={52} rx={6} fill="oklch(0.2 0.05 262)" />
              <rect
                x={10}
                y={470}
                width={210}
                height={100}
                rx={6}
                fill="oklch(0.2 0.05 150 / 0.55)"
              />
              <path
                d="M0 572 C 180 542, 340 582, 520 558 S 860 562, 1000 542"
                fill="none"
                stroke="oklch(0.42 0.1 235 / 0.55)"
                strokeWidth={14}
                strokeLinecap="round"
              />
              <rect x={954} y={0} width={14} height={H} fill="oklch(0.24 0.04 262)" />
              <line
                x1={961}
                x2={961}
                y1={0}
                y2={H}
                stroke="oklch(0.6 0.05 255 / 0.5)"
                strokeDasharray="8 8"
              />
              <text x={160} y={42} fontSize={9} fontWeight={700} letterSpacing={1} fill={MUTED}>
                RAILWAY COLONY
              </text>
              <text x={766} y={78} fontSize={9} fontWeight={700} letterSpacing={1} fill={MUTED}>
                TRD DEPOT
              </text>
              <text x={24} y={512} fontSize={9} fontWeight={700} letterSpacing={1} fill={MUTED}>
                S&amp;T WORKSHOP
              </text>
              <text x={600} y={575} fontSize={9} letterSpacing={2} fill="oklch(0.66 0.09 235)">
                CANAL
              </text>

              {/* Buildings */}
              <rect
                x={390}
                y={20}
                width={220}
                height={36}
                rx={4}
                fill="oklch(0.27 0.06 262)"
                stroke="var(--rail-yellow)"
                strokeOpacity={0.7}
              />
              <text
                x={500}
                y={42}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                letterSpacing={1.2}
                fill="var(--foreground)"
              >
                NDG · NANDGAON JUNCTION
              </text>
              <g
                className="cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setSelectedId("BLK-101")}
              >
                <rect
                  x={690}
                  y={20}
                  width={110}
                  height={36}
                  rx={4}
                  fill="oklch(0.27 0.06 262)"
                  stroke="var(--primary)"
                />
                <text
                  x={745}
                  y={36}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight={700}
                  fill="var(--foreground)"
                >
                  CONTROL ROOM
                </text>
                <text x={745} y={49} textAnchor="middle" fontSize={8.5} fill={MUTED}>
                  TMS · TDMS · SMMS · COA
                </text>
              </g>
              <rect
                x={60}
                y={20}
                width={90}
                height={30}
                rx={4}
                fill="oklch(0.27 0.06 262)"
                stroke={MUTED}
                strokeOpacity={0.6}
              />
              <text
                x={105}
                y={39}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={700}
                fill="var(--foreground)"
              >
                SS-01 TSS
              </text>
              <rect
                x={850}
                y={20}
                width={90}
                height={30}
                rx={4}
                fill="oklch(0.27 0.06 262)"
                stroke={MUTED}
                strokeOpacity={0.6}
              />
              <text
                x={895}
                y={39}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={700}
                fill="var(--foreground)"
              >
                SS-02 TSS
              </text>
              <line
                x1={500}
                x2={500}
                y1={58}
                y2={376}
                stroke={MUTED}
                strokeOpacity={0.5}
                strokeDasharray="5 4"
                strokeWidth={5}
              />
              <text x={508} y={392} fontSize={9} fill={MUTED}>
                FOB
              </text>

              {/* Platforms */}
              {PLATFORM_Y.map((y, i) => (
                <g key={y}>
                  <rect
                    x={330}
                    y={y + 7}
                    width={350}
                    height={13}
                    rx={2}
                    fill="oklch(0.33 0.05 262)"
                    stroke={MUTED}
                    strokeOpacity={0.45}
                  />
                  <rect
                    x={296}
                    y={y - 9}
                    width={26}
                    height={18}
                    rx={3}
                    fill="oklch(0.27 0.06 262)"
                    stroke="var(--primary)"
                  />
                  <text
                    x={309}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={800}
                    fill="var(--foreground)"
                  >{`P${i + 1}`}</text>
                </g>
              ))}

              {/* Tracks */}
              <g
                fill="none"
                stroke={MUTED}
                strokeOpacity={0.62}
                strokeWidth={3}
                strokeLinecap="round"
              >
                <line x1={14} x2={946} y1={ROW.up} y2={ROW.up} />
                <line x1={14} x2={946} y1={ROW.dn} y2={ROW.dn} />
                <line x1={250} x2={750} y1={ROW.loop1} y2={ROW.loop1} />
                <line x1={250} x2={750} y1={ROW.loop2} y2={ROW.loop2} />
                {PLATFORM_Y.map((y) => (
                  <line key={y} x1={193} x2={807} y1={y} y2={y} />
                ))}
                <line x1={804} x2={950} y1={ROW.y1} y2={ROW.y1} />
                <line x1={836} x2={950} y1={ROW.y2} y2={ROW.y2} />
                {[ROW.p1, ROW.p2, ROW.p3].map((y) => (
                  <g key={y}>
                    <path d={ladder(ROW.up, y, "L")} />
                    <path d={ladder(ROW.up, y, "R")} />
                  </g>
                ))}
                {[ROW.p4, ROW.p5, ROW.p6].map((y) => (
                  <g key={y}>
                    <path d={ladder(ROW.dn, y, "L")} />
                    <path d={ladder(ROW.dn, y, "R")} />
                  </g>
                ))}
                <path d={`M206 ${ROW.up} L250 ${ROW.loop1}`} />
                <path d={`M750 ${ROW.loop1} L794 ${ROW.up}`} />
                <path d={`M206 ${ROW.dn} L250 ${ROW.loop2}`} />
                <path d={`M750 ${ROW.loop2} L794 ${ROW.dn}`} />
                <path d={`M760 ${ROW.loop2} L804 ${ROW.y1}`} />
                <path d={`M804 ${ROW.y1} L836 ${ROW.y2}`} />
              </g>
              <g stroke={MUTED} strokeOpacity={0.28} strokeWidth={8} strokeDasharray="1.5 9">
                <line x1={14} x2={946} y1={ROW.up} y2={ROW.up} />
                <line x1={14} x2={946} y1={ROW.dn} y2={ROW.dn} />
                {PLATFORM_Y.map((y) => (
                  <line key={y} x1={193} x2={807} y1={y} y2={y} />
                ))}
              </g>
              <text x={20} y={ROW.up - 8} fontSize={9} fontWeight={700} fill={MUTED}>
                UP MAIN
              </text>
              <text x={20} y={ROW.dn - 8} fontSize={9} fontWeight={700} fill={MUTED}>
                DN MAIN
              </text>
              <text x={256} y={ROW.loop1 + 20} fontSize={9} fontWeight={700} fill={MUTED}>
                LOOP 1
              </text>
              <text x={256} y={ROW.loop2 + 16} fontSize={9} fontWeight={700} fill={MUTED}>
                LOOP 2
              </text>
              <text x={810} y={ROW.y1 - 7} fontSize={9} fontWeight={700} fill={MUTED}>
                YARD 1
              </text>
              <text x={842} y={ROW.y2 - 7} fontSize={9} fontWeight={700} fill={MUTED}>
                YARD 2
              </text>
              <path d={`M140 ${ROW.up - 5} l5 5 l-5 5 l-5 -5 z`} fill="var(--primary)" />
              <text x={150} y={ROW.up + 22} fontSize={8.5} fill={MUTED}>
                PT-12A
              </text>

              {/* Track occupancy: occupied = red, blocked = hatched */}
              {layers.occupancy &&
                OCCUPIED.map((o) => (
                  <line
                    key={o.id}
                    className="cursor-pointer"
                    x1={o.x1}
                    x2={o.x2}
                    y1={o.y}
                    y2={o.y}
                    stroke={o.blocked ? "url(#ym-blocked)" : "var(--st-critical)"}
                    strokeWidth={o.blocked ? 8 : 4}
                    strokeLinecap="round"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={pick(o.id)}
                  />
                ))}

              {/* Maintenance block */}
              {layers.block && (
                <g
                  className="cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={pick("BLK-101")}
                >
                  <rect
                    x={420}
                    y={ROW.loop1 - 13}
                    width={140}
                    height={26}
                    rx={4}
                    fill="url(#ym-hatch)"
                    stroke="var(--st-block)"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={490}
                    y={ROW.loop1 + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={800}
                    fill="var(--st-block)" stroke="var(--background)" strokeWidth={3} paintOrder="stroke"
                  >
                    BLK-101
                  </text>
                </g>
              )}

              {/* OHE masts + traction */}
              {layers.traction && (
                <g>
                  {Array.from({ length: 11 }, (_, i) => 60 + i * 80).map((x) => (
                    <g key={x}>
                      <circle cx={x} cy={ROW.up - 16} r={2} fill={MUTED} fillOpacity={0.7} />
                      <circle cx={x} cy={ROW.dn + 16} r={2} fill={MUTED} fillOpacity={0.7} />
                    </g>
                  ))}
                  {assets
                    .filter((a) => a.kind === "Traction")
                    .map((a) => (
                      <g
                        key={a.id}
                        className="cursor-pointer"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={pick(a.id)}
                      >
                        <rect
                          x={a.x - 6}
                          y={a.y - 6}
                          width={12}
                          height={12}
                          rx={2}
                          fill="var(--background)"
                          stroke={a.severity ? SEVERITY_COLOR[a.severity] : "var(--primary)"}
                          strokeWidth={2}
                        />
                        <path
                          d={`M${a.x + 1} ${a.y - 4} L${a.x - 3} ${a.y + 1} H${a.x} L${a.x - 1} ${a.y + 4} L${a.x + 3} ${a.y - 1} H${a.x}Z`}
                          fill="var(--rail-yellow)"
                        />
                        <text x={a.x + 10} y={a.y + 3} fontSize={9} fill={MUTED}>
                          {a.id}
                        </text>
                      </g>
                    ))}
                </g>
              )}

              {/* Signals */}
              {layers.signals &&
                signals.map((s, i) => {
                  const pos = SIGNAL_POS[i] ?? [500, 300];
                  return (
                    <g
                      key={s.id}
                      className="cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={pick(s.id)}
                    >
                      <line
                        x1={pos[0]}
                        x2={pos[0] + 12}
                        y1={pos[1]}
                        y2={pos[1]}
                        stroke={MUTED}
                        strokeWidth={2}
                      />
                      <circle
                        cx={pos[0]}
                        cy={pos[1]}
                        r={6}
                        fill={ASPECT_COLOR[s.status]}
                        stroke="var(--background)"
                        strokeWidth={1.5}
                      />
                      <text
                        x={pos[0] + 15}
                        y={pos[1] + 3}
                        fontSize={9}
                        fontWeight={700}
                        fill={MUTED}
                      >
                        {s.id}
                      </text>
                    </g>
                  );
                })}

              {/* Trains on platform roads */}
              {layers.trains &&
                platforms.map((p, i) => {
                  if (p.status !== "Occupied") return null;
                  const y = PLATFORM_Y[i] ?? ROW.p1;
                  const id = p.train.split(" ")[0] ?? p.train;
                  const x = 400 + ((i * 53) % 150);
                  const color = trainColor(p.delay);
                  return (
                    <g
                      key={p.id}
                      className="cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={pick(p.id)}
                    >
                      <rect
                        x={x}
                        y={y - 8}
                        width={74}
                        height={16}
                        rx={4}
                        fill={color}
                        stroke="var(--background)"
                      />
                      <path d={`M${x + 74} ${y - 5} l7 5 l-7 5 z`} fill={color} />
                      <text
                        x={x + 37}
                        y={y + 3.5}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill={INK}
                      >
                        {id}
                      </text>
                    </g>
                  );
                })}

              {/* Alert markers */}
              {layers.alerts &&
                alerts.map((a) => {
                  const color = SEVERITY_COLOR[a.severity ?? "Low"];
                  const isSel = a.id === selectedId;
                  return (
                    <g
                      key={a.id}
                      className="cursor-pointer"
                      transform={`translate(${a.x} ${a.y - 20})`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={pick(a.id)}
                    >
                      {a.severity === "Critical" && (
                        <circle r={8} fill="none" stroke={color} strokeWidth={1.5}>
                          <animate
                            attributeName="r"
                            values="8;18"
                            dur="1.8s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.8;0"
                            dur="1.8s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                      <path
                        d="M0 -10 L10 8 L-10 8 Z"
                        fill={color}
                        stroke={isSel ? "var(--foreground)" : "var(--background)"}
                        strokeWidth={isSel ? 2 : 1.5}
                        strokeLinejoin="round"
                      />
                      <text y={6} textAnchor="middle" fontSize={10} fontWeight={800} fill={INK}>
                        !
                      </text>
                    </g>
                  );
                })}

              {selected && (
                <circle
                  cx={selected.x}
                  cy={selected.y}
                  r={13}
                  fill="none"
                  stroke="var(--rail-yellow)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              )}
            </g>

            {/* Fixed map furniture */}
            <g transform="translate(40 452)">
              <circle r={16} fill="oklch(0.2 0.05 262)" stroke="var(--border)" />
              <path d="M0 -11 L5 4 L0 1 L-5 4 Z" fill="var(--rail-yellow)" />
              <text
                y={-20}
                textAnchor="middle"
                fontSize={9}
                fontWeight={800}
                fill="var(--foreground)"
              >
                N
              </text>
            </g>
            <g transform="translate(70 566)">
              <line x2={100} stroke="var(--foreground)" strokeWidth={2} />
              <line y1={-4} y2={4} stroke="var(--foreground)" strokeWidth={2} />
              <line x1={100} x2={100} y1={-4} y2={4} stroke="var(--foreground)" strokeWidth={2} />
              <text x={50} y={-7} textAnchor="middle" fontSize={9} fill={MUTED}>
                200 m (schematic)
              </text>
            </g>
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <Legend>
            <span className="size-2.5 rounded-full bg-st-ontime" /> Green / on time
          </Legend>
          <Legend>
            <span className="size-2.5 rounded-full bg-st-delayed" /> Restricted / delayed
          </Legend>
          <Legend>
            <span className="size-2.5 rounded-full bg-st-critical" /> Danger / critical
          </Legend>
          <Legend>
            <span className="h-1 w-4 rounded bg-st-critical" /> Occupied track
          </Legend>
          <Legend>
            <span className="size-2.5 rounded-sm border border-dashed border-st-block bg-st-block/30" />{" "}
            Maintenance block
          </Legend>
          <span className="ml-auto">Drag to pan · +/− to zoom</span>
        </div>
      </Panel>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
        <Panel title="Asset / alert details">
          {selected ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{selected.kind} ID</p>
                <p className="font-mono text-lg font-bold text-primary">{selected.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold">{selected.kind}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Severity</p>
                  {selected.severity ? (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: SEVERITY_COLOR[selected.severity], color: INK }}
                    >
                      {selected.severity}
                    </span>
                  ) : (
                    <p className="font-semibold text-st-ontime">Normal</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold">{selected.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold">{selected.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="font-medium text-foreground">{selected.description}</p>
              </div>
              <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
                Simulated station-level telemetry for NDG — not live railway data.
              </p>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No asset selected</div>
          )}
        </Panel>

        <Panel title={`Active alerts (${alerts.length})`}>
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {alerts.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors hover:bg-secondary ${
                    a.id === selectedId
                      ? "border-rail-yellow/60 bg-secondary/60"
                      : "border-border/70"
                  }`}
                >
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ background: SEVERITY_COLOR[a.severity ?? "Low"] }}
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold">
                      {a.id} <span className="font-normal text-muted-foreground">· {a.kind}</span>
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {a.description}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
