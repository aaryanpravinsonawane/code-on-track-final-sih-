import {
  BatteryCharging,
  Gauge,
  ListChecks,
  Signal,
  TrainFront,
  TriangleAlert,
  Zap,
} from "lucide-react";
import type { ReactElement } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartBox } from "@/components/trackwise/ChartBox";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { useRealtimeIssues } from "@/hooks/useRealtimeIssues";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { generateStationIncidents } from "@/lib/trackwise/operations";
import { RESOURCES, SECTIONS, TASKS, TRAINS, fmt } from "@/lib/trackwise/data";
import { trainOccupancy } from "@/lib/trackwise/engine";

const BLUE = "#1e40af";
const NAVY = "#0f2d6b";
const ORANGE = "#f97316";
const GRID = "#dbe4f0";
const MUTED = "#64748b";
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #dbe4f0",
  backgroundColor: "#ffffff",
  boxShadow: "0 10px 30px rgba(15, 45, 107, 0.12)",
};
const chartAxis = { fontSize: 11, fill: MUTED };

const issueData = [
  {
    name: "Track",
    value: TASKS.filter((task) => task.department === "Engineering").length,
    color: "#1e40af",
  },
  {
    name: "Signal",
    value: TASKS.filter((task) => task.department === "S&T").length,
    color: "#f97316",
  },
  {
    name: "Power",
    value: TASKS.filter((task) => task.department === "TRD").length,
    color: "#0ea5e9",
  },
  { name: "Safety", value: 8, color: "#dc2626" },
];
const trafficData = [
  { day: "Mon", movements: 42, onTime: 38 },
  { day: "Tue", movements: 48, onTime: 43 },
  { day: "Wed", movements: 45, onTime: 41 },
  { day: "Thu", movements: 56, onTime: 50 },
  { day: "Fri", movements: 61, onTime: 55 },
  { day: "Sat", movements: 52, onTime: 48 },
  { day: "Sun", movements: 47, onTime: 44 },
];
const monthlyIncidentData = [
  { month: "Jan", incidents: 38, resolved: 31 },
  { month: "Feb", incidents: 44, resolved: 37 },
  { month: "Mar", incidents: 35, resolved: 32 },
  { month: "Apr", incidents: 52, resolved: 43 },
  { month: "May", incidents: 46, resolved: 41 },
  { month: "Jun", incidents: 41, resolved: 38 },
];
const schedule = [
  { name: "Rajdhani Link", id: "12951", platform: "P1", start: 360, end: 392, delay: 0 },
  { name: "Grand Trunk Exp", id: "12615", platform: "P2", start: 425, end: 459, delay: 8 },
  { name: "Nandgaon Pass", id: "56501", platform: "P3", start: 500, end: 545, delay: 22 },
  { name: "Deccan Superfast", id: "22691", platform: "P4", start: 620, end: 650, delay: 3 },
  { name: "Suburban EMU-11", id: "64011", platform: "P5", start: 700, end: 725, delay: 0 },
  { name: "Coal Rake 201", id: "FR-201", platform: "P6", start: 1080, end: 1140, delay: 14 },
];

