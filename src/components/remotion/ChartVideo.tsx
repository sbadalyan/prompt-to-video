import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import React, { useMemo } from "react";

// --- Types ---

export interface ChartItem {
  name: string;
  value: number;
  color?: string;
}

export interface ChartFrame {
  label: string;
  items: ChartItem[];
}

export interface ChartVideoData {
  type: "chart";
  title: string;
  subtitle?: string;
  unit?: string;
  valueFormat?: "number" | "millions" | "billions" | "percentage";
  framesPerPeriod?: number;
  frames: ChartFrame[];
  maxBars?: number;
  accentColor?: string;
  coverImage?: string;
}

export interface ChartVideoProps {
  data?: ChartVideoData;
}

// --- Constants ---

const CHART_COLORS = [
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
  "#6366f1",
  "#a855f7",
  "#d97706",
  "#059669",
  "#dc2626",
];

// Layout (1920x1080)
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const MARGIN_LEFT = 80;
const MARGIN_RIGHT = 80;
const TOP_H = 160;
const BOTTOM_H = 80;
const CHART_H = CANVAS_H - TOP_H - BOTTOM_H;
const LABEL_W = 320;
const BAR_START_X = MARGIN_LEFT + LABEL_W + 24;
const MAX_BAR_W = CANVAS_W - BAR_START_X - MARGIN_RIGHT - 140; // 140 for value text

// --- Helpers ---

function buildColorMap(frames: ChartFrame[]): Record<string, string> {
  const map: Record<string, string> = {};
  let idx = 0;
  for (const frame of frames) {
    for (const item of frame.items) {
      if (!map[item.name]) {
        map[item.name] = item.color ?? CHART_COLORS[idx % CHART_COLORS.length];
        idx++;
      }
    }
  }
  return map;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

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
      return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(v));
  }
}

// --- Main Component ---

