import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Clock3,
  Gauge,
  Radio,
  Signal,
  TrainFront,
  Wrench,
  Zap,
} from "lucide-react";
import { Panel } from "@/components/trackwise/shared";
import {
  useRealtimeFeed,
  type FeedEventType,
  type LiveOperationEvent,
} from "@/hooks/useRealtimeFeed";
import { RealtimeStatusBar } from "./RealtimeStatusBar";

const eventIcons: Record<FeedEventType, typeof TrainFront> = {
  train: TrainFront,
  track: Gauge,
  signal: Signal,
  power: Zap,
  incident: AlertTriangle,
  maintenance: Wrench,
};

const severityClasses: Record<LiveOperationEvent["severity"], string> = {
  critical: "border-red-500/25 bg-red-500/10 text-red-600",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-700",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  info: "border-blue-500/25 bg-blue-500/10 text-blue-700",
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function LiveOperationsFeed({ compact = false }: { compact?: boolean }) {
  const { events, status } = useRealtimeFeed();

  return (
    <Panel title="LIVE OPERATIONS FEED" right={<RealtimeStatusBar status={status} compact />}>
      <div className={compact ? "max-h-72 overflow-y-auto" : "max-h-[30rem] overflow-y-auto"}>
        <div className="space-y-2">
          {events.map((event, index) => {
            const Icon = eventIcons[event.type];
            return (
              <article
                key={event.id}
                className="animate-in fade-in slide-in-from-top-1 flex gap-3 rounded-xl border border-border/70 bg-panel-muted/60 p-3 duration-300"
                style={{ animationDelay: `${Math.min(index * 35, 250)}ms` }}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${severityClasses[event.severity]}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-mono text-muted-foreground">
                      <Clock3 className="size-3" />
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClasses[event.severity]}`}
                    >
                      {event.status}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {event.source}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

export function LiveOperationsLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="flex items-center gap-1">
        <Radio className="size-3 text-emerald-500" /> Live
      </span>
      <span className="flex items-center gap-1">
        <CheckCircle2 className="size-3 text-emerald-500" /> Healthy
      </span>
      <span className="flex items-center gap-1">
        <BatteryCharging className="size-3 text-amber-500" /> Attention
      </span>
    </div>
  );
}