function ChartFrame({ children, height = 280 }: { children: ReactElement; height?: number }) {
  return (
    <ChartBox height={height}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function RailwayKpiGrid() {
  const { issues: realtimeIncidents } = useRealtimeIssues();
  const { events: realtimeEvents } = useRealtimeFeed();
  const incidents = realtimeIncidents.length ? realtimeIncidents : generateStationIncidents(56);
  const liveTrainEvents = realtimeEvents.filter((event) => event.type === "train");
  const liveTrackEvents = realtimeEvents.filter((event) => event.type === "track");
  const liveSignalEvents = realtimeEvents.filter((event) => event.type === "signal");
  const activeTrains = liveTrainEvents.length || TRAINS.length;
  const availableTracks =
    liveTrackEvents.length > 0
      ? liveTrackEvents.filter((event) => !event.status.toLowerCase().includes("blocked")).length
      : SECTIONS.filter((section) => section.operationalStatus === "Operational").length;
  const signalHealth = liveSignalEvents.length
    ? Math.max(
        0,
        100 - liveSignalEvents.filter((event) => event.severity === "critical").length * 4,
      )
    : 96;
  const openIssues = incidents.filter((incident) => incident.status !== "Resolved").length;
  const resolvedIssues = incidents.filter((incident) => incident.status === "Resolved").length;
  const criticalAlerts = realtimeEvents.filter((event) => event.severity === "critical").length;
  const resourceAvailability = Math.round(
    (RESOURCES.reduce((sum, resource) => sum + resource.available, 0) /
      RESOURCES.reduce((sum, resource) => sum + resource.total, 0)) *
      100,
  );
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        label="Active Trains"
        value={activeTrains}
        icon={TrainFront}
        hint="Running on corridor"
      />
      <KpiCard
        label="Available Tracks"
        value={availableTracks}
        icon={Gauge}
        tone="success"
        hint={`Of ${SECTIONS.length} sections`}
      />
      <KpiCard
        label="Signal Health"
        value={signalHealth}
        unit="%"
        icon={Signal}
        tone="success"
        hint="Interlocking telemetry"
      />
      <KpiCard
        label="Power Health"
        value={94}
        unit="%"
        icon={Zap}
        tone="warn"
        hint="OHE and feeder health"
      />
      <KpiCard
        label="Open Issues"
        value={openIssues}
        icon={TriangleAlert}
        tone="danger"
        hint="Requires attention"
      />
      <KpiCard
        label="Resolved Issues"
        value={resolvedIssues}
        icon={Signal}
        tone="success"
        hint="Closed in live feed"
      />
      <KpiCard
        label="Critical Alerts"
        value={criticalAlerts}
        icon={TriangleAlert}
        tone="danger"
        hint="Live attention required"
      />
      <KpiCard
        label="System Efficiency"
        value={resourceAvailability}
        unit="%"
        icon={BatteryCharging}
        tone="success"
        hint="Resource availability"
      />
    </div>
  );
}

export function TrainTrafficTrend() {
  return (
    <Panel title="TRAIN TRAFFIC TREND" subtitle="Daily corridor movements and on-time departures">
      <ChartFrame>
        <LineChart data={trafficData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="day" tick={chartAxis} axisLine={false} tickLine={false} />
          <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="movements"
            name="Movements"
            stroke={BLUE}
            strokeWidth={3}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="onTime"
            name="On time"
            stroke={ORANGE}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartFrame>
    </Panel>
  );
}

export function IssueDistribution() {
  const { issues } = useRealtimeIssues();
  const data = issues.length
    ? [
        {
          name: "Track",
          value: issues.filter((issue) => issue.department === "TMS").length,
          color: "#1e40af",
        },
        {
          name: "Signal",
          value: issues.filter((issue) => issue.department === "SMMS").length,
          color: "#f97316",
        },
        {
          name: "Power",
          value: issues.filter((issue) => issue.department === "TDMS").length,
          color: "#0ea5e9",
        },
        {
          name: "Safety",
          value: issues.filter((issue) => issue.department === "COA").length,
          color: "#dc2626",
        },
      ]
    : issueData;
  return (
    <Panel title="ISSUE DISTRIBUTION" subtitle="Current workload by operational domain">
      <ChartFrame>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={4}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ChartFrame>
    </Panel>
  );
}

export function DepartmentPerformance() {
  const { events } = useRealtimeFeed();
  const data = [
    { department: "TMS", uptime: 98, resolved: 86 },
    { department: "TDMS", uptime: 94, resolved: 79 },
    { department: "SMMS", uptime: 97, resolved: 91 },
  ];
  const liveData =
    events.length > 3
      ? ["TMS", "TDMS", "SMMS"].map((department) => ({
          department,
          uptime: Math.max(
            0,
            100 -
              events.filter((event) => event.source === department && event.severity === "critical")
                .length *
                5,
          ),
          resolved: Math.round(
            (events.filter((event) => event.source === department && event.severity === "success")
              .length /
              Math.max(1, events.filter((event) => event.source === department).length)) *
              100,
          ),
        }))
      : data;
  return (
    <Panel title="DEPARTMENT PERFORMANCE" subtitle="Uptime and issue resolution score">
      <ChartFrame>
        <BarChart data={liveData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="department" tick={chartAxis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={chartAxis} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="uptime" name="Uptime %" fill={NAVY} radius={[5, 5, 0, 0]} />
          <Bar dataKey="resolved" name="Resolved %" fill={ORANGE} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ChartFrame>
    </Panel>
  );
}

export function MonthlyIncidents() {
  const { issues } = useRealtimeIssues();
  const data = issues.length
    ? monthlyIncidentData.map((month, index) =>
        index === monthlyIncidentData.length - 1
          ? {
              ...month,
              incidents: issues.length,
              resolved: issues.filter((issue) => issue.status === "Resolved").length,
            }
          : month,
      )
    : monthlyIncidentData;
  return (
    <Panel title="MONTHLY INCIDENTS" subtitle="Reported incidents compared with resolved cases">
      <ChartFrame>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incidentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ORANGE} stopOpacity={0.32} />
              <stop offset="95%" stopColor={ORANGE} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false} />
          <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="incidents"
            name="Reported"
            stroke={ORANGE}
            fill="url(#incidentFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke={BLUE}
            fill="transparent"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartFrame>
    </Panel>
  );
}

export function ResolutionRate() {
  const { issues } = useRealtimeIssues();
  const incidentData = issues.length
    ? monthlyIncidentData.map((month, index) =>
        index === monthlyIncidentData.length - 1
          ? {
              ...month,
              incidents: issues.length,
              resolved: issues.filter((issue) => issue.status === "Resolved").length,
            }
          : month,
      )
    : monthlyIncidentData;
  const data = incidentData.map((month) => ({
    ...month,
    rate: Math.round((month.resolved / month.incidents) * 100),
  }));
  return (
    <Panel
      title="RESOLUTION RATE"
      subtitle="Percentage of incidents closed within the reporting period"
    >
      <ChartFrame>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={chartAxis} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`${value}%`, "Resolution"]}
          />
          <ReferenceLine y={85} stroke="#94a3b8" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="rate"
            name="Resolution"
            stroke={BLUE}
            strokeWidth={3}
            dot={{ r: 4, fill: ORANGE }}
          />
        </LineChart>
      </ChartFrame>
    </Panel>
  );
}

