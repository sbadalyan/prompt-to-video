import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import React from "react";

// --- Types ---

export interface LineChartDataPoint {
  label: string;
  value: number;
}

export interface LineChartSeries {
  name: string;
  color?: string;
  data: LineChartDataPoint[];
}

export interface LineChartVideoData {
  type: "line-chart";
  title: string;
  subtitle?: string;
  unit?: string;
  valueFormat?: "number" | "millions" | "billions" | "percentage";
  framesPerPeriod?: number;
  series: LineChartSeries[];
  coverImage?: string;
}

export interface LineChartVideoProps {
  data?: LineChartVideoData;
}

// --- Constants ---

const LINE_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
];

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const MARGIN_LEFT = 140;
const MARGIN_RIGHT = 80;
const MARGIN_TOP = 170;
const MARGIN_BOTTOM = 150;

const CHART_LEFT = MARGIN_LEFT;
const CHART_RIGHT = CANVAS_W - MARGIN_RIGHT;
const CHART_TOP = MARGIN_TOP;
const CHART_BOTTOM = CANVAS_H - MARGIN_BOTTOM;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const CHART_H = CHART_BOTTOM - CHART_TOP;

// --- Helpers ---

function formatValue(value: number, format: string = "number"): string {
  const v = Math.max(0, value);
  switch (format) {
    case "millions":
      return `${(v / 1e6).toFixed(1)}M`;
    case "billions":
      return `${(v / 1e9).toFixed(2)}B`;
    case "percentage":
      return `${v.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(Math.round(v));
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// --- Main Component ---

export const LineChartVideo: React.FC<LineChartVideoProps> = ({ data }) => {
  const frame = useCurrentFrame();

  if (!data?.series || data.series.length === 0) return null;

  const {
    title,
    subtitle,
    unit,
    valueFormat = "number",
    framesPerPeriod = 30,
    series,
  } = data;

  // Assign colors
  const coloredSeries = series.map((s, i) => ({
    ...s,
    color: s.color ?? LINE_COLORS[i % LINE_COLORS.length],
  }));

  // Labels from first series (all series share same labels)
  const labels = coloredSeries[0].data.map((d) => d.label);
  const totalPoints = labels.length;

  // Total animation frames
  const totalAnimFrames = Math.max(framesPerPeriod * (totalPoints - 1), 1);

  // Progress (0 to 1)
  const progress = Math.min(frame / totalAnimFrames, 1);

  // Current interpolated position
  const currentIdxFloat = progress * (totalPoints - 1);
  const currentIdxFloor = Math.min(Math.floor(currentIdxFloat), totalPoints - 2);
  const currentIdxCeil = Math.min(currentIdxFloor + 1, totalPoints - 1);
  const frac = currentIdxFloat - currentIdxFloor;

  // All values for scale
  const allValues = coloredSeries.flatMap((s) => s.data.map((d) => d.value));
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const valuePadding = Math.max((rawMax - rawMin) * 0.1, rawMax * 0.05);
  const minVal = Math.max(0, rawMin - valuePadding);
  const maxVal = rawMax + valuePadding;

  // Coordinate helpers
  const cx = (idx: number) => CHART_LEFT + (idx / (totalPoints - 1)) * CHART_W;
  const cy = (value: number) =>
    CHART_BOTTOM - ((value - minVal) / (maxVal - minVal)) * CHART_H;

  // Clip rect width based on progress
  const clipWidth = Math.max(0, progress * CHART_W);

  // Polyline points for each series
  const seriesPoints = coloredSeries.map((s) =>
    s.data.map((d, i) => `${cx(i).toFixed(1)},${cy(d.value).toFixed(1)}`).join(" ")
  );

  // Grid lines (5 intervals)
  const GRID_COUNT = 5;
  const gridLines = Array.from({ length: GRID_COUNT + 1 }, (_, i) => {
    const value = minVal + (i / GRID_COUNT) * (maxVal - minVal);
    return { value, y: cy(value) };
  });

  // X-axis labels: show at most 12
  const maxXLabels = 12;
  const xLabelStep = Math.max(1, Math.ceil(totalPoints / maxXLabels));
  const xLabels = labels
    .map((label, i) => ({ label, x: cx(i), i }))
    .filter((item, i) => i % xLabelStep === 0 || item.i === totalPoints - 1);

  // Title/legend fade-in
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", overflow: "hidden" }}>
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.06) 0%, transparent 55%)",
        }}
      />

      {/* SVG Chart */}
      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id="lc-clip">
            <rect
              x={CHART_LEFT}
              y={CHART_TOP - 20}
              width={clipWidth}
              height={CHART_H + 40}
            />
          </clipPath>
        </defs>

        {/* Horizontal grid lines + Y-axis labels */}
        {gridLines.map(({ value, y }, i) => (
          <g key={i}>
            <line
              x1={CHART_LEFT}
              y1={y}
              x2={CHART_RIGHT}
              y2={y}
              stroke="rgba(248,250,252,0.07)"
              strokeWidth={1}
            />
            <text
              x={CHART_LEFT - 16}
              y={y + 7}
              textAnchor="end"
              fontSize={20}
              fill="#475569"
              fontFamily="system-ui, sans-serif"
            >
              {formatValue(value, valueFormat)}
            </text>
          </g>
        ))}

        {/* Bottom axis line */}
        <line
          x1={CHART_LEFT}
          y1={CHART_BOTTOM}
          x2={CHART_RIGHT}
          y2={CHART_BOTTOM}
          stroke="rgba(248,250,252,0.15)"
          strokeWidth={1.5}
        />

        {/* Left axis line */}
        <line
          x1={CHART_LEFT}
          y1={CHART_TOP}
          x2={CHART_LEFT}
          y2={CHART_BOTTOM}
          stroke="rgba(248,250,252,0.08)"
          strokeWidth={1}
        />

        {/* X-axis labels */}
        {xLabels.map(({ label, x, i }) => (
          <text
            key={i}
            x={x}
            y={CHART_BOTTOM + 40}
            textAnchor="middle"
            fontSize={22}
            fill="#64748b"
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Vertical tick at current position */}
        <line
          x1={CHART_LEFT + progress * CHART_W}
          y1={CHART_TOP}
          x2={CHART_LEFT + progress * CHART_W}
          y2={CHART_BOTTOM}
          stroke="rgba(248,250,252,0.08)"
          strokeWidth={1}
          strokeDasharray="6 6"
        />

        {/* Series lines (clipped) */}
        <g clipPath="url(#lc-clip)">
          {coloredSeries.map((s, si) => (
            <polyline
              key={si}
              points={seriesPoints[si]}
              fill="none"
              stroke={s.color}
              strokeWidth={4.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.9}
            />
          ))}
        </g>

        {/* Glow layer for lines (clipped) */}
        <g clipPath="url(#lc-clip)">
          {coloredSeries.map((s, si) => (
            <polyline
              key={si}
              points={seriesPoints[si]}
              fill="none"
              stroke={s.color}
              strokeWidth={12}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.12}
            />
          ))}
        </g>

        {/* Current position dots */}
        {coloredSeries.map((s, si) => {
          const valA = s.data[Math.max(0, currentIdxFloor)]?.value ?? 0;
          const valB = s.data[currentIdxCeil]?.value ?? valA;
          const currentVal = lerp(valA, valB, Math.min(frac, 1));
          const dotX = CHART_LEFT + progress * CHART_W;
          const dotY = cy(currentVal);

          return (
            <g key={si}>
              <circle cx={dotX} cy={dotY} r={14} fill={s.color} opacity={0.2} />
              <circle cx={dotX} cy={dotY} r={7} fill={s.color} />
              <circle
                cx={dotX}
                cy={dotY}
                r={4}
                fill="#0f172a"
              />
            </g>
          );
        })}
      </svg>

      {/* Title area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: MARGIN_LEFT,
          right: MARGIN_RIGHT,
          height: MARGIN_TOP,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          opacity: headerOpacity,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#f8fafc",
            lineHeight: 1.1,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 28, color: "#64748b", fontWeight: 400 }}>
            {subtitle}
          </div>
        )}
        {unit && (
          <div style={{ fontSize: 20, color: "#475569", fontWeight: 500, marginTop: 2 }}>
            {unit}
          </div>
        )}
      </div>

      {/* Legend + current values */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: MARGIN_LEFT,
          right: MARGIN_RIGHT,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 36px",
          opacity: headerOpacity,
        }}
      >
        {coloredSeries.map((s, i) => {
          const valA = s.data[Math.max(0, currentIdxFloor)]?.value ?? 0;
          const valB = s.data[currentIdxCeil]?.value ?? valA;
          const currentVal = lerp(valA, valB, Math.min(frac, 1));

          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: s.color,
                }}
              />
              <span
                style={{
                  fontSize: 22,
                  color: "#cbd5e1",
                  fontWeight: 500,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontSize: 22,
                  color: s.color,
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {formatValue(currentVal, valueFormat)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Period watermark */}
      <div
        style={{
          position: "absolute",
          bottom: -20,
          right: MARGIN_RIGHT,
          fontSize: 220,
          fontWeight: 900,
          color: "rgba(248,250,252,0.03)",
          lineHeight: 1,
          letterSpacing: -12,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {labels[Math.min(Math.round(currentIdxFloat), totalPoints - 1)]}
      </div>
    </AbsoluteFill>
  );
};
