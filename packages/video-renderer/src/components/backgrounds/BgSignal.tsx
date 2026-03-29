import React from "react";
import { TOKEN } from "../../tokens";
import { Grid } from "../primitives/Grid";

interface Props { frame: number; startFrame: number }

/**
 * Signal — data / information scenes.
 * Linear gradient base + tight grid + drifting scan band + side vignettes.
 * Used by: TplTimeline, TplFlowDiagram, TplStatCallout
 */
export const BgSignal: React.FC<Props> = ({ frame, startFrame }) => {
  const f = frame - startFrame;
  // Scan line drifts downward continuously
  const scanY = (f * 0.28) % 100;

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(to bottom, #06111F 0%, #010508 55%, #000203 100%)",
    }}>
      <Grid size={TOKEN.gridSizeTight} />
      {/* Horizontal scan band — rgba(30,80,180,0.05) */}
      <div style={{
        position: "absolute", left: 0, right: 0,
        top: `${scanY}%`, height: 100,
        background: "linear-gradient(to bottom, transparent, rgba(30,80,180,0.05), transparent)",
        pointerEvents: "none",
      }} />
      {/* Side vignettes */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.35) 100%)",
      }} />
      {/* Top/bottom fade */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.25) 100%)",
      }} />
    </div>
  );
};
