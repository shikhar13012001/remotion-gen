import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// EASING LIBRARY — cinematic quality curves
// ─────────────────────────────────────────────────────────────────────────────
const E = {
  // Smooth deceleration — for text reveals
  out3:    (t) => 1 - Math.pow(1 - t, 3),
  out4:    (t) => 1 - Math.pow(1 - t, 4),
  out5:    (t) => 1 - Math.pow(1 - t, 5),
  // Acceleration then deceleration — for moving elements
  inOut3:  (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  inOut4:  (t) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2,4)/2,
  // Exponential — snappy, editorial feel
  outExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo:  (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  // Spring — organic, not mechanical
  spring:  (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -9*t) * Math.sin((t*10 - 0.75) * (2*Math.PI/3)) + 1;
  },
  // Cinematic ease — slow start, fast middle, graceful stop
  cinema:  (t) => t < 0.1 ? 5*t*t : t < 0.9 ? (0.05 + 0.9*(t-0.1)/0.8) : 0.95 + 5*Math.pow(t-0.9,2),
  linear:  (t) => t,
};

function lerp(t, a, b, ease = E.out3) {
  const et = Math.max(0, Math.min(1, t));
  return a + ease(et) * (b - a);
}

function progress(frame, start, dur) {
  return Math.max(0, Math.min(1, (frame - start) / dur));
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND TOKENS — matches background system
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN = {
  gold:        "#c8a96e",
  goldDim:     "rgba(200,169,110,0.35)",
  goldGlow:    "rgba(200,169,110,0.15)",
  white:       "#ffffff",
  whiteDim:    "rgba(255,255,255,0.55)",
  whiteFaint:  "rgba(255,255,255,0.18)",
  border:      "rgba(255,255,255,0.08)",
  borderGold:  "rgba(200,169,110,0.25)",
  surface:     "rgba(255,255,255,0.04)",
  surfaceGold: "rgba(200,169,110,0.07)",
  fontSerif:   "Georgia, 'Times New Roman', serif",
  fontSans:    "'Helvetica Neue', Arial, sans-serif",
  fontMono:    "'Courier New', monospace",
};

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 1: KINETIC TITLE ───────────────────────────────────────────────
// Word-by-word reveal with gold accent word support
// Each word slides up from a clip mask — not just opacity
// ─────────────────────────────────────────────────────────────────────────────
export function KineticTitle({
  text = "The shots that changed a nation",
  frame = 0,
  startFrame = 0,
  fontSize = 56,
  color = TOKEN.white,
  accentColor = TOKEN.gold,
  accentWords = [],          // words to render in gold
  wordStagger = 4,           // frames between each word
  wordDuration = 18,
  align = "left",
  lineHeight = 1.2,
  maxWidth = "100%",
}) {
  const words = text.split(" ");

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: `${fontSize * 0.28}px ${fontSize * 0.22}px`,
      maxWidth,
      justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      lineHeight,
    }}>
      {words.map((word, i) => {
        const t = progress(frame, startFrame + i * wordStagger, wordDuration);
        const isAccent = accentWords.some(w => w.toLowerCase() === word.toLowerCase().replace(/[^a-z]/g, ""));

        return (
          <div key={i} style={{ overflow: "hidden", display: "inline-block" }}>
            <span style={{
              display: "inline-block",
              fontSize,
              fontFamily: TOKEN.fontSerif,
              fontWeight: 700,
              color: isAccent ? accentColor : color,
              letterSpacing: "-0.02em",
              transform: `translateY(${lerp(t, 100, 0, E.out4)}%)`,
              opacity: lerp(t, 0, 1, E.out3),
              // Gold words get a subtle glow
              textShadow: isAccent
                ? `0 0 40px rgba(200,169,110,0.4), 0 2px 20px rgba(200,169,110,0.2)`
                : `0 2px 40px rgba(0,0,0,0.5)`,
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
// Stamp-style label — scales in with a brief overshoot
// ─────────────────────────────────────────────────────────────────────────────
export function ClassifiedBadge({
  text = "Classified",
  frame = 0,
  startFrame = 0,
  color = TOKEN.gold,
  style = "stamp",   // "stamp" | "pill" | "line"
}) {
  const t = progress(frame, startFrame, 14);
  const scale = lerp(t, 0.7, 1, E.spring);
  const opacity = lerp(t, 0, 1, E.out3);
  // Stamp rotation settles to 0 from slight angle
  const rotate = lerp(t, -3, 0, E.out4);

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    opacity,
    transform: `scale(${scale}) rotate(${rotate}deg)`,
    transformOrigin: "center",
    fontFamily: TOKEN.fontMono,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 700,
  };

  if (style === "stamp") return (
    <div style={{
      ...base,
      color,
      border: `1.5px solid ${color}`,
      padding: "5px 14px",
      borderRadius: 2,
      background: `rgba(200,169,110,0.06)`,
      boxShadow: `inset 0 0 20px rgba(200,169,110,0.05), 0 0 20px rgba(200,169,110,0.08)`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
      {text}
    </div>
  );

  if (style === "pill") return (
    <div style={{
      ...base,
      color: "#000",
      background: color,
      padding: "5px 16px",
      borderRadius: 999,
      boxShadow: `0 4px 24px rgba(200,169,110,0.3)`,
    }}>
      {text}
    </div>
  );

  return (
    <div style={{ ...base, color, gap: 8 }}>
      <div style={{ width: 20, height: 1, background: color }} />
      {text}
      <div style={{ width: 20, height: 1, background: color }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 3: TIMELINE ────────────────────────────────────────────────────
// Each item draws in sequentially — line extends, then content fades
// The connecting line between dots animates like a wire being laid
// ─────────────────────────────────────────────────────────────────────────────
export function CinematicTimeline({
  items = [
    { time: "12:30 PM", event: "Shots fired",              location: "Dealey Plaza, Dallas" },
    { time: "1:00 PM",  event: "Kennedy pronounced dead",  location: "Parkland Hospital" },
    { time: "2:38 PM",  event: "LBJ sworn in",             location: "Air Force One" },
    { time: "6:00 PM",  event: "Body flown to Washington", location: "Andrews AFB" },
  ],
  frame = 0,
  startFrame = 0,
  itemStagger = 20,        // frames between each item appearing
  itemDuration = 18,
  lineDuration = 12,
  accentColor = TOKEN.gold,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
      {items.map((item, i) => {
        const itemStart = startFrame + i * itemStagger;
        const t = progress(frame, itemStart, itemDuration);
        const lineT = progress(frame, itemStart - lineDuration, lineDuration);

        const visible = t > 0;
        if (!visible && i > 0) return null;

        return (
          <div key={i} style={{ display: "flex", gap: 0, position: "relative" }}>

            {/* Left column — dot + vertical line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>

              {/* Vertical connector line from previous item */}
              {i > 0 && (
                <div style={{
                  width: 1,
                  height: 28,
                  background: `linear-gradient(to bottom, ${accentColor}60, ${accentColor}20)`,
                  transformOrigin: "top",
                  transform: `scaleY(${lerp(lineT, 0, 1, E.outExpo)})`,
                  marginBottom: 2,
                }} />
              )}

              {/* Dot */}
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: accentColor,
                flexShrink: 0,
                opacity: lerp(t, 0, 1, E.out3),
                transform: `scale(${lerp(t, 0.3, 1, E.spring)})`,
                boxShadow: `0 0 0 ${lerp(t, 0, 6, E.out4)}px rgba(200,169,110,0.15), 0 0 ${lerp(t, 0, 16, E.out4)}px rgba(200,169,110,0.25)`,
                marginTop: i === 0 ? 0 : 2,
              }} />
            </div>

            {/* Content */}
            <div style={{
              paddingLeft: 16,
              paddingBottom: i < items.length - 1 ? 28 : 0,
              opacity: lerp(t, 0, 1, E.out3),
              transform: `translateX(${lerp(t, 16, 0, E.out4)}px)`,
            }}>
              <div style={{
                fontSize: 10,
                color: accentColor,
                fontFamily: TOKEN.fontMono,
                letterSpacing: "0.12em",
                marginBottom: 5,
                textTransform: "uppercase",
              }}>
                {item.time}
              </div>
              <div style={{
                fontSize: 17,
                color: TOKEN.white,
                fontFamily: TOKEN.fontSerif,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                marginBottom: 4,
              }}>
                {item.event}
              </div>
              {item.location && (
                <div style={{
                  fontSize: 11,
                  color: TOKEN.whiteDim,
                  fontFamily: TOKEN.fontSans,
                  fontWeight: 300,
                  letterSpacing: "0.02em",
                }}>
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
// ── ANIMATION 4: FLOW DIAGRAM ────────────────────────────────────────────────
// Boxes draw in sequentially, arrows animate between them
// ─────────────────────────────────────────────────────────────────────────────
export function CinematicFlow({
  nodes = [
    "Washington D.C.",
    "San Antonio TX",
    "Houston TX",
    "Love Field Dallas",
    "Dealey Plaza",
  ],
  frame = 0,
  startFrame = 0,
  nodeDuration = 16,
  nodeStagger = 14,
  accentColor = TOKEN.gold,
  width = 280,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, width }}>
      {nodes.map((node, i) => {
        const nodeStart = startFrame + i * nodeStagger;
        const t = progress(frame, nodeStart, nodeDuration);
        const arrowT = progress(frame, nodeStart - 8, 10);

        return (
          <div key={i} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Arrow between nodes */}
            {i > 0 && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: 24,
                justifyContent: "center",
                gap: 0,
              }}>
                <div style={{
                  width: 1,
                  height: `${lerp(arrowT, 0, 14, E.outExpo)}px`,
                  background: `linear-gradient(to bottom, ${accentColor}80, ${accentColor})`,
                }} />
                {arrowT > 0.7 && (
                  <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderTop: `5px solid ${accentColor}`,
                    opacity: lerp(progress(frame, nodeStart - 2, 6), 0, 1, E.out3),
                  }} />
                )}
              </div>
            )}

            {/* Node box */}
            <div style={{
              width: "100%",
              padding: "11px 20px",
              background: lerp(t, 0, 1, E.out3) > 0.5
                ? `linear-gradient(135deg, rgba(200,169,110,0.07), rgba(255,255,255,0.03))`
                : "transparent",
              border: `1px solid rgba(200,169,110,${lerp(t, 0, 0.3, E.out3)})`,
              borderRadius: 4,
              opacity: lerp(t, 0, 1, E.out3),
              transform: `translateY(${lerp(t, 8, 0, E.out4)}px)`,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Left accent bar */}
              <div style={{
                position: "absolute",
                left: 0, top: 0, bottom: 0,
                width: `${lerp(t, 0, 3, E.outExpo)}px`,
                background: accentColor,
                opacity: 0.7,
              }} />
              <div style={{
                fontSize: 13,
                color: TOKEN.white,
                fontFamily: TOKEN.fontSans,
                fontWeight: 500,
                letterSpacing: "0.02em",
                textAlign: "center",
              }}>
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
// ── ANIMATION 5: STAT CALLOUT ────────────────────────────────────────────────
// Number counts up with a gold glow that intensifies at peak
// ─────────────────────────────────────────────────────────────────────────────
export function StatCallout({
  value = 22,
  label = "years of investigation",
  prefix = "",
  suffix = "",
  frame = 0,
  startFrame = 0,
  fontSize = 96,
  countDuration = 50,
  accentColor = TOKEN.gold,
}) {
  const entranceT = progress(frame, startFrame, 20);
  const countT = progress(frame, startFrame + 10, countDuration);
  const current = Math.floor(value * E.out3(countT));
  // Glow peaks as counter reaches final value
  const glowIntensity = countT > 0.9 ? lerp(progress(frame, startFrame + 10 + countDuration * 0.9, countDuration * 0.1), 0, 1, E.outExpo) : 0;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      opacity: lerp(entranceT, 0, 1, E.out3),
      transform: `translateY(${lerp(entranceT, 24, 0, E.out4)}px)`,
    }}>
      {/* Number */}
      <div style={{
        fontFamily: TOKEN.fontSerif,
        fontWeight: 700,
        fontSize,
        color: TOKEN.white,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        textShadow: glowIntensity > 0
          ? `0 0 ${60 * glowIntensity}px rgba(200,169,110,${0.5 * glowIntensity}), 0 0 ${120 * glowIntensity}px rgba(200,169,110,${0.2 * glowIntensity})`
          : "none",
        display: "flex",
        alignItems: "baseline",
        gap: 4,
      }}>
        {prefix && <span style={{ fontSize: fontSize * 0.4, color: accentColor }}>{prefix}</span>}
        {current}
        {suffix && <span style={{ fontSize: fontSize * 0.4, color: accentColor }}>{suffix}</span>}
      </div>

      {/* Underline that draws in when count completes */}
      <div style={{
        height: 1,
        width: `${lerp(progress(frame, startFrame + 10 + countDuration * 0.8, 20), 0, 100, E.outExpo)}%`,
        background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
        marginTop: 12,
        marginBottom: 12,
      }} />

      {/* Label */}
      <div style={{
        fontSize: 12,
        color: TOKEN.whiteDim,
        fontFamily: TOKEN.fontMono,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        opacity: lerp(progress(frame, startFrame + 14, 18), 0, 1, E.out3),
      }}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 6: SUBTITLE REVEAL ─────────────────────────────────────────────
// Line-masked reveal — text slides up from beneath a clip
// Feels like text being uncovered, not faded in
// ─────────────────────────────────────────────────────────────────────────────
export function SubtitleReveal({
  lines = ["Twelve seconds.", "Four shots.", "One motorcade."],
  frame = 0,
  startFrame = 0,
  fontSize = 18,
  stagger = 18,
  duration = 20,
  color = TOKEN.whiteDim,
  accentLine = -1,   // index to highlight in gold
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: fontSize * 0.6 }}>
      {lines.map((line, i) => {
        const t = progress(frame, startFrame + i * stagger, duration);
        const isAccent = i === accentLine;
        return (
          <div key={i} style={{ overflow: "hidden" }}>
            <div style={{
              fontSize,
              fontFamily: TOKEN.fontSans,
              fontWeight: isAccent ? 600 : 300,
              color: isAccent ? TOKEN.gold : color,
              letterSpacing: isAccent ? "0.04em" : "0.02em",
              lineHeight: 1.4,
              transform: `translateY(${lerp(t, 100, 0, E.out4)}%)`,
              opacity: lerp(t, 0.3, 1, E.out3),
            }}>
              {line}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 7: SECTION DIVIDER ─────────────────────────────────────────────
// Gold line extends from center outward with a glow
// ─────────────────────────────────────────────────────────────────────────────
export function GoldDivider({
  frame = 0,
  startFrame = 0,
  width = 400,
  label,                  // optional centered text label
  accentColor = TOKEN.gold,
}) {
  const t = progress(frame, startFrame, 24);
  const labelT = progress(frame, startFrame + 18, 16);
  const lineW = lerp(t, 0, width / 2, E.outExpo);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {label && (
        <div style={{
          fontSize: 9,
          fontFamily: TOKEN.fontMono,
          color: accentColor,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: lerp(labelT, 0, 1, E.out3),
        }}>
          {label}
        </div>
      )}
      <div style={{ position: "relative", width, height: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Left arm */}
        <div style={{
          position: "absolute",
          right: "50%",
          top: 0,
          width: lineW,
          height: 1,
          background: `linear-gradient(to left, ${accentColor}, transparent)`,
          boxShadow: t > 0.5 ? `0 0 8px rgba(200,169,110,0.4)` : "none",
        }} />
        {/* Right arm */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: lineW,
          height: 1,
          background: `linear-gradient(to right, ${accentColor}, transparent)`,
          boxShadow: t > 0.5 ? `0 0 8px rgba(200,169,110,0.4)` : "none",
        }} />
        {/* Center diamond */}
        {t > 0.6 && (
          <div style={{
            width: 5, height: 5,
            background: accentColor,
            transform: `rotate(45deg) scale(${lerp(progress(frame, startFrame + 14, 10), 0, 1, E.spring)})`,
            boxShadow: `0 0 10px ${accentColor}`,
            position: "relative", zIndex: 1,
            flexShrink: 0,
          }} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ANIMATION 8: IMAGE REVEAL ────────────────────────────────────────────────
// Photo reveals from left with a gold light sweep across
// ─────────────────────────────────────────────────────────────────────────────
export function ImageReveal({
  src,
  frame = 0,
  startFrame = 0,
  width = 320,
  height = 200,
  caption,
  accentColor = TOKEN.gold,
}) {
  const revealT = progress(frame, startFrame, 28);
  const sweepT  = progress(frame, startFrame + 20, 20);
  const captionT = progress(frame, startFrame + 32, 16);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{
        width, height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        border: `1px solid rgba(200,169,110,${lerp(revealT, 0, 0.2, E.out3)})`,
      }}>
        {/* Reveal mask — wipes from left */}
        <div style={{
          position: "absolute", inset: 0,
          background: src ? "none" : "linear-gradient(135deg, #0a1628, #060e1a)",
          clipPath: `inset(0 ${lerp(revealT, 100, 0, E.outExpo)}% 0 0)`,
        }}>
          {src ? (
            <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7) contrast(1.1)" }} />
          ) : (
            // Placeholder — dark textured rect
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0d1f38 0%, #060e1a 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(200,169,110,0.4)", fontFamily: TOKEN.fontMono, letterSpacing: "0.1em" }}>IMAGE</div>
            </div>
          )}
        </div>

        {/* Gold light sweep */}
        {sweepT > 0 && sweepT < 1 && (
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to right, transparent ${lerp(sweepT, -20, 80, E.inOut3)}%, rgba(200,169,110,0.12) ${lerp(sweepT, -10, 90, E.inOut3)}%, transparent ${lerp(sweepT, 0, 100, E.inOut3)}%)`,
            pointerEvents: "none",
          }} />
        )}

        {/* Bottom gradient */}
        {src && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          }} />
        )}
      </div>

      {caption && (
        <div style={{
          fontSize: 10,
          color: TOKEN.whiteDim,
          fontFamily: TOKEN.fontMono,
          letterSpacing: "0.1em",
          opacity: lerp(captionT, 0, 1, E.out3),
          paddingLeft: 2,
        }}>
          {caption}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW SANDBOX
// ─────────────────────────────────────────────────────────────────────────────

// Inline backgrounds (simplified from background file)
function BgDeepField({ frame }) {
  const d = Math.sin(frame * 0.004) * 6;
  const d2 = Math.cos(frame * 0.003) * 8;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "#03070F" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 55% at ${28+d}% ${22+d2}%, #0D2B5E, transparent 70%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at ${72-d}% ${78-d2}%, #071830, transparent 65%)` }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.75" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)" }} />
    </div>
  );
}

function BgSignal({ frame }) {
  const scanY = (frame * 0.3) % 100;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #06111F, #010508 55%, #000203)" }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><pattern id="gs" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.75" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#gs)" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 120, background: "linear-gradient(to bottom, transparent, rgba(30,80,180,0.06), transparent)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.4) 100%)" }} />
    </div>
  );
}

function BgFlare({ frame }) {
  const b = Math.sin(frame * 0.025) * 0.03;
  const d = Math.sin(frame * 0.006) * 5;
  const r1 = 70 + b * 100;
  const r2 = 42 + b * 60;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "#020810" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 65% 60% at ${20+d}% ${25}%, #0F3070, transparent 65%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 40% 30% at 5% 95%, #1040A0, transparent 55%)", opacity: 0.5 }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><pattern id="gf" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.75" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#gf)" />
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "38%", width: `${r1}%`, paddingTop: `${r1}%`, transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)" }} />
      <div style={{ position: "absolute", left: "50%", top: "55%", width: `${r2}%`, paddingTop: `${r2}%`, transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.055)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 30%, rgba(0,0,0,0.82) 100%)" }} />
    </div>
  );
}

const DEMOS = [
  {
    id: "title-scene",
    label: "Title Scene",
    bg: BgFlare,
    duration: 80,
    render: (f) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "0 40px", position: "relative", zIndex: 2 }}>
        <ClassifiedBadge text="November 22, 1963" frame={f} startFrame={0} style="stamp" />
        <KineticTitle
          text="The shots that changed a nation"
          frame={f}
          startFrame={8}
          fontSize={38}
          accentWords={["shots", "nation"]}
          align="center"
          wordStagger={5}
        />
        <GoldDivider frame={f} startFrame={45} width={200} />
        <SubtitleReveal
          lines={["Twelve seconds.", "Four shots.", "One motorcade."]}
          frame={f}
          startFrame={50}
          fontSize={14}
          stagger={12}
        />
      </div>
    ),
  },
  {
    id: "timeline-scene",
    label: "Timeline Scene",
    bg: BgSignal,
    duration: 120,
    render: (f) => (
      <div style={{ position: "relative", zIndex: 2, padding: "0 32px" }}>
        <ClassifiedBadge text="Timeline of Events" frame={f} startFrame={0} style="line" />
        <div style={{ marginTop: 20 }}>
          <CinematicTimeline
            frame={f}
            startFrame={10}
            itemStagger={22}
            items={[
              { time: "12:30 PM", event: "Shots fired",              location: "Dealey Plaza, Dallas" },
              { time: "1:00 PM",  event: "Kennedy pronounced dead",  location: "Parkland Hospital" },
              { time: "2:38 PM",  event: "LBJ sworn in",             location: "Air Force One" },
              { time: "6:00 PM",  event: "Body flown to Washington", location: "Andrews AFB" },
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    id: "flow-scene",
    label: "Flow Scene",
    bg: BgSignal,
    duration: 110,
    render: (f) => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <ClassifiedBadge text="Kennedy's Texas Trip" frame={f} startFrame={0} style="stamp" />
        <CinematicFlow
          frame={f}
          startFrame={14}
          nodes={["Washington D.C.", "San Antonio TX", "Houston TX", "Love Field Dallas", "Dealey Plaza"]}
          width={260}
        />
      </div>
    ),
  },
  {
    id: "stat-scene",
    label: "Stat Scene",
    bg: BgDeepField,
    duration: 90,
    render: (f) => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <ClassifiedBadge text="By the numbers" frame={f} startFrame={0} style="line" />
        <div style={{ display: "flex", gap: 48 }}>
          <StatCallout value={3} label="shots fired" frame={f} startFrame={14} fontSize={80} countDuration={30} />
          <StatCallout value={22} label="November" frame={f} startFrame={28} fontSize={80} countDuration={40} />
          <StatCallout value={1963} label="year" frame={f} startFrame={42} fontSize={56} countDuration={50} />
        </div>
        <GoldDivider frame={f} startFrame={65} width={300} label="Warren Commission, 1964" />
      </div>
    ),
  },
  {
    id: "image-scene",
    label: "Image Scene",
    bg: BgDeepField,
    duration: 80,
    render: (f) => (
      <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 24, alignItems: "flex-start", padding: "0 28px" }}>
        <ImageReveal
          frame={f}
          startFrame={0}
          width={200}
          height={140}
          caption="Dealey Plaza, Dallas TX"
        />
        <div style={{ flex: 1, paddingTop: 8 }}>
          <KineticTitle
            text="Three bullets. One question."
            frame={f}
            startFrame={10}
            fontSize={26}
            accentWords={["Three", "One"]}
            align="left"
            wordStagger={6}
          />
          <div style={{ marginTop: 16 }}>
            <SubtitleReveal
              lines={["The Warren Commission concluded", "Oswald acted alone.", "Not everyone agreed."]}
              frame={f}
              startFrame={42}
              fontSize={12}
              stagger={14}
              accentLine={1}
            />
          </div>
        </div>
      </div>
    ),
  },
];

export default function App() {
  const [active, setActive] = useState("title-scene");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const fRef = useRef(0);
  const demo = DEMOS.find(d => d.id === active);

  useEffect(() => {
    const tick = (t) => {
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

  const BG = demo.bg;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: TOKEN.fontSans, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", gap: 24 }}>

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10, color: TOKEN.gold, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: TOKEN.fontMono, marginBottom: 6 }}>Animation System</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Cinematic Component Animations</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Matched to background aesthetic · Gold accent · Editorial pacing</div>
      </div>

      {/* Scene tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {DEMOS.map(d => (
          <button key={d.id} onClick={() => setActive(d.id)} style={{
            background: active === d.id ? TOKEN.surfaceGold : "rgba(255,255,255,0.03)",
            border: `1px solid ${active === d.id ? TOKEN.borderGold : TOKEN.border}`,
            color: active === d.id ? TOKEN.gold : "rgba(255,255,255,0.45)",
            padding: "7px 16px", borderRadius: 5, cursor: "pointer",
            fontSize: 11, fontWeight: active === d.id ? 600 : 400,
            letterSpacing: "0.04em", transition: "all 0.15s",
          }}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Canvas — 9:16 */}
      <div style={{
        width: 300, height: 533,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <BG frame={frame} />
        {demo.render(frame)}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={() => { fRef.current = 0; setFrame(0); }} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${TOKEN.border}`, color: TOKEN.whiteDim, padding: "6px 14px", borderRadius: 5, cursor: "pointer", fontSize: 11 }}>↺ Reset</button>
        <button onClick={() => setPlaying(p => !p)} style={{ background: TOKEN.gold, border: "none", color: "#000", padding: "7px 18px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <input type="range" min={0} max={demo.duration - 1} value={frame}
          onChange={e => { setPlaying(false); const f = Number(e.target.value); fRef.current = f; setFrame(f); }}
          style={{ width: 160, accentColor: TOKEN.gold, cursor: "pointer" }}
        />
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: TOKEN.fontMono }}>{frame}/{demo.duration}</span>
      </div>

    </div>
  );
}
