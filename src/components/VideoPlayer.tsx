"use client";
import { Player } from "@remotion/player";
import { PromoVideo, FPS, type PromoVideoProps } from "@/components/remotion/PromoVideo";

export const VideoPlayer = ({ promptData }: { promptData: PromoVideoProps["data"] }) => {
  const fps = promptData?.fps ?? FPS;
  const totalDurationInFrames = promptData?.scenes
    ? promptData.scenes.reduce((sum, s) => sum + (s.duration || 150), 0)
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
      inputProps={{ data: promptData }}
    />
  );
};
