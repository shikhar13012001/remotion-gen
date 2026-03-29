import React from "react";
import type { TextDominantData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";
import { BgDeepField } from "../backgrounds/BgDeepField";
import { GoldDivider } from "../primitives/GoldDivider";

interface Props { data: TextDominantData; frame: number; startFrame: number }

/**
 * Pure kinetic text — serif display, word-by-word clip reveal.
 * Each line slides up from overflow:hidden. Gold divider follows last line.
 * Designed for rhetorical questions, emotional beats, section transitions.
 */
export const TplTextDominant: React.FC<Props> = ({ data, frame, startFrame }) => (
  <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
    <BgDeepField frame={frame} startFrame={startFrame} />
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      justifyContent: "center",
      padding: "0 100px", gap: 4,
    }}>
      {data.lines.map((line, i) => {
        const p  = prog(frame, startFrame + i * 12, 20);
        const op = E.out3(p);
        const y  = lerp(p, 32, 0, E.out4);
        return (
          <div key={i} style={{ overflow: "hidden" }}>
            <div style={{
              opacity: op,
              transform: `translateY(${y}px)`,
              fontFamily: TOKEN.serif,
              fontSize: 68, fontWeight: 700,
              color: TOKEN.white,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
            }}>
              {line}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 32 }}>
        <GoldDivider
          frame={frame}
          startFrame={startFrame + data.lines.length * 12 + 4}
          width={320}
        />
      </div>
    </div>
  </div>
);
