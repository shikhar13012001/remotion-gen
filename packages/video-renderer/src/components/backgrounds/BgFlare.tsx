import React from "react";
import { TOKEN } from "../../tokens";
import { Grid } from "../primitives/Grid";

interface Props { frame: number; startFrame: number }

/**
 * Flare — cinematic / title scenes.
 * Two blobs + concentric breathing circles + tight vignette.
 * Used by: TplSubjectCutout, TplTransitionWipe
 */
export const BgFlare: React.FC<Props> = ({ frame, startFrame }) => {
  const f = frame - startFrame;
  const breath = Math.sin(f * 0.025);
  // Circles breathe ±2%
  const r1 = 70 + breath * 2;
  const r2 = 42 + breath * 2;
  // Blob drifts
  const d = Math.sin(f * 0.006) * 5;

  return (
    <div style={{ position: "absolute", inset: 0, background: TOKEN.bgFlare }}>
      {/* Primary blob — upper left */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 65% 60% at ${20 + d}% 25%, #0F3070, transparent 65%)`,
      }} />
      {/* Corner accent — lower left */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 40% 28% at 5% 95%, #1040A0, transparent 55%)",
        opacity: 0.45,
      }} />
      <Grid size={TOKEN.gridSize} />
      {/* Outer ring — centered at 50% 40% */}
      <div style={{
        position: "absolute",
        left: "50%", top: "40%",
        width: `${r1}%`, paddingTop: `${r1}%`,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.065)",
        pointerEvents: "none",
      }} />
      {/* Inner ring — centered at 50% 55% */}
      <div style={{
        position: "absolute",
        left: "50%", top: "55%",
        width: `${r2}%`, paddingTop: `${r2}%`,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.05)",
        pointerEvents: "none",
      }} />
      {/* Vignette — transparent 30% → rgba(0,0,0,0.80) */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 30%, rgba(0,0,0,0.80) 100%)",
      }} />
    </div>
  );
};
