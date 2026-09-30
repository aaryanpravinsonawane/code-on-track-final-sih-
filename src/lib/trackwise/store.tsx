import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getEngine } from "./engine";
import { RESOURCES, TASKS, TRAINS, WINDOWS } from "./data";
import type { AuditEntry, OptimizationResult, Role } from "./types";
import type { User } from "./auth";
import {
  canCreateBlock,
  canManageWorkflowIssue,
  canSubmitFieldReport,
  canTransitionBlock,
  DEMO_WORKFLOW,
  loadWorkflowSnapshot,
  runDemoBlockOptimizer,
  type BlockAction,
  type BlockDemand,
  type BlockOptimizationResult,
  type FieldReport,
  type ResolutionIssue,
  type WorkflowAuditEvent,
  type WorkflowSnapshot,
} from "./workflow";
import { workflowApiConfigured, workflowService, type BlockDemandInput, type FieldReportInput } from "@/services/api/workflowService";

export type PlanStatus = "none" | "draft" | "approved" | "rejected" | "modified";

interface TrackwiseState {
  user: User | null;
  setUser: (u: User | null) => void;
  role: Role;
  setRole: (r: Role) => void;
  plan: OptimizationResult | null;
  planStatus: PlanStatus;
  delays: Record<string, number>;
  audit: AuditEntry[];
  workflowAudit: WorkflowAuditEvent[];
  blockRequests: BlockDemand[];
  issues: ResolutionIssue[];
  fieldReports: FieldReport[];
  demoMode: boolean;
  lastBlockOptimization: BlockOptimizationResult | null;
  generating: boolean;
  generate: (delays?: Record<string, number>) => Promise<OptimizationResult>;
  setPlanStatus: (s: PlanStatus, note?: string) => void;
  setDelays: (d: Record<string, number>) => void;
  log: (action: string, detail: string) => void;
  refreshWorkflow: () => Promise<void>;
  createBlockDemand: (input: BlockDemandInput) => Promise<BlockDemand>;
  transitionBlock: (id: string, action: BlockAction, options?: { note?: string; trimmed_duration_minutes?: number }) => Promise<BlockDemand>;
  updateWorkflowIssue: (id: string, changes: { status?: ResolutionIssue["status"]; assigned_department?: string }) => Promise<void>;
  submitFieldReport: (input: FieldReportInput) => Promise<{ report: FieldReport; issue: ResolutionIssue; schedule_impact: BlockOptimizationResult }>;
  runBlockOptimization: () => Promise<BlockOptimizationResult>;
  engineName: string;
}

const Ctx = createContext<TrackwiseState | null>(null);

let seq = 0;

