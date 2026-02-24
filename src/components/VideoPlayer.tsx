"use client";
import { Player } from "@remotion/player";
import { PromoVideo, FPS, type PromoVideoProps } from "@/components/remotion/PromoVideo";

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

export const VideoPlayer = ({ promptData }: { promptData: PromoVideoProps["data"] }) => {
  const fps = promptData?.fps ?? FPS;
  const totalDurationInFrames = promptData?.scenes
    ? promptData.scenes.reduce((sum, s) => sum + (s.duration || 150), 0)
    : 270;

  const coverImage = promptData?.coverImage;
  const title = promptData?.title;

  return (
    <Player
      component={PromoVideo}
      durationInFrames={totalDurationInFrames}
      fps={fps}
      compositionWidth={1920}
      compositionHeight={1080}
      controls
      style={{ width: "100%" }}
      inputProps={{ data: promptData }}
      renderPoster={() => <CoverPoster src={coverImage} title={title} />}
      showPosterWhenUnplayed
      showPosterWhenEnded
    />
  );
};
