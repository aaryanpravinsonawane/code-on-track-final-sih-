import api from "./client";
import type {
  BlockAction,
  BlockDemand,
  BlockOptimizationResult,
  FieldEventType,
  FieldReport,
  IssueSeverity,
  IssueStatus,
  ResolutionIssue,
  WorkflowAuditEvent,
  WorkflowSnapshot,
} from "@/lib/trackwise/workflow";
import type { Role } from "@/lib/trackwise/types";

export const workflowApiConfigured = Boolean(import.meta.env["VITE_API_URL"]);

export interface BlockDemandInput {
  title: string;
  department: BlockDemand["department"];
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
}

export interface FieldReportInput {
  event_type: FieldEventType;
  asset: string;
  work_package_id: string;
  severity: IssueSeverity;
  event_time: string;
  remarks: string;
  location: string;
  block_id?: string;
}

export interface FieldReportResponse {
  report: FieldReport;
  issue: ResolutionIssue;
  schedule_impact: BlockOptimizationResult;
}

export interface WorkflowLoginResponse {
  access_token: string;
  token_type: "bearer";
}

export const workflowService = {
  snapshot: () => api.get<WorkflowSnapshot>("/workflow/snapshot").then((response) => response.data),
  createBlock: (block: BlockDemandInput) =>
    api.post<BlockDemand>("/workflow/blocks", block).then((response) => response.data),
  transitionBlock: (
    id: string,
    action: BlockAction,
    options: { note?: string; trimmed_duration_minutes?: number } = {},
  ) =>
    api
      .post<BlockDemand>(`/workflow/blocks/${id}/transition`, { action, ...options })
      .then((response) => response.data),
  updateIssue: (id: string, changes: { status?: IssueStatus; assigned_department?: string }) =>
    api.patch<ResolutionIssue>(`/workflow/issues/${id}`, changes).then((response) => response.data),
  optimize: () =>
    api.post<BlockOptimizationResult>("/workflow/optimize").then((response) => response.data),
  submitFieldReport: (report: FieldReportInput) =>
    api.post<FieldReportResponse>("/workflow/field-reports", report).then((response) => response.data),
  audit: () => api.get<WorkflowAuditEvent[]>("/workflow/audit").then((response) => response.data),
  verifyAudit: () => api.get<{ valid: boolean; verified_events: number }>("/workflow/audit/verify").then((response) => response.data),
  login: (employeeId: string, password: string, role: Role) =>
    api
      .post<WorkflowLoginResponse>("/auth/token", { username: employeeId, password, role })
      .then((response) => response.data),
};