export function StationAnalyticsCharts() {
  const activeTrainData = SECTIONS.map((section) => ({
    section: section.id,
    active: TRAINS.filter((train) => train.section === section.id).length,
  }));
  const platformData = [
    { platform: "P1", occupied: 82 },
    { platform: "P2", occupied: 96 },
    { platform: "P3", occupied: 44 },
    { platform: "P4", occupied: 71 },
    { platform: "P5", occupied: 28 },
    { platform: "P6", occupied: 63 },
  ];
  const issueStats = [
    { status: "Open", count: 9 },
    { status: "In progress", count: 5 },
    { status: "Resolved", count: 12 },
  ];
  const delayData = TRAINS.slice(0, 8).map((train, index) => ({
    train: train.id,
    delay: [0, 8, 22, 3, 0, 14, 5, 2][index] ?? 0,
  }));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="ACTIVE TRAIN CHART" subtitle="Live train count by corridor section">
        <ChartFrame height={240}>
          <BarChart data={activeTrainData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="section" tick={chartAxis} axisLine={false} tickLine={false} />
            <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="active" name="Active trains" fill={BLUE} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ChartFrame>
      </Panel>
      <Panel title="PLATFORM OCCUPANCY" subtitle="Current utilization by platform">
        <ChartFrame height={240}>
          <BarChart data={platformData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="platform" tick={chartAxis} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={chartAxis} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value}%`, "Occupied"]}
            />
            <Bar dataKey="occupied" name="Occupied" fill={ORANGE} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ChartFrame>
      </Panel>
      <Panel title="ISSUE STATISTICS" subtitle="Station issue workflow status">
        <ChartFrame height={240}>
          <PieChart>
            <Pie
              data={issueStats}
              dataKey="count"
              nameKey="status"
              innerRadius={55}
              outerRadius={86}
              paddingAngle={4}
            >
              {issueStats.map((entry, index) => (
                <Cell key={entry.status} fill={[ORANGE, "#fbbf24", "#16a34a"][index]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ChartFrame>
      </Panel>
      <Panel title="DELAY ANALYSIS" subtitle="Minutes of delay across current train movements">
        <ChartFrame height={240}>
          <ComposedChart data={delayData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="train" tick={chartAxis} axisLine={false} tickLine={false} />
            <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value} min`, "Delay"]}
            />
            <Bar dataKey="delay" name="Delay" fill={ORANGE} radius={[5, 5, 0, 0]} />
            <Line dataKey="delay" stroke={NAVY} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ChartFrame>
      </Panel>
    </div>
  );
}

