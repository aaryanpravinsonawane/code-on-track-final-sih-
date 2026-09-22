import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationOperationsPage } from "@/components/trackwise/StationOperations";
export const Route = createFileRoute("/track-occupancy")({ component: TrackOccupancy });
function TrackOccupancy() {
  return (
    <MainShell title="TRACK OCCUPANCY" subtitle="Live track circuits and train presence">
      <StationOperationsPage mode="tracks" />
    </MainShell>
  );
}
