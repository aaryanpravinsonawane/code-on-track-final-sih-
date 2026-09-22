import type {
  MaintenanceTask,
  OptimizationEngine,
  OptimizationInput,
  OptimizationResult,
  PlannedBlock,
  RejectedTask,
  Train,
} from "./types";

/**
 * Local heuristic optimization engine (deterministic, rule-based).
 * This is NOT an LLM. It implements the OptimizationEngine contract so a
 * remote solver (Python FastAPI + Google OR-Tools CP-SAT) can replace it
 * by implementing the same interface — see createRemoteEngine() below.
 */

const CRIT_WEIGHT: Record<MaintenanceTask["criticality"], number> = {
  Low: 1,
  Medium: 2,
  High: 3.5,
  Critical: 5,
};

export function priorityScore(task: MaintenanceTask): number {
  const raw =
    CRIT_WEIGHT[task.criticality] * 8 + task.urgency * 3 + Math.min(task.overdueDays, 20) * 1.5;
  return Math.round(Math.min(100, (raw / 79) * 100));
}

export function priorityBand(task: MaintenanceTask): "High" | "Medium" | "Low" {
  const s = priorityScore(task);
  return s >= 70 ? "High" : s >= 45 ? "Medium" : "Low";
}

export function trainOccupancy(train: Train, delayMin = 0) {
  return { start: train.arrival + delayMin, end: train.departure + delayMin };
}

const overlaps = (a1: number, a2: number, b1: number, b2: number) => a1 < b2 && b1 < a2;

export function conflictingTrains(
  trains: Train[],
  section: string,
  start: number,
  end: number,
  delays: Record<string, number> = {},
): Train[] {
  return trains.filter((tr) => {
    if (tr.section !== section) return false;
    const occ = trainOccupancy(tr, delays[tr.id] ?? 0);
    // 10 min safety buffer either side (simulated planning margin)
    return overlaps(occ.start - 10, occ.end + 10, start, end);
  });
}

function resourceAvailable(task: MaintenanceTask, input: OptimizationInput): string | null {
  for (const r of task.requiredResources) {
    const res = input.resources.find((x) => x.name === r);
    if (!res || res.available <= 0) return r;
  }
  return null;
}

