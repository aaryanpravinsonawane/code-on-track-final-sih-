import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationMapCanvas } from "@/components/trackwise/StationMapCanvas";
import { MapAnalyticsSummary } from "@/components/trackwise/RailwayAnalytics";

export const Route = createFileRoute("/station-map")({
  component: StationMap,
});

function StationMap() {
  return (
    <MainShell
      title="STATION MAP"
      subtitle="NDG · Nandgaon Junction · 2D yard map · simulated live asset telemetry"
    >
      <MapAnalyticsSummary />
      <div className="mt-4" />
      <StationMapCanvas />
    </MainShell>
  );
}
