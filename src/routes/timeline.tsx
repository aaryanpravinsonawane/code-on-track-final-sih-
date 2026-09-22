import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { GanttChart } from "@/components/trackwise/GanttChart";
import { Panel } from "@/components/trackwise/shared";
import { useTrackwise } from "@/lib/trackwise/store";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Gantt Timeline — TRACKWISE Simulation" },
      {
        name: "description",
        content:
          "Interactive railway timeline showing simulated train movements, declared windows, planned maintenance blocks and detected conflicts by section.",
      },
      { property: "og:title", content: "Gantt Timeline — TRACKWISE" },
      {
        property: "og:description",
        content: "Section-wise timeline of trains, maintenance blocks and conflicts.",
      },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const { plan, delays } = useTrackwise();
  return (
    <MainShell
      title="GANTT TIMELINE"
      subtitle="05:00 – 24:00 simulated operating day · train paths, declared windows and planned blocks"
    >
      <Panel>
        <GanttChart blocks={plan?.blocks ?? []} delays={delays} />
        {!plan && (
          <p className="mt-4 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn-foreground">
            No optimized plan loaded yet — run the AI Block Planner to populate the maintenance block lane.
          </p>
        )}
      </Panel>
    </MainShell>
  );
}
