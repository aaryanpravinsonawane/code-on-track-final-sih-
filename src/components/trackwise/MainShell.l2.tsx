import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  TrainFront,
  User,
  Wrench,
} from "lucide-react";
import { useTrackwise } from "@/lib/trackwise/store";
import { canAccessModule } from "@/lib/trackwise/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: number;
  module?: string;
}

const NAVIGATION: NavSection[] = [
  {
    title: "COMMAND CENTER",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, module: "management" },
      { to: "/live-operations", label: "Live Operations", icon: Activity, module: "station_master" },
      { to: "/station-map", label: "Station Map", icon: Map, module: "station_master" },
      { to: "/ai-priority", label: "AI Priority Queue", icon: Sparkles, module: "ai", badge: 3 },
      { to: "/incidents", label: "Incidents", icon: AlertTriangle, module: "station_master", badge: 1 },
      { to: "/alerts", label: "Alerts", icon: Bell, module: "station_master", badge: 5 },
      { to: "/analytics", label: "Analytics", icon: BarChart3, module: "analytics" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { to: "/coa", label: "COA", icon: TrainFront, module: "coa" },
      { to: "/train-movement", label: "Train Movement", icon: Activity, module: "coa" },
      { to: "/train-schedule", label: "Train Schedule", icon: ClipboardList, module: "coa" },
      { to: "/regulation", label: "Regulation", icon: Settings, module: "coa" },
    ],
  },
  {
    title: "ENGINEERING",
    items: [
      { to: "/tms", label: "TMS", icon: Wrench, module: "tms" },
      { to: "/tdms", label: "TDMS", icon: Gauge, module: "tdms" },
      { to: "/smms", label: "SMMS", icon: ShieldCheck, module: "smms" },
      { to: "/maintenance-planner", label: "Maintenance Planner", icon: Sparkles, module: "engineering" },
      { to: "/work-orders", label: "Work Orders", icon: ClipboardList, module: "engineering" },
      { to: "/asset-health", label: "Asset Health", icon: BarChart3, module: "engineering" },
    ],
  },
  {
    title: "STATION",
    items: [
      { to: "/station-master", label: "Station Master", icon: Building2, module: "station_master" },
      { to: "/platform-status", label: "Platform Status", icon: LayoutDashboard, module: "station_master" },
      { to: "/track-occupancy", label: "Track Occupancy", icon: TrainFront, module: "station_master" },
      { to: "/signal-status", label: "Signal Status", icon: ShieldCheck, module: "station_master" },
      { to: "/traction-status", label: "Traction Status", icon: Gauge, module: "station_master" },
      { to: "/workstation-location", label: "Workstation Location", icon: Map, module: "station_master" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { to: "/operational-analytics", label: "Operational Analytics", icon: BarChart3, module: "analytics" },
      { to: "/maintenance-analytics", label: "Maintenance Analytics", icon: BarChart3, module: "analytics" },
      { to: "/delay-analysis", label: "Delay Analysis", icon: Activity, module: "analytics" },
      { to: "/performance-kpi", label: "Performance KPIs", icon: Gauge, module: "analytics" },
      { to: "/reports", label: "Reports", icon: ClipboardList, module: "analytics" },
    ],
  },
  {
    title: "AI",
    items: [
      { to: "/ai-priority-engine", label: "AI Priority Engine", icon: Sparkles, module: "ai" },
      { to: "/ai-scheduling", label: "Optimized Scheduling", icon: Sparkles, module: "ai" },
      { to: "/predictive-maintenance", label: "Predictive Maintenance", icon: Sparkles, module: "ai" },
      { to: "/conflict-detection", label: "Conflict Detection", icon: AlertTriangle, module: "ai" },
      { to: "/what-if-simulation", label: "What-If Simulation", icon: Activity, module: "ai" },
    ],
  },
];

export function MainShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { user, setUser } = useTrackwise();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["COMMAND CENTER", "ENGINEERING"]));

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem("trackwise_user");
    setUser(null);
    navigate({ to: "/login" });
  };

  const currentTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-panel flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-primary flex items-center justify-center">
              <TrainFront className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-[0.14em] text-primary">TRACKWISE</p>
              <p className="text-[10px] text-muted-foreground tracking-wide">
                INTEGRATED RAILWAY OPERATIONS
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAVIGATION.map((section) => {
            const hasAccessibleItems = section.items.some((item) =>
              !item.module || canAccessModule(user, item.module)
            );
            if (!hasAccessibleItems) return null;

            const isExpanded = expandedSections.has(section.title);

            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {section.title}
                  {isExpanded ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                </button>
                {isExpanded && (
                  <div className="space-y-0.5 ml-2">
                    {section.items.map((item) => {
                      if (item.module && !canAccessModule(user, item.module)) return null;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                          activeProps={{ className: "bg-primary/10 text-primary" }}
                        >
                          <item.icon className="size-4" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-muted-foreground truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-panel shadow-panel">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left: Station & Division */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Station</p>
                <p className="text-sm font-semibold text-foreground">{user?.station || "NDG"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Division</p>
                <p className="text-sm font-semibold text-foreground">{user?.division || "Central Division"}</p>
              </div>
            </div>

            {/* Center: Time & System Status */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Time</p>
                <p className="text-sm font-mono font-semibold text-foreground">{currentTime}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">System Status</p>
                  <p className="text-sm font-semibold text-emerald-500">ONLINE</p>
                </div>
              </div>
            </div>

            {/* Right: Notifications & User */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
              </Button>
              <Button variant="ghost" size="icon">
                <AlertTriangle className="size-5 text-warn" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="size-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="size-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1800px] px-6 py-6">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <p>
              TRACKWISE is a prototype decision-support simulation. It does not control signals,
              interlocking, Kavach, train movement or any safety-critical railway system.
            </p>
            <p className="flex items-center gap-1">
              <Sparkles className="size-3" />
              ONE WORKPLACE. CONNECTED RAILWAY OPERATIONS.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
