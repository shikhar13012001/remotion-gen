import React from "react";
import { interpolate } from "remotion";
import type { PaletteContextValue } from "../context/PaletteContext";
import { TimelineItem } from "../../packages/video-renderer/src/components/primitives/TimelineItem";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const DISPLAY_FONT   = TOKEN.serif;
const STAGGER_FRAMES = 8;

interface TimelineEvent { date: string; label: string; sublabel?: string; }

interface TimelineRendererProps {
  events: TimelineEvent[];
  frame: number;
  fps: number;
  palette: PaletteContextValue;
  lineProgress: number;
  containerOp: number;
}

// ─── Vertical Timeline — uses TimelineItem primitive ──────────────────────────
export const VerticalTimeline: React.FC<TimelineRendererProps> = ({
  events, frame, palette, containerOp,
}) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "flex-start", justifyContent: "center", padding: "120px 100px", opacity: containerOp }}>
    {events.map((ev, i) => (
      <TimelineItem
        key={i}
        time={ev.date}
        event={ev.label}
        detail={ev.sublabel ?? ""}
        frame={frame}
        startFrame={i * STAGGER_FRAMES}
        isLast={i === events.length - 1}
        accentColor={palette.accent}
      />
    ))}
  </div>
);

// ─── Horizontal Timeline — dots on a track ────────────────────────────────────
// TimelineItem is designed for vertical use; horizontal layout is kept as bespoke
// but now uses TOKEN values for consistency.
export const HorizontalTimeline: React.FC<TimelineRendererProps> = ({
  events, frame, fps, palette, lineProgress, containerOp,
}) => {
  const TRACK_W = 800;
  const stepX   = TRACK_W / Math.max(events.length - 1, 1);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "120px 60px", opacity: containerOp }}>
      <div style={{ position: "relative", width: TRACK_W, height: 180 }}>
        {/* Track line */}
        <div style={{ position: "absolute", top: 40, left: 0,
          height: 1, width: TRACK_W * lineProgress,
          background: `linear-gradient(to right, ${palette.accent}, ${palette.accent_dim})` }} />

        {events.map((ev, i) => {
          const startF = i * STAGGER_FRAMES;
          const pDot   = Math.max(0, Math.min(1, (frame - startF) / 10));
          const dotS   = 0.2 + 0.8 * (1 - Math.pow(1 - pDot, 4)); // out4 spring feel
          const pText  = Math.max(0, Math.min(1, (frame - startF - 4) / 8));

          return (
            <div key={i} style={{ position: "absolute", left: i * stepX, top: 0,
              transform: "translateX(-50%)" }}>
              {/* Dot with glow ring */}
              <div style={{
                width: 12, height: 12, borderRadius: "50%", background: palette.accent,
                margin: "34px auto 0", transform: `scale(${dotS})`,
                opacity: pDot,
                boxShadow: pDot > 0.5
                  ? `0 0 0 5px ${palette.accent}20, 0 0 14px ${palette.accent}50`
                  : "none",
              }} />
              {/* Date */}
              <div style={{ position: "absolute", bottom: 96, left: "50%",
                transform: "translateX(-50%)",
                fontFamily: TOKEN.mono, fontWeight: 700, fontSize: 20,
                color: palette.accent, whiteSpace: "nowrap", opacity: pText,
                letterSpacing: "0.10em", textTransform: "uppercase" as const }}>
                {ev.date}
              </div>
              {/* Label */}
              <div style={{ marginTop: 10, fontFamily: TOKEN.sans, fontWeight: 400, fontSize: 24,
                color: palette.text, textAlign: "center", whiteSpace: "nowrap", opacity: pText,
                lineHeight: 1.25 }}>
                {ev.label}
              </div>
              {ev.sublabel && (
                <div style={{ fontFamily: TOKEN.sans, fontWeight: 400, fontSize: 18,
                  color: palette.text, opacity: pText * 0.5, textAlign: "center", marginTop: 2 }}>
                  {ev.sublabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
