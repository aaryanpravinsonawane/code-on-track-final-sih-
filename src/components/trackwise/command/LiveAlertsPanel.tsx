import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Info, TriangleAlert } from "lucide-react";
import { Panel } from "@/components/trackwise/shared";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { buildAlerts, type AlertSeverity, type CorridorSnapshot } from "@/lib/trackwise/corridor";

interface Row {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  source: string;
  when: string;
}

const COLOR: Record<AlertSeverity, string> = {
  critical: "var(--st-critical)",
  warning: "var(--st-held)",
  info: "var(--st-block)",
};
const RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/**
 * Live alerts: real realtime events (existing useRealtimeFeed) when the backend is connected,
 * plus alerts derived from the simulated corridor state.
 */
export function LiveAlertsPanel({ snapshot }: { snapshot: CorridorSnapshot }) {
  const { events, status } = useRealtimeFeed();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rows = useMemo<Row[]>(() => {
    const remote: Row[] =
      status === "connected"
        ? events.slice(0, 5).map((e) => ({
            id: `rt-${e.id}`,
            severity:
              e.severity === "critical"
                ? "critical"
                : e.severity === "warning"
                  ? "warning"
                  : "info",
            title: e.title,
            detail: e.description,
            source: e.source,
            when: mounted
              ? new Date(e.timestamp).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          }))
        : [];
    const derived: Row[] = buildAlerts(snapshot).map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      detail: a.detail,
      source: a.source,
      when: `${a.ageMin} min ago`,
    }));
    return [...remote, ...derived].sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  }, [events, status, snapshot, mounted]);

  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <Panel
      title="Live Alerts"
      right={
        <div className="flex items-center gap-3">
          {critical > 0 && (
            <span className="rounded-full border border-st-critical/40 bg-st-critical/10 px-2 py-0.5 text-[10px] font-bold text-st-critical">
              {critical} critical
            </span>
          )}
          <Link to="/alerts" className="text-[11px] font-semibold text-primary hover:underline">
            View all →
          </Link>
        </div>
      }
    >
      <ul className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
        {rows.map((r) => {
          const Icon = r.severity === "info" ? Info : TriangleAlert;
          return (
            <li
              key={r.id}
              className="flex gap-2.5 rounded-md border border-border/70 bg-panel-muted/50 p-2.5"
              style={{ borderLeft: `3px solid ${COLOR[r.severity]}` }}
            >
              <Icon className="mt-0.5 size-4 shrink-0" style={{ color: COLOR[r.severity] }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-snug">{r.title}</p>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {r.when}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{r.detail}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {r.source}
                </p>
              </div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="py-6 text-center text-xs text-muted-foreground">No active alerts.</li>
        )}
      </ul>
    </Panel>
  );
}
