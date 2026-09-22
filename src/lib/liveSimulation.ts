import { useEffect, useRef, useState } from "react";

export type LiveTrain = {
  number: string;
  name: string;
  category: "Vande Bharat" | "Express" | "Freight";
  origin: string;
  destination: string;
  section: string;
  position_km: number;
  speed_kmph: number;
  delay_minutes: number;
  delay_prediction_minutes: number;
  traction_status: "Healthy" | "Attention";
  status: "Running" | "At station";
};
export type LiveSignal = {
  id: string;
  location: string;
  status: "Green" | "Yellow" | "Red";
  alert: string;
};
export type LiveTrack = {
  id: string;
  section: string;
  occupancy: "Occupied" | "Free" | "Blocked";
  trains: number;
  health: number;
  condition: "Healthy" | "Warning" | "Critical";
};
export type LiveMaintenance = {
  id: string;
  section: string;
  location: string;
  activity: string;
  department: string;
  status: string;
  progress: number;
  window_minutes_remaining: number;
};
export type LiveKpi = {
  track_health: number;
  signal_health: number;
  operations_efficiency: number;
  delayed_trains: number;
  active_blocks: number;
  running_trains: number;
  updated_at: string;
};
export type LiveSnapshot = {
  updated_at: string;
  tick: number;
  trains: LiveTrain[];
  signals: LiveSignal[];
  tracks: LiveTrack[];
  maintenance: LiveMaintenance[];
  kpi: LiveKpi;
};

const services = [
  ["22439", "Vande Bharat Express", "Vande Bharat"],
  ["12951", "Mumbai Rajdhani", "Express"],
  ["12615", "Grand Trunk Express", "Express"],
  ["12841", "Coromandel Express", "Express"],
  ["FR-201", "Central Coal Rake", "Freight"],
  ["FR-318", "Container Rake", "Freight"],
] as const;

function localSnapshot(tick: number): LiveSnapshot {
  const trains: LiveTrain[] = services.map(([number, name, category], index) => {
    const position = (tick * (7 + index) + index * 31) % 160;
    const delay = Math.max(0, Math.round(5 + 7 * Math.sin(tick / 3 + index) + (index % 3) * 2));
    return {
      number,
      name,
      category,
      origin: "NDG",
      destination: "MRG",
      section: `S${Math.floor(position / 40) + 1}`,
      position_km: position,
      speed_kmph: position % 40 < 4 ? 0 : 82 - index * 3,
      delay_minutes: delay,
      delay_prediction_minutes: Math.max(0, delay + ((tick + index) % 5) - 2),
      traction_status: (tick + index) % 11 ? "Healthy" : "Attention",
      status: position % 40 < 4 ? "At station" : "Running",
    };
  });
  const tracks: LiveTrack[] = Array.from({ length: 8 }, (_, index) => {
    const health = Math.max(78, 97 - ((tick + index * 3) % 12));
    return {
      id:
        ["UP-MAIN", "DN-MAIN", "LOOP-1", "LOOP-2", "YARD-1", "YARD-2", "S3-MAIN", "S4-MAIN"][
          index
        ] ?? "UP-MAIN",
      section: `S${(index % 4) + 1}`,
      occupancy:
        index === tick % 8 && tick % 4 === 0
          ? "Blocked"
          : (index + tick) % 3 === 0
            ? "Occupied"
            : "Free",
      trains: (index + tick) % 4,
      health,
      condition: health < 85 ? "Critical" : health < 93 ? "Warning" : "Healthy",
    };
  });
  const signals: LiveSignal[] = Array.from({ length: 12 }, (_, index) => ({
    id: `S${index + 1}`,
    location: "NDG North Cabin",
    status: (index + tick) % 17 === 0 ? "Red" : (index + tick) % 9 === 0 ? "Yellow" : "Green",
    alert: (index + tick) % 17 === 0 ? "Lamp or relay attention" : "No alerts",
  }));
  const maintenance: LiveMaintenance[] = Array.from({ length: 2 + (tick % 3) }, (_, index) => ({
    id: `BLK-${101 + index}`,
    section: `S${index + 1}`,
    location: "NDG-KRP",
    activity:
      ["Track tamping", "OHE inspection", "Signal relay testing", "Bridge inspection"][index] ??
      "Inspection",
    department: index % 2 ? "TRD" : "Engineering",
    status: "Active",
    progress: (tick * 9 + index * 17) % 100,
    window_minutes_remaining: 35 + (((tick + index) * 7) % 90),
  }));
  return {
    updated_at: new Date().toISOString(),
    tick,
    trains,
    signals,
    tracks,
    maintenance,
    kpi: {
      track_health: Math.round(
        (tracks.filter((track) => track.health >= 90).length / tracks.length) * 100,
      ),
      signal_health: Math.round(
        (signals.filter((signal) => signal.status !== "Red").length / signals.length) * 100,
      ),
      operations_efficiency: Math.round(
        (trains.filter((train) => train.delay_minutes <= 10).length / trains.length) * 100,
      ),
      delayed_trains: trains.filter((train) => train.delay_minutes > 10).length,
      active_blocks: maintenance.length,
      running_trains: trains.filter((train) => train.status === "Running").length,
      updated_at: new Date().toISOString(),
    },
  };
}

const apiBase = import.meta.env.VITE_API_URL ?? "";
const apiRoot = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

export function useLiveSimulation() {
  const [snapshot, setSnapshot] = useState<LiveSnapshot>(() => localSnapshot(1));
  const tick = useRef(1);
  useEffect(() => {
    let active = true;
    const updateFromApi = async () => {
      try {
        const [trains, signals, tracks, maintenance, kpi] = await Promise.all(
          ["trains", "signals", "tracks", "maintenance", "kpi"].map((endpoint) =>
            fetch(`${apiRoot}/${endpoint}`).then((response) => response.json()),
          ),
        );
        if (active)
          setSnapshot({
            updated_at: kpi.updated_at,
            tick: tick.current++,
            trains,
            signals,
            tracks,
            maintenance,
            kpi,
          });
      } catch {
        if (active) setSnapshot(localSnapshot(++tick.current));
      }
    };
    void updateFromApi();
    const interval = window.setInterval(() => void updateFromApi(), 5000);
    const websocketUrl = apiBase
      ? `${apiRoot.replace(/^http/, "ws")}/ws`
      : `ws://${window.location.host}/api/ws`;
    const socket = new WebSocket(websocketUrl);
    socket.onmessage = (event) => {
      if (active) setSnapshot(JSON.parse(event.data) as LiveSnapshot);
    };
    return () => {
      active = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, []);
  return snapshot;
}
