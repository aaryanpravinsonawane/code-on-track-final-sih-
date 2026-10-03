import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, X } from "lucide-react";
import { Panel } from "@/components/trackwise/shared";
import {
  CORRIDOR_LENGTH_KM,
  CORRIDOR_STATIONS,
  INCIDENT_COLOR,
  MAJOR_STATIONS,
  STATE_META,
  describePosition,
  etaToNextMajor,
  type CorridorSnapshot,
  type CorridorTrain,
} from "@/lib/trackwise/corridor";

export type CorridorSelection =
  { kind: "train"; id: string } | { kind: "station"; name: string } | null;

type Hover = { kind: "train" | "station" | "block" | "incident"; id: string } | null;

// SVG layout (viewBox units). Station spacing is proportional to kilometres.
const W = 1240;
const H = 326;
const PAD = 72;
const TRACK_W = W - PAD * 2;
const LANE_UP = 150;
const LANE_DN = 200;
const LANE_MID = 175;
const ROW_OFFSET = 26;
const INK = "oklch(0.16 0.05 262)";
const xOf = (km: number) => PAD + (km / CORRIDOR_LENGTH_KM) * TRACK_W;

function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function laneOf(t: CorridorTrain, index: number) {
  const y = t.dir === "UP" ? LANE_UP : LANE_DN;
  const outward = t.dir === "UP" ? -ROW_OFFSET : ROW_OFFSET;
  return y + (index % 2 ? outward : 0);
}

function tooltipFor(hover: Hover, snap: CorridorSnapshot) {
  if (!hover) return null;
  if (hover.kind === "train") {
    const idx = snap.trains.findIndex((t) => t.id === hover.id);
    const t = snap.trains[idx];
    if (!t) return null;
    return {
      x: xOf(t.km),
      y: laneOf(t, idx),
      title: `${t.id} · ${t.name}`,
      lines: [
        `${STATE_META[t.state].label} · +${t.delay} min`,
        describePosition(t.km),
        `${t.speedKmph} km/h · towards ${t.dir === "UP" ? "Nanded" : "Manmad"}`,
      ],
    };
  }
  if (hover.kind === "station") {
    const st = CORRIDOR_STATIONS.find((s) => s.name === hover.id);
    if (!st) return null;
    const near = snap.trains.filter((t) => Math.abs(t.km - st.km) <= 15).length;
    return {
      x: xOf(st.km),
      y: LANE_MID,
      title: st.code ? `${st.name} (${st.code})` : st.name,
      lines: [`km ${st.km} from Manmad`, `${near} train(s) within 15 km`],
    };
  }
  if (hover.kind === "block") {
    const b = snap.blocks.find((x) => x.id === hover.id);
    if (!b) return null;
    return {
      x: (xOf(b.fromKm) + xOf(b.toKm)) / 2,
      y: LANE_MID,
      title: `Track block · ${b.place}`,
      lines: [
        b.activity,
        `${b.department} · ${b.progress}% done`,
        `${b.remainingMin} min of window left`,
      ],
    };
  }
  const inc = snap.incidents.find((x) => x.id === hover.id);
  if (!inc) return null;
  return {
    x: xOf(inc.km),
    y: 100,
    title: inc.title,
    lines: [...wrap(inc.detail, 32), `Source: ${inc.source}`],
  };
}

