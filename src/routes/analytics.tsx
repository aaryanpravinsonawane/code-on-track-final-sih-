import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { AIAnalyticsCharts } from "@/components/trackwise/AIAnalyticsCharts";
import { PandasAnalyticsSection } from "@/components/trackwise/PandasAnalyticsSection";
import {
  DepartmentPerformance,
  IssueDistribution,
  MonthlyIncidents,
  RailwayKpiGrid,
  ResolutionRate,
  TrainScheduleGantt,
  TrainTrafficTrend,
} from "@/components/trackwise/RailwayAnalytics";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsDashboard,
});

function AnalyticsDashboard() {
  return (
    <MainShell
      title="RAILWAY ANALYTICS"
      subtitle="Operational performance, traffic trends and incident intelligence"
    >
      <RailwayKpiGrid />
      <PandasAnalyticsSection />
      <AIAnalyticsCharts />
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TrainTrafficTrend />
        <IssueDistribution />
        <DepartmentPerformance />
        <MonthlyIncidents />
        <ResolutionRate />
      </div>
      <div className="mt-4">
        <TrainScheduleGantt />
      </div>
    </MainShell>
  );
}
