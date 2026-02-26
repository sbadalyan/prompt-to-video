"use client";
import { Player } from "@remotion/player";
import { PromoVideo, FPS, type PromoVideoProps } from "@/components/remotion/PromoVideo";
import { ChartVideo, type ChartVideoData } from "@/components/remotion/ChartVideo";
export type VideoResult = PromoVideoProps["data"] | ChartVideoData;

const CoverPoster = ({ src, title }: { src?: string; title?: string }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      overflow: "hidden",
      background: "#111",
    }}
  >
    {src && (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        src={src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    )}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
      }}
    />
    {title && (
      <div
        style={{
          position: "relative",
          color: "#fff",
          fontSize: 28,
          fontWeight: 600,
          padding: "24px 32px",
          lineHeight: 1.3,
          maxWidth: "80%",
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}
      >
        {title}
      </div>
    )}
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#111">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  </div>
);

export const VideoPlayer = ({ promptData }: { promptData: VideoResult }) => {
  const dataType =
    promptData !== null &&
    promptData !== undefined &&
    "type" in (promptData as object)
      ? (promptData as { type: string }).type
      : null;

  if (dataType === "chart") {
    const chartData = promptData as ChartVideoData;
    const framesPerPeriod = chartData.framesPerPeriod ?? 60;
    const totalDurationInFrames = framesPerPeriod * (chartData.frames?.length ?? 1);

    return (
      <Player
        component={ChartVideo}
        durationInFrames={totalDurationInFrames}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        controls
        style={{ width: "100%" }}
        inputProps={{ data: chartData }}
        renderPoster={() => <CoverPoster title={chartData.title} />}
        showPosterWhenUnplayed
        showPosterWhenEnded
      />
    );
  }

  const promoData = promptData as PromoVideoProps["data"];
  const fps = promoData?.fps ?? FPS;
  const totalDurationInFrames = promoData?.scenes
    ? promoData.scenes.reduce((sum, s) => sum + (s.duration || 150), 0)
    : 270;

  return (
    <Player
      component={PromoVideo}
      durationInFrames={totalDurationInFrames}
      fps={fps}
      compositionWidth={1920}
      compositionHeight={1080}
      controls
      style={{ width: "100%" }}
      inputProps={{ data: promoData }}
      renderPoster={() => <CoverPoster src={promoData?.coverImage} title={promoData?.title} />}
      showPosterWhenUnplayed
      showPosterWhenEnded
    />
  );
};
