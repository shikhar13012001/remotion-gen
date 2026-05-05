import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BgSignal, DESIGN, SceneProps } from "./DESIGN";

// Scene 8 — "The architecture is two-sided: servers expose data, clients consume it."
// Cross-section: SERVERS band (top) + CLIENTS band (bottom), MCP divider with ↑↓ arrows
export const Scene08TwoSided: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();

  // Divider draws left→right
  const divW  = interpolate(frame, [0, 8],  [0, 100], { extrapolateRight: "clamp" });

  // Bands slide in from opposite directions
  const topY  = interpolate(frame, [4, 14], [-220, 0], { extrapolateRight: "clamp" });
  const botY  = interpolate(frame, [4, 14], [220, 0],  { extrapolateRight: "clamp" });

  // Server blocks stagger in
  const s1Op  = interpolate(frame, [16, 22], [0, 1], { extrapolateRight: "clamp" });
  const s2Op  = interpolate(frame, [21, 27], [0, 1], { extrapolateRight: "clamp" });
  const s3Op  = interpolate(frame, [26, 32], [0, 1], { extrapolateRight: "clamp" });
  const c1Op  = interpolate(frame, [21, 27], [0, 1], { extrapolateRight: "clamp" });
  const c2Op  = interpolate(frame, [26, 32], [0, 1], { extrapolateRight: "clamp" });

  // ↑↓ arrows
  const arrowOp = interpolate(frame, [32, 40], [0, 1], { extrapolateRight: "clamp" });

  const SERVER_BLOCKS = [
    { label: "GitHub Server", op: s1Op },
    { label: "Postgres Server", op: s2Op },
    { label: "Drive Server", op: s3Op },
  ];
  const CLIENT_BLOCKS = [
    { label: "Claude", op: c1Op },
    { label: "Any MCP Tool", op: c2Op },
  ];

  const blockStyle = (op: number): React.CSSProperties => ({
    background: DESIGN.surface,
    border: `1px solid ${DESIGN.border}`,
    borderRadius: "8px",
    padding: "16px 24px",
    fontFamily: DESIGN.fontMono,
    fontSize: DESIGN.caption.fontSize,
    color: DESIGN.textOn,
    opacity: op,
  });

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgSignal />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "60px",
        gap: "0",
      }}>
        {/* SERVERS band — top */}
        <div style={{ transform: `translateY(${topY}px)` }}>
          <div style={{
            fontFamily: DESIGN.fontMono,
            fontSize: DESIGN.caption.fontSize,
            letterSpacing: "0.16em",
            fontWeight: 700,
            color: DESIGN.accent,
            textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            SERVERS
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
            {SERVER_BLOCKS.map((b) => (
              <div key={b.label} style={blockStyle(b.op)}>{b.label}</div>
            ))}
          </div>
          <div style={{ fontSize: DESIGN.caption.fontSize, color: DESIGN.textMuted, fontFamily: DESIGN.fontMono }}>
            expose data →
          </div>
        </div>

        {/* MCP Divider with ↑↓ arrows */}
        <div style={{ position: "relative", marginTop: "24px", marginBottom: "24px" }}>
          <div style={{
            width: `${divW}%`,
            height: "2px",
            background: DESIGN.accentDim,
            borderRadius: "1px",
          }} />
          {/* Three ↑↓ arrows along the divider */}
          {[25, 50, 75].map((pct, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${pct}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: arrowOp,
            }}>
              <div style={{ fontSize: "18px", color: DESIGN.accent, lineHeight: 1 }}>↑↓</div>
              <div style={{
                fontFamily: DESIGN.fontMono,
                fontSize: "12px",
                color: DESIGN.textMuted,
                letterSpacing: "0.08em",
                marginTop: "4px",
              }}>
                MCP
              </div>
            </div>
          ))}
        </div>

        {/* CLIENTS band — bottom */}
        <div style={{ transform: `translateY(${botY}px)` }}>
          <div style={{ fontSize: DESIGN.caption.fontSize, color: DESIGN.textMuted, fontFamily: DESIGN.fontMono, marginBottom: "8px" }}>
            ← consume it
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            {CLIENT_BLOCKS.map((b) => (
              <div key={b.label} style={blockStyle(b.op)}>{b.label}</div>
            ))}
          </div>
          <div style={{
            fontFamily: DESIGN.fontMono,
            fontSize: DESIGN.caption.fontSize,
            letterSpacing: "0.16em",
            fontWeight: 700,
            color: DESIGN.textOn,
            textTransform: "uppercase",
          }}>
            CLIENTS
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
