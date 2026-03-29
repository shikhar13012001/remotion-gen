import React from "react";
import { TOKEN } from "../../tokens";
import { Grid } from "../primitives/Grid";

interface Props { frame: number; startFrame: number }

/**
 * Deep Field — default narrative background.
 * Two royal-blue blobs drift imperceptibly via sin(frame*0.004).
 * L-path grid + strong vignette focus the eye.
 * Used by: TplEditorialHeadline, TplTextDominant, TplSplitPhotoData
 */
export const BgDeepField: React.FC<Props> = ({ frame, startFrame }) => {
  const f  = frame - startFrame;
  const d1 = Math.sin(f * 0.004) * 6;
  const d2 = Math.cos(f * 0.003) * 8;
  const bx1 = 28 + d1, by1 = 22 + d2;
  const bx2 = 72 - d1, by2 = 78 - d2;

  return (
    <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 70% 55% at ${bx1}% ${by1}%, ${TOKEN.blobBlue}, transparent 70%)`,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 60% 50% at ${bx2}% ${by2}%, ${TOKEN.blobMid}, transparent 65%)`,
      }} />
      <Grid size={TOKEN.gridSize} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 35%, rgba(0,0,0,0.72) 100%)",
      }} />
    </div>
  );
};
