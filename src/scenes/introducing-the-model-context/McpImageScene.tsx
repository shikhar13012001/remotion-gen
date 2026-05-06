/**
 * McpImageScene.tsx
 * Used for build / reveal beats that have a fetched image asset.
 * Layout: full-bleed image with Ken Burns + bottom-gradient scrim + text block.
 * Colour grade: desaturated 65%, cool steel cast for data/systems aesthetic.
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

export interface McpImageSceneProps {
  text: string;
  highlightWords: string[];
  imagePath: string | null;
  tokens: TokenMap;
  durationInFrames: number;
  /** "zoom_in" | "zoom_out" | "pan_left" | "pan_right" */
  kenBurns?: string;
}

export const McpImageScene: React.FC<McpImageSceneProps> = ({
  text,
  highlightWords,
  imagePath,
  tokens,
  durationInFrames,
  kenBurns = "zoom_in",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = tokens.colors["accent"] ?? "#da291c";
  const textColor = tokens.colors["textOn"] ?? "#ffffff";
  const bgColor = tokens.colors["background"] ?? "#181818";

  // ── Ken Burns ──────────────────────────────────────────────────────────────
  const scale = kenBurns === "zoom_out"
    ? interpolate(frame, [0, durationInFrames], [1.08, 1.0], { extrapolateRight: "clamp" })
    : interpolate(frame, [0, durationInFrames], [1.0, 1.08], { extrapolateRight: "clamp" });

  const translateX = kenBurns === "pan_left"
    ? interpolate(frame, [0, durationInFrames], [0, -4], { extrapolateRight: "clamp" })
    : kenBurns === "pan_right"
    ? interpolate(frame, [0, durationInFrames], [-4, 0], { extrapolateRight: "clamp" })
    : 0;

  // ── Entrance / exit ────────────────────────────────────────────────────────
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame, [durationInFrames - 8, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const sceneOpacity = Math.min(fadeIn, fadeOut);

  // ── Text entrance — staggered word reveal ─────────────────────────────────
  const textEnter = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 18, stiffness: 110 },
    durationInFrames: 20,
  });
  const textY = interpolate(textEnter, [0, 1], [28, 0]);
  const textOpacity = interpolate(textEnter, [0, 1], [0, 1]);

  const tokens_ = tokenise(text, highlightWords);
  const wordCount = tokens_.length;
  const fontSize = mcpFontSize(wordCount);

  const resolvedImage = imagePath ?? null;

  return (
    <AbsoluteFill style={{ background: bgColor, opacity: sceneOpacity }}>

      {/* ── Background image ──────────────────────────────────────────────── */}
      {resolvedImage && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <Img
            src={staticFile(resolvedImage)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 35%",
              // Cool steel desaturation: data/systems aesthetic
              filter: "saturate(0.65) brightness(0.75) hue-rotate(5deg)",
              transform: `scale(${scale}) translateX(${translateX}%)`,
              transformOrigin: "center center",
            }}
          />
        </div>
      )}

      {/* ── Bottom-gradient scrim — text protection zone ──────────────────── */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: resolvedImage
          ? "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.82) 100%)"
          : bgColor,
        pointerEvents: "none",
      }} />

      {/* ── Hairline accent rule ───────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 320,
        left: 72,
        width: interpolate(frame, [8, 24], [0, 80], { extrapolateRight: "clamp" }),
        height: 2,
        background: accent,
      }} />

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
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: textColor,
          fontFamily: tokens.fontFamily,
        }}>
          {tokens_.map((token, i) => (
            <span
              key={i}
              style={{
                color: token.highlighted ? accent : textColor,
                fontWeight: token.highlighted ? 800 : 700,
              }}
            >
              {token.word}{i < tokens_.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      </div>

    </AbsoluteFill>
  );
};