export const localEngine: OptimizationEngine = {
  name: "TRACKWISE Heuristic Bundler v1 (simulated)",
  async optimize(input: OptimizationInput): Promise<OptimizationResult> {
    const delays = input.delays ?? {};
    const blocks: PlannedBlock[] = [];
    const rejected: RejectedTask[] = [];
    const assigned = new Set<string>();
    const rejectReasons = new Map<string, Set<string>>();

    const addReject = (id: string, reason: string) => {
      if (!rejectReasons.has(id)) rejectReasons.set(id, new Set());
      rejectReasons.get(id)!.add(reason);
    };

    const candidates = input.tasks
      .filter((t) => t.status !== "Completed")
      .sort((a, b) => priorityScore(b) - priorityScore(a));

    // resource unavailability is a hard filter (simulated)
    const usable = candidates.filter((t) => {
      const missing = resourceAvailable(t, input);
      if (missing) {
        addReject(t.id, `✗ Resource unavailable — ${missing}`);
        return false;
      }
      return true;
    });

    const windows = [...input.windows].sort((a, b) => a.start - b.start);
    let blockNo = 101;

    for (const win of windows) {
      const conflicts = conflictingTrains(input.trains, win.section, win.start, win.end, delays);
      let startAt = win.start;

      const pool = usable.filter((t) => t.section === win.section && !assigned.has(t.id));
      if (!pool.length) continue;

      if (conflicts.length > 0) {
        // window is blocked by train movement — try the residual free time
        const lastTrainEnd = Math.max(
          ...conflicts.map((c) => trainOccupancy(c, delays[c.id] ?? 0).end + 10),
        );
        if (win.end - lastTrainEnd < 45) {
          pool.forEach((t) =>
            addReject(t.id, `✗ Train conflict in ${win.label} (${conflicts.map((c) => c.id).join(", ")})`),
          );
          continue;
        }
        startAt = lastTrainEnd;
      }

      const capacity = win.end - startAt;
      const picked: MaintenanceTask[] = [];
      let used = 0;

      for (const task of pool) {
        // bundled tasks in the same block run in parallel across departments,
        // sequentially within a department (simulated coordination rule)
        const sameDept = picked.filter((p) => p.department === task.department);
        const deptLoad = sameDept.reduce((s, p) => s + p.duration, 0) + task.duration;
        const newSpan = Math.max(used, deptLoad, task.duration);
        if (newSpan > capacity) {
          addReject(task.id, "✗ Insufficient duration remaining in window");
          continue;
        }
        picked.push(task);
        used = newSpan;
      }

      if (!picked.length) continue;

      const end = startAt + Math.max(60, used);
      // utilization is measured against the declared window the block sits in
      const utilization = Math.min(100, Math.round((used / (win.end - startAt)) * 100));
      const departments = [...new Set(picked.map((p) => p.department))];

      const reasons = [
        conflicts.length ? "✓ Rescheduled clear of train movement" : "✓ No train conflict in window",
        `✓ ${picked.filter((p) => priorityBand(p) === "High").length} high-priority task(s) cleared`,
        "✓ Required crew and machinery available",
        departments.length > 1
          ? `✓ Compatible cross-department tasks bundled (${departments.join(" + ")})`
          : "✓ Same-department tasks sequenced efficiently",
        `✓ Block utilization ${utilization}%`,
      ];

      picked.forEach((p) => assigned.add(p.id));
      blocks.push({
        id: `B-${blockNo++}`,
        section: win.section,
        start: startAt,
        end,
        taskIds: picked.map((p) => p.id),
        utilization,
        trainConflicts: conflictingTrains(input.trains, win.section, startAt, end, delays).length,
        departments,
        reasonsAccepted: reasons,
      });
    }

    for (const t of input.tasks) {
      if (assigned.has(t.id) || t.status === "Completed") continue;
      const reasons = [...(rejectReasons.get(t.id) ?? [])];
      rejected.push({
        taskId: t.id,
        reasons: reasons.length ? reasons : ["✗ No compatible window left in the planning horizon"],
      });
    }

    const tasksBundled = blocks.reduce((s, b) => s + b.taskIds.length, 0);
    const totalWindowMin = blocks.reduce((s, b) => s + (b.end - b.start), 0);
    const avgUtilization = blocks.length
      ? Math.round(blocks.reduce((s, b) => s + b.utilization, 0) / blocks.length)
      : 0;

    return {
      blocks,
      rejected,
      metrics: {
        blocksPlanned: blocks.length,
        tasksBundled,
        avgUtilization,
        conflicts: blocks.reduce((s, b) => s + b.trainConflicts, 0),
        totalWindowHours: Math.round((totalWindowMin / 60) * 10) / 10,
        estimatedDelayReductionMin: Math.round(tasksBundled * 7 + avgUtilization * 1.4),
      },
      generatedAt: new Date().toISOString(),
      engine: localEngine.name,
    };
  },
};

/**
 * Drop-in remote engine. Point VITE_OPTIMIZER_URL at a FastAPI + OR-Tools
 * CP-SAT service exposing POST /optimize returning OptimizationResult.
 */
export function createRemoteEngine(baseUrl: string): OptimizationEngine {
  return {
    name: `Remote CP-SAT solver (${baseUrl})`,
    async optimize(input) {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`Optimizer responded ${res.status}`);
      return (await res.json()) as OptimizationResult;
    },
  };
}

export function getEngine(): OptimizationEngine {
  const url = import.meta.env["VITE_OPTIMIZER_URL"] as string | undefined;
  return url ? createRemoteEngine(url) : localEngine;
}
