import { useEffect, useState, type ReactNode } from "react";

/** Charts measure the DOM, so only render them after hydration. */
export function ChartBox({ height, children }: { height: number; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div style={{ height }} className="w-full">
      {mounted ? children : <div className="size-full animate-pulse rounded-md bg-panel-muted" />}
    </div>
  );
}
