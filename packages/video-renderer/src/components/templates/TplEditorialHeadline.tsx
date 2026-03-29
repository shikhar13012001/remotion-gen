import React from "react";
import type { EditorialHeadlineData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";
import { BgDeepField } from "../backgrounds/BgDeepField";
import { Stamp } from "../primitives/Stamp";
import { GoldDivider } from "../primitives/GoldDivider";

interface Props { data: EditorialHeadlineData; frame: number; startFrame: number }

/**
 * Large editorial typography — two serif display lines + highlight + subtext.
 * Hierarchy: Stamp → Line1 → Line2 → Divider → Highlight → Subtext
 */
export const TplEditorialHeadline: React.FC<Props> = ({ data, frame, startFrame }) => {
  const p = (delay: number) => prog(frame, startFrame + delay, 18);
  const y = (pp: number)    => lerp(pp, 28, 0, E.out4);
  const op = (pp: number)   => E.out3(pp);

  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
      <BgDeepField frame={frame} startFrame={startFrame} />
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 100px",
      }}>
        <div style={{ marginBottom: 28 }}>
          <Stamp label={data.stamp_label} frame={frame} startFrame={startFrame} />
        </div>
        {/* Line 1 — serif display, weight 700 */}
        <div style={{
          opacity: op(p(4)), transform: `translateY(${y(p(4))}px)`,
          fontFamily: TOKEN.serif, fontSize: 80, fontWeight: 700,
          color: TOKEN.white, lineHeight: 1.05, letterSpacing: "-0.025em",
        }}>
          {data.line1}
        </div>
        {/* Line 2 — serif display */}
        <div style={{
          opacity: op(p(10)), transform: `translateY(${y(p(10))}px)`,
          fontFamily: TOKEN.serif, fontSize: 80, fontWeight: 700,
          color: TOKEN.white, lineHeight: 1.05, letterSpacing: "-0.025em",
        }}>
          {data.line2}
        </div>
        <div style={{ marginTop: 28, marginBottom: 28 }}>
          <GoldDivider frame={frame} startFrame={startFrame + 14} />
        </div>
        {/* Highlight — serif italic in gold */}
        <div style={{
          opacity: op(p(18)), transform: `translateY(${y(p(18))}px)`,
          fontFamily: TOKEN.serif, fontSize: 40, fontStyle: "italic",
          color: TOKEN.gold, letterSpacing: "-0.01em", marginBottom: 24,
        }}>
          {data.highlight_line}
        </div>
        {/* Subtext — sans body */}
        <div style={{
          opacity: op(p(24)), transform: `translateY(${y(p(24))}px)`,
          fontFamily: TOKEN.sans, fontSize: 20, fontWeight: 300,
          color: TOKEN.dim, lineHeight: 1.55, letterSpacing: "0.01em",
        }}>
          {data.subtext}
        </div>
      </div>
    </div>
  );
};
