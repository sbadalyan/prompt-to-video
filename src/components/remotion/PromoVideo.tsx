import { Sequence, useCurrentFrame, staticFile, interpolate } from "remotion";
import React from "react";

// --- Types ---

interface Animation {
  enter: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale";
  duration: number;
}

interface BackgroundElement {
  type: "background";
  style: { color: string };
}

interface TextElement {
  type: "text";
  content: string;
  position?: string;
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string | number;
  };
  animation?: Animation;
}

interface ImageElement {
  type: "image";
  src: string;
  position?: string;
  animation?: Animation;
}

export type SceneElement = BackgroundElement | TextElement | ImageElement;

export interface Scene {
  id: number;
  duration: number; // in frames
  layout?: string;
  elements: SceneElement[];
}

export interface PromoVideoProps {
  data?: {
    title: string;
    fps?: number;
    scenes: Scene[];
  };
}

export const FPS = 30;

// --- Helpers ---

const ZONE_CONFIG: Record<string, {
  justifyContent: string;
  alignItems: string;
}> = {
  "top-left":      { justifyContent: "flex-start", alignItems: "flex-start" },
  "top-center":    { justifyContent: "flex-start", alignItems: "center" },
  "top-right":     { justifyContent: "flex-start", alignItems: "flex-end" },
  "center":        { justifyContent: "center",     alignItems: "center" },
  "bottom-left":   { justifyContent: "flex-end",   alignItems: "flex-start" },
  "bottom-center": { justifyContent: "flex-end",   alignItems: "center" },
  "bottom-right":  { justifyContent: "flex-end",   alignItems: "flex-end" },
};

function zoneStyle(position: string): React.CSSProperties {
  const config = ZONE_CONFIG[position] ?? ZONE_CONFIG["center"];
  return {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: config.justifyContent,
    alignItems: config.alignItems,
    gap: 16,
    padding: 60,
    overflow: "hidden",
    pointerEvents: "none" as const,
  };
}

function normalizePosition(position: string): string {
  if (ZONE_CONFIG[position]) return position;
  return "center";
}

function groupElementsByPosition(
  elements: (TextElement | ImageElement)[]
): Record<string, (TextElement | ImageElement)[]> {
  const groups: Record<string, (TextElement | ImageElement)[]> = {};
  for (const el of elements) {
    const pos = normalizePosition(el.position ?? "center");
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push(el);
  }
  return groups;
}

function useAnimationStyle(frame: number, animation?: Animation): React.CSSProperties {
  if (!animation) return {};
  const { enter, duration } = animation;
  const progress = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });

  switch (enter) {
    case "fade":
      return { opacity: progress };
    case "slide-up":
      return { opacity: progress, transform: `translateY(${(1 - progress) * 60}px)` };
    case "slide-down":
      return { opacity: progress, transform: `translateY(${(progress - 1) * 60}px)` };
    case "slide-left":
      return { opacity: progress, transform: `translateX(${(1 - progress) * 60}px)` };
    case "slide-right":
      return { opacity: progress, transform: `translateX(${(progress - 1) * 60}px)` };
    case "scale":
      return { opacity: progress, transform: `scale(${0.5 + progress * 0.5})` };
    default:
      return {};
  }
}

// --- Element renderers ---

const AnimatedText: React.FC<{ element: TextElement }> = ({ element }) => {
  const frame = useCurrentFrame();
  const animStyle = useAnimationStyle(frame, element.animation);
  const centered = !element.position || element.position === "center" || element.position.endsWith("-center");

  return (
    <div
      style={{
        ...animStyle,
        color: element.style?.color ?? "white",
        fontSize: element.style?.fontSize ?? 64,
        fontWeight: element.style?.fontWeight ?? 700,
        maxWidth: "90%",
        textAlign: centered ? "center" : undefined,
        wordBreak: "break-word",
        lineHeight: 1.2,
        overflow: "hidden",
        flexShrink: 1,
        minHeight: 0,
      }}
    >
      {element.content}
    </div>
  );
};

const AnimatedImage: React.FC<{ element: ImageElement }> = ({ element }) => {
  const frame = useCurrentFrame();
  const animStyle = useAnimationStyle(frame, element.animation);
  const [errored, setErrored] = React.useState(false);

  if (errored || !element.src) return null;

  const src = element.src.startsWith('http') ? element.src : staticFile(element.src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      src={src}
      onError={() => setErrored(true)}
      style={{
        ...animStyle,
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
      }}
    />
  );
};

// --- Main component ---

export const PromoVideo: React.FC<PromoVideoProps> = ({ data }) => {
  if (!data?.scenes) return null;

  return (
    <>
      {data.scenes.filter((s) => s.duration > 0).map((scene, index, filtered) => {
        const from = filtered
          .slice(0, index)
          .reduce((sum, s) => sum + (s.duration || 150), 0);
        const elements = scene.elements ?? [];
        const duration = scene.duration || 150;

        return (
          <Sequence key={scene.id ?? index} from={from} durationInFrames={duration}>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {/* Background layer */}
              {elements
                .filter((el): el is BackgroundElement => el.type === "background")
                .map((el, i) => (
                  <div
                    key={`bg-${i}`}
                    style={{ position: "absolute", inset: 0, backgroundColor: el.style.color }}
                  />
                ))}

              {/* Full-screen image layer */}
              {elements
                .filter((el): el is ImageElement => el.type === "image")
                .map((el, i) => (
                  <AnimatedImage key={`img-${i}`} element={el} />
                ))}

              {/* Text zones as absolute overlays */}
              {Object.entries(
                groupElementsByPosition(
                  elements.filter(
                    (el): el is TextElement => el.type === "text"
                  )
                )
              ).map(([position, els]) => (
                <div key={position} style={zoneStyle(position)}>
                  {els.map((el, elIdx) =>
                    el.type === "text" ? (
                      <AnimatedText key={elIdx} element={el as TextElement} />
                    ) : null
                  )}
                </div>
              ))}
            </div>
          </Sequence>
        );
      })}
    </>
  );
};
