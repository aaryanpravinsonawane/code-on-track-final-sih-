import { SECTIONS, TASKS, TRAINS, WINDOWS, fmt } from "@/lib/trackwise/data";
import { conflictingTrains, trainOccupancy } from "@/lib/trackwise/engine";
import type { PlannedBlock } from "@/lib/trackwise/types";
import { DEPT_BAR } from "./shared";

const T0 = 300;
const T1 = 1440;
const span = T1 - T0;
const pct = (m: number) => ((Math.min(Math.max(m, T0), T1) - T0) / span) * 100;

const TRAIN_TONE: Record<string, string> = {
  Superfast: "bg-primary",
  Express: "bg-info",
  Passenger: "bg-snt",
  Suburban: "bg-eng",
  Freight: "bg-muted-foreground",
};

export function GanttChart({
  blocks = [],
  delays = {},
}: {
  blocks?: PlannedBlock[];
  delays?: Record<string, number>;
}) {
  const hours = Array.from({ length: 20 }, (_, i) => 300 + i * 60);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1000px]">
        <div className="relative mb-2 ml-32 h-5 border-b border-border">
          {hours.map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
              style={{ left: `${pct(h)}%` }}
            >
              {fmt(h)}
            </span>
          ))}
        </div>

        {SECTIONS.map((sec) => {
          const secBlocks = blocks.filter((b) => b.section === sec.id);
          return (
            <div key={sec.id} className="mb-4">
              <p className="mb-1 font-display text-xs font-bold tracking-wide text-muted-foreground">
                {sec.name}
              </p>

              <Row label="Train movements">
                {TRAINS.filter((t) => t.section === sec.id).map((t) => {
                  const occ = trainOccupancy(t, delays[t.id] ?? 0);
                  const delayed = (delays[t.id] ?? 0) > 0;
                  return (
                    <div
                      key={t.id}
                      title={`${t.id} ${t.name} · ${fmt(occ.start)}–${fmt(occ.end)}${delayed ? ` (+${delays[t.id]} min)` : ""}`}
                      className={`absolute top-1.5 h-5 rounded-sm ${TRAIN_TONE[t.type]} ${delayed ? "ring-2 ring-danger" : ""} overflow-hidden text-[9px] leading-5 text-primary-foreground`}
                      style={{ left: `${pct(occ.start)}%`, width: `${Math.max(1.2, pct(occ.end) - pct(occ.start))}%` }}
                    >
                      <span className="px-1 font-mono">{t.id}</span>
                    </div>
                  );
                })}
              </Row>

              <Row label="Available windows">
                {WINDOWS.filter((w) => w.section === sec.id).map((w) => (
                  <div
                    key={w.id}
                    title={`${w.label} · ${fmt(w.start)}–${fmt(w.end)}`}
                    className="absolute top-1.5 h-5 rounded-sm border border-dashed border-success/60 bg-success/10"
                    style={{ left: `${pct(w.start)}%`, width: `${pct(w.end) - pct(w.start)}%` }}
                  />
                ))}
              </Row>

              <Row label="Maintenance blocks">
                {secBlocks.length === 0 && (
                  <span className="absolute top-2 left-2 text-[11px] text-muted-foreground">
                    No block planned — run the AI Block Planner
                  </span>
                )}
                {secBlocks.map((b) => {
                  const conflicts = conflictingTrains(TRAINS, b.section, b.start, b.end, delays);
                  const depts = b.taskIds
                    .map((id) => TASKS.find((t) => t.id === id)!)
                    .filter(Boolean);
                  return (
                    <div
                      key={b.id}
                      title={`${b.id} · ${fmt(b.start)}–${fmt(b.end)} · ${b.taskIds.length} tasks`}
                      className={`absolute top-1 flex h-6 overflow-hidden rounded-sm border ${conflicts.length ? "border-danger ring-2 ring-danger/50" : "border-primary/50"}`}
                      style={{ left: `${pct(b.start)}%`, width: `${Math.max(2, pct(b.end) - pct(b.start))}%` }}
                    >
                      {depts.map((t, i) => (
                        <span key={i} className={`h-full flex-1 ${DEPT_BAR[t.department]}`} />
                      ))}
                      <span className="absolute inset-0 px-1 font-mono text-[9px] leading-6 text-primary-foreground">
                        {b.id}
                      </span>
                    </div>
                  );
                })}
              </Row>
            </div>
          );
        })}

        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          <L cls="bg-primary" label="Superfast" />
          <L cls="bg-info" label="Express" />
          <L cls="bg-snt" label="Passenger / S&T" />
          <L cls="bg-eng" label="Suburban / Engineering" />
          <L cls="bg-trd" label="TRD" />
          <L cls="bg-success/40" label="Available window" />
          <L cls="ring-2 ring-danger bg-transparent" label="Conflict / delayed train" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-stretch">
      <div className="w-32 shrink-0 pr-2 text-right text-[11px] text-muted-foreground">{label}</div>
      <div className="relative h-8 flex-1 rounded-sm bg-panel-muted">
        <div className="absolute inset-0 flex">
          {Array.from({ length: 19 }).map((_, i) => (
            <span key={i} className="flex-1 border-r border-grid/60 last:border-0" />
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

function L({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${cls}`} />
      {label}
    </span>
  );
}
