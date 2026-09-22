import type {
  MaintenanceTask,
  MaintenanceWindow,
  ResourceAvailability,
  Section,
  Station,
  Train,
} from "./types";

/** SIMULATED DATA — representative values only, not Indian Railways data. */

export const STATIONS: Station[] = [
  { id: "A", code: "NDG", name: "Nandgaon Jn", order: 0 },
  { id: "B", code: "KRP", name: "Karimpur", order: 1 },
  { id: "C", code: "STP", name: "Sitalpur", order: 2 },
  { id: "D", code: "DVR", name: "Devrai Jn", order: 3 },
  { id: "E", code: "MRG", name: "Mirgaon", order: 4 },
];

export const SECTIONS: Section[] = [
  {
    id: "S1",
    name: "S1 · NDG–KRP",
    sourceStation: "NDG",
    destinationStation: "KRP",
    distanceKm: 38,
    trafficLevel: "High",
    operationalStatus: "Operational",
    maintenanceStatus: "Overdue",
    electrified: true,
  },
  {
    id: "S2",
    name: "S2 · KRP–STP",
    sourceStation: "KRP",
    destinationStation: "STP",
    distanceKm: 52,
    trafficLevel: "Medium",
    operationalStatus: "Operational",
    maintenanceStatus: "Pending",
    electrified: true,
  },
  {
    id: "S3",
    name: "S3 · STP–DVR",
    sourceStation: "STP",
    destinationStation: "DVR",
    distanceKm: 44,
    trafficLevel: "High",
    operationalStatus: "Restricted",
    maintenanceStatus: "Overdue",
    electrified: true,
  },
  {
    id: "S4",
    name: "S4 · DVR–MRG",
    sourceStation: "DVR",
    destinationStation: "MRG",
    distanceKm: 29,
    trafficLevel: "Low",
    operationalStatus: "Operational",
    maintenanceStatus: "Pending",
    electrified: true,
  },
];

