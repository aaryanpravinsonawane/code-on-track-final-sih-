import type { Department, MaintenanceTask } from "@/lib/trackwise/types";
import { priorityBand } from "@/lib/trackwise/engine";

export const DEPT_CLASS: Record<Department, string> = {
  Engineering: "bg-eng/15 text-eng border-eng/30",
  "S&T": "bg-snt/15 text-snt border-snt/30",
  TRD: "bg-trd/15 text-trd border-trd/30",
};

export const DEPT_BAR: Record<Department, string> = {
  Engineering: "bg-eng",
  "S&T": "bg-snt",
  TRD: "bg-trd",
};

export function DeptTag({ dept }: { dept: Department }) {
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold ${DEPT_CLASS[dept]}`}>
      {dept}
    </span>
  );
}

export function PriorityTag({ task }: { task: MaintenanceTask }) {
  const band = priorityBand(task);
  const cls =
    band === "High"
      ? "bg-danger/12 text-danger border-danger/30"
      : band === "Medium"
        ? "bg-warn/15 text-warn-foreground border-warn/40"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {band}
    </span>
  );
}

export function StatusTag({ status }: { status: string }) {
  const cls =
    status === "Scheduled"
      ? "bg-info/12 text-info border-info/30"
      : status === "Completed"
        ? "bg-success/12 text-success border-success/30"
        : status === "Deferred"
          ? "bg-danger/10 text-danger border-danger/30"
          : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-display text-xs font-bold tracking-[0.12em] uppercase text-primary">
            {title}
          </h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
