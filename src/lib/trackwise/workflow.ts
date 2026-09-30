import type { Role } from "./types";

export type BlockStatus =
  | "Draft"
  | "Submitted"
  | "AI Validated"
  | "Pending Control Review"
  | "Sanctioned"
  | "Rejected"
  | "Dispatched"
  | "In Progress"
  | "Completed";

export type BlockAction =
  | "submit"
  | "validate"
  | "review"
  | "sanction"
  | "trim"
  | "reject"
  | "resubmit"
  | "dispatch"
  | "start"
  | "complete";

export type DepartmentName = "Engineering" | "S&T" | "TRD";
export type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IssueStatus = "Open" | "Assigned" | "In Progress" | "Resolved";
export type FieldEventType =
  | "Machine Breakdown"
  | "Machine Unavailable"
  | "Material Delayed"
  | "Crew Unavailable"
  | "Work Started"
  | "Work Delayed"
  | "Work Completed Early";

export interface BlockDemand {
  id: string;
  title: string;
  department: DepartmentName;
  section: string;
  track: string;
  window_start: number;
  window_end: number;
  duration_minutes: number;
  resources: string[];
  urgency: number;
  priority: number;
  tsr_required: boolean;
  bundle_key: string | null;
  requested_by: string;
  status: BlockStatus;
  replan_required: boolean;
  updated_at?: string;
  last_action_note?: string;
}

export interface ResolutionIssue {
  id: string;
  source: "TMS" | "SMMS" | "TDMS" | "Station Master" | "COA";
  severity: IssueSeverity;
  location: string;
  description: string;
  created_at: string;
  status: IssueStatus;
  assigned_department: string;
  recommended_action: string;
}

export interface FieldReport {
  id: string;
  event_type: FieldEventType;
  asset: string;
  work_package_id: string;
  severity: IssueSeverity;
  event_time: string;
  remarks: string;
  location: string;
  block_id?: string | null;
  reported_by: string;
  received_at: string;
}

export interface WorkflowAuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  entity_id: string;
  action: string;
  previous_state: unknown;
  new_state: unknown;
  previous_hash: string;
  integrity_hash: string;
}

export interface OptimizedBlock {
  request_id: string;
  department: DepartmentName;
  section: string;
  track: string;
  start: number;
  end: number;
  duration_minutes: number;
  resources: string[];
  bundle_id: string;
  reasons: string[];
}

export interface BlockOptimizationResult {
  solver_mode: "ortools-cp-sat" | "demo-heuristic" | "unavailable";
  solver_status: "OPTIMAL" | "FEASIBLE" | "DEMO" | "NOT_RUN" | string;
  schedule: OptimizedBlock[];
  bundles: Array<{
    id: string;
    section: string;
    track: string;
    start: number;
    end: number;
    request_ids: string[];
    departments: DepartmentName[];
  }>;
  unscheduled: Array<{ request_id: string; reason: string }>;
  conflicts: {
    overlapping_blocks: unknown[];
    train_paths: Array<{ request_id: string; train_id: string }>;
    resources: unknown[];
    impossible_windows: string[];
  };
  reasoning: string[];
  metrics: {
    scheduled: number;
    train_conflicts_avoided: number;
    resource_utilization: number;
  };
}

export interface WorkflowSnapshot {
  demo_mode: boolean;
  block_requests: BlockDemand[];
  issues: ResolutionIssue[];
  field_reports: FieldReport[];
  audit: WorkflowAuditEvent[];
  last_optimization: BlockOptimizationResult | null;
  train_paths: Array<{ id: string; section: string; start: number; end: number; priority: number }>;
}

