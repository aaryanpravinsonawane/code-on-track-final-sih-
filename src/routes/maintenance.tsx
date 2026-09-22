import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MainShell } from "@/components/trackwise/MainShell";
import { DeptTag, Panel, PriorityTag, StatusTag } from "@/components/trackwise/shared";
import { SECTIONS, TASKS } from "@/lib/trackwise/data";
import { priorityBand, priorityScore } from "@/lib/trackwise/engine";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance Register — TRACKWISE Simulation" },
      {
        name: "description",
        content:
          "Filterable register of 30 simulated Engineering, S&T and TRD maintenance tasks by department, priority and corridor section.",
      },
      { property: "og:title", content: "Maintenance Register — TRACKWISE" },
      {
        property: "og:description",
        content: "Simulated maintenance task register with department, priority and section filters.",
      },
    ],
  }),
  component: MaintenancePage,
});

const DEPTS = ["All", "Engineering", "S&T", "TRD"] as const;
const PRIOS = ["All", "High", "Medium", "Low"] as const;

function MaintenancePage() {
  const [dept, setDept] = useState<string>("All");
  const [prio, setPrio] = useState<string>("All");
  const [section, setSection] = useState<string>("All");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      TASKS.filter(
        (t) =>
          (dept === "All" || t.department === dept) &&
          (prio === "All" || priorityBand(t) === prio) &&
          (section === "All" || t.section === section) &&
          (q === "" ||
            `${t.id} ${t.workType} ${t.assetType}`.toLowerCase().includes(q.toLowerCase())),
      ).sort((a, b) => priorityScore(b) - priorityScore(a)),
    [dept, prio, section, q],
  );

  const sel =
    "rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <MainShell
      title="MAINTENANCE REGISTER"
      subtitle="30 simulated maintenance requests raised by Engineering, S&T and TRD"
    >
      <Panel
        title={`Tasks (${rows.length})`}
        right={
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search task or asset…"
              className={sel}
            />
            <select value={dept} onChange={(e) => setDept(e.target.value)} className={sel}>
              {DEPTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select value={prio} onChange={(e) => setPrio(e.target.value)} className={sel}>
              {PRIOS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select value={section} onChange={(e) => setSection(e.target.value)} className={sel}>
              <option>All</option>
              {SECTIONS.map((s) => (
                <option key={s.id}>{s.id}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-[0.08em] uppercase text-muted-foreground">
                <th className="py-2 pr-3">Task ID</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 pr-3">Work Type</th>
                <th className="py-2 pr-3">Asset</th>
                <th className="py-2 pr-3">Duration</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Resources</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                  <td className="py-2.5 pr-3 font-mono text-xs font-semibold">{t.id}</td>
                  <td className="py-2.5 pr-3">
                    <DeptTag dept={t.department} />
                  </td>
                  <td className="py-2.5 pr-3 font-semibold">{t.section}</td>
                  <td className="py-2.5 pr-3">{t.workType}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{t.assetType}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{t.duration} min</td>
                  <td className="py-2.5 pr-3 tabular-nums font-semibold">{priorityScore(t)}</td>
                  <td className="py-2.5 pr-3">
                    <PriorityTag task={t} />
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                    {t.requiredResources.join(", ")}
                  </td>
                  <td className="py-2.5">
                    <StatusTag status={t.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    No tasks match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Priority score = criticality weight + urgency + overdue ageing. Simulated values only.
        </p>
      </Panel>
    </MainShell>
  );
}
