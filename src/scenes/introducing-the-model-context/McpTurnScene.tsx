/**
 * McpTurnScene.tsx
 * Beat: turn — sentence 6.
 * Full-bleed image. A horizontal rule draws across the screen before text arrives,
 * signalling a pivot. Pan-right motion (return/reframing). Text uses bolder weight.
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { TokenMap } from "../../../lmstudio/types";
import { tokenise, mcpFontSize } from "./mcpUtils";

export interface McpTurnSceneProps {
  text: string;
  highlightWords: string[];
  imagePath: string | null;
  tokens: TokenMap;
  durationInFrames: number;
}

export const McpTurnScene: React.FC<McpTurnSceneProps> = ({
  text,
  highlightWords,
  imagePath,
  tokens,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = tokens.colors["accent"] ?? "#da291c";
  const textColor = tokens.colors["textOn"] ?? "#ffffff";
  const bgColor = "#181818";

  // ── Ken Burns: pan-right (reframing/rewind) ─────────────────────────────────
  const translateX = interpolate(frame, [0, durationInFrames], [-4, 0], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.0], {
    extrapolateRight: "clamp",
  });

  // ── Scene fade ──────────────────────────────────────────────────────────────
  const sceneOpacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Pivot rule: draws from centre outward ───────────────────────────────────
  const ruleMidpoint = 1080 / 2;
  const ruleHalfWidth = interpolate(frame, [0, 20], [0, ruleMidpoint - 72], {
    extrapolateRight: "clamp",
  });
  const ruleOpacity = interpolate(frame, [0, 6, 30, 40], [0, 1, 1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Text block entrance — delayed until after rule ──────────────────────────
  const textSpring = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 16, stiffness: 100 },
    durationInFrames: 22,
  });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [20, 0]);

  const wordTokens = tokenise(text, highlightWords);
  const fontSize = mcpFontSize(wordTokens.length);

  return (
    <AbsoluteFill style={{ background: bgColor, opacity: sceneOpacity }}>

      {/* ── Background image ────────────────────────────────────────────── */}
      {imagePath && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <Img
            src={staticFile(imagePath)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 35%",
              filter: "saturate(0.55) brightness(0.72) hue-rotate(-5deg)",
              transform: `scale(${scale}) translateX(${translateX}%)`,
              transformOrigin: "center center",
            }}
          />
        </div>
      )}

      {/* ── Gradient scrim ───────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.88) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Pivot accent rule (draws from centre out) ────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 290,
          left: ruleMidpoint - ruleHalfWidth,
          width: ruleHalfWidth * 2,
          height: 2,
          background: accent,
          opacity: ruleOpacity,
        }}
      />

      {/* ── Pivot label above rule ───────────────────────────────────────── */}
      <p style={{
        position: "absolute",
        top: 258,
        left: 0,
        right: 0,
        textAlign: "center",
        margin: 0,
        fontSize: 18,
        fontWeight: 500,
        letterSpacing: "0.20em",
        textTransform: "uppercase" as const,
        color: accent,
        fontFamily: tokens.fontFamily,
        opacity: ruleOpacity,
      }}>
        The Solution
      </p>

      {/* ── Text block — lower third ──────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 160,
        left: 0,
        right: 0,
        paddingLeft: 72,
        paddingRight: 72,
        opacity: textOpacity,
        transform: `translateY(${textY}px)`,
      }}>
        <p style={{
          margin: 0,
          fontSize,
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: textColor,
          fontFamily: tokens.fontFamily,
        }}>
          {wordTokens.map((token, i) => (
            <span
              key={i}
              style={{
                color: token.highlighted ? accent : textColor,
                fontWeight: token.highlighted ? 800 : 800,
              }}
            >
              {token.word}{i < wordTokens.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      </div>

    </AbsoluteFill>
  );
};