function scheduleColor(delay: number) {
  return delay >= 15 ? "#dc2626" : delay > 0 ? "#f59e0b" : "#16a34a";
}
function scheduleLabel(delay: number) {
  return delay >= 15 ? "Major delay" : delay > 0 ? "Minor delay" : "On time";
}

export function TrainScheduleGantt() {
  const start = 300;
  const end = 1200;
  const width = end - start;
  const position = (minutes: number) =>
    `${Math.max(0, Math.min(100, ((minutes - start) / width) * 100))}%`;
  return (
    <Panel
      title="TRAIN SCHEDULE TIMELINE"
      subtitle="Gantt-style platform occupation and delay status"
    >
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="mb-3 ml-36 flex justify-between border-b border-border pb-2 font-mono text-[10px] text-muted-foreground">
            {[300, 480, 660, 840, 1020, 1200].map((time) => (
              <span key={time}>{fmt(time)}</span>
            ))}
          </div>
          <div className="space-y-2">
            {schedule.map((train) => {
              const color = scheduleColor(train.delay);
              return (
                <div key={train.id} className="flex items-center gap-3 text-xs">
                  <div className="w-33 shrink-0 truncate">
                    <p className="font-semibold text-foreground">{train.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {train.id} · {train.platform}
                    </p>
                  </div>
                  <div className="relative h-10 flex-1 rounded-lg bg-panel-muted">
                    <div className="absolute inset-0 flex justify-between px-[10%] opacity-60">
                      {[1, 2, 3, 4].map((line) => (
                        <span key={line} className="border-l border-border" />
                      ))}
                    </div>
                    <div
                      className="absolute top-1.5 h-7 rounded-md px-2 text-[10px] font-bold leading-7 text-white shadow-sm"
                      style={{
                        left: position(train.start),
                        width: `${Math.max(4, ((train.end - train.start) / width) * 100)}%`,
                        backgroundColor: color,
                      }}
                      title={`${train.name} · ${fmt(train.start)}–${fmt(train.end)} · ${scheduleLabel(train.delay)}`}
                    >
                      {scheduleLabel(train.delay)}
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                    +{train.delay}m
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            {[
              { color: "#16a34a", label: "On time" },
              { color: "#f59e0b", label: "Minor delay" },
              { color: "#dc2626", label: "Major delay" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function MapAnalyticsSummary() {
  const { issues: realtimeIncidents } = useRealtimeIssues();
  const incidents = realtimeIncidents.length ? realtimeIncidents : generateStationIncidents(56);
  const stats = [
    { label: "Total issues", value: incidents.length, icon: ListChecks, tone: "text-primary" },
    {
      label: "Critical issues",
      value: incidents.filter((issue) => issue.severity === "Critical").length,
      icon: TriangleAlert,
      tone: "text-danger",
    },
    {
      label: "Resolved issues",
      value: incidents.filter((issue) => issue.status === "Resolved").length,
      icon: Signal,
      tone: "text-success",
    },
    {
      label: "Pending issues",
      value: incidents.filter((issue) => issue.status === "Open" || issue.status === "Acknowledged")
        .length,
      icon: Gauge,
      tone: "text-warn-foreground",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-panel p-4 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </span>
              <Icon className={`size-4 ${stat.tone}`} />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
