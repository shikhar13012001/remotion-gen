import React from "react";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";

interface Props { frame: number; startFrame: number; width?: number; accentColor?: string; }

/**
 * Gold line extends from center outward + diamond springs in at 60% extension.
 * Arms: gradient gold → transparent, outExpo easing.
 * Diamond: spring scale, appears only after arms are 60% extended.
 * accentColor overrides TOKEN.gold — pass palette.accent for dynamic color injection.
 */
export const GoldDivider: React.FC<Props> = ({ frame, startFrame, width = 400, accentColor }) => {
  const color    = accentColor ?? TOKEN.gold;
  const glowAlpha = accentColor ? `${accentColor}66` : "rgba(200,169,110,0.40)";
  const pArm     = prog(frame, startFrame, 22);
  const pDiamond = prog(frame, startFrame + 13, 12);  // starts at 60% of arm duration
  const armW     = lerp(pArm, 0, width / 2, E.outExpo);
  const glow     = pArm > 0.5 ? `0 0 10px ${glowAlpha}` : "none";

  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      height: 20,
    }}>
      {/* Left arm */}
      <div style={{
        position: "absolute", right: "50%",
        width: armW, height: 1,
        background: `linear-gradient(to left, ${color}, transparent)`,
        boxShadow: glow,
        transformOrigin: "right center",
      }} />
      {/* Right arm */}
      <div style={{
        position: "absolute", left: "50%",
        width: armW, height: 1,
        background: `linear-gradient(to right, ${color}, transparent)`,
        boxShadow: glow,
        transformOrigin: "left center",
      }} />
      {/* Center diamond — springs in after arms reach 60% */}
      {pDiamond > 0 && (
        <div style={{
          width: 6, height: 6,
          background: color,
          transform: `rotate(45deg) scale(${lerp(pDiamond, 0, 1, E.spring)})`,
          flexShrink: 0,
          position: "relative", zIndex: 1,
          boxShadow: `0 0 12px ${color}`,
        }} />
      )}
    </div>
  );
};
