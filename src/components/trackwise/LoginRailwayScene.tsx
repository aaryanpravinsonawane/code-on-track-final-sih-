/**
 * Illustrated railway scene for the login page (flat vector artwork, no external image).
 * Dusk sky, distant hills, converging tracks, overhead-equipment masts and a signal.
 */
export function LoginRailwayScene() {
  const vp = { x: 400, y: 600 };
  const sleepers = Array.from({ length: 22 }, (_, i) => {
    const t = Math.pow(i / 21, 2.1);
    const y = vp.y + (1000 - vp.y) * t;
    const half = 18 + (440 - 18) * t;
    return { y, x1: vp.x - half, x2: vp.x + half, w: 1 + 5 * t };
  });
  const masts = Array.from({ length: 7 }, (_, i) => {
    const t = Math.pow((i + 1) / 8, 1.9);
    const y = vp.y + (1000 - vp.y) * t;
    const off = 40 + 420 * t;
    return { y, xl: vp.x - off - 40 * t, xr: vp.x + off + 40 * t, h: 14 + 220 * t, w: 1 + 5 * t };
  });
  return (
    <svg
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070f26" />
          <stop offset="0.38" stopColor="#14275a" />
          <stop offset="0.6" stopColor="#c2410c" />
          <stop offset="0.62" stopColor="#f97316" />
          <stop offset="0.64" stopColor="#1b1530" />
          <stop offset="1" stopColor="#0a0f1f" />
        </linearGradient>
        <radialGradient id="ls-glow" cx="0.5" cy="0.6" r="0.35">
          <stop offset="0" stopColor="#fdba74" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ls-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#0c1530" stopOpacity="0" />
          <stop offset="1" stopColor="#0c1530" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#ls-sky)" />
      <ellipse cx="400" cy="600" rx="420" ry="190" fill="url(#ls-glow)" />
      {/* stars */}
      {Array.from({ length: 36 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 211) % 800}
          cy={(i * 97) % 300}
          r={i % 5 === 0 ? 1.6 : 0.9}
          fill="#e2e8f0"
          opacity={0.35 + (i % 4) * 0.15}
        />
      ))}
      {/* distant hills + town */}
      <path
        d="M0 600 L0 560 Q90 520 180 548 T360 540 T520 552 T700 524 T800 546 L800 600Z"
        fill="#101a3a"
      />
      <path
        d="M0 600 L0 578 Q120 556 230 574 T440 566 T640 574 T800 566 L800 600Z"
        fill="#0b1330"
      />
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={120 + i * 36}
          y={580 - ((i * 7) % 4) * 6}
          width={10 + (i % 3) * 4}
          height={20 + ((i * 7) % 4) * 6}
          fill="#0a1128"
        />
      ))}
      {/* ground */}
      <rect y="600" width="800" height="400" fill="#0b1124" />
      {/* tracks */}
      {[-1, 1].map((side) => (
        <g key={side}>
          {[0, 1].map((rail) => (
            <line
              key={rail}
              x1={vp.x + side * (7 + rail * 14)}
              y1={vp.y}
              x2={vp.x + side * (210 + rail * 70) * 1 + (side < 0 ? -30 : 30) * rail}
              y2={1000}
              stroke="#94a3b8"
              strokeOpacity={0.75}
              strokeWidth={rail ? 3 : 4}
            />
          ))}
        </g>
      ))}
      {sleepers.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          x2={s.x2}
          y1={s.y}
          y2={s.y}
          stroke="#64748b"
          strokeOpacity={0.4}
          strokeWidth={s.w}
        />
      ))}
      {/* OHE masts, cantilevers and catenary */}
      {masts.map((m, i) => (
        <g key={i} stroke="#1e293b" strokeWidth={m.w} strokeLinecap="round">
          <line x1={m.xl} x2={m.xl} y1={m.y} y2={m.y - m.h} />
          <line x1={m.xr} x2={m.xr} y1={m.y} y2={m.y - m.h} />
          <line x1={m.xl} x2={m.xr} y1={m.y - m.h} y2={m.y - m.h} stroke="#334155" />
        </g>
      ))}
      <path
        d={`M${vp.x} ${vp.y - 12} L${vp.x - 520} 120`}
        stroke="#334155"
        strokeOpacity={0.7}
        fill="none"
      />
      <path
        d={`M${vp.x} ${vp.y - 12} L${vp.x + 520} 120`}
        stroke="#334155"
        strokeOpacity={0.7}
        fill="none"
      />
      {/* signal */}
      <g transform="translate(640 700)">
        <line y1="0" y2="190" stroke="#1e293b" strokeWidth="6" />
        <rect x="-14" y="-62" width="28" height="70" rx="6" fill="#0b1124" stroke="#334155" />
        <circle cy="-46" r="7" fill="#ef4444" opacity="0.35" />
        <circle cy="-27" r="7" fill="#f59e0b" opacity="0.35" />
        <circle cy="-8" r="7" fill="#22c55e" />
        <circle cy="-8" r="22" fill="#22c55e" opacity="0.18" />
      </g>
      {/* blend into the form panel */}
      <rect width="800" height="1000" fill="url(#ls-fade)" />
    </svg>
  );
}
