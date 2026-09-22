import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationOperationsPage } from "@/components/trackwise/StationOperations";

export const Route = createFileRoute("/station-master")({
  component: StationMasterDashboard,
});

function StationMasterDashboard() {
  return (
    <MainShell
      title="STATION MASTER — LIVE OPERATIONS"
      subtitle="NDG Station · Central Division · Shift: Morning · Station Master control room"
    >
      <StationOperationsPage mode="master" />
    </MainShell>
  );
}
