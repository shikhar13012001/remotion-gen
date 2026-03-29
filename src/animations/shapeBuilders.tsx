import React from "react";
import { interpolate } from "remotion";
import type { PaletteContextValue } from "../context/PaletteContext";

const SHAPE_W = 200;
const MAX_H   = 500;
const BASE_H  = 120;
const CX      = 540;
const CY      = 580;

interface ShapeBuildResult {
  svgContent: React.ReactNode;
  isFullReturn?: boolean;
  fullReturn?: React.ReactNode;
}

export function buildTowerVsFlat(
  progress: number,
  palette: PaletteContextValue,
  concept: string,
  containerOp: number,
  BODY_FONT: string,
): React.ReactNode {
  const towerH = BASE_H + (MAX_H - BASE_H) * progress;
  const flatW  = 80 + (320 - 80) * progress;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
      <svg width={1080} height={1344} style={{ position: "absolute", inset: 0 }}>
        <rect x={CX - 180 - SHAPE_W / 2} y={CY - towerH}
          width={SHAPE_W} height={towerH} fill={palette.accent} rx={2} />
        <rect x={CX + 180 - flatW / 2} y={CY - BASE_H}
          width={flatW} height={BASE_H} fill={palette.accent_dim} rx={2} />
      </svg>
      {concept && (
        <div style={{ position: "absolute", bottom: 280, left: 0, right: 0, textAlign: "center",
          fontFamily: BODY_FONT, fontWeight: 400, fontSize: 32, color: palette.text, opacity: 0.7 }}>
          {concept}
        </div>
      )}
    </div>
  );
}

export function buildShrinkingShape(progress: number, palette: PaletteContextValue): React.ReactNode {
  const scale = interpolate(progress, [0, 1], [1.0, 0.1]);
  return (
    <rect x={CX - SHAPE_W / 2} y={CY - SHAPE_W / 2}
      width={SHAPE_W} height={SHAPE_W} fill={palette.accent} rx={2}
      transform={`scale(${scale})`} style={{ transformOrigin: `${CX}px ${CY}px` }} />
  );
}

export function buildExpandingShape(progress: number, palette: PaletteContextValue): React.ReactNode {
  const scale = interpolate(progress, [0, 1], [0.05, 1.0]);
  return (
    <rect x={CX - SHAPE_W / 2} y={CY - SHAPE_W / 2}
      width={SHAPE_W} height={SHAPE_W} fill="none" stroke={palette.accent} strokeWidth={3} rx={2}
      transform={`scale(${scale})`}
      style={{ transformOrigin: `${CX}px ${CY}px`, opacity: interpolate(scale, [0.05, 0.2], [0, 1]) }} />
  );
}

export function buildSplittingShape(progress: number, palette: PaletteContextValue): React.ReactNode {
  const offset = interpolate(progress, [0, 1], [0, 200]);
  return (
    <>
      <rect x={CX - SHAPE_W / 2 - offset} y={CY - SHAPE_W / 2}
        width={SHAPE_W} height={SHAPE_W} fill={palette.accent} rx={2} />
      <rect x={CX - SHAPE_W / 2 + offset} y={CY - SHAPE_W / 2}
        width={SHAPE_W} height={SHAPE_W} fill={palette.accent_dim} rx={2} />
    </>
  );
}

export function buildMergingShape(progress: number, palette: PaletteContextValue): React.ReactNode {
  const offset = interpolate(progress, [0, 1], [200, 0]);
  return (
    <>
      <rect x={CX - SHAPE_W / 2 - offset} y={CY - SHAPE_W / 2}
        width={SHAPE_W} height={SHAPE_W} fill={palette.accent} rx={2}
        style={{ opacity: interpolate(offset, [20, 200], [0.5, 1]) }} />
      <rect x={CX - SHAPE_W / 2 + offset} y={CY - SHAPE_W / 2}
        width={SHAPE_W} height={SHAPE_W} fill={palette.accent_dim} rx={2}
        style={{ opacity: interpolate(offset, [20, 200], [0.5, 1]) }} />
      <rect x={CX - SHAPE_W / 2} y={CY - SHAPE_W / 2}
        width={SHAPE_W} height={SHAPE_W} fill={palette.accent} rx={2}
        style={{ opacity: interpolate(offset, [0, 30], [1, 0]) }} />
    </>
  );
}

export function buildFillingShape(progress: number, palette: PaletteContextValue): React.ReactNode {
  const fillH = SHAPE_W * progress;
  return (
    <>
      <rect x={CX - SHAPE_W / 2} y={CY - SHAPE_W / 2}
        width={SHAPE_W} height={SHAPE_W} fill="none" stroke={palette.accent} strokeWidth={3} rx={2} />
      <clipPath id="fill-clip">
        <rect x={CX - SHAPE_W / 2} y={CY + SHAPE_W / 2 - fillH} width={SHAPE_W} height={fillH} />
      </clipPath>
      <rect x={CX - SHAPE_W / 2} y={CY - SHAPE_W / 2}
        width={SHAPE_W} height={SHAPE_W} fill={palette.accent} rx={2} clipPath="url(#fill-clip)" />
    </>
  );
}
