import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BrainCircuit, Check } from "lucide-react";
import { Panel } from "@/components/trackwise/shared";
import { AIPriorityEngine, type AIPriorityItem } from "@/lib/trackwise/ai-priority";
import { canApprove, useTrackwise } from "@/lib/trackwise/store";
import type { CorridorTrain } from "@/lib/trackwise/corridor";

const SEVERITY: Record<AIPriorityItem["priority"], { label: string; color: string }> = {
  P1: { label: "Critical", color: "var(--st-critical)" },
  P2: { label: "High", color: "var(--st-held)" },
  P3: { label: "Medium", color: "var(--st-delayed)" },
  P4: { label: "Low", color: "var(--st-ontime)" },
};

/** Visual layer over the existing AIPriorityEngine queue (no new AI logic). */
export function AiRecommendationPanel({ trains }: { trains: CorridorTrain[] }) {
  const { user } = useTrackwise();
  const queue = useMemo(() => AIPriorityEngine.generatePriorityQueue().slice(0, 3), []);
  const [index, setIndex] = useState(0);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const item = queue[index] ?? queue[0];
  if (!item) return null;

  const sev = SEVERITY[item.priority];
  const affected = [...trains]
    .sort((a, b) => b.predictedDelay - a.predictedDelay)
    .slice(0, item.affectedTrains);
  const impact = affected.length
    ? Math.round(affected.reduce((s, t) => s + t.predictedDelay, 0) / affected.length)
    : 0;
  const allowed = Boolean(user && canApprove(user.role));
  const isApplied = applied.has(item.id);

  const apply = () => {
    setApplied((prev) => new Set(prev).add(item.id));
    toast.success(`Recommendation ${item.id} sent for controller confirmation`, {
      description: "Advisory only — this prototype does not control signals or trains.",
    });
  };

  return (
    <Panel
      title="AI Recommendation"
      right={
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Recommendation queue">
          {queue.map((q, i) => (
            <button
              key={q.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Recommendation ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`size-2 rounded-full transition-colors ${i === index ? "bg-rail-yellow" : "bg-muted-foreground/40 hover:bg-muted-foreground"}`}
            />
          ))}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: sev.color, borderColor: sev.color }}
        >
          <BrainCircuit className="size-3" /> {sev.label}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {item.system} · {item.type}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Issue
          </p>
          <p className="text-sm font-semibold leading-snug">{item.description}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recommendation
          </p>
          <p className="text-sm leading-snug text-foreground/90">{item.score.recommendedAction}</p>
        </div>
        <p className="text-[11px] text-muted-foreground">Why: {item.score.reason}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-border bg-panel-muted/60 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Expected delay impact
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold">
            {affected.length ? `+${impact} min` : "Minimal"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {affected.length ? `avg · ${affected.length} train(s)` : "No trains affected"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Confidence
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold">{item.score.confidence}%</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${item.score.confidence}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={!allowed || isApplied}
          title={allowed ? undefined : "Requires an approver role"}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isApplied && <Check className="size-3.5" />}
          {isApplied ? "Applied" : "Apply"}
        </button>
        <Link
          to="/ai-priority"
          className="inline-flex h-8 items-center rounded-md border border-border px-4 text-xs font-bold hover:bg-secondary"
        >
          Review All
        </Link>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        AI recommendations require authorized human confirmation before implementation.
      </p>
    </Panel>
  );
}
