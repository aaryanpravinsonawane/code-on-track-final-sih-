import { useState } from "react";
import { Search } from "lucide-react";
import type { LiveSnapshot } from "@/lib/liveSimulation";
import { STATE_META, useCorridorFeed } from "@/lib/trackwise/corridor";
import { useTrackwise } from "@/lib/trackwise/store";
import { AiRecommendationPanel } from "./AiRecommendationPanel";
import { CommandKpis } from "./CommandKpis";
import { LiveAlertsPanel } from "./LiveAlertsPanel";
import { LiveCorridor, type CorridorSelection } from "./LiveCorridor";

/**
 * Command Center top section: toolbar, KPI cards, Live corridor, AI recommendation, live alerts.
 * It receives the existing live snapshot from the page, so no extra network subscriptions are opened.
 */
export function CommandCenterHero({ live }: { live: LiveSnapshot }) {
  const { user } = useTrackwise();
  const { snapshot, history, playing, setPlaying } = useCorridorFeed(live);
  const [selection, setSelection] = useState<CorridorSelection>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = q
    ? snapshot.trains.filter(
        (t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
      )
    : [];
  const matchIds = q ? matches.map((t) => t.id) : null;

  const pick = (id: string) => {
    setSelection({ kind: "train", id });
    setQuery("");
  };

  return (
    <section aria-label="Command Center overview" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches[0]) pick(matches[0].id);
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search trains by number or name"
            aria-label="Search trains"
            className="h-9 w-full rounded-md border border-input bg-panel-muted pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {q && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
              {matches.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => pick(t.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <span
                      className="size-2 rounded-sm"
                      style={{ background: STATE_META[t.state].color }}
                    />
                    <span className="font-mono font-semibold">{t.id}</span>
                    <span className="truncate text-muted-foreground">{t.name}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matching train</li>
              )}
            </ul>
          )}
        </div>
        <div className="ml-auto rounded-md border border-border bg-panel px-3 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Section Controller
          </p>
          <p className="text-sm font-semibold leading-tight">
            {user?.name ?? "—"}
            {user?.role && (
              <span className="text-xs font-normal text-muted-foreground"> · {user.role}</span>
            )}
          </p>
        </div>
      </div>

      <CommandKpis snapshot={snapshot} history={history} />

      <div className="grid gap-3 min-[1800px]:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0">
          <LiveCorridor
            snapshot={snapshot}
            playing={playing}
            onTogglePlay={() => setPlaying(!playing)}
            selection={selection}
            onSelect={setSelection}
            matchIds={matchIds}
          />
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-2 min-[1800px]:grid-cols-1 min-[1800px]:content-start">
          <AiRecommendationPanel trains={snapshot.trains} />
          <LiveAlertsPanel snapshot={snapshot} />
        </div>
      </div>
    </section>
  );
}
