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
  Menu,
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
      {
        to: "/live-operations",
        label: "Live Operations",
        icon: Activity,
        module: "station_master",
      },
      { to: "/station-map", label: "Station Map", icon: Map, module: "station_master" },
      { to: "/ai-priority", label: "AI Priority Queue", icon: Sparkles, module: "ai", badge: 3 },
      {
        to: "/incidents",
        label: "Incidents",
        icon: AlertTriangle,
        module: "station_master",
        badge: 1,
      },
      { to: "/alerts", label: "Alerts", icon: Bell, module: "station_master", badge: 5 },
    ],
  },
  {
    title: "OPERATIONS",
    items: [{ to: "/coa", label: "COA", icon: TrainFront, module: "coa" }],
  },
  {
    title: "ENGINEERING",
    items: [
      { to: "/tms", label: "TMS", icon: Wrench, module: "tms" },
      { to: "/tdms", label: "TDMS", icon: Gauge, module: "tdms" },
      { to: "/smms", label: "SMMS", icon: ShieldCheck, module: "smms" },
      { to: "/work-orders", label: "Work Orders", icon: ClipboardList, module: "engineering" },
    ],
  },
  {
    title: "STATION",
    items: [
      { to: "/station-master", label: "Station Master", icon: Building2, module: "station_master" },
      {
        to: "/platform-status",
        label: "Platform Status",
        icon: LayoutDashboard,
        module: "station_master",
      },
      {
        to: "/track-occupancy",
        label: "Track Occupancy",
        icon: TrainFront,
        module: "station_master",
      },
      { to: "/signal-status", label: "Signal Status", icon: ShieldCheck, module: "station_master" },
      { to: "/traction-status", label: "Traction Status", icon: Gauge, module: "station_master" },
      {
        to: "/workstation-location",
        label: "Workstation Location",
        icon: Map,
        module: "station_master",
      },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { to: "/comparison", label: "Performance Comparison", icon: BarChart3, module: "analytics" },
      { to: "/audit", label: "Operational Audit", icon: ClipboardList, module: "analytics" },
    ],
  },
  {
    title: "AI",
    items: [
      { to: "/ai-priority", label: "AI Priority Engine", icon: Sparkles, module: "ai" },
      { to: "/simulator", label: "What-If Simulation", icon: Activity, module: "ai" },
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["COMMAND CENTER", "ENGINEERING"]),
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition-opacity lg:hidden ${sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-blue-950/70 bg-[#0f2d6b] text-blue-50 shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="border-b border-blue-900/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-[0_0_24px_rgba(249,115,22,0.35)]">
              <TrainFront className="size-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-[0.12em] text-white">
                RAIL<span className="text-orange-300">WISE</span>
              </p>
              <p className="text-[9px] tracking-[0.14em] text-blue-200/70">
                OPERATIONS CONTROL CENTER
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-emerald-200">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            NETWORK SYNCHRONIZED
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAVIGATION.map((section) => {
            const hasAccessibleItems = section.items.some(
              (item) => !item.module || canAccessModule(user, item.module),
            );
            if (!hasAccessibleItems) return null;

            const isExpanded = expandedSections.has(section.title);

            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold tracking-[0.16em] text-blue-200/55 transition-colors hover:text-white"
                >
                  {section.title}
                  {isExpanded ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-1 space-y-0.5 border-l border-blue-300/20 pl-2">
                    {section.items.map((item) => {
                      if (item.module && !canAccessModule(user, item.module)) return null;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100/70 transition-all hover:bg-white/10 hover:text-white"
                          activeProps={{ className: "bg-white/12 text-white shadow-[inset_3px_0_0_#fb923c]" }}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon className="size-4 text-blue-200/60 transition-colors group-hover:text-orange-300" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                              <span className="flex size-5 items-center justify-center rounded-full bg-orange-400 text-[10px] font-bold text-blue-950">
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
        <div className="border-t border-blue-900/80 p-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-800 text-orange-300">
              <User className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold text-white">{user?.name}</p>
              <p className="truncate text-blue-200/60">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-blue-950/80 bg-[#0f2d6b] shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
            {/* Left: Station & Division */}
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-200/70">
                  Station
                </p>
                <p className="text-sm font-semibold text-white">{user?.station || "NDG"}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] uppercase tracking-wider text-blue-200/70">
                  Division
                </p>
                <p className="text-sm font-semibold text-white">
                  {user?.division || "Central Division"}
                </p>
              </div>
            </div>

            {/* Center: Time & System Status */}
            <div className="hidden items-center gap-6 md:flex">
              <div className="border-l border-border pl-6">
                <p className="text-[10px] uppercase tracking-wider text-blue-200/70">
                  Current Time
                </p>
                <p className="font-mono text-sm font-semibold text-white">{currentTime}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-200/70">
                    System Status
                  </p>
                  <p className="text-sm font-semibold text-emerald-500">ONLINE</p>
                </div>
              </div>
            </div>

            {/* Right: Notifications & User */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl text-white hover:bg-white/10 hover:text-white"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Open notifications"
              >
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
              </Button>
              {notificationsOpen && (
                <div className="absolute right-4 top-14 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-panel p-3 shadow-2xl">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">Notifications</p>
                    <span className="text-xs text-muted-foreground">4 new</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <button
                      className="w-full rounded-md bg-destructive/10 p-2 text-left hover:bg-destructive/20"
                      onClick={() => navigate({ to: "/incidents" })}
                    >
                      Critical: signal S4 failure requires review
                    </button>
                    <button
                      className="w-full rounded-md bg-amber-500/10 p-2 text-left hover:bg-amber-500/20"
                      onClick={() => navigate({ to: "/work-orders" })}
                    >
                      Work order WO-2026-042 generated
                    </button>
                    <button
                      className="w-full rounded-md bg-primary/10 p-2 text-left hover:bg-primary/20"
                      onClick={() => navigate({ to: "/live-operations" })}
                    >
                      Status change: train 12615 delayed 18 min
                    </button>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="icon" className="hidden rounded-xl text-white hover:bg-white/10 hover:text-white sm:inline-flex">
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
          <div className="rail-grid mx-auto max-w-[1800px] px-4 py-5 sm:px-6 sm:py-7">
            <div className="mb-6 border-b border-border/70 pb-5">
              <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-rail-orange">OPERATIONS / CONTROL VIEW</p>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl">
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
