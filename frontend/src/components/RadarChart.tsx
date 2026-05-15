"use client";

export interface RadarData {
  axis: string;
  value: number; // 0 to 100
}

interface RadarChartProps {
  data: RadarData[];
  size?: number;
  color?: string;
  hideLabels?: boolean;
  isMini?: boolean;
}

// Shorten verbose labels so they never clip
function shortLabel(label: string): string {
  const map: Record<string, string> = {
    "structural depth": "Structure",
    "modularity": "Modularity",
    "idiomatic expression": "Idiomatic",
    "error resilience": "Resilience",
    "namespace hygiene": "Namespace",
    "concurrency pattern": "Concurrency",
    "complexity gradient": "Complexity",
    "dependency gravity": "Dependency",
    // Real analysis labels
    "readability": "Readability",
    "complexity": "Complexity",
    "documentation": "Docs",
    "test_mindset": "Testing",
    "commit_discipline": "Commits",
    "language_depth": "Lang Depth",
    "refactor_tendency": "Refactoring",
    "error_handling": "Error Handling",
  };
  return map[label.toLowerCase()] || label;
}

export function RadarChart({ data, size = 500, color = "#10b981", hideLabels = false, isMini = false }: RadarChartProps) {
  if (!data.length) return null;

  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = isMini ? size * 0.22 : size * 0.24;
  const labelRadius = isMini ? size * 0.44 : size * 0.38;
  const levels = 5;
  const angleSlice = (Math.PI * 2) / n;

  const getX = (i: number, r: number) => cx + r * Math.cos(angleSlice * i - Math.PI / 2);
  const getY = (i: number, r: number) => cy + r * Math.sin(angleSlice * i - Math.PI / 2);

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = (radius / levels) * (level + 1);
    const points = data.map((_, i) => `${getX(i, r)},${getY(i, r)}`).join(" ");
    return <polygon key={level} points={points} fill="none" stroke="#fff" strokeWidth="0.5" opacity={0.06} />;
  });

  // Axis lines
  const axisLines = data.map((_, i) => (
    <line key={i} x1={cx} y1={cy} x2={getX(i, radius)} y2={getY(i, radius)} stroke="#fff" strokeWidth="0.5" opacity={0.12} />
  ));

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * radius;
    return `${getX(i, r)},${getY(i, r)}`;
  }).join(" ");

  // Data dots
  const dataDots = data.map((d, i) => {
    const r = (d.value / 100) * radius;
    return <circle key={i} cx={getX(i, r)} cy={getY(i, r)} r={4} fill={color} stroke="#fff" strokeWidth="1.5" />;
  });

  // Labels — all anchored to render INWARD, never outside viewBox
  const safeX = 12; // minimum x from edge
  const labels = data.map((d, i) => {
    const cosA = Math.cos(angleSlice * i - Math.PI / 2);
    const sinA = Math.sin(angleSlice * i - Math.PI / 2);

    const rawX = getX(i, labelRadius);
    const rawY = getY(i, labelRadius);

    let x = rawX;
    let y = rawY;
    let anchor: string = "middle";

    if (cosA > 0.15) {
      // Right side — use "end" so text extends LEFTWARD (inward)
      anchor = "end";
      x = Math.min(rawX, size - safeX);
    } else if (cosA < -0.15) {
      // Left side — use "start" so text extends RIGHTWARD (inward)
      anchor = "start";
      x = Math.max(safeX, rawX);
    }

    let dy = 0;
    if (sinA < -0.6) dy = -8;
    else if (sinA > 0.6) dy = 8;

    const labelText = shortLabel(d.axis);
    const displayLabel = isMini ? labelText.substring(0, 4) : labelText;

    return (
      <g key={i}>
        <text
          x={x}
          y={y + dy}
          textAnchor={anchor}
          dominantBaseline="central"
          fill="#d4d4d8"
          fontSize={isMini ? "8" : "13"}
          fontWeight="800"
          letterSpacing="0.04em"
          style={{ textTransform: "uppercase" as const }}
        >
          {displayLabel}
        </text>
        {!isMini && (
          <text
            x={x}
            y={y + dy + 18}
            textAnchor={anchor}
            fill={color}
            fontSize="16"
            fontWeight="900"
          >
            {d.value}%
          </text>
        )}
      </g>
    );
  });

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {gridPolygons}
      {axisLines}

      <polygon
        points={dataPoints}
        fill={color}
        fillOpacity={hideLabels ? 0.35 : 0.15}
        stroke={color}
        strokeWidth="2"
        filter="url(#radarGlow)"
      />

      {dataDots}
      {!hideLabels && labels}
    </svg>
  );
}
