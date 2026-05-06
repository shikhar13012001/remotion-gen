/**
 * McpHookScene.tsx
 * Beat: hook — sentence 1.
 * Layout: full-bleed image, animated network grid overlay, oversized display text centre-stage.
 * Ken Burns: slow zoom-in (intimacy / reveal). Grade: desaturated 60%, slightly lifted blacks.
 * Text entrance: scale 0.85→1.0 + fade, confident snap. Exit: scale down + fade.
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
import { tokenise } from "./mcpUtils";

export interface McpHookSceneProps {
  text: string;
  highlightWords: string[];
  imagePath: string | null;
  tokens: TokenMap;
  durationInFrames: number;
}

export const McpHookScene: React.FC<McpHookSceneProps> = ({
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
  const bgColor = tokens.colors["background"] ?? "#181818";

  // ── Ken Burns: slow zoom-in ─────────────────────────────────────────────────
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  // ── Scene fade in / out ─────────────────────────────────────────────────────
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const sceneOpacity = Math.min(fadeIn, fadeOut);

  // ── Text entrance: spring scale + fade ─────────────────────────────────────
  const textSpring = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 24,
  });
  const textScale = interpolate(textSpring, [0, 1], [0.82, 1.0]);
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);

  // ── Accent line draws in after text ────────────────────────────────────────
  const lineWidth = interpolate(frame, [20, 36], [0, 100], { extrapolateRight: "clamp" });

  // ── Animated subtle grid lines (SVG) ───────────────────────────────────────
  const gridOpacity = interpolate(frame, [0, 18], [0, 0.12], { extrapolateRight: "clamp" });

  const wordTokens = tokenise(text, highlightWords);

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
              objectPosition: "center 30%",
              // Lifted blacks / slightly warm for hook drama
              filter: "saturate(0.6) brightness(0.7) sepia(0.08)",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      )}

      {/* ── Dark overlay — heavier for hook legibility ──────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.88) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Subtle structural grid overlay (SVG) ────────────────────────── */}
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
        {/* Vertical grid lines */}
        {[180, 360, 540, 720, 900].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke={accent} strokeWidth={0.5} />
        ))}
        {/* Horizontal grid lines */}
        {[320, 640, 960, 1280, 1600].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} stroke={accent} strokeWidth={0.5} />
        ))}
      </svg>

      {/* ── Center display text ──────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingLeft: 72,
        paddingRight: 72,
        paddingTop: 200,
      }}>
        {/* Small category label above headline */}
        <p style={{
          margin: 0,
          marginBottom: 24,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: accent,
          fontFamily: tokens.fontFamily,
          opacity: textOpacity,
        }}>
          Open-Source Release
        </p>

        {/* Main hook text */}
        <div style={{
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          transformOrigin: "left center",
        }}>
          <p style={{
            margin: 0,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            color: textColor,
            fontFamily: tokens.fontFamily,
          }}>
            {wordTokens.map((token, i) => (
              <span
                key={i}
                style={{
                  color: token.highlighted ? accent : textColor,
                  fontWeight: token.highlighted ? 800 : 800,
                  // Highlighted words get a subtle underline treatment
                  ...(token.highlighted
                    ? { borderBottom: `3px solid ${accent}`, paddingBottom: 2 }
                    : {}),
                }}
              >
                {token.word}{i < wordTokens.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>

        {/* Accent rule draws in after text */}
        <div style={{
          marginTop: 32,
          height: 3,
          width: lineWidth,
          background: accent,
        }} />
      </div>

    </AbsoluteFill>
  );
};
