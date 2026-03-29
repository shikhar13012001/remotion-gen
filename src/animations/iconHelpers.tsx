import React from "react";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const BODY_FONT = TOKEN.sans;

export const IconPlaceholder: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => (
  <div style={{
    width: size, height: size,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: `${color}22`, borderRadius: "50%", border: `2px solid ${color}44`,
    fontFamily: BODY_FONT, fontWeight: 700, fontSize: Math.round(size * 0.28),
    color, textTransform: "uppercase", letterSpacing: "-0.02em",
  }}>
    {name.slice(0, 2)}
  </div>
);

export type IconLayout = "scatter" | "grid" | "radial" | "stack";

export function getIconPositions(layout: IconLayout, count: number): [number, number][] {
  const CX = 460;
  const CY = 540;

  if (layout === "grid") {
    const cols   = count <= 2 ? count : count <= 4 ? 2 : 3;
    const rows   = Math.ceil(count / cols);
    const CELL_W = 240;
    const CELL_H = 260;
    return Array.from({ length: count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return [CX + (col - (cols - 1) / 2) * CELL_W, CY + (row - (rows - 1) / 2) * CELL_H];
    });
  }
  if (layout === "radial") {
    const R = 280;
    return Array.from({ length: count }, (_, i) => [
      CX + R * Math.cos((i / count) * 2 * Math.PI - Math.PI / 2),
      CY + R * Math.sin((i / count) * 2 * Math.PI - Math.PI / 2),
    ]);
  }
  if (layout === "stack") {
    const STEP_Y = 180;
    const total  = count * STEP_Y;
    return Array.from({ length: count }, (_, i) => [CX, CY - total / 2 + i * STEP_Y + STEP_Y / 2]);
  }
  // scatter: deterministic pseudo-random positions
  const seed: [number, number][] = [[200, 300], [740, 280], [160, 620], [760, 600], [460, 820], [460, 260]];
  return Array.from({ length: count }, (_, i) => seed[i % seed.length]);
}
