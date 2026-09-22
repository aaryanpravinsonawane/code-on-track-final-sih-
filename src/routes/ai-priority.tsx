import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  Clock,
  Filter,
  Gauge,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Zap,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { AIPriorityEngine, type AIPriorityItem } from "@/lib/trackwise/ai-priority";

export const Route = createFileRoute("/ai-priority")({
  component: AIPriorityQueue,
});

function AIPriorityQueue() {
  const [filter, setFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState<AIPriorityItem | null>(null);

  const queue = AIPriorityEngine.generatePriorityQueue();
  const filteredQueue = AIPriorityEngine.filterQueue(queue, filter);

  const p1Count = queue.filter((item) => item.priority === "P1").length;
  const p2Count = queue.filter((item) => item.priority === "P2").length;
  const p3Count = queue.filter((item) => item.priority === "P3").length;
  const p4Count = queue.filter((item) => item.priority === "P4").length;

  return (
    <MainShell
      title="AI PRIORITY QUEUE"
      subtitle="Real-time AI-powered operational event prioritization and recommendation engine"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard label="P1 — CRITICAL" value={p1Count} icon={AlertTriangle} tone="danger" hint="Immediate action required" />
        <KpiCard label="P2 — HIGH" value={p2Count} icon={Zap} tone="warn" hint="High priority attention" />
        <KpiCard label="P3 — MEDIUM" value={p3Count} icon={Clock} hint="Standard priority" />
        <KpiCard label="P4 — LOW" value={p4Count} icon={ShieldCheck} hint="Low priority" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Priority Queue */}
        <div className="lg:col-span-2">
          <Panel
            title="AI PRIORITY QUEUE"
            right={
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="All">All</option>
                  <option value="P1">P1 — CRITICAL</option>
                  <option value="P2">P2 — HIGH</option>
                  <option value="P3">P3 — MEDIUM</option>
                  <option value="P4">P4 — LOW</option>
                  <option value="TMS">TMS</option>
                  <option value="TDMS">TDMS</option>
                  <option value="SMMS">SMMS</option>
                  <option value="COA">COA</option>
                  <option value="Station">Station</option>
                </select>
              </div>
            }
          >
            <div className="space-y-2">
              {filteredQueue.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? "bg-primary/10 border-primary"
                      : item.priority === "P1"
                      ? "bg-destructive/10 border-destructive/20 hover:bg-destructive/20"
                      : item.priority === "P2"
                      ? "bg-warn/10 border-warn/20 hover:bg-warn/20"
                      : item.priority === "P3"
                      ? "bg-panel-muted border-border hover:bg-panel-muted/80"
                      : "bg-panel-muted border-border hover:bg-panel-muted/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            item.priority === "P1"
                              ? "bg-destructive text-destructive-foreground"
                              : item.priority === "P2"
                              ? "bg-warn text-warn-foreground"
                              : item.priority === "P3"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted-foreground text-muted-foreground"
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.system}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{item.type}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrainFront className="size-3" />
                          {item.affectedTrains} trains affected
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="size-3" />
                          Score: {item.score.score}/100
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{item.score.score}</p>
                      <p className="text-xs text-muted-foreground">AI Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* AI Recommendation Detail */}
        <div>
          <Panel title="AI RECOMMENDATION">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="size-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">AI Analysis</span>
                  </div>
                  <p className="text-sm text-foreground">{selectedItem.score.reason}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Priority Score</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-foreground">{selectedItem.score.score}/100</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedItem.priority === "P1"
                          ? "bg-destructive/10 text-destructive"
                          : selectedItem.priority === "P2"
                          ? "bg-warn/10 text-warn-foreground"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {selectedItem.priority} — {selectedItem.priority === "P1" ? "CRITICAL" : selectedItem.priority === "P2" ? "HIGH" : selectedItem.priority === "P3" ? "MEDIUM" : "LOW"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${selectedItem.score.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{selectedItem.score.confidence}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Scoring Factors</p>
                  <div className="space-y-2">
                    {Object.entries(selectedItem.score.factors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-28 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              value >= 8 ? "bg-destructive" : value >= 5 ? "bg-warn" : "bg-emerald-500"
                            }`}
                            style={{ width: `${value * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono w-6 text-right">{value}/10</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-warn/10 border border-warn/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-4 text-warn-foreground" />
                    <span className="text-xs font-semibold text-warn-foreground">Suggested Action</span>
                  </div>
                  <p className="text-sm text-foreground">{selectedItem.score.recommendedAction}</p>
                </div>

                <div className="p-3 bg-panel-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground text-center">
                    AI recommendations require authorized human confirmation before implementation.
                    Never present AI output as automatic safety commands.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Select an item to view AI analysis</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </MainShell>
  );
}
