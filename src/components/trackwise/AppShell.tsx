import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Activity,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  Network,
  ScrollText,
  Sparkles,
  TimerReset,
  TrainFront,
} from "lucide-react";
import { ROLES, useTrackwise } from "@/lib/trackwise/store";
import type { Role } from "@/lib/trackwise/types";

const NAV = [
  { to: "/", label: "Control Dashboard", icon: LayoutDashboard },
  { to: "/network", label: "Railway Network", icon: Network },
  { to: "/maintenance", label: "Maintenance Register", icon: ListChecks },
  { to: "/planner", label: "AI Block Planner", icon: Sparkles },
  { to: "/timeline", label: "Gantt Timeline", icon: Activity },
  { to: "/simulator", label: "What-If Simulator", icon: TimerReset },
  { to: "/comparison", label: "Before vs After", icon: GitCompareArrows },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { role, setRole, engineName } = useTrackwise();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-panel shadow-panel">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <TrainFront className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg leading-none font-bold tracking-[0.14em] text-primary">
                TRACKWISE
              </p>
              <p className="mt-1 text-[11px] tracking-wide text-muted-foreground">
                Railway Maintenance Block Planning · Decision Support
              </p>
            </div>
          </div>
          <span className="rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-warn-foreground">
            SIMULATION MODE — REPRESENTATIVE DATA ONLY
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[11px] text-muted-foreground lg:inline">
              Engine: {engineName}
            </span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-1 md:px-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-primary/10 text-primary" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
        <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          TRACKWISE is a prototype decision-support simulation. It does not control signals,
          interlocking, Kavach, train movement or any safety-critical railway system. All figures
          are simulation results using representative data.
        </footer>
      </main>
    </div>
  );
}
