import React from "react";
import type { SplitPhotoData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";
import { BgDeepField } from "../backgrounds/BgDeepField";
import { Stamp } from "../primitives/Stamp";
import { GoldDivider } from "../primitives/GoldDivider";

interface Props { data: SplitPhotoData; frame: number; startFrame: number }

/**
 * Left: B&W archival photo zone (wipe reveal + Ken Burns).
 * Right: fact list — gold left-bar + sans body, staggered in.
 * Headline: serif display weight.
 */
export const TplSplitPhotoData: React.FC<Props> = ({ data, frame, startFrame }) => {
  const pWipe = prog(frame, startFrame + 4, 22);
  const pKB   = prog(frame, startFrame, 180);
  const scale = lerp(pKB, 1.0, 1.04, (t) => 1 - Math.pow(1 - t, 5));

  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
      <BgDeepField frame={frame} startFrame={startFrame} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "120px 80px" }}>
        <Stamp label={data.stamp_label} frame={frame} startFrame={startFrame} />
        {/* Headline — serif display */}
        <div style={{
          marginTop: 24,
          fontFamily: TOKEN.serif, fontSize: 44, fontWeight: 700,
          color: TOKEN.white, lineHeight: 1.1, letterSpacing: "-0.025em",
          opacity: E.out3(prog(frame, startFrame + 4, 16)),
        }}>
          {data.headline}
        </div>
        <GoldDivider frame={frame} startFrame={startFrame + 10} />
        <div style={{ marginTop: 32, display: "flex", gap: 40, flex: 1 }}>
          {/* Photo zone */}
          <div style={{
            flex: 1, position: "relative", overflow: "hidden",
            background: TOKEN.surface,
            border: `1px solid ${TOKEN.border}`,
            clipPath: `inset(0 ${lerp(pWipe, 100, 0, (t) => t === 1 ? 1 : 1 - Math.pow(2, -10*t))}% 0 0)`,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${scale})`,
              transformOrigin: "center top",
              filter: "grayscale(1) contrast(1.15) brightness(0.70)",
            }}>
              <span style={{ fontFamily: TOKEN.mono, fontSize: 12, color: TOKEN.dim, letterSpacing: "0.1em" }}>
                [{data.image_query}]
              </span>
            </div>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
              background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
            }} />
          </div>
          {/* Facts list */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, justifyContent: "center" }}>
            {data.facts.map((fact, i) => {
              const p = prog(frame, startFrame + 16 + i * 8, 16);
              return (
                <div key={i} style={{
                  opacity: E.out3(p),
                  transform: `translateX(${lerp(p, 18, 0, (t) => 1 - Math.pow(1 - t, 4))}px)`,
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 3, minHeight: 20, flexShrink: 0, marginTop: 4,
                    background: TOKEN.gold,
                    borderRadius: 2,
                    height: "100%",
                  }} />
                  <span style={{
                    fontFamily: TOKEN.sans, fontSize: 18, fontWeight: 300,
                    color: TOKEN.dim, lineHeight: 1.5, letterSpacing: "0.01em",
                  }}>
                    {fact}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
