import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart, FileText } from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { Panel } from "@/components/trackwise/shared";
import { Button } from "@/components/ui/button";
import { useLiveSimulation } from "@/lib/liveSimulation";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const live = useLiveSimulation();
  const generatedAt = new Date(live.updated_at).toLocaleString("en-GB");
  const csv = [
    "Train,Category,Section,Position KM,Delay Minutes,Predicted Delay,Status",
    ...live.trains.map((train) =>
      [
        train.number,
        train.category,
        train.section,
        train.position_km,
        train.delay_minutes,
        train.delay_prediction_minutes,
        train.status,
      ].join(","),
    ),
  ].join("\n");
  const report = {
    generated_at: generatedAt,
    kpi: live.kpi,
    trains: live.trains,
    signals: live.signals,
    tracks: live.tracks,
    maintenance: live.maintenance,
  };

  return (
    <MainShell
      title="OPERATIONS REPORTS"
      subtitle={`Demo reports generated from live telemetry · ${generatedAt}`}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="LIVE OPERATIONS REPORT">
          <div className="flex items-start gap-3">
            <FileBarChart className="size-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Current network snapshot</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Trains, signals, tracks, maintenance blocks and KPIs.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() =>
                  downloadFile(
                    "codeontrack-live-report.json",
                    JSON.stringify(report, null, 2),
                    "application/json",
                  )
                }
              >
                <Download className="mr-2 size-4" /> Download JSON
              </Button>
            </div>
          </div>
        </Panel>
        <Panel title="TRAIN MOVEMENT REPORT">
          <div className="flex items-start gap-3">
            <FileText className="size-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Train delay and position extract</p>
              <p className="mt-1 text-xs text-muted-foreground">
                CSV format for spreadsheet and control-room review.
              </p>
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadFile("codeontrack-train-movements.csv", csv, "text/csv;charset=utf-8")
                }
              >
                <Download className="mr-2 size-4" /> Download CSV
              </Button>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="REPORT STATUS" className="mt-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Metric label="Trains" value={live.trains.length} />
          <Metric label="Signals" value={live.signals.length} />
          <Metric label="Tracks" value={live.tracks.length} />
          <Metric label="Active Blocks" value={live.maintenance.length} />
          <Metric label="Delayed" value={live.kpi.delayed_trains} />
        </div>
      </Panel>
    </MainShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-panel-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
    </div>
  );
}
