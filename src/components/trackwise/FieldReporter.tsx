import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, ClipboardPlus, Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";
import type { FieldEventType, IssueSeverity } from "@/lib/trackwise/workflow";

const eventTypes: FieldEventType[] = [
  "Machine Breakdown",
  "Machine Unavailable",
  "Material Delayed",
  "Crew Unavailable",
  "Work Started",
  "Work Delayed",
  "Work Completed Early",
];
const severities: IssueSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function localDateTime() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function FieldReporter() {
  const { user, role, blockRequests, fieldReports, demoMode, submitFieldReport } = useTrackwise();
  const [eventType, setEventType] = useState<FieldEventType>("Machine Breakdown");
  const [asset, setAsset] = useState("");
  const [workPackage, setWorkPackage] = useState("");
  const [severity, setSeverity] = useState<IssueSeverity>("HIGH");
  const [eventTime, setEventTime] = useState(localDateTime);
  const [remarks, setRemarks] = useState("");
  const [location, setLocation] = useState("");
  const [blockId, setBlockId] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return fieldReports
      .filter((report) => !needle || `${report.id} ${report.event_type} ${report.asset} ${report.work_package_id} ${report.location} ${report.reported_by}`.toLowerCase().includes(needle))
      .sort((first, second) => second.received_at.localeCompare(first.received_at));
  }, [fieldReports, query]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await submitFieldReport({
        event_type: eventType,
        asset: asset.trim(),
        work_package_id: workPackage.trim(),
        severity,
        event_time: new Date(eventTime).toISOString(),
        remarks: remarks.trim(),
        location: location.trim(),
        ...(blockId ? { block_id: blockId } : {}),
      });
      const count = response.schedule_impact.metrics.scheduled;
      toast.success(`Report logged; replanning returned ${count} scheduled request(s) (${response.schedule_impact.solver_status}).`);
      setRemarks("");
      setAsset("");
      setWorkPackage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit the field report.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <Panel title="FIELD REPORTER" subtitle="Disruptions create a linked issue and immediately request a schedule re-plan." className="mb-4">
      {demoMode && <p className="mb-3 border-l-2 border-warn bg-warn/10 px-3 py-2 text-xs text-warn-foreground">SIMULATED FIELD REPORTS · No live railway telemetry or work orders are affected.</p>}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-medium">Event type<select className={`${inputClass} mt-1`} value={eventType} onChange={(event) => setEventType(event.target.value as FieldEventType)}>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="text-xs font-medium">Asset<input required minLength={1} maxLength={120} className={`${inputClass} mt-1`} value={asset} onChange={(event) => setAsset(event.target.value)} placeholder="Machine / asset ID" /></label>
        <label className="text-xs font-medium">Work package ID<input required minLength={1} maxLength={80} className={`${inputClass} mt-1`} value={workPackage} onChange={(event) => setWorkPackage(event.target.value)} placeholder="Work package" /></label>
        <label className="text-xs font-medium">Severity<select className={`${inputClass} mt-1`} value={severity} onChange={(event) => setSeverity(event.target.value as IssueSeverity)}>{severities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium">Event time<input type="datetime-local" required className={`${inputClass} mt-1`} value={eventTime} onChange={(event) => setEventTime(event.target.value)} /></label>
        <label className="text-xs font-medium">Location<input required minLength={2} maxLength={160} className={`${inputClass} mt-1`} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Section, station, or km" /></label>
        <label className="text-xs font-medium">Related block request<select className={`${inputClass} mt-1`} value={blockId} onChange={(event) => setBlockId(event.target.value)}><option value="">No linked block</option>{blockRequests.filter((block) => block.status !== "Completed").map((block) => <option key={block.id} value={block.id}>{block.id} · {block.title}</option>)}</select></label>
        <label className="text-xs font-medium">Reported by<input readOnly className={`${inputClass} mt-1 bg-muted`} value={user?.employeeId ?? user?.name ?? role} /></label>
        <label className="text-xs font-medium sm:col-span-2 xl:col-span-3">Remarks<textarea required minLength={3} maxLength={2000} className={`${inputClass} mt-1 min-h-20 resize-y`} value={remarks} onChange={(event) => setRemarks(event.target.value)} /></label>
        <div className="flex items-end"><Button type="submit" className="w-full" disabled={saving}><ClipboardPlus className="mr-2 size-4" />{saving ? "Submitting..." : "Submit & re-plan"}</Button></div>
      </form>

      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-2 flex flex-wrap items-center gap-2"><div className="flex items-center gap-2"><Radio className="size-4 text-primary" /><h3 className="text-xs font-bold uppercase text-primary">Recent field reports ({rows.length})</h3></div><input className={`${inputClass} ml-auto w-full sm:w-64`} aria-label="Search field reports" placeholder="Search reports" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-180 text-sm"><thead><tr className="border-b border-border text-left text-[10px] font-bold uppercase text-muted-foreground"><th className="py-2 pr-3">Event</th><th className="py-2 pr-3">Asset / package</th><th className="py-2 pr-3">Severity</th><th className="py-2 pr-3">Location</th><th className="py-2 pr-3">Reported by</th><th className="py-2">Received</th></tr></thead><tbody>{rows.map((report) => <tr key={report.id} className="border-b border-border/60"><td className="py-2 pr-3"><span className="font-medium">{report.event_type}</span><p className="text-[10px] text-muted-foreground">{report.id}</p></td><td className="py-2 pr-3">{report.asset}<p className="text-[10px] text-muted-foreground">{report.work_package_id}</p></td><td className="py-2 pr-3">{report.severity}</td><td className="py-2 pr-3">{report.location}</td><td className="py-2 pr-3">{report.reported_by}</td><td className="py-2 text-xs text-muted-foreground">{new Date(report.received_at).toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="flex items-center gap-2 py-4 text-xs text-muted-foreground"><AlertTriangle className="size-4" />No field reports have been submitted in this workspace.</p>}
      </div>
    </Panel>
  );
}