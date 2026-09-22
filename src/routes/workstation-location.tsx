import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationOperationsPage } from "@/components/trackwise/StationOperations";
export const Route = createFileRoute("/workstation-location")({ component: WorkstationLocation });
function WorkstationLocation() {
  return (
    <MainShell title="WORKSTATION LOCATION" subtitle="Control room console and room mapping">
      <StationOperationsPage mode="workstations" />
    </MainShell>
  );
}