export const ChartVideo: React.FC<ChartVideoProps> = ({ data }) => {
  const frame = useCurrentFrame();

  const colorMap = useMemo(() => buildColorMap(data?.frames ?? []), [data?.frames]);

  if (!data?.frames || data.frames.length === 0) return null;

  const {
    title,
    subtitle,
    unit,
    valueFormat = "number",
    framesPerPeriod = 60,
    frames,
    maxBars = 10,
  } = data;

  const totalPeriods = frames.length;

  // Current period index and progress within it
  const periodIdx = Math.min(Math.floor(frame / framesPerPeriod), totalPeriods - 1);
  const rawProgress = Math.min((frame % framesPerPeriod) / framesPerPeriod, 1);
  const easedProgress = easeInOut(rawProgress);

  const currentPeriod = frames[periodIdx];
  const nextPeriod = frames[Math.min(periodIdx + 1, totalPeriods - 1)];

  // Period label: interpolate numeric labels (years), otherwise crossfade
  const curLabelNum = parseFloat(currentPeriod.label);
  const nxtLabelNum = parseFloat(nextPeriod.label);
  const isNumericLabel = !isNaN(curLabelNum) && !isNaN(nxtLabelNum);
  const displayLabel = isNumericLabel
    ? String(Math.round(lerp(curLabelNum, nxtLabelNum, easedProgress)))
    : easedProgress < 0.5
    ? currentPeriod.label
    : nextPeriod.label;

  // Get top N from each period
  const currentTopN = currentPeriod.items.slice(0, maxBars);
  const nextTopN = nextPeriod.items.slice(0, maxBars);

  // Union of all names in current + next top N
  const allNames = [...new Set([...currentTopN.map((i) => i.name), ...nextTopN.map((i) => i.name)])];

  // Interpolate each item's rank and value
  const interpolatedItems = allNames.map((name) => {
    const curItem = currentTopN.find((i) => i.name === name);
    const nxtItem = nextTopN.find((i) => i.name === name);

    const curRank = curItem ? currentTopN.indexOf(curItem) : maxBars;
    const nxtRank = nxtItem ? nextTopN.indexOf(nxtItem) : maxBars;
    const curValue = curItem?.value ?? 0;
    const nxtValue = nxtItem?.value ?? 0;

    const interpRank = lerp(curRank, nxtRank, easedProgress);
    const interpValue = lerp(curValue, nxtValue, easedProgress);
    const color = colorMap[name] ?? CHART_COLORS[0];

    // Opacity: fade in when entering (curRank >= maxBars), fade out when leaving (nxtRank >= maxBars)
    let opacity = 1;
    if (curRank >= maxBars) {
      opacity = easedProgress;
    } else if (nxtRank >= maxBars) {
      opacity = 1 - easedProgress;
    }

    return { name, interpRank, interpValue, color, opacity };
  });

  // Sort by interpolated rank ascending
  interpolatedItems.sort((a, b) => a.interpRank - b.interpRank);

  // Only render items that are within or near the visible range
  const visibleItems = interpolatedItems.filter((i) => i.interpRank < maxBars + 0.5);

  // Max value for proportional bar widths
  const maxValue = Math.max(...interpolatedItems.map((i) => i.interpValue), 1);

  // Per-bar geometry
  const slotH = CHART_H / maxBars;
  const barH = Math.round(slotH * 0.65);
  const barVertOffset = Math.round((slotH - barH) / 2);

  // Title opacity: fade in over first 20 frames
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", overflow: "hidden" }}>
      {/* Subtle background radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 15% 50%, rgba(59,130,246,0.07) 0%, transparent 55%)",
        }}
      />

      {/* Title area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: MARGIN_LEFT,
          right: MARGIN_RIGHT,
          height: TOP_H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          opacity: titleOpacity,
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
          <div style={{ fontSize: 28, color: "#64748b", fontWeight: 400 }}>{subtitle}</div>
        )}
        {unit && (
          <div style={{ fontSize: 20, color: "#475569", fontWeight: 500, marginTop: 2 }}>{unit}</div>
        )}
      </div>

      {/* Bars area */}
      <div
        style={{
          position: "absolute",
          top: TOP_H,
          left: 0,
          right: 0,
          height: CHART_H,
          overflow: "hidden",
        }}
      >
        {visibleItems.map((item) => {
          const yPos = item.interpRank * slotH + barVertOffset;
          const barWidth = Math.max(8, (item.interpValue / maxValue) * MAX_BAR_W);

          return (
            <div
              key={item.name}
              style={{
                position: "absolute",
                top: yPos,
                left: 0,
                right: 0,
                height: barH,
                opacity: item.opacity,
                willChange: "transform",
              }}
            >
              {/* Item name label */}
              <div
                style={{
                  position: "absolute",
                  left: MARGIN_LEFT,
                  width: LABEL_W,
                  top: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 20,
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#e2e8f0",
                  textAlign: "right",
                  letterSpacing: -0.3,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </div>

              {/* Bar */}
              <div
                style={{
                  position: "absolute",
                  left: BAR_START_X,
                  top: 0,
                  width: barWidth,
                  height: "100%",
                  borderRadius: "0 6px 6px 0",
                  background: `linear-gradient(90deg, ${item.color}bb 0%, ${item.color} 100%)`,
                }}
              />

              {/* Value label */}
              <div
                style={{
                  position: "absolute",
                  left: BAR_START_X + barWidth + 14,
                  top: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                {formatValue(item.interpValue, valueFormat)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom separator */}
      <div
        style={{
          position: "absolute",
          bottom: BOTTOM_H - 1,
          left: BAR_START_X,
          right: MARGIN_RIGHT,
          height: 1,
          backgroundColor: "rgba(248,250,252,0.08)",
        }}
      />

      {/* Period label — large watermark */}
      <div
        style={{
          position: "absolute",
          bottom: -20,
          right: MARGIN_RIGHT,
          fontSize: 220,
          fontWeight: 900,
          color: "rgba(248,250,252,0.04)",
          lineHeight: 1,
          letterSpacing: -12,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {displayLabel}
      </div>

      {/* Period label — visible */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: MARGIN_RIGHT,
          fontSize: 60,
          fontWeight: 700,
          color: "#f8fafc",
          lineHeight: 1,
          letterSpacing: -2,
          textAlign: "right",
        }}
      >
        {displayLabel}
      </div>
    </AbsoluteFill>
  );
};
