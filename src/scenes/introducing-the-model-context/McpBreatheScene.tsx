/**
 * McpBreatheScene.tsx
 * Beat: breathe — sentences 5, 9.
 * No image. Dark field (`#181818`). Single-line text, centred, damped spring entrance.
 * Purpose: editorial rhythm pause. Minimal, high contrast.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { TokenMap } from "../../../lmstudio/types";
import { tokenise } from "./mcpUtils";

export interface McpBreatheSceneProps {
  text: string;
  highlightWords: string[];
  tokens: TokenMap;
  durationInFrames: number;
}

export const McpBreatheScene: React.FC<McpBreatheSceneProps> = ({
  text,
  highlightWords,
  tokens,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Use canvas dark field always — breathe = no image
  const canvas = "#181818";
  const accent = tokens.colors["accent"] ?? "#da291c";
  const textColor = tokens.colors["textOn"] ?? "#ffffff";

  // ── Entrance: slow soft fade — "breathe" pacing ────────────────────────────
  const entranceSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 28, stiffness: 60 },
    durationInFrames: 30,
  });
  const textOpacity = interpolate(entranceSpring, [0, 1], [0, 1]);
  const textY = interpolate(entranceSpring, [0, 1], [18, 0]);

  // ── Exit ────────────────────────────────────────────────────────────────────
  const sceneOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Ambient horizontal rule (drawn left from center, slow) ─────────────────
  const ruleProgress = interpolate(frame, [4, 28], [0, 1], { extrapolateRight: "clamp" });

  const wordTokens = tokenise(text, highlightWords);

  return (
    <AbsoluteFill style={{ background: canvas, opacity: sceneOpacity }}>

      {/* ── Subtle vignette — soft edges ─────────────────────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Thin accent rule: draws across centre ────────────────────────── */}
      <div style={{
        position: "absolute",
        top: "42%",
        left: 72,
        height: 1,
        width: `calc(${ruleProgress * 100}% - 144px)`,
        background: `rgba(218,41,28,${0.25 * ruleProgress})`,
        pointerEvents: "none",
      }} />

      {/* ── Centred text ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 96,
        paddingRight: 96,
      }}>
        <p style={{
          margin: 0,
          fontSize: 52,
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          textAlign: "center",
          color: textColor,
          fontFamily: tokens.fontFamily,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}>
          {wordTokens.map((token, i) => (
            <span
              key={i}
              style={{
                color: token.highlighted ? accent : textColor,
                fontWeight: token.highlighted ? 700 : 600,
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