export const DEMO_WORKFLOW: WorkflowSnapshot = {
  demo_mode: true,
  block_requests: [
    { id: "BLK-ENG-014", title: "Rail weld inspection", department: "Engineering", section: "S1", track: "UP-MAIN", window_start: 780, window_end: 900, duration_minutes: 60, resources: ["Track Gang A"], urgency: 9, priority: 5, tsr_required: true, bundle_key: "S1-UP-MAIN-DAY", requested_by: "TMS-001", status: "Draft", replan_required: false },
    { id: "BLK-SNT-021", title: "Track circuit relay replacement", department: "S&T", section: "S2", track: "DN-MAIN", window_start: 750, window_end: 870, duration_minutes: 60, resources: ["Signal Crew 1"], urgency: 8, priority: 4, tsr_required: false, bundle_key: "S2-DN-MAIN-DAY", requested_by: "SMMS-001", status: "Submitted", replan_required: false },
    { id: "BLK-TRD-008", title: "OHE contact wire check", department: "TRD", section: "S1", track: "UP-MAIN", window_start: 780, window_end: 900, duration_minutes: 45, resources: ["Tower Wagon", "OHE Crew A"], urgency: 7, priority: 4, tsr_required: true, bundle_key: "S1-UP-MAIN-DAY", requested_by: "TDMS-001", status: "AI Validated", replan_required: false },
    { id: "BLK-ENG-011", title: "Turnout renewal Pt 12A", department: "Engineering", section: "S1", track: "UP-MAIN", window_start: 990, window_end: 1080, duration_minutes: 75, resources: ["Track Gang B", "Crane"], urgency: 10, priority: 5, tsr_required: true, bundle_key: "S1-UP-MAIN-EVE", requested_by: "TMS-001", status: "Pending Control Review", replan_required: false },
    { id: "BLK-SNT-019", title: "Signal lamp renewal", department: "S&T", section: "S3", track: "LOOP-1", window_start: 795, window_end: 915, duration_minutes: 45, resources: ["Signal Crew 2"], urgency: 6, priority: 3, tsr_required: false, bundle_key: "S3-LOOP-1-DAY", requested_by: "SMMS-001", status: "Sanctioned", replan_required: false },
    { id: "BLK-TRD-004", title: "Feeder isolation inspection", department: "TRD", section: "S2", track: "DN-MAIN", window_start: 1020, window_end: 1140, duration_minutes: 60, resources: ["OHE Crew B"], urgency: 5, priority: 3, tsr_required: false, bundle_key: "S2-DN-MAIN-EVE", requested_by: "TDMS-001", status: "Rejected", replan_required: false },
    { id: "BLK-ENG-017", title: "Ballast screening", department: "Engineering", section: "S3", track: "UP-MAIN", window_start: 1320, window_end: 1440, duration_minutes: 90, resources: ["Tamping Machine", "Track Gang A"], urgency: 8, priority: 4, tsr_required: true, bundle_key: "S3-UP-MAIN-NIGHT", requested_by: "TMS-001", status: "In Progress", replan_required: false },
  ],
  issues: [
    { id: "ISS-DEMO-101", source: "TMS", severity: "CRITICAL", location: "S1 · KM 104/7", description: "Rail weld inspection is overdue; temporary speed restriction required for the simulated corridor.", created_at: "2026-09-30T07:10:00Z", status: "Open", assigned_department: "Engineering", recommended_action: "Review the S1 request and confirm the TSR plan." },
    { id: "ISS-DEMO-102", source: "SMMS", severity: "HIGH", location: "S2 · Karimpur", description: "Intermittent track circuit indication requires a signal crew inspection.", created_at: "2026-09-30T07:24:00Z", status: "Assigned", assigned_department: "S&T", recommended_action: "Confirm isolation and schedule a relay replacement." },
    { id: "ISS-DEMO-103", source: "TDMS", severity: "MEDIUM", location: "S1 · OHE span 44/8", description: "Tower wagon availability is reduced for the next maintenance window.", created_at: "2026-09-30T07:40:00Z", status: "Open", assigned_department: "TRD", recommended_action: "Re-run the resource-feasible block schedule." },
    { id: "ISS-DEMO-104", source: "Station Master", severity: "HIGH", location: "NDG Station · Platform 2", description: "Simulated platform occupancy overlaps the proposed station work window.", created_at: "2026-09-30T07:56:00Z", status: "In Progress", assigned_department: "Operations", recommended_action: "Coordinate the window with the section controller." },
    { id: "ISS-DEMO-105", source: "COA", severity: "LOW", location: "Central Control", description: "A draft request is awaiting controller review before approval.", created_at: "2026-09-30T08:03:00Z", status: "Open", assigned_department: "Operations", recommended_action: "Complete review and record the decision." },
  ],
  field_reports: [
    { id: "FLD-DEMO-001", event_type: "Machine Unavailable", asset: "TAMP-04", work_package_id: "WP-ENG-17", severity: "HIGH", event_time: "2026-09-30T06:45:00Z", remarks: "Tamping machine unavailable during pre-block inspection.", location: "S3 · KM 128/4", block_id: "BLK-ENG-017", reported_by: "MNT-001", received_at: "2026-09-30T06:47:00Z" },
  ],
  audit: [],
  last_optimization: null,
  train_paths: [
    { id: "12951", section: "S1", start: 360, end: 392, priority: 1 },
    { id: "12615", section: "S1", start: 425, end: 459, priority: 2 },
    { id: "12841", section: "S2", start: 380, end: 415, priority: 1 },
    { id: "12903", section: "S3", start: 345, end: 378, priority: 1 },
  ],
};

