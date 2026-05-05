import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BgSignal, DESIGN, SceneProps } from "./DESIGN";

// Scene 3 — "Every new data source requires its own custom connector..."
// 3-column ledger: Data Source | Connector | Built By — 4 rows appending
const ROWS = [
  { source: "GitHub",   connector: "⌁⌁⌁",  count: 1 },
  { source: "Slack",    connector: "≋≋≋",  count: 2 },
  { source: "Postgres", connector: "⌀⌀⌀",  count: 3 },
  { source: "Drive",    connector: "⊣⊣⊣",  count: 4 },
];

export const Scene03Ledger: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: DESIGN.fontBody, overflow: "hidden" }}>
      <BgSignal />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "60px",
      }}>
        {/* Ledger table */}
        <div style={{
          width: "900px",
          border: `1px solid ${DESIGN.border}`,
          borderRadius: "8px",
          overflow: "hidden",
        }}>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            background: DESIGN.surface,
            borderBottom: `1px solid ${DESIGN.border}`,
            opacity: headerOp,
          }}>
            {["Data Source", "Connector", "Built By"].map((h) => (
              <div key={h} style={{
                padding: "16px 24px",
                fontFamily: DESIGN.fontMono,
                fontSize: DESIGN.caption.fontSize,
                letterSpacing: "0.1em",
                fontWeight: 700,
                color: DESIGN.textMuted,
                textTransform: "uppercase",
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {ROWS.map((row, i) => {
            const rowStart = 8 + i * 10;
            const rowOp = interpolate(frame, [rowStart, rowStart + 8], [0, 1], { extrapolateRight: "clamp" });
            const countOp = interpolate(frame, [rowStart + 4, rowStart + 10], [0, 1], { extrapolateRight: "clamp" });

            return (
              <div key={row.source} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                borderBottom: i < ROWS.length - 1 ? `1px solid ${DESIGN.border}` : "none",
                opacity: rowOp,
              }}>
                <div style={{ padding: "20px 24px", fontFamily: DESIGN.fontMono, fontSize: DESIGN.body.fontSize, color: DESIGN.textOn }}>
                  {row.source}
                </div>
                <div style={{ padding: "20px 24px", fontFamily: DESIGN.fontMono, fontSize: DESIGN.body.fontSize, color: DESIGN.textMuted, letterSpacing: "0.2em" }}>
                  {row.connector}
                </div>
                <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px", opacity: countOp }}>🕐</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row-count summary */}
        {(() => {
          const countStart = 8 + (ROWS.length - 1) * 10 + 8;
          const summaryOp = interpolate(frame, [countStart, countStart + 8], [0, 1], { extrapolateRight: "clamp" });
          const visibleRows = ROWS.filter((_, i) => {
            const rowStart = 8 + i * 10;
            return frame >= rowStart;
          });
          const count = visibleRows.length;
          return (
            <div style={{
              marginTop: "32px",
              fontFamily: DESIGN.fontMono,
              fontSize: DESIGN.caption.fontSize,
              color: DESIGN.accent,
              opacity: summaryOp,
              letterSpacing: "0.08em",
            }}>
              {count} connector{count !== 1 ? "s" : ""}. {count} build{count !== 1 ? "s" : ""}. {count}× the cost. Every time.
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
