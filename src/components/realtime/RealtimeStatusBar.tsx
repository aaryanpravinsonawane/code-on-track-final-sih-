import { CheckCircle2, CloudOff, LoaderCircle, WifiOff } from "lucide-react";
import type { RealtimeStatus } from "@/hooks/useRealtimeIssues";

const statusConfig: Record<
  RealtimeStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  connected: { label: "Realtime connected", className: "text-emerald-500", icon: CheckCircle2 },
  loading: { label: "Connecting", className: "text-amber-500", icon: LoaderCircle },
  error: { label: "Realtime unavailable", className: "text-red-500", icon: WifiOff },
  disabled: { label: "Simulation mode", className: "text-blue-200/70", icon: CloudOff },
};

export function RealtimeStatusBar({
  status,
  compact = false,
}: {
  status: RealtimeStatus;
  compact?: boolean;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${config.className}`}
    >
      <Icon className={`size-3 ${status === "loading" ? "animate-spin" : ""}`} />
      {!compact && config.label}
      {compact && <span className="hidden sm:inline">{config.label}</span>}
    </span>
  );
}
