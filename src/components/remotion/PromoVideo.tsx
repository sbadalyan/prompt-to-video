import { Sequence, useCurrentFrame, staticFile, interpolate, AbsoluteFill } from "remotion";
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
  role?: "title" | "body";
  align?: "left" | "center" | "right";
  position?: string;
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string | number;
    fontStyle?: string;
    lineHeight?: number;
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
  const textAlign: React.CSSProperties["textAlign"] = element.align
    ? element.align
    : (!element.position || element.position === "center" || element.position.endsWith("-center"))
      ? "center"
      : "left";

  return (
    <div
      style={{
        ...animStyle,
        color: element.style?.color ?? "#111111",
        fontSize: element.style?.fontSize ?? 64,
        fontWeight: element.style?.fontWeight ?? 400,
        fontStyle: element.style?.fontStyle,
        lineHeight: element.style?.lineHeight ?? 1.2,
        maxWidth: "90%",
        textAlign,
        wordBreak: "break-word",
        whiteSpace: "pre-line",
        overflow: "hidden",
        flexShrink: 1,
        minHeight: 0,
      }}
    >
      {element.content}
    </div>
  );
};

const AnimatedImage: React.FC<{ element: ImageElement; fullscreen?: boolean }> = ({ element, fullscreen = false }) => {
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
        ...(fullscreen ? {
          position: "absolute" as const,
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover" as const,
        } : {
          maxWidth: "100%",
          maxHeight: "45%",
          objectFit: "contain" as const,
          borderRadius: 8,
          flexShrink: 1,
          minHeight: 0,
        }),
      }}
    />
  );
};

// --- Split layout ---

const SceneSplitLayout: React.FC<{ scene: Scene; imageOnLeft: boolean }> = ({ scene, imageOnLeft }) => {
  const elements = scene.elements ?? [];
  const imageEl = elements.find((el): el is ImageElement => el.type === "image");
  const bgEl = elements.find((el): el is BackgroundElement => el.type === "background");
  const textEls = elements.filter((el): el is TextElement => el.type === "text");

  const titleEl =
    textEls.find((el) => el.role === "title") ??
    [...textEls].sort((a, b) => (b.style?.fontSize ?? 0) - (a.style?.fontSize ?? 0))[0];
  const bodyEl =
    textEls.find((el) => el.role === "body") ??
    textEls.filter((el) => el !== titleEl)[0];

  const bgColor = bgEl?.style.color ?? "#cccccc";

  const imagePanel = (
    <div style={{ flex: "0 0 48%", position: "relative", overflow: "hidden", backgroundColor: bgColor }}>
      {imageEl && <AnimatedImage element={imageEl} fullscreen />}
    </div>
  );

  const contentPanel = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: 60,
        paddingBottom: 60,
        paddingLeft: 64,
        paddingRight: 64,
        backgroundColor: "#ffffff",
        overflow: "hidden",
        gap: 28,
      }}
    >
      {titleEl && <AnimatedText element={titleEl} />}
      {bodyEl && <AnimatedText element={bodyEl} />}
    </div>
  );

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row" }}>
      {imageOnLeft ? imagePanel : contentPanel}
      {imageOnLeft ? contentPanel : imagePanel}
    </AbsoluteFill>
  );
};

// --- Title layout ---

const SceneTitleLayout: React.FC<{ scene: Scene }> = ({ scene }) => {
  const elements = scene.elements ?? [];
  const textEls = elements.filter((el): el is TextElement => el.type === "text");
  const titleEl = textEls.find((el) => el.role === "title") ?? textEls[0];
  const subtitleEl = textEls.find((el) => el.role === "body") ?? textEls.filter((el) => el !== titleEl)[0];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 120,
        paddingRight: 120,
        gap: 32,
      }}
    >
      {titleEl && <AnimatedText element={{ ...titleEl, align: "center" }} />}
      {subtitleEl && <AnimatedText element={{ ...subtitleEl, align: "center" }} />}
    </AbsoluteFill>
  );
};

// --- Text-only layout ---

const SceneTextOnlyLayout: React.FC<{ scene: Scene }> = ({ scene }) => {
  const elements = scene.elements ?? [];
  const textEls = elements.filter((el): el is TextElement => el.type === "text");
  const titleEl = textEls.find((el) => el.role === "title") ?? textEls[0];
  const bodyEl = textEls.find((el) => el.role === "body") ?? textEls.filter((el) => el !== titleEl)[0];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        paddingTop: 90,
        paddingBottom: 90,
        paddingLeft: 100,
        paddingRight: 100,
        gap: 48,
      }}
    >
      {titleEl && <AnimatedText element={titleEl} />}
      {bodyEl && <AnimatedText element={bodyEl} />}
    </AbsoluteFill>
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
        const duration = scene.duration || 150;

        const isSplit = scene.layout === "split-left" || scene.layout === "split-right";
        const isTitle = scene.layout === "title";

        return (
          <Sequence key={scene.id ?? index} from={from} durationInFrames={duration}>
            {isSplit ? (
              <SceneSplitLayout scene={scene} imageOnLeft={scene.layout !== "split-right"} />
            ) : isTitle ? (
              <SceneTitleLayout scene={scene} />
            ) : (
              <SceneTextOnlyLayout scene={scene} />
            )}
          </Sequence>
        );
      })}
    </>
  );
};