export function LiveCorridor({
  snapshot,
  playing,
  onTogglePlay,
  selection,
  onSelect,
  matchIds,
}: {
  snapshot: CorridorSnapshot;
  playing: boolean;
  onTogglePlay: () => void;
  selection: CorridorSelection;
  onSelect: (selection: CorridorSelection) => void;
  matchIds: string[] | null;
}) {
  const [hover, setHover] = useState<Hover>(null);
  const tip = tooltipFor(hover, snapshot);
  const selectedTrain =
    selection?.kind === "train" ? snapshot.trains.find((t) => t.id === selection.id) : undefined;
  const selectedStation =
    selection?.kind === "station"
      ? CORRIDOR_STATIONS.find((s) => s.name === selection.name)
      : undefined;

  const clearHover = () => setHover(null);
  const activate = (fn: () => void) => ({
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    },
    onClick: fn,
  });

  return (
    <Panel
      title="Live corridor · Manmad to Hazur Sahib Nanded"
      right={
        <div className="flex items-center gap-2">
          <span className="hidden items-center rounded-full border border-st-delayed/30 bg-st-delayed/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-st-delayed sm:inline-flex">
            Simulated feed · demo data
          </span>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-pressed={playing}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-muted px-2.5 py-1 text-[11px] font-bold tracking-wider text-foreground hover:bg-secondary"
          >
            <span
              className={`size-1.5 rounded-full ${playing ? "animate-pulse bg-st-ontime" : "bg-st-delayed"}`}
            />
            {playing ? "LIVE" : "PAUSED"}
            {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
          </button>
        </div>
      }
    >
      <div
        className="overflow-x-auto rounded-lg border border-border/70"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.8 0.08 250 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.8 0.08 250 / 0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[840px]"
          role="img"
          aria-label="Live corridor from Manmad to Hazur Sahib Nanded, station spacing proportional to kilometres"
        >
          <defs>
            <pattern
              id="cc-block-hatch"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="8" height="8" fill="var(--st-block)" fillOpacity="0.14" />
              <rect width="3" height="8" fill="var(--st-block)" fillOpacity="0.5" />
            </pattern>
          </defs>

          {/* 50 km guides + scale */}
          {Array.from({ length: 8 }, (_, i) => i * 50).map((km) => (
            <g key={km}>
              <line
                x1={xOf(km)}
                x2={xOf(km)}
                y1={60}
                y2={296}
                stroke="var(--grid)"
                strokeDasharray="2 6"
              />
              <line x1={xOf(km)} x2={xOf(km)} y1={296} y2={302} stroke="var(--muted-foreground)" />
              <text
                x={xOf(km)}
                y={316}
                textAnchor="middle"
                fontSize={9.5}
                className="font-mono"
                fill="var(--muted-foreground)"
              >
                {km}
              </text>
            </g>
          ))}
          <line
            x1={PAD}
            x2={xOf(CORRIDOR_LENGTH_KM)}
            y1={296}
            y2={296}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.5}
          />
          <text
            x={xOf(CORRIDOR_LENGTH_KM) + 22}
            y={316}
            fontSize={9.5}
            className="font-mono"
            fill="var(--muted-foreground)"
          >
            km
          </text>

          {/* Active track blocks */}
          {snapshot.blocks.map((b) => {
            const x1 = xOf(b.fromKm);
            const x2 = xOf(b.toKm);
            return (
              <g
                key={b.id}
                className="cursor-pointer"
                onMouseEnter={() => setHover({ kind: "block", id: b.id })}
                onMouseLeave={clearHover}
              >
                <rect
                  x={x1}
                  y={128}
                  width={x2 - x1}
                  height={94}
                  rx={4}
                  fill="url(#cc-block-hatch)"
                  stroke="var(--st-block)"
                  strokeWidth={1.2}
                  strokeDasharray="4 3"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={190}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={700}
                  fill="var(--st-block)"
                >
                  BLK
                </text>
              </g>
            );
          })}

          {/* Lanes */}
          {[LANE_UP, LANE_DN].map((y) => (
            <g key={y}>
              <line
                x1={PAD - 20}
                x2={W - PAD + 20}
                y1={y}
                y2={y}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.55}
                strokeWidth={3}
              />
              <line
                x1={PAD - 20}
                x2={W - PAD + 20}
                y1={y}
                y2={y}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.3}
                strokeWidth={9}
                strokeDasharray="1.5 8"
              />
            </g>
          ))}
          <text x={6} y={LANE_UP + 3} fontSize={9} fontWeight={700} fill="var(--muted-foreground)">
            UP
          </text>
          <text x={6} y={LANE_DN + 3} fontSize={9} fontWeight={700} fill="var(--muted-foreground)">
            DN
          </text>

          <path
            d={`M26 ${LANE_UP - 4} L32 ${LANE_UP} L26 ${LANE_UP + 4} Z`}
            fill="var(--muted-foreground)"
          />
          <path
            d={`M32 ${LANE_DN - 4} L26 ${LANE_DN} L32 ${LANE_DN + 4} Z`}
            fill="var(--muted-foreground)"
          />

          {/* Stations */}
          {CORRIDOR_STATIONS.map((st) => {
            const x = xOf(st.km);
            const selected = selection?.kind === "station" && selection.name === st.name;
            const majorIdx = MAJOR_STATIONS.indexOf(st);
            const above = majorIdx % 2 === 0;
            return (
              <g
                key={st.name}
                className="cursor-pointer outline-none"
                aria-label={`${st.name}, km ${st.km}`}
                onMouseEnter={() => setHover({ kind: "station", id: st.name })}
                onMouseLeave={clearHover}
                {...activate(() => onSelect(selected ? null : { kind: "station", name: st.name }))}
              >
                <rect
                  x={x - 10}
                  y={st.major ? 30 : 128}
                  width={20}
                  height={st.major ? 250 : 96}
                  fill="transparent"
                />
                {st.major ? (
                  <>
                    <line
                      x1={x}
                      x2={x}
                      y1={above ? 56 : 212}
                      y2={above ? 138 : 244}
                      stroke="var(--muted-foreground)"
                      strokeOpacity={0.4}
                      strokeDasharray="2 3"
                    />
                    <rect
                      x={x - 2.5}
                      y={138}
                      width={5}
                      height={74}
                      rx={2}
                      fill="var(--muted-foreground)"
                      fillOpacity={0.45}
                    />
                    <circle
                      cx={x}
                      cy={LANE_MID}
                      r={8}
                      fill="var(--background)"
                      stroke={selected ? "var(--rail-yellow)" : "var(--primary)"}
                      strokeWidth={selected ? 3 : 2.5}
                    />
                    <circle
                      cx={x}
                      cy={LANE_MID}
                      r={3}
                      fill={selected ? "var(--rail-yellow)" : "var(--primary)"}
                    />
                    <text
                      x={x}
                      y={above ? 36 : 260}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      letterSpacing={0.4}
                      fill={selected ? "var(--rail-yellow)" : "var(--foreground)"}
                    >
                      {st.label}
                    </text>
                    <text
                      x={x}
                      y={above ? 49 : 273}
                      textAnchor="middle"
                      fontSize={9.5}
                      className="font-mono"
                      fill="var(--muted-foreground)"
                    >
                      {st.code} · {st.km} km
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x={x - 1}
                      y={146}
                      width={2}
                      height={58}
                      fill="var(--muted-foreground)"
                      fillOpacity={0.35}
                    />
                    <circle
                      cx={x}
                      cy={LANE_MID}
                      r={selected ? 5 : 3.5}
                      fill="var(--background)"
                      stroke={selected ? "var(--rail-yellow)" : "var(--muted-foreground)"}
                      strokeWidth={selected ? 2.5 : 1.5}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Incident markers */}
          {snapshot.incidents.map((inc) => {
            const x = xOf(inc.km);
            const color = INCIDENT_COLOR[inc.severity];
            return (
              <g
                key={inc.id}
                transform={`translate(${x} 96)`}
                className="cursor-pointer"
                onMouseEnter={() => setHover({ kind: "incident", id: inc.id })}
                onMouseLeave={clearHover}
              >
                <circle r={8} fill="none" stroke={color} strokeWidth={1.5}>
                  <animate attributeName="r" values="8;20" dur="1.8s" repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="0.8;0"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <line y1={9} y2={32} stroke={color} strokeOpacity={0.7} strokeDasharray="2 2" />
                <path
                  d="M0 -10 L10 8 L-10 8 Z"
                  fill={color}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                <text y={6} textAnchor="middle" fontSize={10} fontWeight={800} fill={INK}>
                  !
                </text>
              </g>
            );
          })}

          {/* Trains */}
          {snapshot.trains.map((t, i) => {
            const color = STATE_META[t.state].color;
            const selected = selection?.kind === "train" && selection.id === t.id;
            const dim = matchIds !== null && !matchIds.includes(t.id);
            const matched = matchIds !== null && matchIds.includes(t.id);
            const y = laneOf(t, i);
            const gw = t.delay > 10 ? 84 : 48;
            const half = gw / 2;
            return (
              <g
                key={t.id}
                className="cursor-pointer outline-none"
                aria-label={`Train ${t.id} ${t.name}, ${STATE_META[t.state].label}`}
                style={{
                  transform: `translate(${xOf(t.km)}px, ${y}px)`,
                  transition: playing ? "transform 1.5s linear, opacity 200ms" : "opacity 200ms",
                  opacity: dim ? 0.28 : 1,
                  filter: selected || matched ? `drop-shadow(0 0 6px ${color})` : undefined,
                }}
                onMouseEnter={() => setHover({ kind: "train", id: t.id })}
                onMouseLeave={clearHover}
                {...activate(() => onSelect(selected ? null : { kind: "train", id: t.id }))}
              >
                <rect x={-half - 2} y={-10} width={gw + 4} height={20} fill="transparent" />
                <rect
                  x={-half}
                  y={-9}
                  width={gw}
                  height={18}
                  rx={4}
                  fill={color}
                  stroke={selected ? "var(--foreground)" : "var(--background)"}
                  strokeWidth={selected ? 2 : 1}
                />
                <path
                  d={
                    t.dir === "UP"
                      ? `M${half} -5 L${half + 7} 0 L${half} 5 Z`
                      : `M${-half} -5 L${-half - 7} 0 L${-half} 5 Z`
                  }
                  fill={color}
                />
                <text
                  x={0}
                  y={3.5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  className="font-mono"
                  fill={INK}
                >
                  {t.delay > 10 ? `${t.id} +${t.delay}m` : t.id}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tip && (
            <g pointerEvents="none">
              {(() => {
                const w = 226;
                const h = 24 + tip.lines.length * 13;
                const tx = tip.x + 18 + w > W ? tip.x - 18 - w : tip.x + 18;
                const ty = Math.min(Math.max(tip.y - h / 2, 4), H - h - 4);
                return (
                  <>
                    <rect
                      x={tx}
                      y={ty}
                      width={w}
                      height={h}
                      rx={6}
                      fill="var(--popover)"
                      stroke="var(--border)"
                    />
                    <text
                      x={tx + 10}
                      y={ty + 16}
                      fontSize={11}
                      fontWeight={700}
                      fill="var(--foreground)"
                    >
                      {tip.title}
                    </text>
                    {tip.lines.map((line, i) => (
                      <text
                        key={i}
                        x={tx + 10}
                        y={ty + 31 + i * 13}
                        fontSize={10}
                        fill="var(--muted-foreground)"
                      >
                        {line}
                      </text>
                    ))}
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        {(Object.keys(STATE_META) as Array<keyof typeof STATE_META>).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: STATE_META[k].color }} />
            {STATE_META[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-dashed border-st-block bg-st-block/30" />
          Active block
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
            <path d="M6 1 L11 10 L1 10 Z" fill="var(--st-critical)" />
          </svg>
          Incident
        </span>
        <span className="ml-auto xl:hidden">Scroll sideways to pan the corridor</span>
      </div>

      {selectedTrain && <TrainDetail train={selectedTrain} onClear={() => onSelect(null)} />}
      {selectedStation && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-rail-yellow/30 bg-rail-yellow/5 px-4 py-2.5 text-sm">
          <span>
            <strong className="text-rail-yellow">{selectedStation.name}</strong>
            {selectedStation.code ? ` (${selectedStation.code})` : ""} · km {selectedStation.km} ·{" "}
            {snapshot.trains.filter((t) => Math.abs(t.km - selectedStation.km) <= 15).length}{" "}
            train(s) within 15 km
          </span>
          <span className="flex items-center gap-3">
            <Link to="/station-master" className="font-semibold text-primary hover:underline">
              Open Station Master →
            </Link>
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-label="Clear selection"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </span>
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">{value}</dd>
      {sub && <dd className="truncate text-[11px] text-muted-foreground">{sub}</dd>}
    </div>
  );
}

function TrainDetail({ train: t, onClear }: { train: CorridorTrain; onClear: () => void }) {
  const eta = etaToNextMajor(t);
  const meta = STATE_META[t.state];
  return (
    <div className="mt-3 rounded-md border border-border bg-panel-muted/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="size-2.5 rounded-sm" style={{ background: meta.color }} />
        <span className="font-mono text-sm font-bold">{t.id}</span>
        <span className="text-sm font-semibold">{t.name}</span>
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {t.category}
        </span>
        <span
          className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ color: meta.color, borderColor: meta.color }}
        >
          {meta.label}
        </span>
        <span className="ml-auto flex items-center gap-3">
          <Link
            to="/live-operations"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Open Live Operations →
          </Link>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </span>
      </div>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Position" value={`km ${Math.round(t.km)}`} sub={describePosition(t.km)} />
        <Stat label="Direction" value={t.dir === "UP" ? "UP → Nanded" : "DN → Manmad"} />
        <Stat
          label="Speed"
          value={`${t.speedKmph} km/h`}
          sub={t.heldFor ? `Restricted · block at ${t.heldFor}` : undefined}
        />
        <Stat label="Delay" value={`+${t.delay} min`} sub={`Predicted +${t.predictedDelay} min`} />
        <Stat label="Traction" value={t.traction} />
        <Stat
          label="Next major stop"
          value={eta ? eta.station.name : "—"}
          sub={eta ? `~${eta.minutes} min` : undefined}
        />
      </dl>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {t.liveFed
          ? "Delay and traction from the live feed; position is a simulated movement layer."
          : "Simulated train · demo data."}
      </p>
    </div>
  );
}
