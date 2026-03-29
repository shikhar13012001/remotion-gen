import React from "react";
import { CounterUp } from "../lib/effects/CounterUp";

const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";

interface StatDisplayProps {
  statDisplay:  string;
  labelText:    string;
  slamScale:    number;
  slamOp:       number;
  accent:       string;
  useCounter:   boolean;
  counterData:  { value: number; prefix?: string; suffix?: string; decimals?: number } | null;
  durationInFrames: number;
}

export const StatDisplay: React.FC<StatDisplayProps> = ({
  statDisplay, labelText, slamScale, slamOp, accent,
  useCounter, counterData, durationInFrames,
}) => (
  <>
    {/* Large stat number or CounterUp */}
    {useCounter && counterData && typeof counterData.value === "number" ? (
      <div style={{ position: "absolute", top: "22%", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <CounterUp
          value={counterData.value} prefix={counterData.prefix}
          suffix={counterData.suffix} decimals={counterData.decimals}
          accent={accent} durationInFrames={durationInFrames}
        />
      </div>
    ) : statDisplay ? (
      <div style={{ position: "absolute", top: "22%", left: 0, right: 0, textAlign: "center",
        fontSize: 164, fontWeight: 800, fontFamily: DISPLAY_FONT, color: accent,
        transform: `scale(${slamScale})`, opacity: slamOp,
        letterSpacing: "-0.02em", lineHeight: 1 }}>
        {statDisplay}
      </div>
    ) : null}

    {/* Thin accent rule below number */}
    <div style={{ position: "absolute", top: "52%", left: "50%",
      transform: `translateX(-50%) scaleX(${slamOp})`,
      width: 60, height: 2, background: accent, transformOrigin: "center" }} />

    {/* Secondary context label */}
    {labelText && (
      <div style={{ position: "absolute", top: "57%", left: 80, right: 80, textAlign: "center",
        fontSize: 32, fontFamily: DISPLAY_FONT, color: "rgba(255,255,255,0.55)",
        opacity: slamOp, letterSpacing: "0", lineHeight: 1.3 }}>
        {labelText}
      </div>
    )}
  </>
);
