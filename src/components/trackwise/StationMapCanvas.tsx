import { useMemo, useState } from "react";
import { useRealtimeIssues } from "@/hooks/useRealtimeIssues";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/trackwise/shared";
import { generateStationIncidents } from "@/lib/trackwise/operations";

type MapIssue = {
  id: string;
  title: string;
  type: "Signal" | "Track" | "OHE" | "Substation" | "Platform" | "Other";
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Acknowledged" | "In Progress" | "Resolved";
  location: string;
  x: number;
  y: number;
  asset: string;
};

const mapIssueTemplates: Array<Pick<MapIssue, "type" | "severity" | "x" | "y" | "asset">> = [
  { type: "Signal", severity: "Critical", x: 220, y: 120, asset: "S-204" },
  { type: "Track", severity: "High", x: 360, y: 190, asset: "UP-MAIN" },
  { type: "Platform", severity: "Medium", x: 140, y: 250, asset: "P2" },
  { type: "OHE", severity: "Critical", x: 530, y: 310, asset: "OHE-02" },
  { type: "Substation", severity: "Medium", x: 760, y: 120, asset: "SS-01" },
  { type: "Signal", severity: "Low", x: 660, y: 190, asset: "S-412" },
  { type: "Track", severity: "Medium", x: 590, y: 105, asset: "S3" },
  { type: "Platform", severity: "High", x: 140, y: 420, asset: "P6" },
  { type: "Substation", severity: "High", x: 760, y: 360, asset: "SS-02" },
  { type: "Other", severity: "Low", x: 470, y: 410, asset: "CONTROL" },
];

const severityColors: Record<MapIssue["severity"], string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#fbbf24",
  Low: "#22c55e",
};

const typeColors: Record<MapIssue["type"], string> = {
  Signal: "#f59e0b",
  Track: "#ef4444",
  OHE: "#8b5cf6",
  Substation: "#a78bfa",
  Platform: "#38bdf8",
  Other: "#34d399",
};

const typeLabel: Record<MapIssue["type"], string> = {
  Signal: "Signal",
  Track: "Track",
  OHE: "OHE",
  Substation: "Substation",
  Platform: "Platform",
  Other: "Issue",
};

