import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="PromoVideo"
      component={PromoVideo}
      durationInFrames={270}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        data: {
          title: "",
          fps: 30,
          scenes: [],
        },
      }}
    />
  </>
);
