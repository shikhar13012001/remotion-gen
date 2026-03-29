import React from "react";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";

interface Props { label: string; frame: number; startFrame: number; accentColor?: string; }

/**
 * Official document stamp badge.
 * Spring scale + rotation settle from -2° → 0°.
 * Monospace, uppercase, wide tracking — classified file aesthetic.
 * accentColor overrides TOKEN.gold — pass palette.accent for dynamic color injection.
 */
export const Stamp: React.FC<Props> = ({ label, frame, startFrame, accentColor }) => {
  const color   = accentColor ?? TOKEN.gold;
  const border  = accentColor ? `${accentColor}47` : TOKEN.goldBorder;
  const surface = accentColor ? `${accentColor}12` : TOKEN.goldSurface;
  const p      = prog(frame, startFrame, 14);
  const scale  = lerp(p, 0.75, 1, E.spring);
  const rotate = lerp(p, -2, 0, E.out4);
  const opacity = lerp(p, 0, 1, E.out3);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      border: `1.5px solid ${border}`,
      background: surface,
      padding: "5px 14px",
      borderRadius: 2,
      boxShadow: `inset 0 0 20px ${color}0d, 0 0 20px ${color}14`,
      opacity,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      transformOrigin: "left center",
      fontFamily: TOKEN.mono,
      fontSize: 10,
      letterSpacing: "0.18em",
      textTransform: "uppercase" as const,
      color,
      fontWeight: 700,
    }}>
      <div style={{
        width: 5, height: 5,
        background: color,
        borderRadius: "50%",
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}`,
      }} />
      {label}
    </div>
  );
};
