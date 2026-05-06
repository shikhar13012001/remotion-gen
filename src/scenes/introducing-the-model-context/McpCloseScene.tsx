/**
 * McpCloseScene.tsx
 * Beat: close — sentence 12.
 * No image. Dark canvas. Echoes hook motif (grid, accent rule).
 * Text is centred, slower spring — deliberate, editorial.
 * Ends with a final accent accent dot → full stop gesture.
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

export interface McpCloseSceneProps {
  text: string;
  highlightWords: string[];
  tokens: TokenMap;
  durationInFrames: number;
}

export const McpCloseScene: React.FC<McpCloseSceneProps> = ({
  text,
  highlightWords,
  tokens,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const canvas = "#181818";
  const accent = tokens.colors["accent"] ?? "#da291c";
  const textColor = tokens.colors["textOn"] ?? "#ffffff";

  // ── Scene fade ──────────────────────────────────────────────────────────────
  const sceneOpacity = interpolate(
    frame,
    [0, 10, durationInFrames - 16, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Subtle grid lines (echo of hook scene) ─────────────────────────────────
  const gridOpacity = interpolate(frame, [0, 20], [0, 0.07], { extrapolateRight: "clamp" });

  // ── Top rule draws in ───────────────────────────────────────────────────────
  const topRuleWidth = interpolate(frame, [6, 26], [0, 120], { extrapolateRight: "clamp" });

  // ── Text entrance: slow deliberate spring ──────────────────────────────────
  const textSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 28, stiffness: 65 },
    durationInFrames: 36,
  });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [24, 0]);

  // ── Closing "full-stop" dot — appears late ─────────────────────────────────
  const dotScale = spring({
    frame: Math.max(0, frame - (durationInFrames - 28)),
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 18,
  });
  const dotSize = interpolate(dotScale, [0, 1], [0, 12]);

  const wordTokens = tokenise(text, highlightWords);

  return (
    <AbsoluteFill style={{ background: canvas, opacity: sceneOpacity }}>

      {/* ── Subtle grid echo ─────────────────────────────────────────────── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: gridOpacity,
          pointerEvents: "none",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {[180, 360, 540, 720, 900].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke={accent} strokeWidth={0.5} />
        ))}
        {[320, 640, 960, 1280, 1600].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} stroke={accent} strokeWidth={0.5} />
        ))}
      </svg>

      {/* ── Radial vignette ──────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.6) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Accent rule at top of text zone ─────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: 680,
        left: 72,
        height: 3,
        width: topRuleWidth,
        background: accent,
      }} />

      {/* ── Centred main text ─────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 80,
        paddingRight: 80,
        paddingBottom: 80,
      }}>
        <p style={{
          margin: 0,
          fontSize: 60,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: "-0.025em",
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
                fontWeight: token.highlighted ? 800 : 700,
              }}
            >
              {token.word}{i < wordTokens.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      </div>

      {/* ── Closing dot ──────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 180,
        left: "50%",
        transform: "translateX(-50%)",
        width: dotSize,
        height: dotSize,
        borderRadius: "50%",
        background: accent,
      }} />

    </AbsoluteFill>
  );
};
