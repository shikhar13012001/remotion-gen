import React from "react";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";

interface Props {
  text:        string;
  frame:       number;
  startFrame:  number;
  isLast?:     boolean;
  accentColor?: string;
}

/**
 * Flow diagram node.
 * Left bar: scaleX 0→1 via outExpo (not scaleY).
 * Box: documentary gradient bg + gold border.
 * Arrow: stem extends down then arrowhead springs in.
 */
export const FlowNode: React.FC<Props> = ({ text, frame, startFrame, isLast, accentColor }) => {
  const accent = accentColor ?? TOKEN.gold;
  const accentDim = accentColor ? `${accentColor}99` : TOKEN.goldDim;
  const accentBorder = accentColor ? `${accentColor}47` : TOKEN.goldBorder;
  const accentBg = accentColor ? `linear-gradient(135deg, ${accentColor}12, rgba(255,255,255,0.03))` : "linear-gradient(135deg, rgba(200,169,110,0.07), rgba(255,255,255,0.03))";
  const p       = prog(frame, startFrame, 16);
  const arrowP  = prog(frame, startFrame + 10, 10);
  const opacity = lerp(p, 0, 1, E.out3);
  const barW    = lerp(p, 0, 3, E.outExpo);
  const y       = lerp(p, 8, 0, E.out4);

  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>
      <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
        {/* Left accent bar — scaleX reveal */}
        <div style={{
          width: barW, minHeight: 44,
          background: accent,
          borderRadius: "2px 0 0 2px",
          flexShrink: 0,
        }} />
        {/* Node box */}
        <div style={{
          flex: 1,
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          borderLeft: "none",
          padding: "12px 20px",
          borderRadius: "0 4px 4px 0",
        }}>
          <div style={{
            fontFamily: TOKEN.sans, fontSize: 15,
            color: TOKEN.white, fontWeight: 500,
            letterSpacing: "0.01em", textAlign: "center" as const,
          }}>
            {text}
          </div>
        </div>
      </div>
      {/* Arrow connector */}
      {!isLast && arrowP > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: 28 }}>
          <div style={{
            width: 1,
            height: lerp(arrowP, 0, 18, E.outExpo),
            background: `linear-gradient(to bottom, ${accent}, ${accentDim})`,
          }} />
          {arrowP > 0.6 && (
            <div style={{
              width: 0, height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `5px solid ${accent}`,
              opacity: lerp(prog(frame, startFrame + 16, 6), 0, 1, E.spring),
            }} />
          )}
        </div>
      )}
    </div>
  );
};
