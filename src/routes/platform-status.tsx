import { createFileRoute } from "@tanstack/react-router";
import { MainShell } from "@/components/trackwise/MainShell";
import { StationOperationsPage } from "@/components/trackwise/StationOperations";
export const Route = createFileRoute("/platform-status")({ component: PlatformStatus });
function PlatformStatus() {
  return (
    <MainShell title="PLATFORM STATUS" subtitle="NDG Junction platform allocation">
      <StationOperationsPage mode="platforms" />
    </MainShell>
  );
}
