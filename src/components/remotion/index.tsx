import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";
import { ChartVideo, type ChartVideoProps } from "./ChartVideo";
import { LineChartVideo, type LineChartVideoProps } from "./LineChartVideo";

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
      calculateMetadata={({ props }) => {
        const totalFrames =
          props.data?.scenes?.reduce(
            (sum: number, s: { duration?: number }) => sum + (s.duration || 150),
            0
          ) ?? 270;
        return { durationInFrames: Math.max(totalFrames, 1), fps: props.data?.fps ?? 30 };
      }}
    />
    <Composition
      id="ChartVideo"
      component={ChartVideo}
      durationInFrames={60}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ data: undefined } as ChartVideoProps}
      calculateMetadata={({ props }) => {
        const framesPerPeriod = props.data?.framesPerPeriod ?? 60;
        const totalFrames = framesPerPeriod * (props.data?.frames?.length ?? 1);
        return { durationInFrames: Math.max(totalFrames, 1) };
      }}
    />
    <Composition
      id="LineChartVideo"
      component={LineChartVideo}
      durationInFrames={60}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ data: undefined } as LineChartVideoProps}
      calculateMetadata={({ props }) => {
        const framesPerPeriod = props.data?.framesPerPeriod ?? 30;
        const totalPoints = props.data?.series?.[0]?.data?.length ?? 1;
        const totalFrames = Math.max(framesPerPeriod * (totalPoints - 1), 1) + 30;
        return { durationInFrames: totalFrames };
      }}
    />
  </>
);
