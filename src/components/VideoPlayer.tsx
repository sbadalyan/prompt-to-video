"use client";
import { useRef, useEffect } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { PromoVideo, FPS, type PromoVideoProps } from "@/components/remotion/PromoVideo";
import { ChartVideo, type ChartVideoData } from "@/components/remotion/ChartVideo";
import { LineChartVideo, type LineChartVideoData } from "@/components/remotion/LineChartVideo";
export type VideoResult = PromoVideoProps["data"] | ChartVideoData | LineChartVideoData;

const CoverPoster = ({ src, title }: { src?: string; title?: string }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
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
        background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 50%)",
      }}
    />
    {title && (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          color: "#fff",
          fontSize: 22,
          fontWeight: 600,
          padding: "18px 24px",
          lineHeight: 1.3,
          textShadow: "0 1px 6px rgba(0,0,0,0.7)",
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
  const playerRef = useRef<PlayerRef>(null);

  const dataType =
    promptData !== null &&
    promptData !== undefined &&
    "type" in (promptData as object)
      ? (promptData as { type: string }).type
      : null;

  // Compute last frame for chart types so we can seek to it on ended
  let chartLastFrame = -1;
  if (dataType === "line-chart") {
    const lineData = promptData as LineChartVideoData;
    const framesPerPeriod = lineData.framesPerPeriod ?? 30;
    const totalPoints = lineData.series?.[0]?.data?.length ?? 1;
    chartLastFrame = Math.max(framesPerPeriod * (totalPoints - 1), 1) + 30 - 1;
  } else if (dataType === "chart") {
    const chartData = promptData as ChartVideoData;
    const framesPerPeriod = chartData.framesPerPeriod ?? 60;
    chartLastFrame = framesPerPeriod * (chartData.frames?.length ?? 1) - 1;
  }

  useEffect(() => {
    if (chartLastFrame < 0) return;
    const player = playerRef.current;
    if (!player) return;
    let seeking = false;
    const handleEnded = () => {
      if (seeking) return;
      seeking = true;
      player.seekTo(chartLastFrame);
      setTimeout(() => { seeking = false; }, 200);
    };
    player.addEventListener("ended", handleEnded);
    return () => player.removeEventListener("ended", handleEnded);
  }, [chartLastFrame]);

  if (dataType === "line-chart") {
    const lineData = promptData as LineChartVideoData;
    const totalDurationInFrames = chartLastFrame + 1;

    return (
      <Player
        ref={playerRef}
        component={LineChartVideo}
        durationInFrames={totalDurationInFrames}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        controls
        style={{ width: "100%" }}
        inputProps={{ data: lineData }}
        renderPoster={() => <CoverPoster src={lineData.coverImage} title={lineData.title} />}
        showPosterWhenUnplayed
      />
    );
  }

  if (dataType === "chart") {
    const chartData = promptData as ChartVideoData;
    const totalDurationInFrames = chartLastFrame + 1;

    return (
      <Player
        ref={playerRef}
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
