import React from "react";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";

interface Props {
  time:         string;
  event:        string;
  detail:       string;
  frame:        number;
  startFrame:   number;
  isLast?:      boolean;
  accentColor?: string;
}

/**
 * Single timeline entry.
 * Dot: spring entrance + gold glow ring.
 * Connector line: scaleY from 0 → 1 via outExpo, origin top.
 * Content: slides in from left.
 */
export const TimelineItem: React.FC<Props> = ({ time, event, detail, frame, startFrame, isLast, accentColor }) => {
  const accent = accentColor ?? TOKEN.gold;
  const accentDim = accentColor ? `${accentColor}66` : TOKEN.goldDim;
  const p      = prog(frame, startFrame, 16);
  const lineP  = prog(frame, startFrame + 6, 14);
  const opacity = lerp(p, 0, 1, E.out3);
  const x       = lerp(p, -18, 0, E.out4);
  const dotS    = lerp(p, 0.2, 1, E.spring);

  return (
    <div style={{ display: "flex", gap: 18, opacity, transform: `translateX(${x}px)` }}>
      {/* Dot + connector column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 12 }}>
        {/* Dot with glow ring */}
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: accent,
          marginTop: 5, flexShrink: 0,
          transform: `scale(${dotS})`,
          boxShadow: `0 0 0 5px ${accent}1f, 0 0 14px ${accent}4d`,
        }} />
        {/* Connector line — scaleY from 0 */}
        {!isLast && (
          <div style={{
            width: 1, flex: 1, marginTop: 4,
            background: `linear-gradient(to bottom, ${accentDim} 0%, ${accent}1a 100%)`,
            transformOrigin: "top",
            transform: `scaleY(${lerp(lineP, 0, 1, E.outExpo)})`,
          }} />
        )}
      </div>
      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 24 }}>
        <div style={{
          fontFamily: TOKEN.mono, fontSize: 11,
          color: accent, letterSpacing: "0.14em",
          textTransform: "uppercase" as const,
          marginBottom: 4,
        }}>
          {time}
        </div>
        <div style={{
          fontFamily: TOKEN.sans, fontSize: 17,
          color: TOKEN.white, fontWeight: 600,
          lineHeight: 1.25, marginBottom: 4,
        }}>
          {event}
        </div>
        <div style={{ fontFamily: TOKEN.sans, fontSize: 13, color: TOKEN.dim, lineHeight: 1.4 }}>
          {detail}
        </div>
      </div>
    </div>
  );
};
