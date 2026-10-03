import { useEffect, useMemo, useState } from "react";
import type { LiveSnapshot } from "@/lib/liveSimulation";

/**
 * Manmad → Hazur Sahib Nanded corridor model used by the Command Center "Live corridor".
 *
 * - Station kilometres follow published timetable distances (Manmad Jn = 0 km).
 * - Train movement, track blocks and incident markers are a SIMULATED demo layer,
 *   not live Indian Railways data.
 * - Delay, traction and maintenance attributes are read from the existing
 *   useLiveSimulation() snapshot (API/WebSocket when connected, local simulation otherwise).
 */

export const CORRIDOR_LENGTH_KM = 350;
export const TICK_MS = 1500;
/** kmph / SIM_SPEED_DIVISOR = km advanced per tick (time-compressed demo). */
const SIM_SPEED_DIVISOR = 45;

export interface CorridorStation {
  name: string;
  label: string;
  code?: string;
  km: number;
  major: boolean;
}

function major(label: string, name: string, code: string, km: number): CorridorStation {
  return { name, label, code, km, major: true };
}

function minor(name: string, km: number, code?: string): CorridorStation {
  const label = name.toUpperCase();
  return code ? { name, label, code, km, major: false } : { name, label, km, major: false };
}

export const CORRIDOR_STATIONS: CorridorStation[] = [
  major("MANMAD JN", "Manmad Jn", "MMR", 0),
  minor("Ankai", 15, "ANK"),
  major("NAGARSOL", "Nagarsol", "NSL", 24),
  minor("Tarur", 38, "TR"),
  major("ROTEGAON", "Rotegaon", "RGO", 52),
  minor("Parsoda", 65, "PSD"),
  minor("Karanjgaon", 70, "KAJG"),
  major("LASUR", "Lasur", "LSR", 80),
  minor("Potul", 91, "POZ"),
  minor("Daulatabad", 101, "DLB"),
  major("CHH. SAMBHAJINAGAR", "Chh. Sambhajinagar", "CPSN", 113),
  minor("Mukundwadi", 119, "MKDD"),
  minor("Chikalthan", 123, "CTH"),
  minor("Karmad", 137),
  minor("Badnapur", 157, "BDU"),
  major("JALNA", "Jalna", "J", 176),
  minor("Ranjani", 207),
  minor("Paradgaon", 213),
  major("PARTUR", "Partur", "PTU", 221),
  minor("Usmanpur", 229),
  minor("Satuna", 238),
  major("SELU", "Selu", "SELU", 249),
  minor("Dhengli Pimpalgaon", 257),
  major("MANWATH ROAD", "Manwath Road", "MVO", 263),
  minor("Devalgaon", 272),
  minor("Pergaon", 278),
  major("PARBHANI JN", "Parbhani Jn", "PBN", 290),
  minor("Pingli", 300),
  minor("Mirkhal", 306),
  major("PURNA JN", "Purna Jn", "PAU", 319),
  minor("Chudawa", 328),
  minor("Limbgaon", 338),
  minor("Wanegaon", 343),
  major("HAZUR SAHIB NANDED", "Hazur Sahib Nanded", "NED", 350),
];

export const MAJOR_STATIONS = CORRIDOR_STATIONS.filter((s) => s.major);

/** UP = Manmad → Nanded, DN = Nanded → Manmad. */
export type TrainDir = "UP" | "DN";
export type TrainState = "ontime" | "delayed" | "critical" | "held";
export type TrainCategory = "Vande Bharat" | "Express" | "Passenger" | "Freight";
export type IncidentSeverity = "critical" | "high" | "medium";

export const STATE_META: Record<TrainState, { label: string; color: string }> = {
  ontime: { label: "On time", color: "var(--st-ontime)" },
  delayed: { label: "Delayed", color: "var(--st-delayed)" },
  critical: { label: "Critical", color: "var(--st-critical)" },
  held: { label: "Held", color: "var(--st-held)" },
};

export const INCIDENT_COLOR: Record<IncidentSeverity, string> = {
  critical: "var(--st-critical)",
  high: "var(--st-held)",
  medium: "var(--st-delayed)",
};

export interface CorridorTrain {
  id: string;
  name: string;
  category: TrainCategory;
  dir: TrainDir;
  km: number;
  speedKmph: number;
  delay: number;
  predictedDelay: number;
  traction: "Healthy" | "Attention";
  state: TrainState;
  /** true when delay/traction come from the existing live feed (vs. pure simulation). */
  liveFed: boolean;
  heldFor: string | null;
}

export interface CorridorBlock {
  id: string;
  place: string;
  fromKm: number;
  toKm: number;
  activity: string;
  department: string;
  progress: number;
  remainingMin: number;
}

export interface CorridorIncident {
  id: string;
  km: number;
  kind: "OHE" | "Delay" | "Platform";
  severity: IncidentSeverity;
  title: string;
  detail: string;
  source: string;
  impactMin: number;
  radiusKm: number;
}