const departmentRoles: Record<DepartmentName, Role[]> = {
  Engineering: ["TMS Officer", "Maintenance Engineer"],
  "S&T": ["SMMS Officer", "Maintenance Engineer"],
  TRD: ["TDMS Officer", "Maintenance Engineer"],
};
const controlRoles: Role[] = ["Admin", "Station Master", "COA Controller", "DRM"];

export function canCreateBlock(role: Role, department: DepartmentName) {
  return role === "Admin" || role === "Station Master" || departmentRoles[department].includes(role);
}

export function canSubmitFieldReport(role: Role) {
  return role !== "DRM";
}

export function canManageWorkflowIssue(issue: ResolutionIssue, role: Role) {
  if (["Admin", "DRM", "Station Master", "COA Controller", "Maintenance Engineer"].includes(role)) return true;
  return (
    (issue.source === "TMS" && role === "TMS Officer") ||
    (issue.source === "SMMS" && role === "SMMS Officer") ||
    (issue.source === "TDMS" && role === "TDMS Officer")
  );
}

const nextStatus: Partial<Record<BlockAction, Partial<Record<BlockStatus, BlockStatus>>>> = {
  submit: { Draft: "Submitted" },
  validate: { Submitted: "AI Validated" },
  review: { "AI Validated": "Pending Control Review" },
  sanction: { "Pending Control Review": "Sanctioned" },
  trim: { "Pending Control Review": "AI Validated" },
  reject: { "Pending Control Review": "Rejected" },
  resubmit: { Rejected: "Submitted" },
  dispatch: { Sanctioned: "Dispatched" },
  start: { Dispatched: "In Progress" },
  complete: { "In Progress": "Completed" },
};

export function canTransitionBlock(block: BlockDemand, action: BlockAction, role: Role): boolean {
  if (!nextStatus[action]?.[block.status]) return false;
  if (["review", "sanction", "trim", "reject"].includes(action)) {
    return controlRoles.includes(role) && (action !== "sanction" || role !== "COA Controller");
  }
  if (action === "dispatch") return ["Admin", "Station Master", "COA Controller"].includes(role);
  if (["submit", "resubmit"].includes(action)) {
    return role === "Admin" || role === "Station Master" || departmentRoles[block.department].includes(role);
  }
  if (["start", "complete"].includes(action)) {
    return role === "Admin" || departmentRoles[block.department].includes(role);
  }
  return action === "validate" && (role === "Admin" || role === "COA Controller");
}

