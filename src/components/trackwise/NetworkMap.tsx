import {
  getSections,
  getStations,
  pendingTasksInSection,
  sectionStatus,
  trainsInSection,
} from "@/lib/trackwise/network";
import type { BlockPlan, SectionId, SectionStatus } from "@/lib/trackwise/types";

export const STATUS_STYLE: Record<SectionStatus, { bar: string; text: string; dot: string }> = {
  Operational: { bar: "bg-success", text: "text-success", dot: "bg-success" },
  "Maintenance Pending": { bar: "bg-warn", text: "text-warn-foreground", dot: "bg-warn" },
  "Block Planned": { bar: "bg-info", text: "text-info", dot: "bg-info" },
  "Conflict Detected": { bar: "bg-danger", text: "text-danger", dot: "bg-danger" },
};

export function SectionStatusBadge({ status }: { status: SectionStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-border bg-panel-muted px-2 py-0.5 text-[11px] font-semibold ${s.text}`}
    >
      <span className={`size-2 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export function NetworkMap({
  blocks = [],
  onSelectSection,
  onSelectStation,
  selectedSection,
  selectedStation,
}: {
  blocks?: BlockPlan[];
  onSelectSection?: (id: SectionId) => void;
  onSelectStation?: (code: string) => void;
  selectedSection?: SectionId | null;
  selectedStation?: string | null;
}) {
  const stations = getStations();
  const sections = getSections();
  const interactive = Boolean(onSelectSection || onSelectStation);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="flex items-stretch">
          {stations.map((st, i) => {
            const section = sections[i];
            const status = section ? sectionStatus(section.id, blocks) : null;
            return (
              <div key={st.code} className="flex flex-1 items-stretch last:flex-none">
                <button
                  type="button"
                  disabled={!onSelectStation}
                  onClick={() => onSelectStation?.(st.code)}
                  className={`flex w-28 shrink-0 flex-col items-center rounded-md px-1 py-1 transition-colors ${
                    onSelectStation ? "cursor-pointer hover:bg-accent" : "cursor-default"
                  } ${selectedStation === st.code ? "bg-primary/10 ring-1 ring-primary" : ""}`}
                >
                  <span className="grid size-12 place-items-center rounded-full border-2 border-primary bg-panel font-display text-sm font-bold text-primary">
                    {st.code}
                  </span>
                  <span className="mt-2 text-center text-[11px] font-semibold">{st.name}</span>
                  <span className="text-[11px] text-muted-foreground">Station {st.id}</span>
                </button>

                {section && status && (
                  <div className="flex flex-1 flex-col justify-start pt-4">
                    <button
                      type="button"
                      disabled={!onSelectSection}
                      onClick={() => onSelectSection?.(section.id)}
                      className={`w-full rounded-md px-2 py-1 text-left transition-colors ${
                        onSelectSection ? "cursor-pointer hover:bg-accent" : "cursor-default"
                      } ${selectedSection === section.id ? "bg-primary/10 ring-1 ring-primary" : ""}`}
                    >
                      <span className="relative block h-3 rounded-full bg-grid">
                        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-panel-muted" />
                        <span
                          className={`absolute inset-y-0 left-0 rounded-full ${STATUS_STYLE[status].bar}`}
                          style={{
                            width: `${Math.min(100, 35 + pendingTasksInSection(section.id).length * 6)}%`,
                          }}
                        />
                      </span>
                      <span className="mt-2 flex flex-wrap items-center justify-center gap-2 text-center">
                        <span className="font-display text-sm font-bold">{section.id}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {section.distanceKm} km · {section.trafficLevel} traffic
                        </span>
                        <span className={`text-[11px] font-semibold ${STATUS_STYLE[status].text}`}>
                          {status}
                        </span>
                      </span>
                      <span className="mt-1 flex flex-wrap justify-center gap-1">
                        <span className="rounded border border-border bg-panel-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {trainsInSection(section.id).length} trains
                        </span>
                        <span className="rounded border border-border bg-panel-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {pendingTasksInSection(section.id).length} pending tasks
                        </span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          <Legend cls="bg-success" label="Operational" />
          <Legend cls="bg-warn" label="Maintenance Pending" />
          <Legend cls="bg-info" label="Block Planned" />
          <Legend cls="bg-danger" label="Conflict Detected" />
          {interactive && <span>Click any station or section for details</span>}
        </div>
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full ${cls}`} />
      {label}
    </span>
  );
}
