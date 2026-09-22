import { useEffect, useState } from "react";
import type { StationIncident } from "@/lib/trackwise/operations";
import { subscribeToRealtimeTable, supabase } from "@/lib/supabase";
export type RealtimeStatus = "disabled" | "loading" | "connected" | "error";

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function normalizeIncident(row: Record<string, unknown>): StationIncident {
  const severity = asString(row["severity"], "Medium").toLowerCase();
  const status = asString(row["status"], "Open").toLowerCase();
  const department = asString(row["department"], "TMS").toUpperCase();

  return {
    id: asString(row["id"], `INC-${Date.now()}`),
    timestamp: asString(row["timestamp"] ?? row["created_at"], new Date().toISOString()),
    asset: asString(row["asset"] ?? row["asset_id"], "Unknown asset"),
    location: asString(row["location"], "NDG Station"),
    department: ["TMS", "TDMS", "SMMS", "COA"].includes(department)
      ? (department as StationIncident["department"])
      : "TMS",
    severity: ["critical", "high", "medium", "low"].includes(severity)
      ? ((severity.charAt(0).toUpperCase() + severity.slice(1)) as StationIncident["severity"])
      : "Medium",
    status:
      status === "acknowledged"
        ? "Acknowledged"
        : status === "in progress" || status === "in_progress"
          ? "In Progress"
          : status === "resolved" || status === "closed"
            ? "Resolved"
            : "Open",
    affectedTrains: asStringArray(row["affected_trains"] ?? row["affectedTrains"]),
    title: asString(row["title"] ?? row["description"], "Operational issue"),
  };
}

export function useRealtimeIssues() {
  const [issues, setIssues] = useState<StationIncident[]>([]);
  const [status, setStatus] = useState<RealtimeStatus>(supabase ? "loading" : "disabled");

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    const client = supabase;
    const loadIssues = async () => {
      const { data, error } = await client.from("incidents").select("*").limit(100);
      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      setIssues((data ?? []).map((row) => normalizeIncident(row as Record<string, unknown>)));
    };

    void loadIssues();
    const unsubscribe = subscribeToRealtimeTable(
      "incidents",
      (payload) => {
        const next = payload.new as Record<string, unknown>;
        const previous = payload.old as Record<string, unknown>;
        const id = asString(next["id"] ?? previous["id"], "");

        setIssues((current) => {
          if (payload.eventType === "DELETE") {
            return current.filter((issue) => issue.id !== id);
          }
          const normalized = normalizeIncident(next);
          return current.some((issue) => issue.id === normalized.id)
            ? current.map((issue) => (issue.id === normalized.id ? normalized : issue))
            : [normalized, ...current];
        });
      },
      (connectionStatus) => {
        if (!cancelled) setStatus(connectionStatus === "SUBSCRIBED" ? "connected" : "error");
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { issues, status };
}
