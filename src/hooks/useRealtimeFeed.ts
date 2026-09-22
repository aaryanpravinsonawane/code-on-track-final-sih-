import { useEffect, useState } from "react";
import { subscribeToRealtimeTable, supabase } from "@/lib/supabase";
import type { RealtimeStatus } from "./useRealtimeIssues";

export type FeedEventType = "train" | "track" | "signal" | "power" | "incident" | "maintenance";

export interface LiveOperationEvent {
  id: string;
  type: FeedEventType;
  title: string;
  description: string;
  timestamp: string;
  status: string;
  severity: "critical" | "warning" | "success" | "info";
  source: string;
}

interface FeedTable {
  table: string;
  type: FeedEventType;
  source: string;
}

const feedTables: FeedTable[] = [
  { table: "train_movements", type: "train", source: "TMS" },
  { table: "track_status", type: "track", source: "TMS" },
  { table: "signal_status", type: "signal", source: "SMMS" },
  { table: "power_events", type: "power", source: "TDMS" },
  { table: "incidents", type: "incident", source: "Operations" },
  { table: "maintenance_activities", type: "maintenance", source: "Maintenance" },
];

const fallbackEvents: LiveOperationEvent[] = [
  {
    id: "demo-train-1",
    type: "train",
    title: "Train 12615 arrived at Platform 2",
    description: "Grand Trunk Express is being regulated at NDG Junction.",
    timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
    status: "Running",
    severity: "success",
    source: "TMS",
  },
  {
    id: "demo-signal-1",
    type: "signal",
    title: "Signal S4 aspect changed",
    description: "North Cabin signal is currently restricted.",
    timestamp: new Date(Date.now() - 6 * 60_000).toISOString(),
    status: "Warning",
    severity: "warning",
    source: "SMMS",
  },
  {
    id: "demo-power-1",
    type: "power",
    title: "Feeder FEED-03 requires review",
    description: "Traction power telemetry reports a feeder trip.",
    timestamp: new Date(Date.now() - 11 * 60_000).toISOString(),
    status: "Critical",
    severity: "critical",
    source: "TDMS",
  },
];

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function severity(value: unknown): LiveOperationEvent["severity"] {
  const normalized = text(value, "info").toLowerCase();
  if (["critical", "major", "failed", "blocked"].includes(normalized)) return "critical";
  if (["warning", "high", "delayed", "pending"].includes(normalized)) return "warning";
  if (["resolved", "healthy", "running", "completed", "online"].includes(normalized))
    return "success";
  return "info";
}

function normalizeEvent(table: FeedTable, row: Record<string, unknown>): LiveOperationEvent {
  const id = text(row["id"], `${table.table}-${Date.now()}`);
  const status = text(row["status"] ?? row["state"] ?? row["health"], "Updated");
  return {
    id: `${table.table}-${id}`,
    type: table.type,
    title: text(row["title"] ?? row["name"] ?? row["event"], `${table.source} update received`),
    description: text(
      row["description"] ?? row["message"] ?? row["location"],
      "Live operational update",
    ),
    timestamp: text(
      row["timestamp"] ?? row["updated_at"] ?? row["created_at"],
      new Date().toISOString(),
    ),
    status,
    severity: severity(row["severity"] ?? status),
    source: table.source,
  };
}

export function useRealtimeFeed() {
  const [events, setEvents] = useState<LiveOperationEvent[]>(fallbackEvents);
  const [status, setStatus] = useState<RealtimeStatus>(supabase ? "loading" : "disabled");

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    const connectionStatuses = new Map<string, string>();
    const client = supabase;

    const updateConnectionStatus = (table: string, connectionStatus: string) => {
      connectionStatuses.set(table, connectionStatus);
      if (Array.from(connectionStatuses.values()).some((value) => value === "CHANNEL_ERROR")) {
        setStatus("error");
      } else if (
        feedTables.every((feedTable) => connectionStatuses.get(feedTable.table) === "SUBSCRIBED")
      ) {
        setStatus("connected");
      }
    };

    const loadInitialEvents = async () => {
      const results = await Promise.all(
        feedTables.map(async (table) => {
          const { data } = await client.from(table.table).select("*").limit(10);
          return data?.map((row) => normalizeEvent(table, row as Record<string, unknown>)) ?? [];
        }),
      );
      if (cancelled) return;
      const remoteEvents = results.flat().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (remoteEvents.length) setEvents(remoteEvents);
    };

    void loadInitialEvents();

    const cleanups = feedTables.map((table) =>
      subscribeToRealtimeTable(
        table.table,
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const event = normalizeEvent(table, payload.new);
          setEvents((current) =>
            [event, ...current.filter((item) => item.id !== event.id)].slice(0, 50),
          );
        },
        (connectionStatus) => updateConnectionStatus(table.table, connectionStatus),
      ),
    );

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return { events, status };
}