export interface CorridorMetrics {
  trains: number;
  delays: number;
  incidents: number;
  criticalIncidents: number;
  blocks: number;
  blockProgress: number;
}

export interface CorridorSnapshot {
  tick: number;
  trains: CorridorTrain[];
  blocks: CorridorBlock[];
  incidents: CorridorIncident[];
  metrics: CorridorMetrics;
}

interface FleetEntry {
  id: string;
  name: string;
  category: TrainCategory;
  kmph: number;
  /** Start offset along the ping-pong path (0..700). */
  start: number;
}

/** Demo services that plausibly use the corridor. Simulated positions only. */
const FLEET: FleetEntry[] = [
  { id: "17687", name: "Marathwada Express", category: "Express", kmph: 72, start: 30 },
  { id: "17617", name: "Tapovan Express", category: "Express", kmph: 84, start: 150 },
  { id: "12715", name: "Sachkhand Express", category: "Express", kmph: 90, start: 540 },
  { id: "57541", name: "Nagarsol–Nanded Passenger", category: "Passenger", kmph: 48, start: 215 },
  {
    id: "20705",
    name: "Jalna–Mumbai Vande Bharat",
    category: "Vande Bharat",
    kmph: 105,
    start: 630,
  },
  { id: "FR-201", name: "Coal Rake", category: "Freight", kmph: 45, start: 90 },
  { id: "17057", name: "Devagiri Express", category: "Express", kmph: 80, start: 340 },
  { id: "17688", name: "Marathwada Express", category: "Express", kmph: 76, start: 470 },
  { id: "FR-318", name: "Container Rake", category: "Freight", kmph: 52, start: 280 },
];

/** Where active maintenance blocks from the live feed are drawn on the corridor. */
const BLOCK_SLOTS = [
  { id: "BLK-JLN", place: "Jalna", fromKm: 166, toKm: 177 },
  { id: "BLK-PTU", place: "Partur", fromKm: 214, toKm: 225 },
  { id: "BLK-LSR", place: "Lasur–Potul", fromKm: 82, toKm: 91 },
  { id: "BLK-SEL", place: "Selu", fromKm: 243, toKm: 252 },
] as const;

export const CORRIDOR_INCIDENTS: CorridorIncident[] = [
  {
    id: "INC-OHE-PBN",
    km: 292,
    kind: "OHE",
    severity: "critical",
    title: "OHE issue near Parbhani Jn",
    detail: "Overhead equipment fault reported — traction supply under review.",
    source: "TDMS",
    impactMin: 16,
    radiusKm: 14,
  },
  {
    id: "INC-CAS-PAU",
    km: 319,
    kind: "Delay",
    severity: "high",
    title: "Cascading delay near Purna Jn",
    detail: "Following services are bunching behind a regulated train.",
    source: "TMS",
    impactMin: 10,
    radiusKm: 12,
  },
  {
    id: "INC-PF-NED",
    km: 349,
    kind: "Platform",
    severity: "medium",
    title: "Platform congestion near Nanded",
    detail: "Platforms occupied — arrivals may wait at the outer signal.",
    source: "COA",
    impactMin: 6,
    radiusKm: 8,
  },
];

function pingPong(p: number): { km: number; dir: TrainDir } {
  const span = CORRIDOR_LENGTH_KM * 2;
  const m = ((p % span) + span) % span;
  return m <= CORRIDOR_LENGTH_KM ? { km: m, dir: "UP" } : { km: span - m, dir: "DN" };
}

export function describePosition(km: number): string {
  let prev: CorridorStation | undefined;
  for (const st of CORRIDOR_STATIONS) {
    if (Math.abs(st.km - km) <= 1.5) return `At ${st.name}`;
    if (st.km > km) return prev ? `Between ${prev.name} and ${st.name}` : `Approaching ${st.name}`;
    prev = st;
  }
  return prev ? `Beyond ${prev.name}` : "—";
}

export function nextMajorStation(km: number, dir: TrainDir): CorridorStation | undefined {
  if (dir === "UP") return MAJOR_STATIONS.find((s) => s.km > km + 0.5);
  for (let i = MAJOR_STATIONS.length - 1; i >= 0; i--) {
    const s = MAJOR_STATIONS[i];
    if (s && s.km < km - 0.5) return s;
  }
  return undefined;
}

export function etaToNextMajor(
  t: CorridorTrain,
): { station: CorridorStation; minutes: number } | null {
  const station = nextMajorStation(t.km, t.dir);
  if (!station || t.speedKmph <= 0) return null;
  return {
    station,
    minutes: Math.max(1, Math.round((Math.abs(station.km - t.km) / t.speedKmph) * 60)),
  };
}

