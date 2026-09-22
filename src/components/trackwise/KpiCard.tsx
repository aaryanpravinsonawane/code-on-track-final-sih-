import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "warn" | "danger" | "success";
}) {
  const toneCls =
    tone === "danger"
      ? "text-danger"
      : tone === "warn"
        ? "text-warn-foreground"
        : tone === "success"
          ? "text-success"
          : "text-primary";
  return (
    <div className="panel-card panel-card-hover group relative overflow-hidden p-4">
      <div className={`absolute inset-y-0 left-0 w-1 ${tone === "danger" ? "bg-danger" : tone === "warn" ? "bg-warn" : tone === "success" ? "bg-success" : "bg-primary"}`} />
      <div className="absolute -right-8 -top-8 size-20 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-150" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
          {label}
        </p>
        <Icon className={`size-4 shrink-0 ${toneCls}`} />
      </div>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${toneCls}`}>
        {value}
        {unit && <span className="ml-0.5 text-base font-semibold">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
