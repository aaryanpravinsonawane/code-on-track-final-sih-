import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/trackwise/shared";

const mapAssets = [
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `P${i + 1}`,
    type: "Platform",
    x: 120,
    y: 70 + i * 58,
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `S${i + 1}`,
    type: "Signal",
    x: 255 + (i % 3) * 270,
    y: 52 + Math.floor(i / 3) * 116,
  })),
  { id: "SS-01", type: "Substation", x: 760, y: 80 },
  { id: "SS-02", type: "Substation", x: 760, y: 310 },
  { id: "OHE-02", type: "OHE", x: 520, y: 370 },
  { id: "INC-124", type: "Incident", x: 500, y: 180 },
];

export function StationMapCanvas({ focusAsset }: { focusAsset?: string }) {
  const [selected, setSelected] = useState(
    () =>
      focusAsset ??
      (typeof window !== "undefined" ? sessionStorage.getItem("trackwise_map_focus") : null) ??
      "P2",
  );
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const asset = mapAssets.find((item) => item.id === selected) ?? mapAssets[0];
  const colorFor = (type: string) =>
    type === "Signal"
      ? "#f59e0b"
      : type === "Platform"
        ? "#38bdf8"
        : type === "Incident"
          ? "#ef4444"
          : type === "Substation"
            ? "#a78bfa"
            : "#34d399";
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel
        title="NDG JUNCTION · LIVE SCHEMATIC"
        right={
          <div className="flex gap-1">
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
            aria-label="Interactive railway station schematic"
            onWheel={(event) => {
              event.preventDefault();
              setScale((value) => Math.max(0.7, Math.min(1.8, value - event.deltaY / 1500)));
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1)
                setOffset((value) => ({
                  x: value.x + event.movementX,
                  y: value.y + event.movementY,
                }));
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
              {mapAssets.map((item) => (
                <g key={item.id} onClick={() => setSelected(item.id)} className="cursor-pointer">
                  <circle
                    cx={item.x}
                    cy={item.y}
                    r={item.type === "Incident" ? 11 : 8}
                    fill={colorFor(item.type)}
                    stroke={selected === item.id ? "white" : "#0f172a"}
                    strokeWidth="3"
                  />
                  {item.type === "Incident" && (
                    <circle
                      cx={item.x}
                      cy={item.y}
                      r="17"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      opacity=".7"
                    >
                      <animate
                        attributeName="r"
                        values="12;24;12"
                        dur="1.7s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <text x={item.x + 13} y={item.y + 4} fill="#e2e8f0" fontSize="12">
                    {item.id}
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
      <Panel title="ASSET DETAILS">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Selected asset</p>
            <p className="font-mono text-lg font-bold text-primary">{asset?.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-semibold">{asset?.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="font-semibold">
              NDG Station · Control Zone {asset?.id?.slice(-1) ?? "2"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-semibold text-emerald-500">Telemetry available</p>
          </div>
          <div className="border-t border-border pt-3 text-xs text-muted-foreground">
            Click any platform, signal, OHE asset, substation or incident marker. Drag the schematic
            to pan.
          </div>
        </div>
      </Panel>
    </div>
  );
}
