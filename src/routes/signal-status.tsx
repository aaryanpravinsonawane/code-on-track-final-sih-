import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationOperationsPage } from "@/components/trackwise/StationOperations";
export const Route = createFileRoute("/signal-status")({ component: SignalStatus });
function SignalStatus() {
  return (
    <MainShell title="SIGNAL STATUS" subtitle="NDG interlocking aspects and failure alerts">
      <StationOperationsPage mode="signals" />
    </MainShell>
  );
}