export function TrackwiseProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("trackwise_user");
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          sessionStorage.removeItem("trackwise_user");
        }
      }
    }
    return null;
  });
  const [workflow, setWorkflow] = useState<WorkflowSnapshot>(loadWorkflowSnapshot);
  const workflowRef = useRef(workflow);
  const [role, setRoleState] = useState<Role>(() => user?.role || "Station Master");
  const [plan, setPlan] = useState<OptimizationResult | null>(null);
  const [planStatus, setStatus] = useState<PlanStatus>("none");
  const [delays, setDelays] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const engine = useMemo(() => getEngine(), []);

  const commitWorkflow = useCallback((next: WorkflowSnapshot) => {
    workflowRef.current = next;
    setWorkflow(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("trackwise_workflow_v1", JSON.stringify(next));
    }
  }, []);

  const refreshWorkflow = useCallback(async () => {
    if (!workflowApiConfigured) return;
    const snapshot = await workflowService.snapshot();
    commitWorkflow(snapshot);
  }, [commitWorkflow]);

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    setRoleState(nextUser?.role ?? "Station Master");
  }, []);

  const appendLocalEvent = useCallback(
    async (
      state: WorkflowSnapshot,
      entityId: string,
      action: string,
      previousState: unknown,
      newState: unknown,
    ): Promise<WorkflowAuditEvent> => {
      const event = {
        id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        user: user?.employeeId ?? user?.id ?? "DEMO-USER",
        role,
        entity_id: entityId,
        action,
        previous_state: previousState,
        new_state: newState,
        previous_hash: state.audit.at(-1)?.integrity_hash ?? "0".repeat(64),
      };
      let integrityHash = "UNAVAILABLE";
      if (globalThis.crypto?.subtle) {
        const digest = await globalThis.crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(JSON.stringify(event)),
        );
        integrityHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      }
      return { ...event, integrity_hash: integrityHash };
    },
    [role, user],
  );

  useEffect(() => {
    if (workflowApiConfigured && user) {
      void workflowService
        .snapshot()
        .then(commitWorkflow)
        .catch((error: unknown) => console.warn("Workflow API unavailable; retaining saved demo state.", error));
    }
  }, [commitWorkflow, user]);

  const log = useCallback(
    (action: string, detail: string) => {
      setAudit((a) => [
        {
          id: `AL-${++seq}`,
          at: new Date().toLocaleTimeString("en-GB"),
          role,
          action,
          detail,
        },
        ...a,
      ]);
    },
    [role],
  );

  const generate = useCallback(
    async (d?: Record<string, number>) => {
      setGenerating(true);
      try {
        const result = await engine.optimize({
          trains: TRAINS,
          tasks: TASKS,
          windows: WINDOWS.map((w) => ({ ...w })),
          resources: RESOURCES,
          delays: d ?? delays,
        });
        setPlan(result);
        setStatus("draft");
        log(
          "Plan generated",
          `${result.metrics.blocksPlanned} blocks · ${result.metrics.tasksBundled} tasks bundled · ${result.metrics.avgUtilization}% utilization`,
        );
        return result;
      } finally {
        setGenerating(false);
      }
    },
    [engine, delays, log],
  );

  const createBlockDemand = useCallback(
    async (input: BlockDemandInput) => {
      if (!canCreateBlock(role, input.department)) throw new Error(`${role} cannot create ${input.department} block requests.`);
      const created = workflowApiConfigured
        ? await workflowService.createBlock(input)
        : {
            ...input,
            id: `BLK-DEMO-${Date.now().toString(36).toUpperCase()}`,
            requested_by: user?.employeeId ?? "DEMO-USER",
            status: "Draft" as const,
            replan_required: false,
          };
      const next = { ...workflowRef.current, block_requests: [created, ...workflowRef.current.block_requests] };
      if (!workflowApiConfigured) {
        const event = await appendLocalEvent(next, created.id, "Block demand created", null, created);
        next.audit = [...next.audit, event];
      } else {
        const snapshot = await workflowService.snapshot();
        commitWorkflow(snapshot);
        return created;
      }
      commitWorkflow(next);
      return created;
    },
    [appendLocalEvent, commitWorkflow, role, user],
  );

  const transitionBlock = useCallback(
    async (id: string, action: BlockAction, options: { note?: string; trimmed_duration_minutes?: number } = {}) => {
      const existing = workflowRef.current.block_requests.find((item) => item.id === id);
      if (!existing) throw new Error("Block request not found.");
      if (!canTransitionBlock(existing, action, role)) throw new Error(`${role} cannot ${action} this request in ${existing.status}.`);
      const updated = workflowApiConfigured
        ? await workflowService.transitionBlock(id, action, options)
        : {
            ...existing,
            ...(action === "trim" && options.trimmed_duration_minutes
              ? { duration_minutes: options.trimmed_duration_minutes, replan_required: true }
              : {}),
            status: ({
              submit: "Submitted",
              validate: "AI Validated",
              review: "Pending Control Review",
              sanction: "Sanctioned",
              trim: "AI Validated",
              reject: "Rejected",
              resubmit: "Submitted",
              dispatch: "Dispatched",
              start: "In Progress",
              complete: "Completed",
            } as const)[action],
            ...(options.note ? { last_action_note: options.note } : {}),
            updated_at: new Date().toISOString(),
          };
      const next = {
        ...workflowRef.current,
        block_requests: workflowRef.current.block_requests.map((item) => (item.id === id ? updated : item)),
      };
      if (!workflowApiConfigured) {
        const event = await appendLocalEvent(next, id, action, { status: existing.status }, { status: updated.status, duration_minutes: updated.duration_minutes });
        next.audit = [...next.audit, event];
      } else {
        const snapshot = await workflowService.snapshot();
        commitWorkflow(snapshot);
        return updated;
      }
      commitWorkflow(next);
      return updated;
    },
    [appendLocalEvent, commitWorkflow, role],
  );

  const updateWorkflowIssue = useCallback(
    async (id: string, changes: { status?: ResolutionIssue["status"]; assigned_department?: string }) => {
      const existing = workflowRef.current.issues.find((issue) => issue.id === id);
      if (!existing) throw new Error("Issue not found.");
      if (!canManageWorkflowIssue(existing, role)) throw new Error(`${role} cannot update this issue.`);
      if (workflowApiConfigured) {
        await workflowService.updateIssue(id, changes);
        await refreshWorkflow();
        return;
      }
      const updated = { ...existing, ...changes };
      const next = {
        ...workflowRef.current,
        issues: workflowRef.current.issues.map((issue) => (issue.id === id ? updated : issue)),
      };
      const event = await appendLocalEvent(next, id, "Issue updated", existing, updated);
      next.audit = [...next.audit, event];
      commitWorkflow(next);
    },
    [appendLocalEvent, commitWorkflow, refreshWorkflow, role],
  );

  const submitFieldReport = useCallback(
    async (input: FieldReportInput) => {
      if (!canSubmitFieldReport(role)) throw new Error(`${role} cannot submit field reports.`);
      if (workflowApiConfigured) {
        const response = await workflowService.submitFieldReport(input);
        await refreshWorkflow();
        return response;
      }
      const now = new Date().toISOString();
      const report: FieldReport = {
        ...input,
        id: `FLD-DEMO-${Date.now().toString(36).toUpperCase()}`,
        reported_by: user?.employeeId ?? "DEMO-USER",
        received_at: now,
      };
      const linkedBlock = workflowRef.current.block_requests.find((block) => block.id === input.block_id);
      const source: ResolutionIssue["source"] = linkedBlock
        ? linkedBlock.department === "Engineering" ? "TMS" : linkedBlock.department === "S&T" ? "SMMS" : "TDMS"
        : role === "TMS Officer" ? "TMS" : role === "SMMS Officer" ? "SMMS" : role === "TDMS Officer" ? "TDMS" : role === "COA Controller" ? "COA" : "Station Master";
      const issue: ResolutionIssue = {
        id: `ISS-DEMO-${Date.now().toString(36).toUpperCase()}`,
        source,
        severity: input.severity,
        location: input.location,
        description: `${input.event_type}: ${input.remarks}`,
        created_at: now,
        status: "Open",
        assigned_department: linkedBlock?.department ?? "Operations",
        recommended_action: "Review the field report and run the maintenance block optimizer.",
      };
      const next: WorkflowSnapshot = {
        ...workflowRef.current,
        field_reports: [report, ...workflowRef.current.field_reports],
        issues: [issue, ...workflowRef.current.issues],
        block_requests: workflowRef.current.block_requests.map((block) =>
          block.id !== input.block_id ? block : input.event_type === "Work Started" && block.status === "Dispatched"
            ? { ...block, status: "In Progress" }
            : input.event_type === "Work Completed Early" && block.status === "In Progress"
              ? { ...block, status: "Completed" }
              : { ...block, replan_required: true },
        ),
      };
      const impact = runDemoBlockOptimizer(next.block_requests, next.train_paths);
      next.last_optimization = impact;
      const reportEvent = await appendLocalEvent(next, report.id, "Field report submitted", null, report);
      const issueEvent = await appendLocalEvent({ ...next, audit: [...next.audit, reportEvent] }, issue.id, "Issue created from field report", null, issue);
      const replanEvent = await appendLocalEvent({ ...next, audit: [...next.audit, reportEvent, issueEvent] }, "OPTIMIZER", "Disruption replanning completed", null, { solver_status: impact.solver_status, scheduled: impact.metrics.scheduled });
      next.audit = [...next.audit, reportEvent, issueEvent, replanEvent];
      commitWorkflow(next);
      return { report, issue, schedule_impact: impact };
    },
    [appendLocalEvent, commitWorkflow, refreshWorkflow, role, user],
  );

  const runBlockOptimization = useCallback(async () => {
    if (workflowApiConfigured) {
      const result = await workflowService.optimize();
      await refreshWorkflow();
      return result;
    }
    const result = runDemoBlockOptimizer(workflowRef.current.block_requests, workflowRef.current.train_paths);
    const scheduledIds = new Set(result.schedule.map((item) => item.request_id));
    const previous = workflowRef.current;
    const next = {
      ...previous,
      last_optimization: result,
      block_requests: previous.block_requests.map((block) =>
        block.status === "Submitted" && scheduledIds.has(block.id)
          ? { ...block, status: "AI Validated" as const }
          : block,
      ),
    };
    for (const block of next.block_requests) {
      const original = previous.block_requests.find((item) => item.id === block.id);
      if (original?.status === "Submitted" && block.status === "AI Validated") {
        const event = await appendLocalEvent(
          { ...next, audit: [...next.audit] },
          block.id,
          "Demo AI validation passed",
          { status: original.status },
          { status: block.status },
        );
        next.audit = [...next.audit, event];
      }
    }
    const event = await appendLocalEvent(next, "OPTIMIZER", "Demo schedule generated", null, { mode: result.solver_mode, status: result.solver_status, scheduled: result.metrics.scheduled });
    next.audit = [...next.audit, event];
    commitWorkflow(next);
    return result;
  }, [appendLocalEvent, commitWorkflow, refreshWorkflow]);

  const setPlanStatus = useCallback(
    (s: PlanStatus, note?: string) => {
      setStatus(s);
      log(
        s === "approved"
          ? "Plan approved"
          : s === "rejected"
            ? "Plan rejected"
            : "Plan sent for modification",
        note ?? "—",
      );
    },
    [log],
  );

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    setAudit((a) => [
      {
        id: `AL-${++seq}`,
        at: new Date().toLocaleTimeString("en-GB"),
        role: r,
        action: "Role switched",
        detail: `Active role set to ${r}`,
      },
      ...a,
    ]);
  }, []);

  const value: TrackwiseState = {
    user,
    setUser,
    role,
    setRole,
    plan,
    planStatus,
    delays,
    audit,
    workflowAudit: workflow.audit,
    blockRequests: workflow.block_requests,
    issues: workflow.issues,
    fieldReports: workflow.field_reports,
    demoMode: !workflowApiConfigured || workflow.demo_mode,
    lastBlockOptimization: workflow.last_optimization,
    generating,
    generate,
    setPlanStatus,
    setDelays,
    log,
    refreshWorkflow,
    createBlockDemand,
    transitionBlock,
    updateWorkflowIssue,
    submitFieldReport,
    runBlockOptimization,
    engineName: engine.name,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrackwise() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTrackwise must be used inside TrackwiseProvider");
  return c;
}

export const ROLES: Role[] = [
  "Admin",
  "Station Master",
  "TMS Officer",
  "SMMS Officer",
  "TDMS Officer",
  "COA Controller",
  "DRM",
  "Maintenance Engineer",
];

export const canApprove = (role: Role) => role === "Admin" || role === "DRM" || role === "Station Master";

export const roleLandingPath = (role: Role) => {
  const paths: Record<Role, string> = {
    Admin: "/dashboard",
    "Station Master": "/station-master",
    "TMS Officer": "/tms",
    "SMMS Officer": "/smms",
    "TDMS Officer": "/tdms",
    "COA Controller": "/coa",
    DRM: "/drm",
    "Maintenance Engineer": "/maintenance",
  };
  return paths[role];
};
