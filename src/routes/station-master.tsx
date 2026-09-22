import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationOperationsPage } from "@/components/trackwise/StationOperations";
import {
  RailwayKpiGrid,
  StationAnalyticsCharts,
  TrainScheduleGantt,
} from "@/components/trackwise/RailwayAnalytics";

export const Route = createFileRoute("/station-master")({
  component: StationMasterDashboard,
});

function StationMasterDashboard() {
  return (
    <MainShell
      title="STATION MASTER — LIVE OPERATIONS"
      subtitle="NDG Station · Central Division · Shift: Morning · Station Master control room"
    >
      <RailwayKpiGrid />
      <div className="mt-4">
        <StationAnalyticsCharts />
      </div>
      <div className="mt-4">
        <TrainScheduleGantt />
      </div>
      <StationOperationsPage mode="master" />
    </MainShell>
  );
}