export function StationMapCanvas({ focusAsset }: { focusAsset?: string }) {
  const [selected, setSelected] = useState(
    () =>
      focusAsset ??
      (typeof window !== "undefined" ? sessionStorage.getItem("trackwise_map_focus") : null) ??
      "INC-2026-001",
  );
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const { issues: realtimeIncidents, status: realtimeStatus } = useRealtimeIssues();

  const issues = useMemo(() => {
    const incidentList = realtimeIncidents.length
      ? realtimeIncidents
      : generateStationIncidents(18);

    return incidentList.map((incident, index) => {
      const template = mapIssueTemplates[index % mapIssueTemplates.length]!;
      const severityLookup: Record<string, MapIssue["severity"]> = {
        CRITICAL: "Critical",
        HIGH: "High",
        MEDIUM: "Medium",
        LOW: "Low",
      };
      const type = template.type;
      const severity = severityLookup[incident.severity] ?? "Medium";
      const assetName = incident.asset || template.asset;

      return {
        id: incident.id,
        title: incident.title,
        type,
        severity,
        status: incident.status,
        location: incident.location || assetName,
        x: template.x + ((index % 3) - 1) * 12,
        y: template.y + (index % 2 === 0 ? 12 : -10),
        asset: assetName,
      } satisfies MapIssue;
    });
  }, [realtimeIncidents]);

  const selectedIssue = issues.find((issue) => issue.id === selected) ?? issues[0];

  const colorFor = (
    type: MapIssue["type"],
    severity: MapIssue["severity"],
    status: MapIssue["status"],
  ) => {
    if (status === "Resolved") return "#22c55e";
    if (severity === "Critical") return "#ef4444";
    if (severity === "High" || severity === "Medium") return "#fbbf24";
    return typeColors[type] ?? severityColors[severity] ?? "#38bdf8";
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Panel
        title="NDG JUNCTION · LIVE SCHEMATIC"
        right={
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              Realtime: {realtimeStatus}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale((value) => Math.min(1.8, value + 0.15))}
            >
              +
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale((value) => Math.max(0.7, value - 0.15))}
            >
              −
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setScale(1);
                setOffset({ x: 0, y: 0 });
              }}
            >
              Reset
            </Button>
          </div>
        }
      >
        <div className="relative h-[560px] overflow-hidden rounded-md border border-border bg-[#08131b]">
          <svg
            viewBox="0 0 900 500"
            className="h-full w-full cursor-grab"
            role="img"
            aria-label="Interactive railway station schematic with all active issues"
            onWheel={(event) => {
              event.preventDefault();
              setScale((value) => Math.max(0.7, Math.min(1.8, value - event.deltaY / 1500)));
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) {
                setOffset((value) => ({
                  x: value.x + event.movementX,
                  y: value.y + event.movementY,
                }));
              }
            }}
          >
            <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
              <rect width="900" height="500" fill="#08131b" />
              {[0, 1, 2, 3, 4, 5, 6].map((line) => (
                <line
                  key={line}
                  x1="40"
                  y1={68 + line * 58}
                  x2="860"
                  y2={68 + line * 58}
                  stroke={line < 6 ? "#64748b" : "#34d399"}
                  strokeWidth={line < 6 ? 3 : 2}
                  strokeDasharray={line === 6 ? "10 7" : undefined}
                />
              ))}
              {[0, 1, 2, 3, 4, 5].map((line) => (
                <g key={line}>
                  <rect
                    x="75"
                    y={45 + line * 58}
                    width="90"
                    height="46"
                    rx="4"
                    fill="#123247"
                    stroke="#38bdf8"
                  />
                  <text
                    x="120"
                    y={72 + line * 58}
                    textAnchor="middle"
                    fill="#bae6fd"
                    fontSize="14"
                    fontWeight="700"
                  >
                    P{line + 1}
                  </text>
                </g>
              ))}
              <path
                d="M220 126 L340 242 L460 126 M460 126 L580 242 L700 126"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
              />
              <path
                d="M220 358 L340 242 L460 358 M460 358 L580 242 L700 358"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
              />
              {issues.map((issue) => (
                <g
                  key={issue.id}
                  onClick={() => {
                    setSelected(issue.id);
                    if (typeof window !== "undefined")
                      sessionStorage.setItem("trackwise_map_focus", issue.id);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx={issue.x}
                    cy={issue.y}
                    r={issue.severity === "Critical" ? 12 : 9}
                    fill={colorFor(issue.type, issue.severity, issue.status)}
                    stroke={selected === issue.id ? "white" : "#0f172a"}
                    strokeWidth="3"
                  />
                  <circle
                    cx={issue.x}
                    cy={issue.y}
                    r={issue.severity === "Critical" ? 18 : 14}
                    fill="none"
                    stroke={colorFor(issue.type, issue.severity, issue.status)}
                    strokeWidth="2"
                    opacity={issue.severity === "Critical" ? 0.8 : 0.5}
                    strokeDasharray={issue.severity === "Critical" ? "4 6" : undefined}
                  />
                  <text x={issue.x + 13} y={issue.y + 4} fill="#e2e8f0" fontSize="11">
                    {issue.asset}
                  </text>
                </g>
              ))}
              <g>
                <rect
                  x="350"
                  y="202"
                  width="200"
                  height="72"
                  rx="6"
                  fill="#172b3a"
                  stroke="#f59e0b"
                />
                <text
                  x="450"
                  y="226"
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="13"
                  fontWeight="700"
                >
                  NDG CONTROL ROOM
                </text>
                <text x="450" y="248" textAnchor="middle" fill="#94a3b8" fontSize="11">
                  TMS · TDMS · SMMS · COA
                </text>
              </g>
            </g>
          </svg>
        </div>
      </Panel>
      <Panel title="ISSUE DETAILS">
        {selectedIssue ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Issue ID</p>
              <p className="font-mono text-lg font-bold text-primary">{selectedIssue.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-semibold">{typeLabel[selectedIssue.type]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Severity</p>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{
                  backgroundColor: colorFor(
                    selectedIssue.type,
                    selectedIssue.severity,
                    selectedIssue.status,
                  ),
                }}
              >
                {selectedIssue.severity}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p
                className={
                  selectedIssue.status === "Resolved"
                    ? "font-semibold text-emerald-500"
                    : "font-semibold text-foreground"
                }
              >
                {selectedIssue.status}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Asset</p>
              <p className="font-semibold">{selectedIssue.asset}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-semibold">{selectedIssue.location}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="font-medium text-foreground">{selectedIssue.title}</p>
            </div>
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              {issues.length} active issue markers currently shown on the schematic.
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No issue selected</div>
        )}
      </Panel>
    </div>
  );
}
