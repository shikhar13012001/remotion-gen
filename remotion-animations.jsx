import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// FONTS — system serif/sans/mono stack — matches packages/video-renderer/src/tokens.ts
// No external font load needed; Georgia + Helvetica Neue are system fonts.
// ─────────────────────────────────────────────────────────────────────────────
const FONT_URL = null; // no Google Fonts import needed

// ─────────────────────────────────────────────────────────────────────────────
// EASING LIBRARY — cinematic quality curves
// ─────────────────────────────────────────────────────────────────────────────
const E = {
  out3:    t => 1 - Math.pow(1 - t, 3),
  out4:    t => 1 - Math.pow(1 - t, 4),
  out5:    t => 1 - Math.pow(1 - t, 5),
  inOut3:  t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo:  t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  spring:  t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -9*t) * Math.sin((t*10 - 0.75) * (2*Math.PI/3)) + 1;
  },
  cinema:  t => t < 0.1 ? 5*t*t : t < 0.9 ? (0.05 + 0.9*(t-0.1)/0.8) : 0.95 + 5*Math.pow(t-0.9,2),
  linear:  t => t,
};

function lerp(t, a, b, ease = E.out3) {
  return a + ease(Math.max(0, Math.min(1, t))) * (b - a);
}
// prog() — matches packages/video-renderer/src/engine.ts naming
function prog(frame, start, dur) {
  return Math.max(0, Math.min(1, (frame - start) / dur));
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND TOKENS — aligned with packages/video-renderer/src/tokens.ts
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN = {
  // Backgrounds
  bgVoid:      "#03070F",
  bgSignal:    "#06111F",
  bgFlare:     "#020810",
  // Accent — history gold
  gold:        "#c8a96e",
  goldDim:     "rgba(200,169,110,0.35)",
  goldGlow:    "rgba(200,169,110,0.15)",
  goldBorder:  "rgba(200,169,110,0.25)",
  goldSurface: "rgba(200,169,110,0.07)",
  // Text
  white:       "#ffffff",
  dim:         "rgba(255,255,255,0.55)",
  faint:       "rgba(255,255,255,0.18)",
  // Structure
  border:      "rgba(255,255,255,0.08)",
  surface:     "rgba(255,255,255,0.04)",
  gridColor:   "rgba(255,255,255,0.04)",
  // Typography — matches packages/video-renderer/src/tokens.ts
  serif: "Georgia, 'Times New Roman', serif",
  sans:  "'Helvetica Neue', Arial, sans-serif",
  mono:  "'Courier New', monospace",
};

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 1: KINETIC TITLE ───────────────────────────────────────────────
// Word-by-word reveal — each word slides up from a clip mask (not just opacity)
// Georgia for display weight, accent words get a gold glow
// ─────────────────────────────────────────────────────────────────────────────
export function KineticTitle({
  text = "The shots that changed a nation",
  frame = 0,
  startFrame = 0,
  fontSize = 62,
  color = TOKEN.white,
  accentColor = TOKEN.gold,
  accentWords = [],
  wordStagger = 4,
  wordDuration = 18,
  align = "left",
  lineHeight = 1.2,
  maxWidth = "100%",
}) {
  const words = text.split(" ");
  return (
    <div style={{
      display: "flex", flexWrap: "wrap",
      gap: `${fontSize * 0.3}px ${fontSize * 0.24}px`,
      maxWidth,
      justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      lineHeight,
    }}>
      {words.map((word, i) => {
        const t = prog(frame, startFrame + i * wordStagger, wordDuration);
        const isAccent = accentWords.some(w => w.toLowerCase() === word.toLowerCase().replace(/[^a-z]/g, ""));
        return (
          <div key={i} style={{ overflow: "hidden", display: "inline-block" }}>
            <span style={{
              display: "inline-block",
              fontSize,
              fontFamily: TOKEN.serif,
              fontWeight: isAccent ? 800 : 700,
              color: isAccent ? accentColor : color,
              letterSpacing: "-0.03em",
              transform: `translateY(${lerp(t, 100, 0, E.out4)}%)`,
              opacity: lerp(t, 0, 1, E.out3),
              textShadow: isAccent
                ? `0 0 48px rgba(200,169,110,0.45), 0 2px 24px rgba(200,169,110,0.22)`
                : `0 2px 40px rgba(0,0,0,0.6)`,
            }}>
              {word}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 2: CLASSIFIED BADGE ────────────────────────────────────────────
// Stamp-style label — scales in with spring overshoot, slight rotation settle
// ─────────────────────────────────────────────────────────────────────────────
export function ClassifiedBadge({
  text = "Classified",
  frame = 0,
  startFrame = 0,
  color = TOKEN.gold,
  style = "stamp",
}) {
  const t = prog(frame, startFrame, 14);
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7,
    opacity: lerp(t, 0, 1, E.out3),
    transform: `scale(${lerp(t, 0.7, 1, E.spring)}) rotate(${lerp(t, -3, 0, E.out4)}deg)`,
    transformOrigin: "center",
    fontFamily: TOKEN.mono,
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 700,
  };
  if (style === "stamp") return (
    <div style={{ ...base, color, border: `1.5px solid ${color}`, padding: "6px 16px", borderRadius: 2,
      background: TOKEN.goldSurface, boxShadow: `inset 0 0 20px rgba(200,169,110,0.05), 0 0 20px rgba(200,169,110,0.1)` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      {text}
    </div>
  );
  if (style === "pill") return (
    <div style={{ ...base, color: "#000", background: color, padding: "6px 18px", borderRadius: 999,
      boxShadow: `0 4px 28px rgba(200,169,110,0.35)` }}>
      {text}
    </div>
  );
  return (
    <div style={{ ...base, color, gap: 10 }}>
      <div style={{ width: 22, height: 1, background: color }} />
      {text}
      <div style={{ width: 22, height: 1, background: color }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 3: CINEMATIC TIMELINE ──────────────────────────────────────────
// Connector line draws like a wire, dot springs in, content slides from right
// ─────────────────────────────────────────────────────────────────────────────
export function CinematicTimeline({
  items = [
    { time: "12:30 PM", event: "Shots fired",             location: "Dealey Plaza, Dallas" },
    { time: "1:00 PM",  event: "Kennedy pronounced dead", location: "Parkland Hospital" },
    { time: "2:38 PM",  event: "LBJ sworn in",            location: "Air Force One" },
    { time: "6:00 PM",  event: "Body flown to Washington",location: "Andrews AFB" },
  ],
  frame = 0, startFrame = 0,
  itemStagger = 22, itemDuration = 18, lineDuration = 12,
  accentColor = TOKEN.gold,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
      {items.map((item, i) => {
        const itemStart = startFrame + i * itemStagger;
        const t    = prog(frame, itemStart, itemDuration);
        const lineT = prog(frame, itemStart - lineDuration, lineDuration);
        if (!t && i > 0) return null;
        return (
          <div key={i} style={{ display: "flex", gap: 0, position: "relative" }}>
            {/* Dot + line column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30, flexShrink: 0 }}>
              {i > 0 && (
                <div style={{ width: 1, height: 30,
                  background: `linear-gradient(to bottom, ${accentColor}60, ${accentColor}20)`,
                  transformOrigin: "top", transform: `scaleY(${lerp(lineT, 0, 1, E.outExpo)})`,
                  marginBottom: 2 }} />
              )}
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: accentColor,
                flexShrink: 0, marginTop: i === 0 ? 0 : 2,
                opacity: lerp(t, 0, 1, E.out3),
                transform: `scale(${lerp(t, 0.3, 1, E.spring)})`,
                boxShadow: `0 0 0 ${lerp(t, 0, 7, E.out4)}px rgba(200,169,110,0.15), 0 0 ${lerp(t, 0, 18, E.out4)}px rgba(200,169,110,0.28)`,
              }} />
            </div>
            {/* Content */}
            <div style={{ paddingLeft: 18, paddingBottom: i < items.length - 1 ? 30 : 0,
              opacity: lerp(t, 0, 1, E.out3), transform: `translateX(${lerp(t, 18, 0, E.out4)}px)` }}>
              <div style={{ fontSize: 13, color: accentColor, fontFamily: TOKEN.mono,
                letterSpacing: "0.12em", marginBottom: 6, textTransform: "uppercase" }}>
                {item.time}
              </div>
              <div style={{ fontSize: 22, color: TOKEN.white, fontFamily: TOKEN.serif,
                fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 5 }}>
                {item.event}
              </div>
              {item.location && (
                <div style={{ fontSize: 14, color: TOKEN.dim, fontFamily: TOKEN.sans, fontWeight: 400, letterSpacing: "0.01em" }}>
                  {item.location}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 4: FLOW DIAGRAM ─────────────────────────────────────────────────
// Nodes build in sequentially with left-accent bars; arrows draw between them
// ─────────────────────────────────────────────────────────────────────────────
export function CinematicFlow({
  nodes = ["Washington D.C.", "San Antonio TX", "Houston TX", "Love Field Dallas", "Dealey Plaza"],
  frame = 0, startFrame = 0,
  nodeDuration = 16, nodeStagger = 14,
  accentColor = TOKEN.gold, width = 280,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, width }}>
      {nodes.map((node, i) => {
        const nodeStart = startFrame + i * nodeStagger;
        const t      = prog(frame, nodeStart, nodeDuration);
        const arrowT = prog(frame, nodeStart - 8, 10);
        return (
          <div key={i} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {i > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: 26, justifyContent: "center" }}>
                <div style={{ width: 1, height: `${lerp(arrowT, 0, 14, E.outExpo)}px`,
                  background: `linear-gradient(to bottom, ${accentColor}80, ${accentColor})` }} />
                {arrowT > 0.7 && (
                  <div style={{ width: 0, height: 0,
                    borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
                    borderTop: `6px solid ${accentColor}`,
                    opacity: lerp(prog(frame, nodeStart - 2, 6), 0, 1, E.out3) }} />
                )}
              </div>
            )}
            <div style={{ width: "100%", padding: "13px 22px",
              background: lerp(t, 0, 1, E.out3) > 0.5 ? `linear-gradient(135deg, rgba(200,169,110,0.08), rgba(255,255,255,0.03))` : "transparent",
              border: `1px solid rgba(200,169,110,${lerp(t, 0, 0.3, E.out3)})`, borderRadius: 4,
              opacity: lerp(t, 0, 1, E.out3), transform: `translateY(${lerp(t, 8, 0, E.out4)}px)`,
              position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${lerp(t, 0, 3, E.outExpo)}px`, background: accentColor, opacity: 0.75 }} />
              <div style={{ fontSize: 16, color: TOKEN.white, fontFamily: TOKEN.sans, fontWeight: 500,
                letterSpacing: "0.01em", textAlign: "center" }}>
                {node}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 5: STAT CALLOUT ─────────────────────────────────────────────────
// Counter counts up, underline draws, label fades — glow peaks at completion
// ─────────────────────────────────────────────────────────────────────────────
export function StatCallout({
  value = 22, label = "years of investigation",
  prefix = "", suffix = "",
  frame = 0, startFrame = 0,
  fontSize = 104, countDuration = 50, accentColor = TOKEN.gold,
}) {
  const entranceT = prog(frame, startFrame, 20);
  const countT    = prog(frame, startFrame + 10, countDuration);
  const current   = Math.floor(value * E.out3(countT));
  const glowT     = countT > 0.9 ? prog(frame, startFrame + 10 + countDuration * 0.9, countDuration * 0.1) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      opacity: lerp(entranceT, 0, 1, E.out3),
      transform: `translateY(${lerp(entranceT, 28, 0, E.out4)}px)` }}>
      <div style={{ fontFamily: TOKEN.serif, fontWeight: 800, fontSize, color: TOKEN.white,
        letterSpacing: "-0.04em", lineHeight: 1,
        textShadow: glowT > 0
          ? `0 0 ${70 * glowT}px rgba(200,169,110,${0.55 * glowT}), 0 0 ${130 * glowT}px rgba(200,169,110,${0.22 * glowT})`
          : "none",
        display: "flex", alignItems: "baseline", gap: 5 }}>
        {prefix && <span style={{ fontSize: fontSize * 0.42, color: accentColor }}>{prefix}</span>}
        {current}
        {suffix && <span style={{ fontSize: fontSize * 0.42, color: accentColor }}>{suffix}</span>}
      </div>
      <div style={{ height: 1, marginTop: 14, marginBottom: 14,
        width: `${lerp(prog(frame, startFrame + 10 + countDuration * 0.8, 20), 0, 100, E.outExpo)}%`,
        background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }} />
      <div style={{ fontSize: 14, color: TOKEN.dim, fontFamily: TOKEN.mono,
        letterSpacing: "0.14em", textTransform: "uppercase",
        opacity: lerp(prog(frame, startFrame + 14, 18), 0, 1, E.out3) }}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 6: SUBTITLE REVEAL ─────────────────────────────────────────────
// Line-masked reveal — text uncovers upward, not just fades in
// ─────────────────────────────────────────────────────────────────────────────
export function SubtitleReveal({
  lines = ["Twelve seconds.", "Four shots.", "One motorcade."],
  frame = 0, startFrame = 0,
  fontSize = 20, stagger = 18, duration = 20,
  color = TOKEN.dim, accentLine = -1,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: fontSize * 0.65 }}>
      {lines.map((line, i) => {
        const t = prog(frame, startFrame + i * stagger, duration);
        const isAccent = i === accentLine;
        return (
          <div key={i} style={{ overflow: "hidden" }}>
            <div style={{ fontSize, fontFamily: TOKEN.sans, fontWeight: isAccent ? 500 : 400,
              color: isAccent ? TOKEN.gold : color,
              letterSpacing: isAccent ? "0.04em" : "0.01em", lineHeight: 1.4,
              transform: `translateY(${lerp(t, 100, 0, E.out4)}%)`,
              opacity: lerp(t, 0.3, 1, E.out3) }}>
              {line}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 7: GOLD DIVIDER ─────────────────────────────────────────────────
// Two arms extend from center with a spring diamond — section separator
// ─────────────────────────────────────────────────────────────────────────────
export function GoldDivider({
  frame = 0, startFrame = 0, width = 400, label, accentColor = TOKEN.gold,
}) {
  const t      = prog(frame, startFrame, 24);
  const labelT = prog(frame, startFrame + 18, 16);
  const lineW  = lerp(t, 0, width / 2, E.outExpo);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {label && (
        <div style={{ fontSize: 11, fontFamily: TOKEN.mono, color: accentColor,
          letterSpacing: "0.2em", textTransform: "uppercase", opacity: lerp(labelT, 0, 1, E.out3) }}>
          {label}
        </div>
      )}
      <div style={{ position: "relative", width, height: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", right: "50%", top: 0, width: lineW, height: 1,
          background: `linear-gradient(to left, ${accentColor}, transparent)`,
          boxShadow: t > 0.5 ? `0 0 10px rgba(200,169,110,0.45)` : "none" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, width: lineW, height: 1,
          background: `linear-gradient(to right, ${accentColor}, transparent)`,
          boxShadow: t > 0.5 ? `0 0 10px rgba(200,169,110,0.45)` : "none" }} />
        {t > 0.6 && (
          <div style={{ width: 6, height: 6, background: accentColor, transform: `rotate(45deg) scale(${lerp(prog(frame, startFrame + 14, 10), 0, 1, E.spring)})`,
            boxShadow: `0 0 12px ${accentColor}`, position: "relative", zIndex: 1, flexShrink: 0 }} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 8: IMAGE REVEAL ─────────────────────────────────────────────────
// Wipes from left with a gold light sweep across the photo
// ─────────────────────────────────────────────────────────────────────────────
export function ImageReveal({
  src, frame = 0, startFrame = 0, width = 320, height = 200, caption, accentColor = TOKEN.gold,
}) {
  const revealT  = prog(frame, startFrame, 28);
  const sweepT   = prog(frame, startFrame + 20, 20);
  const captionT = prog(frame, startFrame + 32, 16);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ width, height, position: "relative", overflow: "hidden", borderRadius: 4,
        border: `1px solid rgba(200,169,110,${lerp(revealT, 0, 0.22, E.out3)})` }}>
        <div style={{ position: "absolute", inset: 0,
          background: src ? "none" : "linear-gradient(135deg, #0a1628, #060e1a)",
          clipPath: `inset(0 ${lerp(revealT, 100, 0, E.outExpo)}% 0 0)` }}>
          {src ? (
            <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.75) contrast(1.1)" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0d1f38, #060e1a)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(200,169,110,0.4)", fontFamily: TOKEN.mono, letterSpacing: "0.1em" }}>IMAGE</div>
            </div>
          )}
        </div>
        {sweepT > 0 && sweepT < 1 && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: `linear-gradient(to right,
              transparent ${lerp(sweepT, -20, 80, E.inOut3)}%,
              rgba(200,169,110,0.13) ${lerp(sweepT, -10, 90, E.inOut3)}%,
              transparent ${lerp(sweepT, 0, 100, E.inOut3)}%)` }} />
        )}
        {src && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />}
      </div>
      {caption && (
        <div style={{ fontSize: 13, color: TOKEN.dim, fontFamily: TOKEN.mono,
          letterSpacing: "0.1em", opacity: lerp(captionT, 0, 1, E.out3), paddingLeft: 2 }}>
          {caption}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 9: BAR CHART ────────────────────────────────────────────────────
// Vertical bars grow up from baseline — staggered, gold glow at peak
// ─────────────────────────────────────────────────────────────────────────────
export function BarChart({
  items = [
    { label: "1963", value: 3 }, { label: "1964", value: 22 },
    { label: "1979", value: 14 }, { label: "1992", value: 8 }, { label: "2003", value: 5 },
  ],
  unit = "investigations",
  frame = 0, startFrame = 0, accentColor = TOKEN.gold,
  width = 256, height = 160, stagger = 10, barDuration = 24,
}) {
  const maxVal = Math.max(...items.map(i => i.value));
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 8 }}>
      {unit && <div style={{ fontSize: 12, color: TOKEN.dim, fontFamily: TOKEN.mono, letterSpacing: "0.12em", textTransform: "uppercase" }}>{unit}</div>}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
        {items.map((item, i) => {
          const t      = prog(frame, startFrame + i * stagger, barDuration);
          const barH   = lerp(t, 0, (item.value / maxVal) * (height - 30), E.out4);
          const valT   = prog(frame, startFrame + i * stagger + barDuration * 0.7, 14);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 13, fontFamily: TOKEN.mono, color: accentColor, fontWeight: 700,
                opacity: lerp(valT, 0, 1, E.out3), letterSpacing: "0.04em" }}>
                {item.value}
              </div>
              <div style={{ width: "100%", height: barH, borderRadius: "3px 3px 0 0",
                background: `linear-gradient(to top, ${accentColor}45, ${accentColor})`,
                boxShadow: t > 0.85 ? `0 -6px 20px ${TOKEN.goldGlow}` : "none",
                position: "relative", overflow: "hidden" }}>
                {t > 0.7 && <div style={{ position: "absolute", inset: 0,
                  background: `linear-gradient(to top, transparent 50%, rgba(255,255,255,0.09) 100%)` }} />}
              </div>
              <div style={{ fontSize: 13, fontFamily: TOKEN.sans, color: TOKEN.dim,
                opacity: lerp(valT, 0, 1, E.out3), textAlign: "center", lineHeight: 1.2 }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ width: "100%", height: 1, background: TOKEN.border, marginTop: -6 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 10: LINE CHART ──────────────────────────────────────────────────
// Polyline draws point-by-point — dots spring in, segments trace between them
// ─────────────────────────────────────────────────────────────────────────────
export function LineChart({
  points = [12, 34, 28, 67, 89, 110, 95, 142],
  labels = ["'56","'58","'60","'62","'64","'66","'68","'70"],
  yLabel = "testimonies",
  frame = 0, startFrame = 0, accentColor = TOKEN.gold,
  width = 256, height = 160, stagger = 12,
}) {
  const N   = points.length;
  const minY = Math.min(...points), maxY = Math.max(...points);
  const rng  = maxY - minY || 1;
  const pX   = 8, pY   = 18;
  const cX = i => pX + (i / (N - 1)) * (width - pX * 2);
  const cY = v => pY + (1 - (v - minY) / rng) * (height - pY * 2 - 22);
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 4 }}>
      {yLabel && <div style={{ fontSize: 12, color: TOKEN.dim, fontFamily: TOKEN.mono, letterSpacing: "0.12em", textTransform: "uppercase" }}>{yLabel}</div>}
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {[0.25, 0.5, 0.75, 1].map(f => {
          const y = pY + f * (height - pY * 2 - 22);
          return <line key={f} x1={pX} y1={y} x2={width - pX} y2={y}
            stroke={TOKEN.gridColor} strokeWidth={0.75}
            opacity={lerp(prog(frame, startFrame, 16), 0, 1, E.out3)} />;
        })}
        {points.map((val, i) => {
          const dotT = prog(frame, startFrame + i * stagger, 14);
          const x = cX(i), y = cY(val);
          const segT = i < N - 1 ? prog(frame, startFrame + i * stagger + 6, stagger) : 0;
          const x2 = i < N - 1 ? lerp(segT, x, cX(i + 1), E.outExpo) : x;
          const y2 = i < N - 1 ? lerp(segT, y, cY(points[i + 1]), E.outExpo) : y;
          return (
            <g key={i}>
              {i < N - 1 && segT > 0 && <line x1={x} y1={y} x2={x2} y2={y2} stroke={accentColor} strokeWidth={2} opacity={0.85} />}
              {dotT > 0 && <circle cx={x} cy={y} r={lerp(dotT, 0, 3.5, E.spring)} fill={accentColor}
                style={{ filter: `drop-shadow(0 0 5px ${accentColor})` }} />}
              {labels[i] && dotT > 0.5 && (
                <text x={x} y={height - 2} textAnchor="middle" fontSize={11} fill={TOKEN.dim} fontFamily={TOKEN.sans}
                  opacity={lerp(prog(frame, startFrame + i * stagger + 14, 10), 0, 1, E.out3)}>
                  {labels[i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 11: COMPARISON BARS ────────────────────────────────────────────
// Horizontal bars in direct side-by-side contrast — gap is the story
// ─────────────────────────────────────────────────────────────────────────────
export function ComparisonBars({
  items = [{ label: "Before", value: 14, color: TOKEN.gold }, { label: "After", value: 89, color: "#4fc3f7" }],
  unit = "million tons",
  frame = 0, startFrame = 0, width = 256, stagger = 20,
}) {
  const maxVal = Math.max(...items.map(i => i.value));
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 14 }}>
      {unit && <div style={{ fontSize: 12, color: TOKEN.dim, fontFamily: TOKEN.mono, letterSpacing: "0.12em", textTransform: "uppercase" }}>{unit}</div>}
      {items.map((item, i) => {
        const t    = prog(frame, startFrame + i * stagger, 30);
        const valT = prog(frame, startFrame + i * stagger + 22, 12);
        const c    = item.color || TOKEN.gold;
        const fillPct = lerp(t, 0, (item.value / maxVal) * 100, E.out4);
        return (
          <div key={i} style={{ opacity: lerp(t, 0, 1, E.out3), transform: `translateX(${lerp(t, -10, 0, E.out4)}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 64, fontSize: 14, fontFamily: TOKEN.sans, color: TOKEN.dim, flexShrink: 0 }}>{item.label}</div>
              <div style={{ flex: 1, height: 26, background: TOKEN.surface, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${fillPct}%`,
                  background: `linear-gradient(to right, ${c}55, ${c})`, borderRadius: 3,
                  boxShadow: t > 0.85 ? `4px 0 18px ${c}40` : "none" }} />
              </div>
              <div style={{ width: 38, fontSize: 14, fontFamily: TOKEN.mono, color: c,
                fontWeight: 700, textAlign: "right", opacity: lerp(valT, 0, 1, E.out3) }}>
                {item.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 12: PERCENTAGE FILL ────────────────────────────────────────────
// SVG arc traces the proportion — counter counts up, glow at completion
// ─────────────────────────────────────────────────────────────────────────────
export function PercentageFill({
  value = 72, label = "of victims under age 30",
  style = "circle", frame = 0, startFrame = 0,
  accentColor = TOKEN.gold, size = 140,
}) {
  const t          = prog(frame, startFrame, 65);
  const displayVal = Math.round(lerp(t, 0, value, E.out3));
  const labelT     = prog(frame, startFrame + 22, 20);

  if (style === "circle") {
    const r = (size / 2) - 12;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={TOKEN.border} strokeWidth={4} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={accentColor} strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - lerp(t, 0, value / 100, E.out4))}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ filter: t > 0.5 ? `drop-shadow(0 0 7px ${accentColor})` : "none" }} />
          <text x={size/2} y={size/2 - 7} textAnchor="middle" fontSize={36} fontWeight={800}
            fontFamily={TOKEN.serif} fill={TOKEN.white} letterSpacing="-1">
            {displayVal}
          </text>
          <text x={size/2} y={size/2 + 16} textAnchor="middle" fontSize={13}
            fontFamily={TOKEN.mono} fill={accentColor} letterSpacing="1">
            %
          </text>
        </svg>
        <div style={{ fontSize: 14, fontFamily: TOKEN.sans, color: TOKEN.dim,
          textAlign: "center", maxWidth: size + 24, lineHeight: 1.5,
          opacity: lerp(labelT, 0, 1, E.out3) }}>
          {label}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 14, fontFamily: TOKEN.sans, color: TOKEN.dim }}>{label}</div>
        <div style={{ fontSize: 26, fontFamily: TOKEN.serif, fontWeight: 800, color: accentColor,
          opacity: lerp(t, 0, 1, E.out3) }}>{displayVal}%</div>
      </div>
      <div style={{ height: 7, background: TOKEN.surface, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${lerp(t, 0, value, E.out4)}%`,
          background: `linear-gradient(to right, ${accentColor}55, ${accentColor})`, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 13: ICON ARRANGEMENT ───────────────────────────────────────────
// Grid / radial / scatter of symbolic icons — each springs in sequentially
// Uses Unicode symbols (Phosphor-inspired vocabulary)
// ─────────────────────────────────────────────────────────────────────────────
const ICON_GLYPH = {
  person: "◉", users: "◎", "x-circle": "✕", "check-circle": "✓",
  warning: "⚠", sword: "✦", shield: "◈", fire: "◆", globe: "○",
  "map-pin": "▼", building: "▪", factory: "▬", bank: "◻", lock: "◾",
  clock: "◷", lightning: "◈", "arrow-right": "→", "arrow-up": "↑",
  "trend-up": "↗", "trend-down": "↘", atom: "◉", percent: "%",
  "currency-dollar": "$", sword2: "✚", heart: "♥",
};

export function IconArrangement({
  icons = ["person","person","person","person","x-circle","x-circle","check-circle","check-circle"],
  labels = ["infected","infected","infected","infected","died","died","recovered","recovered"],
  layout = "grid",
  frame = 0, startFrame = 0, accentColor = TOKEN.gold, stagger = 5,
}) {
  const cols = layout === "grid" ? Math.ceil(Math.sqrt(icons.length)) : icons.length;
  const CELL = 54;
  const positions = icons.map((_, i) => {
    if (layout === "grid")    return { x: (i % cols) * CELL, y: Math.floor(i / cols) * CELL };
    if (layout === "radial") {
      const a = (i / icons.length) * Math.PI * 2 - Math.PI / 2, r = 72;
      return { x: 100 + Math.cos(a) * r - 16, y: 80 + Math.sin(a) * r - 16 };
    }
    if (layout === "stack")   return { x: i * 20, y: i * 5 };
    return { x: (i * 55 + 18) % 220, y: (i * 39 + 12) % 100 };
  });
  const cW = layout === "grid" ? cols * CELL : 256;
  const cH = layout === "grid" ? Math.ceil(icons.length / cols) * CELL : 170;
  return (
    <div style={{ position: "relative", width: cW, height: cH }}>
      {icons.map((icon, i) => {
        const t = prog(frame, startFrame + i * stagger, 20);
        const pos = positions[i];
        const isNeg = icon.includes("x-circle") || (labels[i] || "").includes("died");
        const c = isNeg ? "#ef5350" : accentColor;
        return (
          <div key={i} style={{ position: "absolute", left: pos.x, top: pos.y,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            opacity: lerp(t, 0, 1, E.out3), transform: `scale(${lerp(t, 0.2, 1, E.spring)})` }}>
            <div style={{ fontSize: 24, color: c, lineHeight: 1, fontFamily: TOKEN.sans,
              textShadow: t > 0.7 ? `0 0 14px ${c}70` : "none" }}>
              {ICON_GLYPH[icon] || "◉"}
            </div>
            {labels[i] && (
              <div style={{ fontSize: 9, color: TOKEN.dim, fontFamily: TOKEN.mono,
                letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
                opacity: lerp(prog(frame, startFrame + i * stagger + 14, 10), 0, 1, E.out3) }}>
                {labels[i]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE BACKGROUNDS — simplified from packages/video-renderer/src/components/backgrounds/
// ─────────────────────────────────────────────────────────────────────────────
function BgDeepField({ frame }) {
  const d  = Math.sin(frame * 0.004) * 6, d2 = Math.cos(frame * 0.003) * 8;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 55% at ${28+d}% ${22+d2}%, #0D2B5E, transparent 70%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at ${72-d}% ${78-d2}%, #071830, transparent 65%)` }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><pattern id="bg-d" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke={TOKEN.gridColor} strokeWidth="0.75" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#bg-d)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.78) 100%)" }} />
    </div>
  );
}

function BgSignal({ frame }) {
  const scanY = (frame * 0.3) % 100;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${TOKEN.bgSignal}, #010508 55%, #000203)` }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><pattern id="bg-s" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" fill="none" stroke={TOKEN.gridColor} strokeWidth="0.75" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#bg-s)" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 120,
        background: "linear-gradient(to bottom, transparent, rgba(30,80,180,0.06), transparent)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.4) 100%)" }} />
    </div>
  );
}

function BgFlare({ frame }) {
  const b = Math.sin(frame * 0.025) * 0.03, d = Math.sin(frame * 0.006) * 5;
  const r1 = 70 + b * 100, r2 = 42 + b * 60;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgFlare }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 65% 60% at ${20+d}% 25%, #0F3070, transparent 65%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 40% 30% at 5% 95%, #1040A0, transparent 55%)", opacity: 0.5 }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><pattern id="bg-f" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke={TOKEN.gridColor} strokeWidth="0.75" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#bg-f)" />
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "38%", width: `${r1}%`, paddingTop: `${r1}%`,
        transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)" }} />
      <div style={{ position: "absolute", left: "50%", top: "55%", width: `${r2}%`, paddingTop: `${r2}%`,
        transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.055)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 30%, rgba(0,0,0,0.83) 100%)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO SCENES
// ─────────────────────────────────────────────────────────────────────────────
const DEMOS = [
  {
    id: "title", label: "Title", bg: BgFlare, duration: 90,
    render: f => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "0 32px", position: "relative", zIndex: 2 }}>
        <ClassifiedBadge text="November 22, 1963" frame={f} startFrame={0} style="stamp" />
        <KineticTitle text="The shots that changed a nation" frame={f} startFrame={8} fontSize={44}
          accentWords={["shots", "nation"]} align="center" wordStagger={5} />
        <GoldDivider frame={f} startFrame={52} width={200} />
        <SubtitleReveal lines={["Twelve seconds.", "Four shots.", "One motorcade."]}
          frame={f} startFrame={58} fontSize={18} stagger={12} />
      </div>
    ),
  },
  {
    id: "timeline", label: "Timeline", bg: BgSignal, duration: 120,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, padding: "0 28px" }}>
        <ClassifiedBadge text="Timeline of Events" frame={f} startFrame={0} style="line" />
        <div style={{ marginTop: 20 }}>
          <CinematicTimeline frame={f} startFrame={10} itemStagger={24}
            items={[
              { time: "12:30 PM", event: "Shots fired",             location: "Dealey Plaza, Dallas" },
              { time: "1:00 PM",  event: "Kennedy pronounced dead", location: "Parkland Hospital" },
              { time: "2:38 PM",  event: "LBJ sworn in",            location: "Air Force One" },
              { time: "6:00 PM",  event: "Body flown to Washington",location: "Andrews AFB" },
            ]} />
        </div>
      </div>
    ),
  },
  {
    id: "flow", label: "Flow", bg: BgSignal, duration: 110,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <ClassifiedBadge text="Kennedy's Texas Trip" frame={f} startFrame={0} style="stamp" />
        <CinematicFlow frame={f} startFrame={14} width={260}
          nodes={["Washington D.C.", "San Antonio TX", "Houston TX", "Love Field Dallas", "Dealey Plaza"]} />
      </div>
    ),
  },
  {
    id: "stat", label: "Stats", bg: BgDeepField, duration: 100,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <ClassifiedBadge text="By the numbers" frame={f} startFrame={0} style="line" />
        <div style={{ display: "flex", gap: 36 }}>
          <StatCallout value={3}    label="shots fired"  frame={f} startFrame={14} fontSize={88} countDuration={30} />
          <StatCallout value={22}   label="November"     frame={f} startFrame={30} fontSize={88} countDuration={42} />
          <StatCallout value={1963} label="year"         frame={f} startFrame={48} fontSize={62} countDuration={52} />
        </div>
        <GoldDivider frame={f} startFrame={72} width={280} label="Warren Commission, 1964" />
      </div>
    ),
  },
  {
    id: "image", label: "Image", bg: BgDeepField, duration: 90,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 22, alignItems: "flex-start", padding: "0 24px" }}>
        <ImageReveal frame={f} startFrame={0} width={188} height={140} caption="Dealey Plaza, Dallas TX" />
        <div style={{ flex: 1, paddingTop: 6 }}>
          <KineticTitle text="Three bullets. One question." frame={f} startFrame={10}
            fontSize={30} accentWords={["Three", "One"]} align="left" wordStagger={6} />
          <div style={{ marginTop: 18 }}>
            <SubtitleReveal frame={f} startFrame={44} fontSize={14} stagger={14} accentLine={1}
              lines={["The Warren Commission concluded", "Oswald acted alone.", "Not everyone agreed."]} />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "barchart", label: "Bar Chart", bg: BgDeepField, duration: 100,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "0 22px" }}>
        <ClassifiedBadge text="Warren Commission witnesses" frame={f} startFrame={0} style="stamp" />
        <BarChart frame={f} startFrame={14} width={256} height={160}
          items={[{ label: "1964", value: 552 }, { label: "1966", value: 214 }, { label: "1979", value: 336 }, { label: "1991", value: 88 }, { label: "2017", value: 441 }]}
          unit="documents released" stagger={12} barDuration={26} />
        <SubtitleReveal frame={f} startFrame={82} fontSize={13} stagger={0}
          lines={["5 separate release tranches over 53 years"]} />
      </div>
    ),
  },
  {
    id: "linechart", label: "Line Chart", bg: BgSignal, duration: 130,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "0 22px" }}>
        <ClassifiedBadge text="Public belief — lone gunman" frame={f} startFrame={0} style="line" />
        <LineChart frame={f} startFrame={14} width={256} height={160} stagger={14}
          points={[76, 55, 52, 44, 36, 32, 38, 42]}
          labels={["'64","'66","'68","'74","'79","'92","'01","'13"]}
          yLabel="% who believed Warren Commission" />
        <SubtitleReveal frame={f} startFrame={120} fontSize={13} stagger={0}
          lines={["Doubt peaked in 1992 — 68% suspected conspiracy"]} color={TOKEN.dim} />
      </div>
    ),
  },
  {
    id: "compare", label: "Compare", bg: BgFlare, duration: 90,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "0 22px" }}>
        <ClassifiedBadge text="Investigation scope" frame={f} startFrame={0} style="stamp" />
        <ComparisonBars frame={f} startFrame={14} width={256} stagger={24}
          unit="witnesses interviewed"
          items={[
            { label: "Warren\n1964", value: 552, color: TOKEN.gold },
            { label: "HSCA\n1979",   value: 335, color: "#4fc3f7" },
            { label: "ARRB\n1994",   value: 78,  color: "#66bb6a" },
          ]} />
        <SubtitleReveal frame={f} startFrame={80} fontSize={13} stagger={0}
          lines={["Three separate investigations, three different conclusions"]} />
      </div>
    ),
  },
  {
    id: "percent", label: "Percent", bg: BgDeepField, duration: 110,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, padding: "0 32px" }}>
        <ClassifiedBadge text="Gallup Poll — 2023" frame={f} startFrame={0} style="line" />
        <PercentageFill frame={f} startFrame={14} value={65} size={148}
          label="of Americans still believe others were involved" accentColor={TOKEN.gold} />
        <GoldDivider frame={f} startFrame={88} width={200} />
        <SubtitleReveal frame={f} startFrame={94} fontSize={14} stagger={0}
          lines={["60 years later, the question remains open"]} />
      </div>
    ),
  },
  {
    id: "icons", label: "Icons", bg: BgSignal, duration: 110,
    render: f => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "0 24px" }}>
        <ClassifiedBadge text="Oswald network — alleged" frame={f} startFrame={0} style="stamp" />
        <IconArrangement frame={f} startFrame={14} layout="grid" stagger={6}
          icons={["person","building","globe","lock","warning","sword","shield","person"]}
          labels={["Oswald","CIA","USSR","KGB","Mafia","Motive","Cover","Ruby"]} />
        <SubtitleReveal frame={f} startFrame={90} fontSize={13} stagger={0}
          lines={["8 major conspiracy theories — none proven conclusive"]} />
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCENE MANIFEST — component breakdown shown in right panel
// ─────────────────────────────────────────────────────────────────────────────
const SCENE_CAT = {
  title:     { tag: "COMP",  color: TOKEN.gold   },
  timeline:  { tag: "SEQ",   color: "#4fc3f7"    },
  flow:      { tag: "SEQ",   color: "#4fc3f7"    },
  stat:      { tag: "DATA",  color: "#66bb6a"    },
  image:     { tag: "COMP",  color: TOKEN.gold   },
  barchart:  { tag: "DATA",  color: "#66bb6a"    },
  linechart: { tag: "DATA",  color: "#66bb6a"    },
  compare:   { tag: "DATA",  color: "#66bb6a"    },
  percent:   { tag: "DATA",  color: "#66bb6a"    },
  icons:     { tag: "ICON",  color: "#ce93d8"    },
};

const MANIFEST = {
  title:     [
    { name: "ClassifiedBadge", f: "0",  props: [{k:"style",v:"stamp"},{k:"text",v:"Nov 22, 1963"}] },
    { name: "KineticTitle",    f: "8",  props: [{k:"fontSize",v:"44px"},{k:"accentWords",v:"2"},{k:"wordStagger",v:"5f"}] },
    { name: "GoldDivider",     f: "52", props: [{k:"width",v:"200px"}] },
    { name: "SubtitleReveal",  f: "58", props: [{k:"lines",v:"3"},{k:"stagger",v:"12f"}] },
  ],
  timeline:  [
    { name: "ClassifiedBadge",   f: "0",  props: [{k:"style",v:"line"}] },
    { name: "CinematicTimeline", f: "10", props: [{k:"items",v:"4"},{k:"stagger",v:"24f"},{k:"lineDur",v:"12f"}] },
  ],
  flow:      [
    { name: "ClassifiedBadge", f: "0",  props: [{k:"style",v:"stamp"}] },
    { name: "CinematicFlow",   f: "14", props: [{k:"nodes",v:"5"},{k:"stagger",v:"14f"}] },
  ],
  stat:      [
    { name: "ClassifiedBadge", f: "0",  props: [{k:"style",v:"line"}] },
    { name: "StatCallout ×3",  f: "14", props: [{k:"values",v:"3 / 22 / 1963"},{k:"countDur",v:"30–52f"}] },
    { name: "GoldDivider",     f: "72", props: [{k:"label",v:"Warren 1964"}] },
  ],
  image:     [
    { name: "ImageReveal",    f: "0",  props: [{k:"size",v:"188×140px"},{k:"sweep",v:"f.20"}] },
    { name: "KineticTitle",   f: "10", props: [{k:"fontSize",v:"30px"},{k:"accentWords",v:"2"}] },
    { name: "SubtitleReveal", f: "44", props: [{k:"lines",v:"3"},{k:"accentLine",v:"1"}] },
  ],
  barchart:  [
    { name: "ClassifiedBadge", f: "0",  props: [{k:"style",v:"stamp"}] },
    { name: "BarChart",        f: "14", props: [{k:"items",v:"5"},{k:"height",v:"160px"},{k:"stagger",v:"12f"}] },
    { name: "SubtitleReveal",  f: "82", props: [{k:"lines",v:"1"}] },
  ],
  linechart: [
    { name: "ClassifiedBadge", f: "0",  props: [{k:"style",v:"line"}] },
    { name: "LineChart",       f: "14", props: [{k:"points",v:"8"},{k:"stagger",v:"14f"},{k:"drawMode",v:"sequential"}] },
    { name: "SubtitleReveal",  f: "120",props: [{k:"lines",v:"1"}] },
  ],
  compare:   [
    { name: "ClassifiedBadge",  f: "0",  props: [{k:"style",v:"stamp"}] },
    { name: "ComparisonBars",   f: "14", props: [{k:"items",v:"3"},{k:"stagger",v:"24f"},{k:"unit",v:"witnesses"}] },
    { name: "SubtitleReveal",   f: "80", props: [{k:"lines",v:"1"}] },
  ],
  percent:   [
    { name: "ClassifiedBadge",  f: "0",  props: [{k:"style",v:"line"}] },
    { name: "PercentageFill",   f: "14", props: [{k:"value",v:"65%"},{k:"style",v:"circle"},{k:"size",v:"148px"}] },
    { name: "GoldDivider",      f: "88", props: [{k:"width",v:"200px"}] },
    { name: "SubtitleReveal",   f: "94", props: [{k:"lines",v:"1"}] },
  ],
  icons:     [
    { name: "ClassifiedBadge",   f: "0",  props: [{k:"style",v:"stamp"}] },
    { name: "IconArrangement",   f: "14", props: [{k:"icons",v:"8"},{k:"layout",v:"grid"},{k:"stagger",v:"6f"}] },
    { name: "SubtitleReveal",    f: "90", props: [{k:"lines",v:"1"}] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// APP — Broadcast production suite UI
// Full-screen 3-column layout: catalog | monitor | manifest
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive]   = useState("title");
  const [frame,  setFrame]    = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef  = useRef(null);
  const lastRef = useRef(null);
  const fRef    = useRef(0);
  const demo    = DEMOS.find(d => d.id === active) ?? DEMOS[0];
  const cat     = SCENE_CAT[demo.id] ?? { tag: "COMP", color: TOKEN.gold };
  const manifest = MANIFEST[demo.id] ?? [];

  // Prevent body scroll
  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    document.body.style.margin   = "0";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // RAF at 30fps
  useEffect(() => {
    const tick = t => {
      if (lastRef.current === null) lastRef.current = t;
      if (t - lastRef.current >= 1000 / 30) {
        fRef.current = (fRef.current + 1) % demo.duration;
        setFrame(fRef.current);
        lastRef.current = t;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (playing) { lastRef.current = null; rafRef.current = requestAnimationFrame(tick); }
    else cancelAnimationFrame(rafRef.current);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, demo.duration]);

  useEffect(() => { fRef.current = 0; setFrame(0); }, [active]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = e => {
      if (e.code === "Space")      { e.preventDefault(); setPlaying(p => !p); }
      if (e.code === "ArrowLeft")  { setPlaying(false); setFrame(f => { const v = Math.max(0, f-1); fRef.current = v; return v; }); }
      if (e.code === "ArrowRight") { setPlaying(false); setFrame(f => { const v = Math.min(demo.duration-1, f+1); fRef.current = v; return v; }); }
      if (e.code === "KeyR")       { fRef.current = 0; setFrame(0); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demo.duration]);

  const BG = demo.bg;
  // Pulse: driven by frame so it only animates when playing
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.22);
  // SMPTE timecode
  const sec = Math.floor(frame / 30), fr = frame % 30;
  const tc = `00:00:${String(sec).padStart(2,"0")}:${String(fr).padStart(2,"0")}`;
  const pct = (frame / Math.max(1, demo.duration - 1)) * 100;

  // Shared style constants
  const S = {
    bg:      "#060810",
    panel:   "#080b13",
    border:  "rgba(255,255,255,0.06)",
    borderG: "rgba(200,169,110,0.18)",
    btnBase: { background: "none", border: "none", cursor: "pointer", color: TOKEN.dim,
               fontFamily: TOKEN.mono, fontSize: 14, padding: "0 10px", lineHeight: 1,
               display: "flex", alignItems: "center" },
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: S.bg, color: TOKEN.white,
      fontFamily: TOKEN.sans, display: "grid",
      gridTemplateColumns: "190px 1fr 218px",
      gridTemplateRows: "44px 1fr 62px",
      overflow: "hidden" }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{ gridColumn: "1/-1",
        display: "flex", alignItems: "center", gap: 0,
        borderBottom: `1px solid ${S.border}`,
        background: S.panel, padding: "0 0 0 20px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 20,
          borderRight: `1px solid ${S.border}` }}>
          <div style={{ width: 3, height: 18, background: TOKEN.gold, borderRadius: 1 }} />
          <span style={{ fontFamily: TOKEN.mono, fontSize: 11, color: TOKEN.gold, letterSpacing: "0.16em" }}>YT·SHORTS</span>
          <span style={{ fontFamily: TOKEN.sans, fontSize: 11, color: TOKEN.dim, letterSpacing: "0.08em" }}>ANIMATION SYSTEM</span>
        </div>

        {/* Current scene label */}
        <div style={{ padding: "0 20px", display: "flex", alignItems: "center", gap: 10,
          borderRight: `1px solid ${S.border}` }}>
          <div style={{ width: 6, height: 6, borderRadius: 1, background: cat.color }} />
          <span style={{ fontFamily: TOKEN.sans, fontSize: 12, fontWeight: 500, color: TOKEN.white }}>
            {demo.label}
          </span>
          <span style={{ fontFamily: TOKEN.mono, fontSize: 10, color: TOKEN.dim,
            background: S.bg, padding: "2px 7px", borderRadius: 2, letterSpacing: "0.12em" }}>
            {cat.tag}
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Keyboard hints */}
        <div style={{ display: "flex", gap: 16, paddingRight: 20,
          borderRight: `1px solid ${S.border}` }}>
          {[["SPACE","play"],["← →","step"],["R","reset"]].map(([k,v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <kbd style={{ fontFamily: TOKEN.mono, fontSize: 9, color: TOKEN.dim,
                background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`,
                padding: "2px 6px", borderRadius: 2, letterSpacing: "0.08em" }}>{k}</kbd>
              <span style={{ fontSize: 10, color: TOKEN.faint }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Timecode */}
        <div style={{ padding: "0 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%",
            background: playing ? `rgba(74,222,128,${pulse})` : "rgba(245,158,11,0.7)",
            boxShadow: playing ? `0 0 ${6 * pulse}px rgba(74,222,128,0.5)` : "none" }} />
          <span style={{ fontFamily: TOKEN.mono, fontSize: 11,
            color: playing ? "rgba(74,222,128,0.8)" : "rgba(245,158,11,0.7)",
            letterSpacing: "0.08em" }}>
            {playing ? "REC" : "HOLD"}
          </span>
          <span style={{ fontFamily: TOKEN.mono, fontSize: 12, color: TOKEN.white,
            letterSpacing: "0.1em", fontVariantNumeric: "tabular-nums" }}>
            {tc}
          </span>
        </div>
      </div>

      {/* ── LEFT SIDEBAR — Scene catalog ────────────────────────────────── */}
      <div style={{ borderRight: `1px solid ${S.border}`, overflowY: "auto",
        background: S.panel, display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "14px 16px 8px", fontSize: 9, color: TOKEN.gold,
          fontFamily: TOKEN.mono, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Scene Catalog
        </div>

        {DEMOS.map((d, i) => {
          const dc = SCENE_CAT[d.id] ?? { tag: "COMP", color: TOKEN.gold };
          const isActive = active === d.id;
          return (
            <button key={d.id} onClick={() => setActive(d.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 16px", border: "none", cursor: "pointer",
              background: isActive ? TOKEN.goldSurface : "transparent",
              borderLeft: `2px solid ${isActive ? TOKEN.gold : "transparent"}`,
              textAlign: "left", transition: "background 0.12s",
            }}>
              <span style={{ fontFamily: TOKEN.mono, fontSize: 10,
                color: isActive ? TOKEN.gold : TOKEN.faint,
                width: 18, flexShrink: 0, letterSpacing: "0.04em" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400,
                color: isActive ? TOKEN.white : TOKEN.dim, flex: 1, fontFamily: TOKEN.sans }}>
                {d.label}
              </span>
              <span style={{ fontSize: 9, fontFamily: TOKEN.mono, letterSpacing: "0.1em",
                color: dc.color, opacity: isActive ? 1 : 0.5 }}>
                {dc.tag}
              </span>
            </button>
          );
        })}

        {/* Bottom info */}
        <div style={{ marginTop: "auto", padding: "12px 16px",
          borderTop: `1px solid ${S.border}` }}>
          <div style={{ fontSize: 10, color: TOKEN.faint, fontFamily: TOKEN.mono,
            letterSpacing: "0.08em", lineHeight: 1.8 }}>
            13 components<br />
            3 backgrounds<br />
            30 fps · 9:16
          </div>
        </div>
      </div>

      {/* ── CENTER — Monitor ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 18,
        background: `radial-gradient(ellipse 60% 50% at 50% 50%, #090d18, ${S.bg})`,
        position: "relative" }}>

        {/* Monitor chrome */}
        <div style={{ position: "relative" }}>

          {/* Status strip above monitor */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8, padding: "0 2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%",
                background: playing ? `rgba(74,222,128,${pulse})` : "rgba(245,158,11,0.6)" }} />
              <span style={{ fontFamily: TOKEN.mono, fontSize: 9, color: TOKEN.faint, letterSpacing: "0.14em" }}>
                {playing ? "PLAYING" : "PAUSED"} · {demo.duration}F
              </span>
            </div>
            <span style={{ fontFamily: TOKEN.mono, fontSize: 9, color: TOKEN.faint, letterSpacing: "0.1em" }}>
              {(demo.duration / 30).toFixed(1)}s · 1080×1920
            </span>
          </div>

          {/* Outer bezel */}
          <div style={{
            padding: 10,
            background: "linear-gradient(145deg, #0f1219, #080b11)",
            borderRadius: 18,
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.06),
              0 60px 120px rgba(0,0,0,0.9),
              inset 0 1px 0 rgba(255,255,255,0.04)
            `,
          }}>
            {/* Inner monitor surface */}
            <div style={{ width: 290, height: 515,
              borderRadius: 10, overflow: "hidden", position: "relative",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.8)" }}>

              {/* Animation canvas */}
              <BG frame={frame} />
              {demo.render(frame)}

              {/* Scan-line overlay — CRT texture */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.028) 3px, rgba(0,0,0,0.028) 4px)",
              }} />

              {/* Vignette */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
              }} />
            </div>
          </div>

          {/* Timecode below */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 16 }}>
            <span style={{ fontFamily: TOKEN.mono, fontSize: 10, color: TOKEN.faint,
              letterSpacing: "0.12em", fontVariantNumeric: "tabular-nums" }}>
              {tc}
            </span>
            <div style={{ width: 1, height: 10, background: S.border }} />
            <span style={{ fontFamily: TOKEN.mono, fontSize: 10,
              color: playing ? "rgba(74,222,128,0.5)" : TOKEN.faint, letterSpacing: "0.1em" }}>
              f.{String(frame).padStart(3, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Component manifest ─────────────────────────────── */}
      <div style={{ borderLeft: `1px solid ${S.border}`, overflowY: "auto",
        background: S.panel, display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "14px 16px 10px",
          borderBottom: `1px solid ${S.border}` }}>
          <div style={{ fontSize: 9, color: TOKEN.gold, fontFamily: TOKEN.mono,
            letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
            Component Manifest
          </div>
          <div style={{ fontSize: 11, color: TOKEN.dim, fontFamily: TOKEN.sans }}>
            {demo.label} · {manifest.length} component{manifest.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div style={{ padding: "10px 0", flex: 1 }}>
          {manifest.map((item, i) => (
            <div key={i} style={{ padding: "10px 16px",
              borderBottom: `1px solid ${S.border}`,
              background: frame >= Number(item.f) ? "rgba(200,169,110,0.03)" : "transparent",
              transition: "background 0.2s" }}>

              {/* Component name + start frame */}
              <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, fontFamily: TOKEN.sans, fontWeight: 500,
                  color: frame >= Number(item.f) ? TOKEN.white : TOKEN.dim }}>
                  {item.name}
                </span>
                <span style={{ fontSize: 9, fontFamily: TOKEN.mono,
                  color: frame >= Number(item.f) ? TOKEN.gold : TOKEN.faint,
                  letterSpacing: "0.1em" }}>
                  f.{item.f}
                </span>
              </div>

              {/* Props */}
              {item.props.map(p => (
                <div key={p.k} style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontFamily: TOKEN.mono, color: TOKEN.faint,
                    letterSpacing: "0.06em" }}>{p.k}</span>
                  <span style={{ fontSize: 10, fontFamily: TOKEN.mono,
                    color: TOKEN.goldDim, letterSpacing: "0.04em" }}>{p.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Font info footer */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${S.border}` }}>
          <div style={{ fontSize: 9, color: TOKEN.faint, fontFamily: TOKEN.mono,
            letterSpacing: "0.08em", lineHeight: 2 }}>
            DISPLAY · Georgia 700<br />
            BODY · Helvetica Neue 400<br />
            ACCENT · #c8a96e
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR — Transport ────────────────────────────────────────── */}
      <div style={{ gridColumn: "1/-1",
        display: "flex", alignItems: "center", gap: 0,
        borderTop: `1px solid ${S.border}`,
        background: S.panel, padding: "0 16px" }}>

        {/* Transport buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 2,
          paddingRight: 16, borderRight: `1px solid ${S.border}` }}>
          <button onClick={() => { fRef.current = 0; setFrame(0); }} style={S.btnBase}
            title="Reset (R)">⟨⟨</button>
          <button onClick={() => { setPlaying(false); setFrame(f => { const v = Math.max(0,f-1); fRef.current=v; return v; }); }}
            style={S.btnBase} title="Step back (←)">⟨</button>
          <button onClick={() => setPlaying(p => !p)}
            style={{ ...S.btnBase, color: playing ? TOKEN.gold : TOKEN.white,
              fontSize: 15, padding: "0 14px" }}
            title="Play/Pause (Space)">
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={() => { setPlaying(false); setFrame(f => { const v = Math.min(demo.duration-1,f+1); fRef.current=v; return v; }); }}
            style={S.btnBase} title="Step forward (→)">⟩</button>
        </div>

        {/* Timeline with ticks */}
        <div style={{ flex: 1, position: "relative", height: 62, margin: "0 16px",
          display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* Tick marks */}
          <svg width="100%" height="28" style={{ display: "block", overflow: "visible" }}>
            {Array.from({ length: demo.duration + 1 }, (_, i) => {
              const x = `${(i / demo.duration) * 100}%`;
              const isSec    = i % 30 === 0;
              const isMajor  = i % 10 === 0;
              const h = isSec ? 12 : isMajor ? 7 : 3;
              const col = isSec ? "rgba(200,169,110,0.35)" : isMajor ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)";
              return <line key={i} x1={x} y1={0} x2={x} y2={h} stroke={col} strokeWidth={isSec ? 1 : 0.75} />;
            })}
            {Array.from({ length: Math.floor(demo.duration / 30) + 1 }, (_, i) => (
              <text key={i} x={`${(i * 30 / demo.duration) * 100}%`} y={22}
                fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="monospace"
                textAnchor="middle">
                {i}s
              </text>
            ))}
          </svg>

          {/* Progress track */}
          <div style={{ position: "relative", height: 3, background: S.border, borderRadius: 2 }}>
            {/* Filled portion */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${pct}%`, borderRadius: 2,
              background: `linear-gradient(to right, ${TOKEN.goldDim}, ${TOKEN.gold})` }} />
            {/* Playhead glow */}
            <div style={{ position: "absolute", top: "50%", left: `${pct}%`,
              transform: "translate(-50%, -50%)",
              width: 2, height: 10, background: TOKEN.gold, borderRadius: 1,
              boxShadow: `0 0 6px ${TOKEN.gold}` }} />
          </div>

          {/* Invisible range input for drag */}
          <input type="range" min={0} max={demo.duration - 1} value={frame}
            onChange={e => { setPlaying(false); const v = Number(e.target.value); fRef.current = v; setFrame(v); }}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%",
              margin: 0, padding: 0 }} />
        </div>

        {/* Duration + FPS readout */}
        <div style={{ paddingLeft: 16, borderLeft: `1px solid ${S.border}`,
          display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
          <div style={{ fontFamily: TOKEN.mono, fontSize: 10, color: TOKEN.white,
            letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}>
            {String(frame).padStart(3,"0")} / {demo.duration}f
          </div>
          <div style={{ fontFamily: TOKEN.mono, fontSize: 9, color: TOKEN.dim, letterSpacing: "0.08em" }}>
            30 fps · {(demo.duration/30).toFixed(1)}s
          </div>
        </div>
      </div>

    </div>
  );
}
