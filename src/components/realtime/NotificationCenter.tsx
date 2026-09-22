import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRealtimeFeed, type LiveOperationEvent } from "@/hooks/useRealtimeFeed";

function notificationTitle(event: LiveOperationEvent) {
  if (event.severity === "critical") return `Critical alert: ${event.title}`;
  if (event.type === "incident") return `New issue: ${event.title}`;
  return event.title;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const { events } = useRealtimeFeed();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const latestId = useRef<string | undefined>(undefined);
  const initialized = useRef(false);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      initialized.current = true;
      latestId.current = eventsRef.current[0]?.id;
    }, 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const latest = events[0];
    if (!latest || !initialized.current || latest.id === latestId.current) return;
    latestId.current = latest.id;
    toast(notificationTitle(latest), {
      description: `${latest.source} · ${latest.status}`,
      action: {
        label: "View",
        onClick: () =>
          navigate(latest.type === "incident" ? { to: "/incidents" } : { to: "/live-operations" }),
      },
    });
  }, [events, navigate]);

  const unread = events.filter((event) => !readIds.has(event.id)).length;
  const visibleEvents = events.slice(0, 5);

  const markAllRead = () => setReadIds(new Set(events.map((event) => event.id)));
  const openEvent = (event: LiveOperationEvent) => {
    setReadIds((current) => new Set(current).add(event.id));
    setOpen(false);
    navigate(event.type === "incident" ? { to: "/incidents" } : { to: "/live-operations" });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-xl text-white hover:bg-white/10 hover:text-white"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Open notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
            {Math.min(unread, 9)}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Live notifications</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Operations control center
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-[10px]"
              onClick={markAllRead}
            >
              <CheckCheck className="size-3" /> Read all
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {visibleEvents.map((event) => (
              <button
                key={event.id}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent ${readIds.has(event.id) ? "opacity-60" : "bg-primary/5"}`}
                onClick={() => openEvent(event)}
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${event.severity === "critical" ? "bg-red-500" : event.severity === "warning" ? "bg-amber-500" : "bg-emerald-500"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {notificationTitle(event)}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {event.source} · {event.status}
                  </span>
                </span>
                <ChevronRight className="mt-1 size-3 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