export const fmt = (m: number) => {
  const t = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

export const TRAINS: Train[] = [
  { id: "12951", name: "Rajdhani Link", type: "Superfast", section: "S1", arrival: 360, departure: 392, priority: 1 },
  { id: "12615", name: "Grand Trunk Exp", type: "Express", section: "S1", arrival: 425, departure: 459, priority: 2 },
  { id: "56501", name: "Nandgaon Pass", type: "Passenger", section: "S1", arrival: 500, departure: 545, priority: 4 },
  { id: "22691", name: "Deccan Superfast", type: "Superfast", section: "S1", arrival: 620, departure: 650, priority: 1 },
  { id: "64011", name: "Suburban EMU-11", type: "Suburban", section: "S1", arrival: 700, departure: 725, priority: 3 },
  { id: "FR-201", name: "Coal Rake 201", type: "Freight", section: "S1", arrival: 1080, departure: 1140, priority: 5 },
  { id: "12627", name: "Karnataka Exp", type: "Express", section: "S1", arrival: 1230, departure: 1262, priority: 2 },

  { id: "12841", name: "Coromandel Link", type: "Superfast", section: "S2", arrival: 380, departure: 415, priority: 1 },
  { id: "57231", name: "Karimpur Pass", type: "Passenger", section: "S2", arrival: 470, departure: 520, priority: 4 },
  { id: "64022", name: "Suburban EMU-22", type: "Suburban", section: "S2", arrival: 555, departure: 580, priority: 3 },
  { id: "12724", name: "Telangana Exp", type: "Express", section: "S2", arrival: 665, departure: 700, priority: 2 },
  { id: "FR-318", name: "Container Rake 318", type: "Freight", section: "S2", arrival: 900, departure: 975, priority: 5 },
  { id: "12760", name: "Charminar Exp", type: "Express", section: "S2", arrival: 1150, departure: 1185, priority: 2 },
  { id: "FR-402", name: "Steel Rake 402", type: "Freight", section: "S2", arrival: 1290, departure: 1350, priority: 5 },

  { id: "12903", name: "Golden Temple Link", type: "Superfast", section: "S3", arrival: 345, departure: 378, priority: 1 },
  { id: "56712", name: "Sitalpur Pass", type: "Passenger", section: "S3", arrival: 455, departure: 505, priority: 4 },
  { id: "12137", name: "Punjab Mail Link", type: "Express", section: "S3", arrival: 600, departure: 634, priority: 2 },
  { id: "64033", name: "Suburban EMU-33", type: "Suburban", section: "S3", arrival: 720, departure: 748, priority: 3 },
  { id: "FR-555", name: "Cement Rake 555", type: "Freight", section: "S3", arrival: 1020, departure: 1085, priority: 5 },
  { id: "12649", name: "Sampark Kranti", type: "Express", section: "S3", arrival: 1260, departure: 1295, priority: 1 },

  { id: "12483", name: "Mirgaon Intercity", type: "Express", section: "S4", arrival: 410, departure: 440, priority: 2 },
  { id: "54321", name: "Devrai Pass", type: "Passenger", section: "S4", arrival: 640, departure: 685, priority: 4 },
  { id: "FR-611", name: "Fly-Ash Rake 611", type: "Freight", section: "S4", arrival: 1110, departure: 1170, priority: 5 },
  { id: "22119", name: "Mirgaon Superfast", type: "Superfast", section: "S4", arrival: 1305, departure: 1332, priority: 1 },
];

const t = (
  id: string,
  department: MaintenanceTask["department"],
  section: MaintenanceTask["section"],
  assetType: string,
  workType: string,
  duration: number,
  criticality: MaintenanceTask["criticality"],
  urgency: number,
  overdueDays: number,
  requiredResources: string[],
  status: MaintenanceTask["status"] = "Pending",
): MaintenanceTask => ({
  id,
  department,
  section,
  assetType,
  workType,
  duration,
  criticality,
  urgency,
  overdueDays,
  requiredResources,
  status,
});

export const TASKS: MaintenanceTask[] = [
  // Engineering
  t("ENG-101", "Engineering", "S1", "Track", "Rail fracture-prone weld repair", 120, "Critical", 10, 12, ["Track Gang A", "Tamping Machine"]),
  t("ENG-102", "Engineering", "S1", "Track", "Through packing / tamping", 90, "High", 8, 6, ["Tamping Machine"]),
  t("ENG-103", "Engineering", "S1", "Points", "Turnout renewal — Pt 12A", 150, "High", 7, 3, ["Track Gang B", "Crane"]),
  t("ENG-104", "Engineering", "S2", "Bridge", "Girder bearing inspection", 60, "Medium", 5, 0, ["Bridge Unit"]),
  t("ENG-105", "Engineering", "S2", "Track", "Deep screening of ballast", 180, "High", 8, 9, ["Track Gang A", "BCM"]),
  t("ENG-106", "Engineering", "S2", "Level Xing", "LC-47 road surface repair", 75, "Medium", 4, 1, ["Track Gang C"]),
  t("ENG-107", "Engineering", "S3", "Track", "Rail grinding stretch 44/2", 120, "Medium", 6, 4, ["Grinding Unit"]),
  t("ENG-108", "Engineering", "S3", "Track", "Sleeper replacement 210 nos", 150, "High", 9, 15, ["Track Gang B"]),
  t("ENG-109", "Engineering", "S3", "Points", "Switch expansion joint check", 45, "Low", 3, 0, ["Track Gang C"]),
  t("ENG-110", "Engineering", "S1", "Culvert", "Culvert desilting CD-19", 60, "Low", 2, 0, ["Track Gang C"], "Deferred"),

  // S&T
  t("SNT-201", "S&T", "S1", "Signal", "Colour-light signal lamp renewal", 45, "High", 8, 5, ["Signal Crew 1"]),
  t("SNT-202", "S&T", "S1", "Point Machine", "Point machine overhaul Pt 12A", 90, "Critical", 9, 11, ["Signal Crew 1", "Test Kit"]),
  t("SNT-203", "S&T", "S1", "Cable", "Signalling cable megger test", 60, "Medium", 5, 2, ["Signal Crew 2"]),
  t("SNT-204", "S&T", "S2", "Axle Counter", "Axle counter calibration", 75, "High", 7, 7, ["Signal Crew 2", "Test Kit"]),
  t("SNT-205", "S&T", "S2", "Track Circuit", "Track circuit relay replacement", 60, "High", 8, 8, ["Signal Crew 1"]),
  t("SNT-206", "S&T", "S2", "Telecom", "OFC splice repair km 61", 90, "Medium", 6, 3, ["Telecom Crew"]),
  t("SNT-207", "S&T", "S3", "Signal", "Signal sighting rectification", 45, "Medium", 5, 1, ["Signal Crew 2"]),
  t("SNT-208", "S&T", "S3", "Interlocking", "Relay room periodic testing (offline)", 120, "High", 7, 6, ["Signal Crew 1", "Test Kit"]),
  t("SNT-209", "S&T", "S3", "Telecom", "Block phone circuit check", 30, "Low", 3, 0, ["Telecom Crew"]),
  t("SNT-210", "S&T", "S1", "Signal", "LED signal unit retrofit", 60, "Medium", 4, 0, ["Signal Crew 2"], "Deferred"),

  // TRD
  t("TRD-301", "TRD", "S1", "OHE", "OHE contact wire wear measurement", 60, "High", 7, 5, ["Tower Wagon", "OHE Crew A"]),
  t("TRD-302", "TRD", "S1", "OHE", "Dropper replacement span 44-48", 90, "Critical", 9, 10, ["Tower Wagon", "OHE Crew A"]),
  t("TRD-303", "TRD", "S1", "Insulator", "Insulator cleaning drive", 45, "Low", 3, 0, ["OHE Crew B"]),
  t("TRD-304", "TRD", "S2", "OHE", "OHE tension adjustment", 75, "High", 8, 8, ["Tower Wagon", "OHE Crew B"]),
  t("TRD-305", "TRD", "S2", "Switching Post", "SP-3 isolator servicing", 60, "Medium", 6, 2, ["OHE Crew A"]),
  t("TRD-306", "TRD", "S2", "OHE", "Overlap span alignment", 90, "Medium", 5, 1, ["Tower Wagon"]),
  t("TRD-307", "TRD", "S3", "OHE", "OHE mast earthing audit", 45, "Medium", 5, 3, ["OHE Crew B"]),
  t("TRD-308", "TRD", "S3", "OHE", "Pantograph entanglement fix span 12", 120, "Critical", 10, 14, ["Tower Wagon", "OHE Crew A"]),
  t("TRD-309", "TRD", "S3", "Feeder", "Feeder cable thermography", 45, "Low", 4, 0, ["OHE Crew B"]),
  t("TRD-310", "TRD", "S1", "OHE", "Anti-theft clamp fitment", 60, "Low", 2, 0, ["OHE Crew B"], "Deferred"),

  // S4 (Devrai Jn — Mirgaon) branch work
  t("ENG-111", "Engineering", "S4", "Track", "Curve realignment km 12/4", 120, "High", 7, 6, ["Track Gang B"]),
  t("ENG-112", "Engineering", "S4", "Level Xing", "LC-62 gate lifting barrier repair", 60, "Medium", 5, 2, ["Track Gang C"]),
  t("SNT-211", "S&T", "S4", "Signal", "Distant signal focusing — MRG home", 45, "Medium", 6, 3, ["Signal Crew 2"]),
  t("SNT-212", "S&T", "S4", "Track Circuit", "Track circuit bonding renewal", 75, "High", 7, 5, ["Signal Crew 1", "Test Kit"]),
  t("TRD-311", "TRD", "S4", "OHE", "OHE section insulator servicing", 90, "High", 8, 7, ["Tower Wagon", "OHE Crew B"]),
  t("TRD-312", "TRD", "S4", "Insulator", "Insulator cleaning — MRG yard approach", 45, "Low", 3, 0, ["OHE Crew B"]),
];

export const WINDOWS: MaintenanceWindow[] = [
  { id: "W-S1-1", section: "S1", start: 780, end: 900, label: "Mid-day low density" },
  { id: "W-S1-2", section: "S1", start: 990, end: 1080, label: "Afternoon corridor" },
  { id: "W-S1-3", section: "S1", start: 1320, end: 1440, label: "Night block" },
  { id: "W-S2-1", section: "S2", start: 750, end: 870, label: "Mid-day low density" },
  { id: "W-S2-2", section: "S2", start: 1020, end: 1140, label: "Evening corridor" },
  { id: "W-S2-3", section: "S2", start: 1350, end: 1440, label: "Night block" },
  { id: "W-S3-1", section: "S3", start: 795, end: 915, label: "Mid-day low density" },
  { id: "W-S3-2", section: "S3", start: 960, end: 1080, label: "Afternoon corridor" },
  { id: "W-S3-3", section: "S3", start: 1320, end: 1440, label: "Night block" },
  { id: "W-S4-1", section: "S4", start: 720, end: 855, label: "Mid-day low density" },
  { id: "W-S4-2", section: "S4", start: 930, end: 1050, label: "Afternoon corridor" },
  { id: "W-S4-3", section: "S4", start: 1350, end: 1440, label: "Night block" },
];

export const RESOURCES: ResourceAvailability[] = [
  { name: "Track Gang A", total: 2, available: 2 },
  { name: "Track Gang B", total: 2, available: 1 },
  { name: "Track Gang C", total: 2, available: 2 },
  { name: "Tamping Machine", total: 1, available: 1 },
  { name: "BCM", total: 1, available: 0 },
  { name: "Crane", total: 1, available: 1 },
  { name: "Bridge Unit", total: 1, available: 1 },
  { name: "Grinding Unit", total: 1, available: 1 },
  { name: "Signal Crew 1", total: 2, available: 2 },
  { name: "Signal Crew 2", total: 2, available: 2 },
  { name: "Telecom Crew", total: 1, available: 1 },
  { name: "Test Kit", total: 2, available: 2 },
  { name: "Tower Wagon", total: 2, available: 1 },
  { name: "OHE Crew A", total: 2, available: 2 },
  { name: "OHE Crew B", total: 2, available: 2 },
];

/** Traditional (non-coordinated) planning baseline — simulated. */
export const TRADITIONAL_BASELINE = {
  blocks: 10,
  windowHours: 30,
  conflicts: 8,
  utilization: 58,
};