export function runDemoBlockOptimizer(
  requests: BlockDemand[],
  trains: WorkflowSnapshot["train_paths"],
): BlockOptimizationResult {
  const active = requests
    .filter((request) => request.status === "Submitted" || request.status === "AI Validated" || request.replan_required)
    .sort((a, b) => b.priority * 10 + b.urgency - (a.priority * 10 + a.urgency));
  const selected: Array<{ request: BlockDemand; start: number; end: number }> = [];
  const unscheduled: BlockOptimizationResult["unscheduled"] = [];
  const trainConflicts: BlockOptimizationResult["conflicts"]["train_paths"] = [];

  for (const request of active) {
    let placement: { start: number; end: number } | undefined;
    for (let start = request.window_start; start + request.duration_minutes <= request.window_end; start += 15) {
      const end = start + request.duration_minutes;
      const blockedBy = trains.filter(
        (train) => train.section === request.section && start < train.end + 10 && train.start - 10 < end,
      );
      blockedBy.forEach((train) => trainConflicts.push({ request_id: request.id, train_id: train.id }));
      if (blockedBy.length) continue;

      const collides = selected.some((current) => {
        if (!(start < current.end && current.start < end)) return false;
        const sharesResource = request.resources.some((resource) => current.request.resources.includes(resource));
        const canBundle = Boolean(
          start === current.start &&
            request.bundle_key &&
            request.bundle_key === current.request.bundle_key &&
            request.section === current.request.section &&
            request.track === current.request.track &&
            request.department !== current.request.department &&
            !sharesResource,
        );
        return sharesResource || (request.section === current.request.section && !canBundle);
      });
      if (!collides) {
        placement = { start, end };
        break;
      }
    }
    if (placement) selected.push({ request, ...placement });
    else unscheduled.push({ request_id: request.id, reason: "No conflict-free slot in the simulated window." });
  }

  const grouped = new Map<string, typeof selected>();
  selected.forEach((item) => {
    const key = `${item.request.section}|${item.request.track}|${item.start}|${item.request.bundle_key ?? item.request.id}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });
  const bundles = [...grouped.entries()].map(([key, group], index) => {
    const [section, track] = key.split("|");
    const id = `DEMO-BND-${String(index + 1).padStart(3, "0")}`;
    return {
      id,
      section: section ?? "",
      track: track ?? "",
      start: Math.min(...group.map((item) => item.start)),
      end: Math.max(...group.map((item) => item.end)),
      request_ids: group.map((item) => item.request.id),
      departments: [...new Set(group.map((item) => item.request.department))],
    };
  });
  const bundleByKey = new Map<string, string>();
  [...grouped.entries()].forEach(([key], index) => bundleByKey.set(key, `DEMO-BND-${String(index + 1).padStart(3, "0")}`));
  const schedule = selected.map((item) => {
    const groupKey = `${item.request.section}|${item.request.track}|${item.start}|${item.request.bundle_key ?? item.request.id}`;
    return {
      request_id: item.request.id,
      department: item.request.department,
      section: item.request.section,
      track: item.request.track,
      start: item.start,
      end: item.end,
      duration_minutes: item.request.duration_minutes,
      resources: item.request.resources,
      bundle_id: bundleByKey.get(groupKey) ?? "DEMO-BND-001",
      reasons: ["Deterministic local demo heuristic; no CP-SAT solver was run.", "Train paths use a simulated 10-minute protection buffer."],
    };
  });
  const occupiedMinutes = bundles.reduce((total, item) => total + item.end - item.start, 0);
  const resourceMinutes = schedule.reduce((total, item) => total + item.duration_minutes * Math.max(1, item.resources.length), 0);

  return {
    solver_mode: "demo-heuristic",
    solver_status: "DEMO",
    schedule,
    bundles,
    unscheduled,
    conflicts: { overlapping_blocks: [], train_paths: trainConflicts, resources: [], impossible_windows: [] },
    reasoning: ["DEMO MODE: this schedule is produced by a deterministic browser heuristic, not OR-Tools.", "The backend optimizer endpoint is required for actual CP-SAT results."],
    metrics: {
      scheduled: schedule.length,
      train_conflicts_avoided: trainConflicts.length,
      resource_utilization: occupiedMinutes ? Math.round((resourceMinutes / occupiedMinutes) * 100) : 0,
    },
  };
}

export function loadWorkflowSnapshot(): WorkflowSnapshot {
  if (typeof window === "undefined") return DEMO_WORKFLOW;
  try {
    const saved = window.localStorage.getItem("trackwise_workflow_v1");
    return saved ? { ...DEMO_WORKFLOW, ...JSON.parse(saved) } as WorkflowSnapshot : DEMO_WORKFLOW;
  } catch {
    window.localStorage.removeItem("trackwise_workflow_v1");
    return DEMO_WORKFLOW;
  }
}