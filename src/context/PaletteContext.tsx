import React from "react";

export interface PaletteContextValue {
  background:    string; // #0d0d0d
  text:          string; // #f0f0f0
  accent:        string; // LLM-provided accentColor
  accent_dim:    string; // accent at 60% opacity
  chart_grid:    string; // rgba(255,255,255,0.08)
  overlay_scrim: string; // rgba(0,0,0,0.55)
}

/** Parse a #rrggbb hex string to rgba(r,g,b,alpha). Falls back to accent purple on bad input. */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(167,139,250,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const DEFAULT_ACCENT = "#a78bfa";

const defaultPalette: PaletteContextValue = {
  background:    "#0d0d0d",
  text:          "#f0f0f0",
  accent:        DEFAULT_ACCENT,
  accent_dim:    hexToRgba(DEFAULT_ACCENT, 0.6),
  chart_grid:    "rgba(255,255,255,0.08)",
  overlay_scrim: "rgba(0,0,0,0.55)",
};

export const PaletteContext =
  React.createContext<PaletteContextValue>(defaultPalette);

export function usePalette(): PaletteContextValue {
  return React.useContext(PaletteContext);
}

/** Build a PaletteContextValue from an accent hex string. */
export function buildPalette(accentColor: string): PaletteContextValue {
  const safeAccent = /^#[0-9a-f]{6}$/i.test(accentColor) ? accentColor : DEFAULT_ACCENT;
  return {
    background:    "#0d0d0d",
    text:          "#f0f0f0",
    accent:        safeAccent,
    accent_dim:    hexToRgba(safeAccent, 0.6),
    chart_grid:    "rgba(255,255,255,0.08)",
    overlay_scrim: "rgba(0,0,0,0.55)",
  };
}
