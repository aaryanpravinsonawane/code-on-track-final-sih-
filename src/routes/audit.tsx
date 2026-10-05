import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MainShell } from "@/components/trackwise/MainShell";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";
import { workflowApiConfigured, workflowService } from "@/services/api/workflowService";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — CODEONTRACK Simulation" },
      {
        name: "description",
        content:
          "Chronological audit trail of plan generation, approvals, rejections, role changes and what-if simulations in the CODEONTRACK prototype.",
      },
      { property: "og:title", content: "Audit Log — CODEONTRACK" },
      {
        property: "og:description",
        content: "Traceable record of every planning action in the simulation.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { audit, workflowAudit, role, planStatus, demoMode } = useTrackwise();
  const [query, setQuery] = useState("");
  const [verifying, setVerifying] = useState(false);
  const rows = useMemo(() => {
    const entries = [
      ...workflowAudit.map((event) => ({
        id: event.id,
        timestamp: event.timestamp,
        user: event.user,
        role: event.role,
        entity: event.entity_id,
        action: event.action,
        previous: event.previous_state,
        next: event.new_state,
        hash: event.integrity_hash,
      })),
      ...audit.map((event) => ({
        id: event.id,
        timestamp: event.at,
        user: "LOCAL SESSION",
        role: event.role,
        entity: "PLAN",
        action: event.action,
        previous: null,
        next: event.detail,
        hash: "NOT HASHED",
      })),
    ];
    const needle = query.trim().toLowerCase();
    return entries
      .filter(
        (event) =>
          !needle ||
          `${event.id} ${event.user} ${event.role} ${event.entity} ${event.action}`
            .toLowerCase()
            .includes(needle),
      )
      .reverse();
  }, [audit, query, workflowAudit]);

  const verify = async () => {
    setVerifying(true);
    try {
      if (workflowApiConfigured) {
        const result = await workflowService.verifyAudit();
        toast[result.valid ? "success" : "error"](
          result.valid
            ? `Verified ${result.verified_events} audit events.`
            : "Audit chain verification failed.",
        );
      } else {
        let previousHash = "0".repeat(64);
        for (const event of workflowAudit) {
          const { integrity_hash: hash, ...payload } = event;
          const digest = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(JSON.stringify(payload)),
          );
          const computed = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
          if (event.previous_hash !== previousHash || hash !== computed)
            throw new Error("Audit chain verification failed.");
          previousHash = hash;
        }
        toast.success(`Verified ${workflowAudit.length} local workflow audit event(s).`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify audit history.");
    } finally {
      setVerifying(false);
    }
  };

  const exportCsv = () => {
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      [
        "Event ID",
        "Timestamp",
        "User",
        "Role",
        "Entity",
        "Action",
        "Previous State",
        "New State",
        "Integrity Hash",
      ],
      ...rows.map((event) => [
        event.id,
        event.timestamp,
        event.user,
        event.role,
        event.entity,
        event.action,
        JSON.stringify(event.previous),
        JSON.stringify(event.next),
        event.hash,
      ]),
    ]
      .map((line) => line.map(quote).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "codeontrack-audit.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainShell
      title="AUDIT LOG"
      subtitle={`Secure audit trail · Active role: ${role} · Current plan status: ${planStatus}`}
    >
      {demoMode && (
        <p className="mb-4 border-l-2 border-warn bg-warn/10 px-3 py-2 text-xs text-warn-foreground">
          Audit entries are from the simulated CODEONTRACK workflow unless an API backend is
          configured.
        </p>
      )}
      <Panel
        title={`Recorded actions (${rows.length})`}
        right={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void verify()} disabled={verifying}>
              <ShieldCheck className="mr-1.5 size-4" />
              {verifying ? "Verifying..." : "Verify chain"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 size-4" />
              Export CSV
            </Button>
          </div>
        }
      >
        <input
          aria-label="Search audit events"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search event, user, entity, or action"
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No actions match this search. Workflow events will appear here after requests,
            approvals, issue updates, or field reports.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] tracking-[0.08em] uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Event / Time</th>
                  <th className="py-2 pr-3">User / Role</th>
                  <th className="py-2 pr-3">Entity</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Previous → New</th>
                  <th className="py-2">Integrity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event) => (
                  <tr key={event.id} className="border-b border-border/60 last:border-0 align-top">
                    <td className="py-2.5 pr-3">
                      <span className="font-mono text-xs">{event.id}</span>
                      <p className="mt-1 whitespace-nowrap text-[10px] text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs font-semibold">{event.user}</span>
                      <p className="text-[10px] text-muted-foreground">{event.role}</p>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{event.entity}</td>
                    <td className="py-2.5 pr-3 text-xs">{event.action}</td>
                    <td className="max-w-72 py-2.5 pr-3 text-[10px] text-muted-foreground">
                      <details>
                        <summary className="cursor-pointer">View state change</summary>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify({ previous: event.previous, next: event.next }, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td className="max-w-40 break-all py-2.5 font-mono text-[10px] text-muted-foreground">
                      {event.hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </MainShell>
  );
}
