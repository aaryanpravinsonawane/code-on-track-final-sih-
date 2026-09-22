import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationOperationsPage } from "@/components/trackwise/StationOperations";
export const Route = createFileRoute("/traction-status")({ component: TractionStatus });
function TractionStatus() {
  return (
    <MainShell title="TRACTION STATUS" subtitle="OHE voltage, feeders and substations">
      <StationOperationsPage mode="traction" />
    </MainShell>
  );
}
