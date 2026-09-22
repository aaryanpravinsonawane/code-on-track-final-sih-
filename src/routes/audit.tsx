import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — TRACKWISE Simulation" },
      {
        name: "description",
        content:
          "Chronological audit trail of plan generation, approvals, rejections, role changes and what-if simulations in the TRACKWISE prototype.",
      },
      { property: "og:title", content: "Audit Log — TRACKWISE" },
      { property: "og:description", content: "Traceable record of every planning action in the simulation." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { audit, role, planStatus } = useTrackwise();
  return (
    <MainShell
      title="AUDIT LOG"
      subtitle={`Secure audit trail · Active role: ${role} · Current plan status: ${planStatus}`}
    >
      <Panel title={`Recorded actions (${audit.length})`}>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No actions recorded yet in this session. Generate a plan, approve it or run a simulation.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-[0.08em] uppercase text-muted-foreground">
                <th className="py-2 pr-3">Ref</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-mono text-xs">{a.id}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{a.at}</td>
                  <td className="py-2.5 pr-3 font-semibold">{a.role}</td>
                  <td className="py-2.5 pr-3">{a.action}</td>
                  <td className="py-2.5 text-muted-foreground">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </MainShell>
  );
}
