export type Health = "Healthy" | "Warning" | "Critical";
export type IncidentStatus = "Open" | "Acknowledged" | "In Progress" | "Resolved";

export interface PlatformRecord {
  id: string;
  status: "Occupied" | "Free";
  train: string;
  delay: number;
  eta: string;
}

export interface TrackRecord {
  id: string;
  occupancy: "Occupied" | "Free" | "Blocked";
  trains: number;
  condition: Health;
}

export interface SignalRecord {
  id: string;
  status: "Green" | "Yellow" | "Red";
  updated: string;
  alert: string;
}

export interface TractionRecord {
  id: string;
  voltage: number;
  feeder: "Online" | "Tripped" | "Maintenance";
  substation: string;
  health: Health;
}

export interface StationIncident {
  id: string;
  timestamp: string;
  asset: string;
  location: string;
  department: "TMS" | "TDMS" | "SMMS" | "COA";
  severity: "Critical" | "High" | "Medium" | "Low";
  status: IncidentStatus;
  affectedTrains: string[];
  title: string;
}

export const platforms: PlatformRecord[] = [
  { id: "P1", status: "Occupied", train: "12951 Rajdhani Link", delay: 4, eta: "08:42" },
  { id: "P2", status: "Occupied", train: "12615 Grand Trunk Exp", delay: 18, eta: "08:55" },
  { id: "P3", status: "Free", train: "-", delay: 0, eta: "09:10" },
  { id: "P4", status: "Occupied", train: "64011 Suburban EMU-11", delay: 0, eta: "09:18" },
  { id: "P5", status: "Free", train: "-", delay: 0, eta: "09:32" },
  { id: "P6", status: "Occupied", train: "FR-201 Coal Rake", delay: 7, eta: "10:05" },
];

export const tracks: TrackRecord[] = [
  { id: "UP-MAIN", occupancy: "Occupied", trains: 2, condition: "Healthy" },
  { id: "DN-MAIN", occupancy: "Occupied", trains: 1, condition: "Warning" },
  { id: "LOOP-1", occupancy: "Free", trains: 0, condition: "Healthy" },
  { id: "LOOP-2", occupancy: "Blocked", trains: 0, condition: "Critical" },
  { id: "YARD-1", occupancy: "Occupied", trains: 3, condition: "Healthy" },
  { id: "YARD-2", occupancy: "Free", trains: 0, condition: "Healthy" },
];

export const signals: SignalRecord[] = Array.from({ length: 12 }, (_, index) => ({
  id: `S${index + 1}`,
  status: index === 3 ? "Red" : index === 7 ? "Yellow" : "Green",
  updated: `${2 + (index % 4)} sec ago`,
  alert: index === 3 ? "Lamp failure detected" : index === 7 ? "Aspect restricted" : "No alerts",
}));

export const traction: TractionRecord[] = [
  { id: "OHE-01", voltage: 25.1, feeder: "Online", substation: "SS-01 NDG", health: "Healthy" },
  { id: "OHE-02", voltage: 24.6, feeder: "Online", substation: "SS-01 NDG", health: "Warning" },
  { id: "FEED-03", voltage: 0, feeder: "Tripped", substation: "SS-02 KRP", health: "Critical" },
  {
    id: "OHE-04",
    voltage: 25.3,
    feeder: "Maintenance",
    substation: "SS-02 KRP",
    health: "Warning",
  },
  { id: "OHE-05", voltage: 25.0, feeder: "Online", substation: "SS-03 STP", health: "Healthy" },
];

const titles = [
  "Rail fracture inspection required",
  "Track geometry deviation",
  "Waterlogging near turnout",
  "Signal lamp failure",
  "Point machine failure",
  "OHE contact wire fault",
  "Feeder trip detected",
  "Transformer overheating",
  "Train delay threshold exceeded",
  "Platform congestion",
  "Crew availability issue",
  "Axle counter mismatch",
];
const assets = [
  "UP-MAIN",
  "S3",
  "P2",
  "S4",
  "PT-12A",
  "OHE-02",
  "FEED-03",
  "SS-02",
  "12951",
  "P4",
  "COA-07",
  "AC-04",
];
const locations = [
  "NDG KM 104/7",
  "NDG East Yard",
  "Platform 2",
  "North Cabin",
  "Points 12A",
  "OHE Mast 44/8",
  "SS-02 KRP",
  "SS-01 NDG",
  "NDG Station",
  "Platform 4",
  "Control Room",
  "Loop Line 1",
];
const departments: StationIncident["department"][] = ["TMS", "TDMS", "SMMS", "COA"];
const severities: StationIncident["severity"][] = ["Critical", "High", "Medium", "Low"];

export function generateStationIncidents(count = 56): StationIncident[] {
  return Array.from({ length: count }, (_, index) => {
    const severity = severities[index % severities.length];
    const status: IncidentStatus =
      index % 9 === 0
        ? "Resolved"
        : index % 5 === 0
          ? "In Progress"
          : index % 3 === 0
            ? "Acknowledged"
            : "Open";
    return {
      id: `INC-2026-${String(124 + index).padStart(5, "0")}`,
      timestamp: new Date(Date.now() - index * 7 * 60_000).toISOString(),
      asset: assets[index % assets.length] ?? "UP-MAIN",
      location: locations[index % locations.length] ?? "NDG Station",
      department: departments[index % departments.length] ?? "TMS",
      severity,
      status,
      affectedTrains: index % 4 === 0 ? ["12951", "12615"] : index % 3 === 0 ? ["64011"] : [],
      title: titles[index % titles.length] ?? "Operational event",
    };
  });
}

export const departmentHealth = [
  { name: "TMS", health: 98, status: "Online", color: "bg-blue-500" },
  { name: "TDMS", health: 94, status: "Degraded", color: "bg-amber-500" },
  { name: "SMMS", health: 97, status: "Online", color: "bg-emerald-500" },
  { name: "COA", health: 99, status: "Online", color: "bg-cyan-500" },
];
