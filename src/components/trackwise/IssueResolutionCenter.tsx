import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, Filter, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { MainShell } from "@/components/trackwise/MainShell";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";
import type { IssueSeverity, IssueStatus, ResolutionIssue } from "@/lib/trackwise/workflow";

const severities: Array<IssueSeverity | "All"> = ["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const sources = ["All", "TMS", "SMMS", "TDMS", "Station Master", "COA"] as const;
const departments = ["Operations", "Engineering", "S&T", "TRD"];
const issueStatuses: IssueStatus[] = ["Open", "Assigned", "In Progress", "Resolved"];
const severityWeight: Record<IssueSeverity, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

function canManageIssue(issue: ResolutionIssue, role: string) {
  if (["Admin", "DRM", "Station Master", "COA Controller", "Maintenance Engineer"].includes(role)) return true;
  return (
    (issue.source === "TMS" && role === "TMS Officer") ||
    (issue.source === "SMMS" && role === "SMMS Officer") ||
    (issue.source === "TDMS" && role === "TDMS Officer")
  );
}

export function IssueResolutionCenter() {
  const { issues, role, demoMode, updateWorkflowIssue } = useTrackwise();
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<IssueSeverity | "All">("All");
  const [source, setSource] = useState<(typeof sources)[number]>("All");
  const [sort, setSort] = useState("severity");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignedDepartment, setAssignedDepartment] = useState("Operations");
  const [status, setStatus] = useState<IssueStatus>("Open");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return issues
      .filter((issue) => severity === "All" || issue.severity === severity)
      .filter((issue) => source === "All" || issue.source === source)
      .filter((issue) => !needle || `${issue.id} ${issue.source} ${issue.location} ${issue.description} ${issue.assigned_department}`.toLowerCase().includes(needle))
      .sort((first, second) => sort === "newest"
        ? second.created_at.localeCompare(first.created_at)
        : severityWeight[second.severity] - severityWeight[first.severity] || second.created_at.localeCompare(first.created_at));
  }, [issues, query, severity, source, sort]);
  const selected = filtered.find((issue) => issue.id === selectedId) ?? filtered[0] ?? null;
  const severityCount = (value: IssueSeverity) => issues.filter((issue) => issue.severity === value).length;

  const chooseIssue = (issue: ResolutionIssue) => {
    setSelectedId(issue.id);
    setAssignedDepartment(issue.assigned_department);
    setStatus(issue.status);
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateWorkflowIssue(selected.id, { assigned_department: assignedDepartment, status });
      toast.success(`${selected.id} updated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update this issue.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <MainShell title="CENTRAL ISSUE RESOLUTION" subtitle="Cross-department control queue · authorized human decisions required">
      {demoMode && <div className="mb-4 border-l-2 border-warn bg-warn/10 px-3 py-2 text-xs text-warn-foreground">DEMONSTRATION DATA · Issues are simulated and not connected to railway live systems.</div>}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Critical" value={severityCount("CRITICAL")} icon={AlertTriangle} tone="danger" hint="Immediate control review" />
        <KpiCard label="High" value={severityCount("HIGH")} icon={ShieldCheck} tone="warn" hint="Priority attention" />
        <KpiCard label="Open" value={issues.filter((issue) => issue.status === "Open").length} icon={Clock3} hint="Awaiting assignment" />
        <KpiCard label="Resolved" value={issues.filter((issue) => issue.status === "Resolved").length} icon={ShieldCheck} tone="success" hint="Closed in workflow" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title={`ISSUE QUEUE (${filtered.length})`} right={<Filter className="size-4 text-muted-foreground" />}>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative sm:col-span-2"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className={`${inputClass} w-full pl-9`} aria-label="Search issues" placeholder="Search ID, location, or description" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <select className={inputClass} aria-label="Filter issue severity" value={severity} onChange={(event) => setSeverity(event.target.value as IssueSeverity | "All")}>{severities.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={inputClass} aria-label="Filter issue source" value={source} onChange={(event) => setSource(event.target.value as (typeof sources)[number])}>{sources.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={`${inputClass} sm:col-span-2 xl:col-span-4`} aria-label="Sort issues" value={sort} onChange={(event) => setSort(event.target.value)}><option value="severity">Sort by severity, then newest</option><option value="newest">Sort by newest</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead><tr className="border-b border-border text-left text-[10px] font-bold uppercase text-muted-foreground"><th className="py-2 pr-3">Issue</th><th className="py-2 pr-3">Source / Severity</th><th className="py-2 pr-3">Location</th><th className="py-2 pr-3">Time</th><th className="py-2">Status</th></tr></thead>
              <tbody>{filtered.map((issue) => <tr key={issue.id} className={`cursor-pointer border-b border-border/60 ${selected?.id === issue.id ? "bg-primary/5" : "hover:bg-accent/40"}`} onClick={() => chooseIssue(issue)}>
                <td className="py-2.5 pr-3"><span className="font-mono text-xs font-semibold">{issue.id}</span><p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{issue.description}</p></td>
                <td className="py-2.5 pr-3"><span className="block text-xs font-semibold">{issue.source}</span><span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${issue.severity === "CRITICAL" ? "bg-destructive/15 text-destructive" : issue.severity === "HIGH" ? "bg-warn/15 text-warn-foreground" : "bg-muted text-muted-foreground"}`}>{issue.severity}</span></td>
                <td className="py-2.5 pr-3 text-xs">{issue.location}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-muted-foreground">{new Date(issue.created_at).toLocaleString()}</td>
                <td className="py-2.5 text-xs">{issue.status}</td>
              </tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No issues match the current filters.</td></tr>}</tbody>
            </table>
          </div>
        </Panel>

        <Panel title="ISSUE DETAILS">
          {selected ? <div className="space-y-4">
            <div className="rounded-md border border-border bg-panel-muted p-3">
              <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-semibold">{selected.id}</span><span className="text-xs font-bold">{selected.severity}</span></div>
              <p className="mt-2 text-sm leading-5">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-muted-foreground">Source department</p><p className="mt-1 font-semibold">{selected.source}</p></div>
              <div><p className="text-muted-foreground">Event time</p><p className="mt-1 font-semibold">{new Date(selected.created_at).toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Location</p><p className="mt-1 font-semibold">{selected.location}</p></div>
              <div><p className="text-muted-foreground">Assigned department</p><p className="mt-1 font-semibold">{selected.assigned_department}</p></div>
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3"><p className="text-[10px] font-bold uppercase text-primary">Recommended action</p><p className="mt-1 text-sm">{selected.recommended_action}</p><p className="mt-2 text-[10px] text-muted-foreground">Decision support only; authorized staff must confirm operational actions.</p></div>
            {canManageIssue(selected, role) ? <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium">Assign department<select className={`${inputClass} mt-1 w-full`} value={assignedDepartment} onChange={(event) => setAssignedDepartment(event.target.value)}>{departments.map((department) => <option key={department}>{department}</option>)}</select></label>
              <label className="text-xs font-medium">Resolution status<select className={`${inputClass} mt-1 w-full`} value={status} onChange={(event) => setStatus(event.target.value as IssueStatus)}>{issueStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
              <Button className="sm:col-span-2" disabled={saving || (status === selected.status && assignedDepartment === selected.assigned_department)} onClick={() => void saveChanges()}>{saving ? "Saving..." : "Save issue update"}</Button>
            </div> : <p className="text-xs text-muted-foreground">{role} can view this issue but cannot assign or resolve it.</p>}
          </div> : <p className="py-8 text-center text-sm text-muted-foreground">Select an issue to inspect its details.</p>}
        </Panel>
      </div>
    </MainShell>
  );
}