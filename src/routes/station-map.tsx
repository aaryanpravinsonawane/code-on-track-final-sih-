import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationMapCanvas } from "@/components/trackwise/StationMapCanvas";

export const Route = createFileRoute("/station-map")({
  component: StationMap,
});

function StationMap() {
  return (
    <MainShell
      title="STATION MAP"
      subtitle="NDG Junction schematic · simulated live asset telemetry"
    >
      <StationMapCanvas />
    </MainShell>
  );
}
