import {
  createClient,
  type RealtimeChannel,
  type RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);

type RealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;
type RealtimeListener = (payload: RealtimePayload) => void;
type RealtimeStatusListener = (status: string) => void;

interface ChannelRegistryEntry {
  channel: RealtimeChannel;
  listeners: Set<RealtimeListener>;
  statusListeners: Set<RealtimeStatusListener>;
}

const channelRegistry = new Map<string, ChannelRegistryEntry>();

export function subscribeToRealtimeTable(
  table: string,
  listener: RealtimeListener,
  onStatus?: RealtimeStatusListener,
) {
  if (!supabase) return () => undefined;

  let entry = channelRegistry.get(table);
  if (!entry) {
    const channel = supabase.channel(`trackwise-${table}-realtime`);
    entry = { channel, listeners: new Set(), statusListeners: new Set() };
    channelRegistry.set(table, entry);

    channel
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        channelRegistry.get(table)?.listeners.forEach((currentListener) => {
          currentListener(payload as RealtimePayload);
        });
      })
      .subscribe((status) => {
        channelRegistry.get(table)?.statusListeners.forEach((statusListener) => {
          statusListener(status);
        });
      });
  }

  entry.listeners.add(listener);
  if (onStatus) entry.statusListeners.add(onStatus);

  return () => {
    const current = channelRegistry.get(table);
    if (!current) return;
    current.listeners.delete(listener);
    if (onStatus) current.statusListeners.delete(onStatus);
    if (current.listeners.size === 0) {
      channelRegistry.delete(table);
      void supabase?.removeChannel(current.channel);
    }
  };
}
