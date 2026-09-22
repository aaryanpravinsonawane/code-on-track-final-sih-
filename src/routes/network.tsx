import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { NetworkMap, SectionStatusBadge } from "@/components/trackwise/NetworkMap";
import { DeptTag, Panel, PriorityTag, StatusTag } from "@/components/trackwise/shared";
import { fmt } from "@/lib/trackwise/data";
import {
  getSections,
  getStations,
  sectionRouteNames,
  sectionStatus,
  sectionSummary,
  stationSummary,
  validateNetwork,
} from "@/lib/trackwise/network";
import { useTrackwise } from "@/lib/trackwise/store";
import type { SectionId } from "@/lib/trackwise/types";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Railway Network — TRACKWISE Corridor Model" },
      {
        name: "description",
        content:
          "Interactive simulated railway corridor NDG–KRP–STP–DVR–MRG with section traffic, status, maintenance load and planned blocks.",
      },
      { property: "og:title", content: "TRACKWISE Railway Network View" },
      {
        property: "og:description",
        content: "Simulated corridor data model shared by the dashboard, planner and timeline.",
      },
    ],
  }),
  component: NetworkPage,
});

function NetworkPage() {
  const { plan } = useTrackwise();
  const blocks = plan?.blocks ?? [];
  const sections = getSections();
  const stations = getStations();

  const [selSection, setSelSection] = useState<SectionId | null>(null);
  const [selStation, setSelStation] = useState<string | null>(null);

  const [fSection, setFSection] = useState("all");
  const [fStation, setFStation] = useState("all");
  const [fTraffic, setFTraffic] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [q, setQ] = useState("");

  const validation = useMemo(() => validateNetwork(), []);

  const rows = sections.filter((s) => {
    if (fSection !== "all" && s.id !== fSection) return false;
    if (fStation !== "all" && s.sourceStation !== fStation && s.destinationStation !== fStation)
      return false;
    if (fTraffic !== "all" && s.trafficLevel !== fTraffic) return false;
    if (fStatus !== "all" && s.operationalStatus !== fStatus) return false;
    if (q.trim()) {
      const hay = `${s.id} ${s.name} ${s.sourceStation} ${s.destinationStation} ${sectionRouteNames(s.id)}`;
      if (!hay.toLowerCase().includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const secDetail = selSection ? sectionSummary(selSection, blocks) : undefined;
  const staDetail = selStation ? stationSummary(selStation) : undefined;

  const selectSection = (id: SectionId) => {
    setSelStation(null);
    setSelSection((p) => (p === id ? null : id));
  };
  const selectStation = (code: string) => {
    setSelSection(null);
    setSelStation((p) => (p === code ? null : code));
  };

  return (
    <MainShell
      title="RAILWAY NETWORK"
      subtitle="Simulated corridor NDG — KRP — STP — DVR — MRG · single source of truth for trains, tasks, windows and blocks"
    >
      <Panel
        title="Corridor Schematic"
        right={
          <span className="text-[11px] text-muted-foreground">
            {validation.counts.stations} stations · {validation.counts.sections} sections ·{" "}
            {validation.counts.trains} trains · {validation.counts.tasks} tasks
            {validation.ok ? " · references valid" : ` · ${validation.issues.length} issue(s)`}
          </span>
        }
      >
        <NetworkMap
          blocks={blocks}
          onSelectSection={selectSection}
          onSelectStation={selectStation}
          selectedSection={selSection}
          selectedStation={selStation}
        />
      </Panel>

      {(secDetail || staDetail) && (
        <div className="mt-4">
          <Panel
            title={secDetail ? `Section ${secDetail.section.id}` : `Station ${staDetail!.station.code}`}
            right={
              <button
                type="button"
                onClick={() => {
                  setSelSection(null);
                  setSelStation(null);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                <X className="size-3.5" /> Close
              </button>
            }
          >
            {secDetail && (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div>
                  <p className="font-display text-lg font-bold">
                    {sectionRouteNames(secDetail.section.id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {secDetail.section.sourceStation} → {secDetail.section.destinationStation}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Field k="Distance" v={`${secDetail.section.distanceKm} km`} />
                    <Field k="Traffic" v={secDetail.section.trafficLevel} />
                    <Field k="Operational" v={secDetail.section.operationalStatus} />
                    <Field k="Maintenance" v={secDetail.section.maintenanceStatus} />
                    <Field k="Pending maintenance" v={String(secDetail.pendingTasks)} />
                    <Field k="Planned blocks" v={String(secDetail.plannedBlocks.length)} />
                    <Field k="Conflicts" v={String(secDetail.conflicts)} />
                    <Field k="Trains today" v={String(secDetail.trains.length)} />
                  </dl>
                  <div className="mt-3">
                    <SectionStatusBadge status={secDetail.status} />
                  </div>
                  <div className="mt-3 rounded-md border border-border bg-panel-muted p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      DECLARED WINDOWS
                    </p>
                    <ul className="mt-1 space-y-1 font-mono text-xs">
                      {secDetail.windows.map((w) => (
                        <li key={w.id}>
                          {fmt(w.start)}–{fmt(w.end)}{" "}
                          <span className="font-sans text-muted-foreground">{w.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
                      RELATED MAINTENANCE TASKS ({secDetail.tasks.length})
                    </p>
                    <div className="max-h-64 overflow-auto rounded-md border border-border">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-border">
                          {secDetail.tasks.map((t) => (
                            <tr key={t.id} className="hover:bg-accent/60">
                              <td className="px-2 py-1.5 font-mono text-xs">{t.id}</td>
                              <td className="px-2 py-1.5">
                                <DeptTag dept={t.department} />
                              </td>
                              <td className="px-2 py-1.5">{t.workType}</td>
                              <td className="px-2 py-1.5 text-xs text-muted-foreground">
                                {t.duration} min
                              </td>
                              <td className="px-2 py-1.5">
                                <PriorityTag task={t} />
                              </td>
                              <td className="px-2 py-1.5">
                                <StatusTag status={t.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
                      TRAINS ON SECTION ({secDetail.trains.length})
                    </p>
                    <div className="max-h-56 overflow-auto rounded-md border border-border">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-border">
                          {secDetail.trains.map((t) => (
                            <tr key={t.id} className="hover:bg-accent/60">
                              <td className="px-2 py-1.5 font-mono text-xs">{t.id}</td>
                              <td className="px-2 py-1.5">{t.name}</td>
                              <td className="px-2 py-1.5 text-xs text-muted-foreground">{t.type}</td>
                              <td className="px-2 py-1.5 font-mono text-xs">
                                {fmt(t.arrival)}–{fmt(t.departure)}
                              </td>
                              <td className="px-2 py-1.5 text-xs text-muted-foreground">
                                P{t.priority}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {staDetail && (
              <div className="grid gap-4 md:grid-cols-2">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Field k="Station code" v={staDetail.station.code} />
                  <Field k="Station name" v={staDetail.station.name} />
                  <Field k="Simulated trains" v={String(staDetail.trains)} />
                  <Field k="Pending maintenance" v={String(staDetail.pendingTasks)} />
                </dl>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
                    CONNECTED SECTIONS
                  </p>
                  <ul className="space-y-2">
                    {staDetail.connectedSections.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-panel-muted px-3 py-2 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => selectSection(s.id)}
                          className="font-display font-bold text-primary hover:underline"
                        >
                          {s.id}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {s.sourceStation} → {s.destinationStation} · {s.distanceKm} km
                        </span>
                        <span className="ml-auto">
                          <SectionStatusBadge status={sectionStatus(s.id, blocks)} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      <div className="mt-4">
        <Panel title="Section Register">
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search section or station…"
              className="w-56 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Select value={fSection} onChange={setFSection} label="Section">
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}
                </option>
              ))}
            </Select>
            <Select value={fStation} onChange={setFStation} label="Station">
              {stations.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>
            <Select value={fTraffic} onChange={setFTraffic} label="Traffic">
              {["Low", "Medium", "High"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Select value={fStatus} onChange={setFStatus} label="Operational status">
              {["Operational", "Restricted", "Suspended"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-2 py-2">Section</th>
                  <th className="px-2 py-2">Route</th>
                  <th className="px-2 py-2">Distance</th>
                  <th className="px-2 py-2">Traffic</th>
                  <th className="px-2 py-2">Operational</th>
                  <th className="px-2 py-2">Pending</th>
                  <th className="px-2 py-2">Blocks</th>
                  <th className="px-2 py-2">Conflicts</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => {
                  const sum = sectionSummary(s.id, blocks)!;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => selectSection(s.id)}
                      className={`cursor-pointer hover:bg-accent/60 ${
                        selSection === s.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-2 py-2 font-display font-bold">{s.id}</td>
                      <td className="px-2 py-2 text-xs">
                        {s.sourceStation} → {s.destinationStation}
                        <span className="block text-muted-foreground">
                          {sectionRouteNames(s.id)}
                        </span>
                      </td>
                      <td className="px-2 py-2">{s.distanceKm} km</td>
                      <td className="px-2 py-2">{s.trafficLevel}</td>
                      <td className="px-2 py-2">{s.operationalStatus}</td>
                      <td className="px-2 py-2">{sum.pendingTasks}</td>
                      <td className="px-2 py-2">{sum.plannedBlocks.length}</td>
                      <td className={`px-2 py-2 ${sum.conflicts ? "text-danger" : ""}`}>
                        {sum.conflicts}
                      </td>
                      <td className="px-2 py-2">
                        <SectionStatusBadge status={sum.status} />
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-2 py-6 text-center text-muted-foreground">
                      No sections match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </MainShell>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-panel-muted px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="all">{label}: All</option>
      {children}
    </select>
  );
}