export function buildSnapshot(tick: number, live: LiveSnapshot): CorridorSnapshot {
  const blocks: CorridorBlock[] = [];
  live.maintenance.slice(0, BLOCK_SLOTS.length).forEach((m, i) => {
    const slot = BLOCK_SLOTS[i];
    if (!slot) return;
    blocks.push({
      id: slot.id,
      place: slot.place,
      fromKm: slot.fromKm,
      toKm: slot.toKm,
      activity: m.activity,
      department: m.department,
      progress: m.progress,
      remainingMin: m.window_minutes_remaining,
    });
  });

  const trains = FLEET.map((f, i): CorridorTrain => {
    const { km, dir } = pingPong(f.start + (tick * f.kmph) / SIM_SPEED_DIVISOR);
    // The first six corridor services take delay/traction from the existing live feed.
    const src = i < 6 ? live.trains[i] : undefined;
    const baseDelay = src
      ? src.delay_minutes
      : Math.max(0, Math.round(4 + 9 * Math.sin(tick / 9 + i)));
    const basePredicted = src
      ? src.delay_prediction_minutes
      : Math.max(0, baseDelay + (Math.abs(tick + i) % 5) - 2);
    const bump = CORRIDOR_INCIDENTS.reduce(
      (sum, inc) => (Math.abs(inc.km - km) <= inc.radiusKm ? sum + inc.impactMin : sum),
      0,
    );
    const block = blocks.find((b) =>
      dir === "UP" ? km >= b.fromKm - 6 && km <= b.toKm : km >= b.fromKm && km <= b.toKm + 6,
    );
    const extra = bump + (block ? 6 : 0);
    const delay = baseDelay + extra;
    const state: TrainState = block
      ? "held"
      : delay > 25
        ? "critical"
        : delay > 10
          ? "delayed"
          : "ontime";
    return {
      id: f.id,
      name: f.name,
      category: f.category,
      dir,
      km,
      speedKmph: block ? 25 : f.kmph,
      delay,
      predictedDelay: Math.max(0, basePredicted + extra),
      traction: src ? src.traction_status : "Healthy",
      state,
      liveFed: Boolean(src),
      heldFor: block ? block.place : null,
    };
  });

  const incidents = CORRIDOR_INCIDENTS;
  return {
    tick,
    trains,
    blocks,
    incidents,
    metrics: {
      trains: trains.length,
      delays: trains.filter((t) => t.delay > 10).length,
      incidents: incidents.length,
      criticalIncidents: incidents.filter((inc) => inc.severity === "critical").length,
      blocks: blocks.length,
      blockProgress: blocks.length
        ? Math.round(blocks.reduce((s, b) => s + b.progress, 0) / blocks.length)
        : 0,
    },
  };
}

export type AlertSeverity = "critical" | "warning" | "info";

export interface CorridorAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  source: string;
  ageMin: number;
}

/** Alerts derived from the corridor state (incidents, blocks, critical/held trains). */
export function buildAlerts(snap: CorridorSnapshot): CorridorAlert[] {
  const out: CorridorAlert[] = [];
  snap.incidents.forEach((inc, i) =>
    out.push({
      id: inc.id,
      severity: inc.severity === "critical" ? "critical" : "warning",
      title: inc.title,
      detail: inc.detail,
      source: inc.source,
      ageMin: 2 + i * 3,
    }),
  );
  snap.blocks.forEach((b, i) =>
    out.push({
      id: b.id,
      severity: "info",
      title: `${b.activity} near ${b.place}`,
      detail: `${b.department} block · ${b.progress}% done · ${b.remainingMin} min left`,
      source: "Maintenance",
      ageMin: 9 + i * 4,
    }),
  );
  snap.trains
    .filter((t) => t.state === "critical")
    .forEach((t, i) =>
      out.push({
        id: `${t.id}-critical`,
        severity: "critical",
        title: `Train ${t.id} running +${t.delay} min`,
        detail: `${t.name} · ${describePosition(t.km)}`,
        source: "TMS",
        ageMin: 1 + i,
      }),
    );
  snap.trains
    .filter((t) => t.state === "held")
    .forEach((t, i) =>
      out.push({
        id: `${t.id}-held`,
        severity: "warning",
        title: `Train ${t.id} held for block at ${t.heldFor ?? "section"}`,
        detail: `${t.name} · ${describePosition(t.km)}`,
        source: "COA",
        ageMin: 4 + i,
      }),
    );
  const rank: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.ageMin - b.ageMin);
}

const HISTORY_POINTS = 24;

export function useCorridorFeed(live: LiveSnapshot) {
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const snapshot = useMemo(() => buildSnapshot(tick, live), [tick, live]);
  // The simulation is a pure function of tick, so the sparkline history can be derived.
  const history = useMemo(
    () =>
      Array.from(
        { length: HISTORY_POINTS },
        (_, i) => buildSnapshot(tick - (HISTORY_POINTS - 1) + i, live).metrics,
      ),
    [tick, live],
  );

  return { snapshot, history, playing, setPlaying };
}
