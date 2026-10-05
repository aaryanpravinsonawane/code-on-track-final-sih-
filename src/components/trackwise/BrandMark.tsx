import { TrainFront } from "lucide-react";

/** CodeOnTrack logo + wordmark. Same mark as the sidebar brand (yellow rounded square, train icon). */
export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-14 rounded-2xl" : "size-11 rounded-xl";
  const icon = size === "lg" ? "size-8" : "size-6";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center bg-yellow-400 text-blue-950 shadow-[0_0_24px_rgba(250,204,21,0.3)] ${box}`}
      >
        <TrainFront className={icon} />
      </div>
      <div>
        <p
          className={`font-display font-bold leading-none tracking-[0.12em] text-white ${size === "lg" ? "text-2xl" : "text-lg"}`}
        >
          CODE<span className="text-yellow-300">ON</span>TRACK
        </p>
        <p className="mt-1 text-[10px] tracking-[0.18em] text-blue-200/70">RAIL COMMAND CENTER</p>
      </div>
    </div>
  );
}

/** Branded splash shown while the saved session is restored (replaces a blank screen). */
export function BrandSplash() {
  return (
    <div
      role="status"
      aria-label="Loading CODEONTRACK"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[oklch(0.14_0.04_262)]"
    >
      <BrandMark size="lg" />
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-yellow-400" />
      </div>
      <p className="text-[11px] tracking-[0.2em] text-blue-200/60">LOADING RAIL COMMAND CENTER</p>
    </div>
  );
}
