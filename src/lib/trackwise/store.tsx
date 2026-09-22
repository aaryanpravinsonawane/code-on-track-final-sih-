import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getEngine } from "./engine";
import { RESOURCES, TASKS, TRAINS, WINDOWS } from "./data";
import type { AuditEntry, OptimizationResult, Role } from "./types";
import type { User } from "./auth";

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
  generating: boolean;
  generate: (delays?: Record<string, number>) => Promise<OptimizationResult>;
  setPlanStatus: (s: PlanStatus, note?: string) => void;
  setDelays: (d: Record<string, number>) => void;
  log: (action: string, detail: string) => void;
  engineName: string;
}

const Ctx = createContext<TrackwiseState | null>(null);

let seq = 0;

export function TrackwiseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("trackwise_user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [role, setRoleState] = useState<Role>(() => user?.role || "Station Master");
  const [plan, setPlan] = useState<OptimizationResult | null>(null);
  const [planStatus, setStatus] = useState<PlanStatus>("none");
  const [delays, setDelays] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const engine = useMemo(() => getEngine(), []);

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
      const result = await engine.optimize({
        trains: TRAINS,
        tasks: TASKS,
        windows: WINDOWS.map((w) => ({ ...w })),
        resources: RESOURCES,
        delays: d ?? delays,
      });
      setPlan(result);
      setStatus("draft");
      setGenerating(false);
      log(
        "Plan generated",
        `${result.metrics.blocksPlanned} blocks · ${result.metrics.tasksBundled} tasks bundled · ${result.metrics.avgUtilization}% utilization`,
      );
      return result;
    },
    [engine, delays, log],
  );

  const setPlanStatus = useCallback(
    (s: PlanStatus, note?: string) => {
      setStatus(s);
      log(
        s === "approved" ? "Plan approved" : s === "rejected" ? "Plan rejected" : "Plan sent for modification",
        note ?? "—",
      );
    },
    [log],
  );

  const setRole = useCallback(
    (r: Role) => {
      setRoleState(r);
      setAudit((a) => [
        { id: `AL-${++seq}`, at: new Date().toLocaleTimeString("en-GB"), role: r, action: "Role switched", detail: `Active role set to ${r}` },
        ...a,
      ]);
    },
    [],
  );

  const value: TrackwiseState = {
    user,
    setUser,
    role,
    setRole,
    plan,
    planStatus,
    delays,
    audit,
    generating,
    generate,
    setPlanStatus,
    setDelays,
    log,
    engineName: engine.name,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrackwise() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTrackwise must be used inside TrackwiseProvider");
  return c;
}

export const ROLES: Role[] = ["Management", "Station Master", "Engineering", "S&T", "TRD", "Control Office"];

export const canApprove = (role: Role) => role === "Management" || role === "Station Master";
