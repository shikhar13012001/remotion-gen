import React from "react";
import type { SubjectCutoutData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";
import { BgFlare } from "../backgrounds/BgFlare";
import { Stamp } from "../primitives/Stamp";
import { GoldDivider } from "../primitives/GoldDivider";
import { Annotation } from "../primitives/Annotation";
import { KineticText } from "../primitives/KineticText";

interface Props { data: SubjectCutoutData; sentence: string; accentWords: string[]; frame: number; startFrame: number }

/**
 * B&W subject photo with floating documentary annotations + serif headline.
 * Photo: grayscale(1) contrast(1.15) brightness(0.88) — always.
 * Reveal: clipPath wipe from left. Gold light sweep after reveal. Ken Burns scale.
 * Gold corner frame lines extend after reveal.
 */
export const TplSubjectCutout: React.FC<Props> = ({ data, sentence, accentWords, frame, startFrame }) => {
  const pWipe  = prog(frame, startFrame + 4, 24);
  const pSweep = prog(frame, startFrame + 26, 18);
  const pFrame = prog(frame, startFrame + 22, 16);
  // Ken Burns: scale 1.0 → 1.04 over full scene
  const pKenBurns = prog(frame, startFrame, 180);
  const scale = lerp(pKenBurns, 1.0, 1.04, E.out5);

  const wipeClip = `inset(0 ${lerp(pWipe, 100, 0, E.outExpo)}% 0 0)`;
  const frameLineH = lerp(pFrame, 0, 60, E.outExpo);
  const frameLineV = lerp(pFrame, 0, 60, E.outExpo);

  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
      <BgFlare frame={frame} startFrame={startFrame} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "120px 80px" }}>
        <Stamp label={data.stamp_label} frame={frame} startFrame={startFrame} />

        {/* Photo zone */}
        <div style={{ marginTop: 32, flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Image with B&W filter + Ken Burns + wipe reveal */}
          <div style={{
            position: "absolute", inset: 0,
            clipPath: wipeClip,
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, ${TOKEN.surface} 0%, transparent 100%)`,
              border: `1px solid ${TOKEN.border}`,
              transform: `scale(${scale})`,
              transformOrigin: "center top",
              display: "flex", alignItems: "center", justifyContent: "center",
              // When a real image is rendered, apply: filter: grayscale(1) contrast(1.15) brightness(0.88)
              filter: "grayscale(1) contrast(1.15) brightness(0.70)",
            }}>
              <div style={{ fontFamily: TOKEN.mono, fontSize: 13, color: TOKEN.dim, letterSpacing: "0.12em" }}>
                [{data.image_query}]
              </div>
            </div>
          </div>

          {/* Gold light sweep after wipe */}
          {pSweep > 0 && pSweep < 1 && (
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: `linear-gradient(to right,
                transparent ${lerp(pSweep, -20, 80, (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2)}%,
                rgba(200,169,110,0.10) ${lerp(pSweep, -10, 90, (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2)}%,
                transparent ${lerp(pSweep, 0, 100, (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2)}%)`,
            }} />
          )}

          {/* Bottom fade */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
            background: "linear-gradient(to top, rgba(0,0,0,0.70), transparent)",
            pointerEvents: "none",
          }} />

          {/* Gold corner frame — top-left */}
          <div style={{ position: "absolute", top: 16, left: 16, pointerEvents: "none" }}>
            <div style={{ width: frameLineH, height: 2, background: TOKEN.gold, boxShadow: `0 0 8px ${TOKEN.gold}` }} />
            <div style={{ width: 2, height: frameLineV, background: TOKEN.gold, marginTop: 0, boxShadow: `0 0 8px ${TOKEN.gold}` }} />
          </div>

          {/* Annotations */}
          <div style={{ position: "absolute", left: -50, top: "28%", transform: "translateY(-50%)" }}>
            <Annotation text={data.annotations[0]?.text ?? ""} side="left" frame={frame} startFrame={startFrame + 12} />
          </div>
          <div style={{ position: "absolute", right: -50, top: "62%", transform: "translateY(-50%)" }}>
            <Annotation text={data.annotations[1]?.text ?? ""} side="right" frame={frame} startFrame={startFrame + 16} />
          </div>
        </div>

        <GoldDivider frame={frame} startFrame={startFrame + 10} />
        <div style={{ marginTop: 28 }}>
          <KineticText
            text={data.headline}
            accentWords={accentWords}
            fontSize={38}
            fontFamily={TOKEN.serif}
            fontWeight={700}
            frame={frame}
            startFrame={startFrame + 18}
          />
        </div>
        <div style={{ marginTop: 18 }}>
          <KineticText
            text={sentence}
            accentWords={accentWords}
            fontSize={22}
            fontFamily={TOKEN.sans}
            fontWeight={300}
            frame={frame}
            startFrame={startFrame + 22}
            stagger={2}
          />
        </div>
      </div>
    </div>
  );
};
