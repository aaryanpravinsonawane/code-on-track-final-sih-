import { useMemo, useState, type FormEvent } from "react";
import { Check, ClipboardList, Plus, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Panel } from "@/components/trackwise/shared";
import { canTransitionBlock, type BlockAction, type BlockDemand, type BlockStatus, type DepartmentName } from "@/lib/trackwise/workflow";
import { useTrackwise } from "@/lib/trackwise/store";

const statusOptions: Array<BlockStatus | "All"> = [
  "All",
  "Draft",
  "Submitted",
  "AI Validated",
  "Pending Control Review",
  "Sanctioned",
  "Rejected",
  "Dispatched",
  "In Progress",
  "Completed",
];

const actionLabels: Partial<Record<BlockAction, string>> = {
  submit: "Submit",
  review: "Send to control review",
  sanction: "Sanction",
  trim: "Trim time",
  reject: "Reject",
  resubmit: "Re-submit",
  dispatch: "Dispatch",
  start: "Start work",
  complete: "Complete",
};

function minutesFromTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function displayTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function departmentForRole(role: string): DepartmentName | "" {
  if (role === "TMS Officer") return "Engineering";
  if (role === "SMMS Officer") return "S&T";
  if (role === "TDMS Officer") return "TRD";
  return "";
}

export function BlockWorkflowTable() {
  const {
    blockRequests,
    role,
    demoMode,
    createBlockDemand,
    transitionBlock,
  } = useTrackwise();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BlockStatus | "All">("All");
  const [sort, setSort] = useState("priority");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trimmedDuration, setTrimmedDuration] = useState(45);
  const [rejectionNote, setRejectionNote] = useState("");
  const [form, setForm] = useState({
    title: "",
    department: departmentForRole(role) || ("Engineering" as DepartmentName),
    section: "S1",
    track: "UP-MAIN",
    start: "13:00",
    end: "15:00",
    duration: "60",
    resources: "Track Gang A",
    urgency: "5",
    priority: "3",
    tsr: false,
    bundleKey: "",
  });

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return blockRequests
      .filter((block) => status === "All" || block.status === status)
      .filter((block) => !search || `${block.id} ${block.title} ${block.department} ${block.section} ${block.track}`.toLowerCase().includes(search))
      .sort((first, second) => {
        if (sort === "earliest") return first.window_start - second.window_start;
        if (sort === "status") return first.status.localeCompare(second.status);
        return second.priority - first.priority || second.urgency - first.urgency;
      });
  }, [blockRequests, query, sort, status]);
  const selected = blockRequests.find((block) => block.id === selectedId) ?? null;
  const canCreate = ["Admin", "Station Master", "TMS Officer", "SMMS Officer", "TDMS Officer", "Maintenance Engineer"].includes(role);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const start = minutesFromTime(form.start);
    const end = minutesFromTime(form.end);
    const duration = Number(form.duration);
    if (end <= start || duration <= 0 || duration > end - start) {
      toast.error("Duration must fit inside the selected block window.");
      return;
    }
    setSaving(true);
    try {
      const created = await createBlockDemand({
        title: form.title.trim(),
        department: form.department,
        section: form.section,
        track: form.track.trim(),
        window_start: start,
        window_end: end,
        duration_minutes: duration,
        resources: form.resources.split(",").map((resource) => resource.trim()).filter(Boolean),
        urgency: Number(form.urgency),
        priority: Number(form.priority),
        tsr_required: form.tsr,
        bundle_key: form.bundleKey.trim() || null,
      });
      setSelectedId(created.id);
      setFormOpen(false);
      setForm((current) => ({ ...current, title: "" }));
      toast.success(`${created.id} saved as a draft.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save this request.");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (block: BlockDemand, action: BlockAction) => {
    try {
      const options = action === "trim"
        ? { trimmed_duration_minutes: trimmedDuration, note: "Duration reduced by control review." }
        : action === "reject"
          ? { note: rejectionNote.trim() }
          : {};
      await transitionBlock(block.id, action, options);
      if (action === "trim") setTrimmedDuration(Math.max(1, block.duration_minutes - 15));
      if (action === "reject") setRejectionNote("");
      toast.success(`${block.id}: ${actionLabels[action] ?? action} recorded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This workflow action failed.");
    }
  };

  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <Panel
      title="BLOCK DEMAND & APPROVAL WORKFLOW"
      subtitle={`${blockRequests.length} shared requests · ${demoMode ? "simulated demo records" : "backend-connected records"}`}
      right={canCreate ? (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 size-4" />New request</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New block request</DialogTitle>
              <DialogDescription>Enter the proposed window, track, resources, urgency, and department.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2 text-xs font-medium">Work package<input required minLength={3} maxLength={200} className={`${inputClass} mt-1`} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label className="text-xs font-medium">Department<select className={`${inputClass} mt-1`} value={form.department} disabled={Boolean(departmentForRole(role))} onChange={(event) => setForm({ ...form, department: event.target.value as DepartmentName })}><option>Engineering</option><option>S&amp;T</option><option>TRD</option></select></label>
              <label className="text-xs font-medium">Section<select className={`${inputClass} mt-1`} value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })}>{["S1", "S2", "S3", "S4"].map((sectionId) => <option key={sectionId}>{sectionId}</option>)}</select></label>
              <label className="text-xs font-medium">Track<input required className={`${inputClass} mt-1`} value={form.track} onChange={(event) => setForm({ ...form, track: event.target.value })} /></label>
              <label className="text-xs font-medium">Machinery / crew<input required className={`${inputClass} mt-1`} value={form.resources} onChange={(event) => setForm({ ...form, resources: event.target.value })} /></label>
              <label className="text-xs font-medium">Start time<input type="time" required className={`${inputClass} mt-1`} value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></label>
              <label className="text-xs font-medium">End time<input type="time" required className={`${inputClass} mt-1`} value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></label>
              <label className="text-xs font-medium">Duration (minutes)<input type="number" min={1} max={1440} required className={`${inputClass} mt-1`} value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></label>
              <label className="text-xs font-medium">Urgency<select className={`${inputClass} mt-1`} value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value })}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>
              <label className="text-xs font-medium">Priority<select className={`${inputClass} mt-1`} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              <label className="text-xs font-medium">Bundle key<input className={`${inputClass} mt-1`} value={form.bundleKey} onChange={(event) => setForm({ ...form, bundleKey: event.target.value })} placeholder="Same key can group compatible work" /></label>
              <label className="flex items-center gap-2 text-xs font-medium sm:col-span-2"><input type="checkbox" checked={form.tsr} onChange={(event) => setForm({ ...form, tsr: event.target.checked })} />TSR restriction required</label>
              <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save draft"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      ) : undefined}
    >
      {demoMode && <div className="mb-3 border-l-2 border-warn bg-warn/10 px-3 py-2 text-xs text-warn-foreground">DEMONSTRATION DATA · Actions persist in this browser only; no railway live systems are connected.</div>}
      <div className="mb-3 flex flex-wrap gap-2">
        <label className="relative min-w-48 flex-1"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className={`${inputClass} pl-9`} aria-label="Search block requests" placeholder="Search requests" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select className={inputClass + " w-auto min-w-40"} aria-label="Filter requests by status" value={status} onChange={(event) => setStatus(event.target.value as BlockStatus | "All")}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>
        <select className={inputClass + " w-auto min-w-36"} aria-label="Sort block requests" value={sort} onChange={(event) => setSort(event.target.value)}><option value="priority">Priority first</option><option value="earliest">Earliest window</option><option value="status">Status</option></select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-225 text-sm">
          <thead><tr className="border-b border-border text-left text-[10px] font-bold uppercase text-muted-foreground"><th className="py-2 pr-3">Request</th><th className="py-2 pr-3">Department</th><th className="py-2 pr-3">Section / Track</th><th className="py-2 pr-3">Window</th><th className="py-2 pr-3">Priority</th><th className="py-2 pr-3">Status</th><th className="py-2">Details</th></tr></thead>
          <tbody>
            {rows.map((block) => <tr key={block.id} className={`border-b border-border/60 ${selectedId === block.id ? "bg-primary/5" : ""}`}>
              <td className="py-2.5 pr-3"><span className="font-mono text-xs font-semibold">{block.id}</span><p className="text-xs text-muted-foreground">{block.title}</p></td>
              <td className="py-2.5 pr-3">{block.department}</td>
              <td className="py-2.5 pr-3">{block.section} · {block.track}</td>
              <td className="py-2.5 pr-3 font-mono text-xs">{displayTime(block.window_start)}–{displayTime(block.window_end)}</td>
              <td className="py-2.5 pr-3">P{block.priority} · U{block.urgency}</td>
              <td className="py-2.5 pr-3"><span className="inline-flex rounded border border-border bg-panel-muted px-2 py-1 text-xs">{block.status}{block.replan_required ? " · Replan" : ""}</span></td>
              <td className="py-2.5"><Button variant="outline" size="sm" onClick={() => { setSelectedId(block.id); setTrimmedDuration(Math.max(1, block.duration_minutes - 15)); }}>View</Button></td>
            </tr>)}
            {rows.length === 0 && <tr><td className="py-8 text-center text-sm text-muted-foreground" colSpan={7}>No block requests match the selected filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && <div className="mt-4 grid gap-4 border-t border-border pt-4 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-2"><ClipboardList className="size-4 text-primary" /><h3 className="text-sm font-semibold">{selected.id} · {selected.title}</h3></div>
          <p className="mt-2 text-xs text-muted-foreground">{selected.department} · {selected.section} / {selected.track} · {displayTime(selected.window_start)}–{displayTime(selected.window_end)} · {selected.duration_minutes} min</p>
          <p className="mt-1 text-xs text-muted-foreground">Resources: {selected.resources.join(", ") || "None listed"} · Priority {selected.priority} · Urgency {selected.urgency} · TSR {selected.tsr_required ? "required" : "not requested"}</p>
          {selected.replan_required && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-warn-foreground"><ShieldAlert className="size-3.5" />Disruption flagged; re-planning required.</p>}
        </div>
        <div className="flex flex-wrap items-end justify-start gap-2 lg:justify-end">
          {selected.status === "Pending Control Review" && canTransitionBlock(selected, "trim", role) && <label className="text-[10px] font-medium">Trim to min<input type="number" min={1} max={selected.duration_minutes - 1} className="mt-1 block w-24 rounded-md border border-input bg-background px-2 py-1.5 text-xs" value={trimmedDuration} onChange={(event) => setTrimmedDuration(Number(event.target.value))} /></label>}
          {selected.status === "Pending Control Review" && canTransitionBlock(selected, "reject", role) && <label className="text-[10px] font-medium">Rejection reason<input className="mt-1 block w-40 rounded-md border border-input bg-background px-2 py-1.5 text-xs" value={rejectionNote} onChange={(event) => setRejectionNote(event.target.value)} placeholder="Required to reject" /></label>}
          {(Object.keys(actionLabels) as BlockAction[]).filter((action) => canTransitionBlock(selected, action, role)).map((action) => <Button key={action} size="sm" variant={action === "reject" ? "destructive" : "outline"} disabled={action === "trim" ? trimmedDuration <= 0 || trimmedDuration >= selected.duration_minutes : action === "reject" && rejectionNote.trim().length < 3} onClick={() => void runAction(selected, action)}><Check className="mr-1.5 size-3.5" />{actionLabels[action]}</Button>)}
          {!Object.keys(actionLabels).some((action) => canTransitionBlock(selected, action as BlockAction, role)) && <span className="text-xs text-muted-foreground">{role} has no action on this request at its current stage.</span>}
        </div>
      </div>}
    </Panel>
  );
}