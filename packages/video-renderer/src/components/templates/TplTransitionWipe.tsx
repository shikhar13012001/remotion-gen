import React from "react";
import type { TransitionWipeData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";
import { Grid } from "../primitives/Grid";

interface Props { data: TransitionWipeData; frame: number; startFrame: number }

/**
 * Section break: gold line sweeps full width, label reveals from center.
 * Uses bgVoid directly — no blob. Purely typographic transition.
 */
export const TplTransitionWipe: React.FC<Props> = ({ data, frame, startFrame }) => {
  const pLine  = prog(frame, startFrame + 4, 22);
  const pLabel = prog(frame, startFrame + 18, 16);
  const lineW  = lerp(pLine, 0, 1080, E.outExpo);
  const labelOp = E.out3(pLabel);
  const labelY  = lerp(pLabel, 12, 0, E.out4);

  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920, background: TOKEN.bgVoid }}>
      <Grid opacity={0.5} />
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.60) 100%)",
      }} />
      {/* Sweeping gold line */}
      <div style={{
        position: "absolute", top: "50%", left: 0,
        width: lineW, height: 1,
        background: `linear-gradient(to right, transparent 0%, ${TOKEN.gold} 8%, ${TOKEN.gold} 92%, transparent 100%)`,
        boxShadow: pLine > 0.5 ? `0 0 12px rgba(200,169,110,0.40)` : "none",
      }} />
      {/* Label */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          opacity: labelOp,
          transform: `translateY(${labelY}px)`,
          fontFamily: TOKEN.mono,
          fontSize: 16,
          color: TOKEN.gold,
          letterSpacing: "0.25em",
          textTransform: "uppercase" as const,
        }}>
          {data.label}
        </div>
      </div>
    </div>
  );
};
