import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Easing } from "remotion";
import { Video } from "remotion";
import type { ImageMotion } from "../../lmstudio/index";

export interface VideoBackgroundProps {
  clip: string;
  scrimOpacity?: number;
  imageMotion?: ImageMotion;
  durationInFrames?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  clip, scrimOpacity = 0.52, imageMotion = "static", durationInFrames = 60,
}) => {
  const frame    = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  let transform: string;
  if      (imageMotion === "slow_zoom_in")  transform = `scale(${interpolate(progress, [0, 1], [1.0, 1.08])})`;
  else if (imageMotion === "slow_zoom_out") transform = `scale(${interpolate(progress, [0, 1], [1.08, 1.0])})`;
  else if (imageMotion === "pan_left")      transform = `translateX(${interpolate(progress, [0, 1], [0, -4])}%) scale(1.05)`;
  else if (imageMotion === "pan_right")     transform = `translateX(${interpolate(progress, [0, 1], [-4, 0])}%) scale(1.05)`;
  else                                      transform = "scale(1.02)";

  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(clip);
  const mediaStyle: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    objectFit: "cover", transform, filter: "saturate(0.75)",
  };

  return (
    <>
      {isVideo ? (
        <Video
          src={staticFile(clip)}
          style={mediaStyle}
          muted
          loop
        />
      ) : (
        <Img
          src={staticFile(clip)}
          style={mediaStyle}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${scrimOpacity})` }} />
    </>
  );
};
