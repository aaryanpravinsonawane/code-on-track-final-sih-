import { useState } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, Gauge, Loader2, TrainFront } from "lucide-react";
import { Panel } from "./shared";
import { optimizerService, type AiOptimizationResult, type AiTrain, type DelayPrediction } from "@/services/api";

const sampleTrains: AiTrain[] = [
  { train_id: "TR101", arrival_time: 360, departure_time: 392, priority: 1, section: "S1" },
  { train_id: "TR102", arrival_time: 425, departure_time: 459, priority: 2, section: "S1" },
  { train_id: "TR103", arrival_time: 470, departure_time: 520, priority: 4, section: "S2" },
];

export function AIOperationsCenter() {
  const [result, setResult] = useState<AiOptimizationResult | null>(null);
  const [prediction, setPrediction] = useState<DelayPrediction | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOptimization = async () => {
    setRunning(true);
    setError(null);
    try {
      const [schedule, delay] = await Promise.all([
        optimizerService.schedule(sampleTrains, ["T1", "T2", "T3", "T4"]),
        optimizerService.predictDelay({ traffic_volume: 9, platform_usage: 82, incident_count: 2, train_priority: 1, historical_delay: 12 }),
      ]);
      setResult(schedule);
      setPrediction(delay);
    } catch {
      setError("FastAPI AI services are unavailable. Start the backend to run live optimization.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section aria-label="AI Operations Center" className="mb-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div>
          <p className="flex items-center gap-2 font-display text-sm font-bold tracking-[0.12em] text-primary">
            <BrainCircuit className="size-4" /> AI OPERATIONS CENTER
          </p>
          <p className="mt-1 text-xs text-muted-foreground">CP-SAT allocation and Random Forest delay intelligence</p>
        </div>
        <button onClick={runOptimization} disabled={running} className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {running ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
          Run AI Optimization
        </button>
      </div>
      {error && <p className="mb-3 rounded-md border border-warn/30 bg-warn/10 p-3 text-xs text-warn-foreground">{error}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        <Metric icon={TrainFront} label="Recommended Track" value={String(result?.assignments[0]?.assigned_track ?? "Awaiting run")} />
        <Metric icon={CheckCircle2} label="AI Optimization Score" value={result?.optimization_score != null ? `${result.optimization_score}%` : "Awaiting run"} />
        <Metric icon={AlertTriangle} label="Delay Risk" value={prediction ? `${prediction.delay_probability}% · ${prediction.risk_level}` : "Awaiting run"} tone={prediction?.risk_level === "High" ? "danger" : "default"} />
      </div>
      {result?.conflicts && result.conflicts.length > 0 && (
        <Panel title="Conflict Warnings" className="mt-3">
          <ul className="space-y-2 text-sm">
            {result.conflicts.map((conflict, index) => <li key={index} className="flex items-start gap-2 text-danger"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> {String(conflict.suggested_solution ?? "Conflict detected")}</li>)}
          </ul>
        </Panel>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone = "default" }: { icon: typeof Gauge; label: string; value: string; tone?: "default" | "danger" }) {
  return <div className="panel-card flex items-center gap-3 p-4"><Icon className={`size-5 ${tone === "danger" ? "text-danger" : "text-primary"}`} /><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold text-foreground">{value}</p></div></div>;
}
