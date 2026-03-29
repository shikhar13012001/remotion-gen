import React from "react";
import type { StatCalloutData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";
import { BgFlare } from "../backgrounds/BgFlare";
import { Stamp } from "../primitives/Stamp";
import { GoldDivider } from "../primitives/GoldDivider";

interface Props { data: StatCalloutData; frame: number; startFrame: number }

/**
 * Single dramatic number in serif display weight.
 * Counter counts up via out4 easing. Scale slams from 1.35 → 1 via spring.
 * Gold glow intensifies as counter reaches final value.
 */
export const TplStatCallout: React.FC<Props> = ({ data, frame, startFrame }) => {
  const pNum  = prog(frame, startFrame + 6, 20);
  const pCtx  = prog(frame, startFrame + 22, 16);
  const scale = lerp(pNum, 1.35, 1, E.spring);
  const glowT = pNum > 0.85 ? prog(frame, startFrame + 6 + 20 * 0.85, 20 * 0.15) : 0;

  const displayValue = Math.round(lerp(pNum, 0, data.value, E.out4));

  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
      <BgFlare frame={frame} startFrame={startFrame} />
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 80px",
      }}>
        <Stamp label={data.stamp_label} frame={frame} startFrame={startFrame} />
        {/* Number — serif, massive scale */}
        <div style={{
          marginTop: 52,
          opacity: E.out3(pNum),
          transform: `scale(${scale})`,
          display: "flex", alignItems: "baseline", gap: 12,
          textShadow: glowT > 0
            ? `0 0 ${80 * glowT}px rgba(200,169,110,${0.5 * glowT}), 0 0 ${140 * glowT}px rgba(200,169,110,${0.2 * glowT})`
            : "none",
        }}>
          {data.prefix && (
            <span style={{
              fontFamily: TOKEN.serif, fontSize: 72, fontWeight: 700,
              color: TOKEN.gold, letterSpacing: "-0.03em",
            }}>
              {data.prefix}
            </span>
          )}
          <span style={{
            fontFamily: TOKEN.serif, fontSize: 160, fontWeight: 700,
            color: TOKEN.gold, lineHeight: 1, letterSpacing: "-0.05em",
          }}>
            {displayValue.toLocaleString()}
          </span>
          {data.suffix && (
            <span style={{
              fontFamily: TOKEN.serif, fontSize: 72, fontWeight: 700,
              color: TOKEN.gold, letterSpacing: "-0.03em",
            }}>
              {data.suffix}
            </span>
          )}
        </div>
        {/* Label — mono */}
        <div style={{
          fontFamily: TOKEN.mono, fontSize: 16,
          color: TOKEN.dim, marginTop: 12,
          letterSpacing: "0.14em", textTransform: "uppercase",
          opacity: E.out3(pNum),
        }}>
          {data.label}
        </div>
        <div style={{ marginTop: 36, marginBottom: 36, width: "100%" }}>
          <GoldDivider frame={frame} startFrame={startFrame + 16} />
        </div>
        {/* Context — sans body */}
        <div style={{
          opacity: E.out3(pCtx),
          fontFamily: TOKEN.sans, fontSize: 20, fontWeight: 300,
          color: TOKEN.dim, textAlign: "center", lineHeight: 1.6, letterSpacing: "0.01em",
        }}>
          {data.context}
        </div>
      </div>
    </div>
  );
};
