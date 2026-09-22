// TRACKWISE domain types.
// NOTE: This is a SIMULATION prototype. Nothing here connects to real
// railway signalling, interlocking, Kavach or any safety-critical system.

export type Department = "Engineering" | "S&T" | "TRD";

export type Role = "Management" | "Station Master" | "Engineering" | "S&T" | "TRD" | "Control Office" | "Admin" | "Viewer";

export type TrainType = "Express" | "Superfast" | "Passenger" | "Suburban" | "Freight";

export type SectionId = "S1" | "S2" | "S3" | "S4";

export type TrafficLevel = "Low" | "Medium" | "High";

export type OperationalStatus = "Operational" | "Restricted" | "Suspended";

/** Derived, display-level status of a section on the simulated corridor. */
export type SectionStatus =
  | "Operational"
  | "Maintenance Pending"
  | "Block Planned"
  | "Conflict Detected";

export type MaintenanceStatus = "Up to date" | "Pending" | "Overdue";

export interface Station {
  /** Short node id used on the corridor diagram (A..E). */
  id: string;
  /** Station code, e.g. NDG */
  code: string;
  /** Station name, e.g. Nandgaon Jn */
  name: string;
  /** Position along the corridor, 0-based. */
  order: number;
}

export interface RailwaySection {
  id: SectionId;
  name: string;
  /** Station code of the source station */
  sourceStation: string;
  /** Station code of the destination station */
  destinationStation: string;
  distanceKm: number;
  trafficLevel: TrafficLevel;
  operationalStatus: OperationalStatus;
  maintenanceStatus: MaintenanceStatus;
  electrified: boolean;
}

/** Back-compat alias used by earlier modules. */
export type Section = RailwaySection;

export interface Train {
  id: string;
  name: string;
  type: TrainType;
  section: SectionId;
  /** minutes from 00:00 */
  arrival: number;
  /** minutes from 00:00 */
  departure: number;
  /** 1 = highest */
  priority: number;
}

export type Criticality = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "Pending" | "Scheduled" | "In Progress" | "Deferred" | "Completed";

export interface MaintenanceTask {
  id: string;
  department: Department;
  section: SectionId;
  assetType: string;
  workType: string;
  /** minutes */
  duration: number;
  criticality: Criticality;
  /** 1..10 */
  urgency: number;
  overdueDays: number;
  requiredResources: string[];
  status: TaskStatus;
}

export interface MaintenanceWindow {
  id: string;
  section: SectionId;
  start: number;
  end: number;
  label: string;
}

export interface ResourceAvailability {
  name: string;
  total: number;
  available: number;
}

/* ---------------- Optimization engine contract ----------------
 * The UI talks to this interface only. A real backend
 * (Python FastAPI + Google OR-Tools CP-SAT) can implement the same
 * shape and be swapped in without touching the presentation layer.
 * -------------------------------------------------------------- */

export interface OptimizationInput {
  trains: Train[];
  tasks: MaintenanceTask[];
  windows: MaintenanceWindow[];
  resources: ResourceAvailability[];
  /** optional per-train delay in minutes, used by the what-if simulator */
  delays?: Record<string, number>;
}

export interface PlannedBlock {
  id: string;
  section: SectionId;
  start: number;
  end: number;
  taskIds: string[];
  utilization: number;
  trainConflicts: number;
  departments: Department[];
  reasonsAccepted: string[];
}

/** Back-compat alias: a planned maintenance block. */
export type BlockPlan = PlannedBlock;

export interface RejectedTask {
  taskId: string;
  reasons: string[];
}

export interface OptimizationResult {
  blocks: PlannedBlock[];
  rejected: RejectedTask[];
  metrics: {
    blocksPlanned: number;
    tasksBundled: number;
    avgUtilization: number;
    conflicts: number;
    totalWindowHours: number;
    estimatedDelayReductionMin: number;
  };
  generatedAt: string;
  engine: string;
}

export interface OptimizationEngine {
  name: string;
  optimize(input: OptimizationInput): Promise<OptimizationResult>;
}

export interface AuditEntry {
  id: string;
  at: string;
  role: Role;
  action: string;
  detail: string;
}

/* ---------------- Unified Data Layer Types ---------------- */

export interface UnifiedEvent {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
  description: string;
  relatedSystems: string[];
  affectedTrains: string[];
  affectedAssets: string[];
  location: string;
  correlationDetails: {
    coa?: string;
    tms?: string;
    smms?: string;
    tdms?: string;
  };
}

export interface Incident {
  id: string;
  location: string;
  relatedSystems: string[];
  impact: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  affectedTrains: number;
  affectedAssets: number;
  assignedDepartments: string[];
  timeline: Array<{ time: string; event: string }>;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  sourceSystem: string;
  station: string;
  location: string;
  asset: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATION";
  affectedTrains: string[];
  assignedDepartment: string;
  status: "Open" | "Acknowledged" | "Assigned" | "Escalated" | "Resolved";
}

export interface WorkOrder {
  id: string;
  source: string;
  asset: string;
  issue: string;
  priority: "P1" | "P2" | "P3" | "P4";
  assigned: string;
  scheduled: string;
  dependencies: string[];
  status: TaskStatus;
  createdAt: string;
}
