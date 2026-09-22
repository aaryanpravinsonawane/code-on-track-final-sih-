// Single source of truth for the simulated railway network.
// Every train, maintenance task, window and block plan resolves its
// section through this layer so section IDs stay consistent app-wide.
// SIMULATION ONLY — no connection to real railway systems.

import { SECTIONS, STATIONS, TASKS, TRAINS, WINDOWS } from "./data";
import { conflictingTrains, priorityBand } from "./engine";
import type {
  BlockPlan,
  MaintenanceTask,
  MaintenanceWindow,
  RailwaySection,
  SectionId,
  SectionStatus,
  Station,
  Train,
} from "./types";

export const SECTION_IDS: SectionId[] = SECTIONS.map((s) => s.id);

export const getSections = (): RailwaySection[] => SECTIONS;
export const getStations = (): Station[] => [...STATIONS].sort((a, b) => a.order - b.order);

export const getSection = (id: SectionId): RailwaySection | undefined =>
  SECTIONS.find((s) => s.id === id);

export const getStationByCode = (code: string): Station | undefined =>
  STATIONS.find((s) => s.code === code);

/** "NDG → KRP" */
export const sectionRoute = (id: SectionId) => {
  const s = getSection(id);
  return s ? `${s.sourceStation} → ${s.destinationStation}` : id;
};

/** "Nandgaon Jn → Karimpur" */
export const sectionRouteNames = (id: SectionId) => {
  const s = getSection(id);
  if (!s) return id;
  return `${getStationByCode(s.sourceStation)?.name ?? s.sourceStation} → ${
    getStationByCode(s.destinationStation)?.name ?? s.destinationStation
  }`;
};

export const trainsInSection = (id: SectionId): Train[] => TRAINS.filter((t) => t.section === id);
export const tasksInSection = (id: SectionId): MaintenanceTask[] =>
  TASKS.filter((t) => t.section === id);
export const pendingTasksInSection = (id: SectionId): MaintenanceTask[] =>
  tasksInSection(id).filter((t) => t.status === "Pending" || t.status === "Deferred");
export const windowsInSection = (id: SectionId): MaintenanceWindow[] =>
  WINDOWS.filter((w) => w.section === id);
export const blocksInSection = (id: SectionId, blocks: BlockPlan[] = []): BlockPlan[] =>
  blocks.filter((b) => b.section === id);

/** Windows on this section that currently clash with a simulated train path. */
export const conflictsInSection = (id: SectionId): number =>
  windowsInSection(id).filter((w) => conflictingTrains(TRAINS, id, w.start, w.end).length > 0)
    .length;

export const sectionStatus = (id: SectionId, blocks: BlockPlan[] = []): SectionStatus => {
  if (conflictsInSection(id) > 0 && blocksInSection(id, blocks).length > 0) return "Conflict Detected";
  if (blocksInSection(id, blocks).length > 0) return "Block Planned";
  const highPriority = tasksInSection(id).filter((t) => priorityBand(t) === "High").length;
  if (highPriority >= 3 || getSection(id)?.maintenanceStatus === "Overdue")
    return "Maintenance Pending";
  return "Operational";
};

export interface StationSummary {
  station: Station;
  connectedSections: RailwaySection[];
  trains: number;
  pendingTasks: number;
}

export const stationSummary = (code: string): StationSummary | undefined => {
  const station = getStationByCode(code);
  if (!station) return undefined;
  const connectedSections = SECTIONS.filter(
    (s) => s.sourceStation === code || s.destinationStation === code,
  );
  return {
    station,
    connectedSections,
    trains: connectedSections.reduce((n, s) => n + trainsInSection(s.id).length, 0),
    pendingTasks: connectedSections.reduce((n, s) => n + pendingTasksInSection(s.id).length, 0),
  };
};

export interface SectionSummary {
  section: RailwaySection;
  trains: Train[];
  tasks: MaintenanceTask[];
  pendingTasks: number;
  windows: MaintenanceWindow[];
  plannedBlocks: BlockPlan[];
  conflicts: number;
  status: SectionStatus;
}

export const sectionSummary = (id: SectionId, blocks: BlockPlan[] = []): SectionSummary | undefined => {
  const section = getSection(id);
  if (!section) return undefined;
  return {
    section,
    trains: trainsInSection(id),
    tasks: tasksInSection(id),
    pendingTasks: pendingTasksInSection(id).length,
    windows: windowsInSection(id),
    plannedBlocks: blocksInSection(id, blocks),
    conflicts: conflictsInSection(id),
    status: sectionStatus(id, blocks),
  };
};

/** Referential-integrity check over the simulated dataset. */
export const validateNetwork = () => {
  const ids = new Set<string>(SECTION_IDS);
  const codes = new Set(STATIONS.map((s) => s.code));
  const issues: string[] = [];

  SECTIONS.forEach((s) => {
    if (!codes.has(s.sourceStation)) issues.push(`${s.id}: unknown source ${s.sourceStation}`);
    if (!codes.has(s.destinationStation))
      issues.push(`${s.id}: unknown destination ${s.destinationStation}`);
  });
  TRAINS.forEach((t) => !ids.has(t.section) && issues.push(`Train ${t.id}: bad section ${t.section}`));
  TASKS.forEach((t) => !ids.has(t.section) && issues.push(`Task ${t.id}: bad section ${t.section}`));
  WINDOWS.forEach((w) => !ids.has(w.section) && issues.push(`Window ${w.id}: bad section ${w.section}`));

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      stations: STATIONS.length,
      sections: SECTIONS.length,
      trains: TRAINS.length,
      tasks: TASKS.length,
      windows: WINDOWS.length,
    },
  };
};
