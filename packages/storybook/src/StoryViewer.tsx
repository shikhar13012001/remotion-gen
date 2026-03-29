import React, { useState, useEffect, useRef, useCallback } from "react";
import { ALL_STORIES, GROUPS, type Story } from "./registry";

const SCALE = 0.278;
const CANVAS_W = Math.round(1080 * SCALE);
const CANVAS_H = Math.round(1920 * SCALE);

const sidebarStyle: React.CSSProperties = {
  width: 240, background: "#06111F", borderRight: "1px solid rgba(255,255,255,0.08)",
  overflowY: "auto", flexShrink: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif",
};

const panelStyle: React.CSSProperties = {
  width: 280, background: "#06111F", borderLeft: "1px solid rgba(255,255,255,0.08)",
  overflowY: "auto", flexShrink: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: 16,
};

export const StoryViewer: React.FC = () => {
  const [activeId, setActiveId]       = useState(ALL_STORIES[0]?.id ?? "");
  const [variant, setVariant]         = useState("default");
  const [frame, setFrame]             = useState(0);
  const [playing, setPlaying]         = useState(true);
  const rafRef                        = useRef<number | null>(null);
  const lastTRef                      = useRef<number | null>(null);

  const story: Story | undefined = ALL_STORIES.find(s => s.id === activeId);

  const selectStory = useCallback((id: string) => {
    setActiveId(id);
    setVariant("default");
    setFrame(0);
    setPlaying(true);
    lastTRef.current = null;
  }, []);

  useEffect(() => {
    if (!playing || !story) return;
    const tick = (t: number) => {
      if (lastTRef.current !== null) {
        const dt = t - lastTRef.current;
        setFrame(f => {
          const next = f + dt * 30 / 1000;
          return next >= story.duration ? 0 : next;
        });
      }
      lastTRef.current = t;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, story]);

  const intFrame = Math.floor(frame);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#03070F", color: "#f0f0f0" }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: "16px 12px 8px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
          Components
        </div>
        {GROUPS.map(group => (
          <div key={group}>
            <div style={{ padding: "8px 12px 4px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(200,169,110,0.7)" }}>
              {group}
            </div>
            {ALL_STORIES.filter(s => s.group === group).map(s => (
              <button key={s.id} onClick={() => selectStory(s.id)} style={{
                display: "block", width: "100%", textAlign: "left", padding: "7px 20px",
                background: s.id === activeId ? "rgba(200,169,110,0.1)" : "transparent",
                border: "none", borderLeft: s.id === activeId ? "2px solid #c8a96e" : "2px solid transparent",
                color: s.id === activeId ? "#c8a96e" : "rgba(255,255,255,0.6)",
                fontSize: 13, cursor: "pointer",
              }}>
                {s.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, overflow: "hidden", background: "#03070F" }}>
          <div style={{ width: 1080, height: 1920, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "absolute" }}>
            {story ? story.render(variant, intFrame) : null}
          </div>
        </div>
        {/* Playback controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setPlaying(p => !p)} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.28)", color: "#c8a96e", padding: "4px 14px", cursor: "pointer", fontSize: 12, borderRadius: 2 }}>
            {playing ? "Pause" : "Play"}
          </button>
          <input type="range" min={0} max={(story?.duration ?? 60) - 1} value={intFrame}
            onChange={e => { setFrame(Number(e.target.value)); setPlaying(false); }}
            style={{ width: 200 }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
            {intFrame}/{(story?.duration ?? 0) - 1}
          </span>
        </div>
      </div>

      {/* Panel */}
      <div style={panelStyle}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
          Variants
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
          {story?.variants.map(v => (
            <button key={v} onClick={() => setVariant(v)} style={{
              background: v === variant ? "rgba(200,169,110,0.1)" : "transparent",
              border: `1px solid ${v === variant ? "rgba(200,169,110,0.28)" : "rgba(255,255,255,0.08)"}`,
              color: v === variant ? "#c8a96e" : "rgba(255,255,255,0.6)",
              padding: "6px 12px", cursor: "pointer", fontSize: 12, textAlign: "left", borderRadius: 2,
            }}>
              {v}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
          LLM Contract
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          <div><span style={{ color: "#c8a96e" }}>component:</span> {story?.component}</div>
          <div><span style={{ color: "#c8a96e" }}>group:</span> {story?.group}</div>
          <div><span style={{ color: "#c8a96e" }}>duration:</span> {story?.duration} frames</div>
          <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", wordBreak: "break-all" }}>
            props: frame=number, startFrame=number{story?.group === "Templates" ? ", data: TemplateData" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};
