import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  TOKEN,
  Grid, Vignette, Stamp, GoldDivider, KineticText, Annotation, TimelineItem, FlowNode,
  BgDeepField, BgSignal, BgFlare,
  TplSubjectCutout, TplEditorialHeadline, TplSplitPhotoData, TplTimeline,
  TplStatCallout, TplTextDominant, TplFlowDiagram, TplTransitionWipe,
} from "@yt-shorts/video-renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  id:       string;
  label:    string;
  group:    string;
  duration: number;
  variants: string[];
  render:   (variant: string, frame: number) => React.ReactElement;
}

// ─── Stories ─────────────────────────────────────────────────────────────────

const STORIES: Story[] = [

  // ── Primitives ──────────────────────────────────────────────────────────────

  {
    id: "grid-default", label: "Grid 48px", group: "Primitives", duration: 60,
    variants: ["default", "tight"],
    render: (variant, _frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid }}>
        <Grid size={variant === "tight" ? 36 : 48} opacity={1} />
      </div>
    ),
  },
  {
    id: "vignette-default", label: "Vignette", group: "Primitives", duration: 60,
    variants: ["default", "strong"],
    render: (variant, _frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgSignal }}>
        <Vignette strength={variant === "strong" ? 0.85 : 0.55} />
      </div>
    ),
  },
  {
    id: "stamp-default", label: "Stamp", group: "Primitives", duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stamp label="Primary Suspect · 1963" frame={frame} startFrame={variant === "delayed" ? 30 : 0} />
      </div>
    ),
  },
  {
    id: "stamp-long", label: "Stamp long", group: "Primitives", duration: 60,
    variants: ["default"],
    render: (_v, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stamp label="Classified · Eyes Only · 1945" frame={frame} startFrame={0} />
      </div>
    ),
  },
  {
    id: "gold-divider-default", label: "GoldDivider 400px", group: "Primitives", duration: 60,
    variants: ["default", "instant"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={variant === "instant" ? 0 : 10} width={400} />
      </div>
    ),
  },
  {
    id: "gold-divider-narrow", label: "GoldDivider 200px", group: "Primitives", duration: 60,
    variants: ["default"],
    render: (_v, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GoldDivider frame={frame} startFrame={0} width={200} />
      </div>
    ),
  },
  {
    id: "kinetic-text-default", label: "KineticText body", group: "Primitives", duration: 90,
    variants: ["default", "fast"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
        <KineticText
          text="The explosion was heard two thousand kilometres away."
          accentWords={["explosion", "thousand"]}
          fontSize={48}
          frame={frame}
          startFrame={0}
          stagger={variant === "fast" ? 2 : 4}
        />
      </div>
    ),
  },
  {
    id: "kinetic-text-caption", label: "KineticText caption", group: "Primitives", duration: 90,
    variants: ["default"],
    render: (_v, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
        <KineticText
          text="Siberia, June 30, 1908. A fireball crossed the sky."
          accentWords={["Siberia", "fireball"]}
          fontSize={28}
          frame={frame}
          startFrame={0}
          stagger={3}
        />
      </div>
    ),
  },
  {
    id: "annotation-left", label: "Annotation left", group: "Primitives", duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Annotation text="Ex-Marine. Soviet defector." side="left" frame={frame} startFrame={variant === "delayed" ? 20 : 0} />
      </div>
    ),
  },
  {
    id: "annotation-right", label: "Annotation right", group: "Primitives", duration: 60,
    variants: ["default"],
    render: (_v, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Annotation text="Arrested at 2:00 PM Dallas." side="right" frame={frame} startFrame={0} />
      </div>
    ),
  },
  {
    id: "timeline-item-default", label: "TimelineItem", group: "Primitives", duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <TimelineItem time="7:17 AM" event="Object enters atmosphere" detail="Over western Siberia, Russia" frame={frame} startFrame={variant === "delayed" ? 20 : 0} isLast={false} />
      </div>
    ),
  },
  {
    id: "timeline-item-last", label: "TimelineItem last", group: "Primitives", duration: 60,
    variants: ["default"],
    render: (_v, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <TimelineItem time="7:17 AM" event="Impact and explosion" detail="Podkamennaya Tunguska River area" frame={frame} startFrame={0} isLast={true} />
      </div>
    ),
  },
  {
    id: "flow-node-default", label: "FlowNode", group: "Primitives", duration: 60,
    variants: ["default", "delayed"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <FlowNode text="Fireball crosses the atmosphere" frame={frame} startFrame={variant === "delayed" ? 20 : 0} isLast={false} />
      </div>
    ),
  },
  {
    id: "flow-node-last", label: "FlowNode last", group: "Primitives", duration: 60,
    variants: ["default"],
    render: (_v, frame) => (
      <div style={{ position: "absolute", inset: 0, background: TOKEN.bgVoid, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <FlowNode text="Shockwave levels 2,000 square km" frame={frame} startFrame={0} isLast={true} />
      </div>
    ),
  },

  // ── Backgrounds ─────────────────────────────────────────────────────────────

  {
    id: "bg-deep-field", label: "BgDeepField", group: "Backgrounds", duration: 300,
    variants: ["default", "mid"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0 }}>
        <BgDeepField frame={variant === "mid" ? frame + 150 : frame} startFrame={0} />
      </div>
    ),
  },
  {
    id: "bg-signal", label: "BgSignal", group: "Backgrounds", duration: 200,
    variants: ["default", "mid"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0 }}>
        <BgSignal frame={variant === "mid" ? frame + 100 : frame} startFrame={0} />
      </div>
    ),
  },
  {
    id: "bg-flare", label: "BgFlare", group: "Backgrounds", duration: 90,
    variants: ["default", "expanded"],
    render: (variant, frame) => (
      <div style={{ position: "absolute", inset: 0 }}>
        <BgFlare frame={variant === "expanded" ? frame + 60 : frame} startFrame={0} />
      </div>
    ),
  },

  // ── Templates ───────────────────────────────────────────────────────────────

  {
    id: "tpl-editorial-headline", label: "EditorialHeadline", group: "Templates", duration: 120,
    variants: ["default", "tunguska"],
    render: (variant, frame) => (
      <TplEditorialHeadline
        data={variant === "tunguska" ? {
          type: "editorial_headline",
          stamp_label: "Tunguska · 1908",
          line1: "No crater.",
          line2: "No meteor.",
          highlight_line: "Nothing made sense.",
          subtext: "Scientists found only flattened forest stretching for miles.",
        } : {
          type: "editorial_headline",
          stamp_label: "November 24, 1963",
          line1: "Shot dead.",
          line2: "Live on air.",
          highlight_line: "The world watched.",
          subtext: "Jack Ruby fired one shot in the Dallas Police basement.",
        }}
        frame={frame} startFrame={0}
      />
    ),
  },
  {
    id: "tpl-stat-callout", label: "StatCallout", group: "Templates", duration: 120,
    variants: ["default", "area"],
    render: (variant, frame) => (
      <TplStatCallout
        data={variant === "area" ? {
          type: "stat_callout",
          stamp_label: "Affected Area",
          value: 2150, prefix: "", suffix: "km²",
          label: "of forest flattened",
          context: "An area larger than metropolitan Tokyo was stripped of trees in seconds.",
        } : {
          type: "stat_callout",
          stamp_label: "Blast Yield · 1908",
          value: 10, prefix: "", suffix: "Mt",
          label: "megatons of TNT equivalent",
          context: "Roughly 1,000 times more powerful than the atomic bomb dropped on Hiroshima.",
        }}
        frame={frame} startFrame={0}
      />
    ),
  },
  {
    id: "tpl-timeline", label: "Timeline", group: "Templates", duration: 180,
    variants: ["default", "kennedy"],
    render: (variant, frame) => (
      <TplTimeline
        data={variant === "kennedy" ? {
          type: "timeline",
          headline: "The Kennedy Assassination",
          stamp_label: "Dallas · November 22, 1963",
          items: [
            { time: "12:30 PM", event: "Shots fired at motorcade", detail: "Dealey Plaza, Dallas, Texas" },
            { time: "12:38 PM", event: "Kennedy arrives at hospital", detail: "Parkland Memorial Hospital" },
            { time: "1:00 PM",  event: "Kennedy pronounced dead",   detail: "Trauma Room One, Parkland" },
            { time: "2:00 PM",  event: "Oswald arrested",           detail: "Texas Theatre, Oak Cliff" },
          ],
        } : {
          type: "timeline",
          headline: "The Morning of June 30",
          stamp_label: "Tunguska · 1908",
          items: [
            { time: "7:14 AM", event: "Fireball first sighted",      detail: "Trans-Siberian Railway passengers" },
            { time: "7:17 AM", event: "Object enters atmosphere",    detail: "Travelling at 27 km per second" },
            { time: "7:17 AM", event: "Air burst at 8–10 km",        detail: "Above Podkamennaya Tunguska River" },
            { time: "7:17 AM", event: "Shockwave flattens trees",    detail: "2,150 square kilometres of forest" },
          ],
        }}
        frame={frame} startFrame={0}
      />
    ),
  },
  {
    id: "tpl-flow-diagram", label: "FlowDiagram", group: "Templates", duration: 180,
    variants: ["default", "investigation"],
    render: (variant, frame) => (
      <TplFlowDiagram
        data={variant === "investigation" ? {
          type: "flow_diagram",
          stamp_label: "Investigation",
          headline: "Why it took 19 years",
          nodes: [
            "1908: No expedition reaches the site",
            "1921: First attempt abandoned mid-journey",
            "1927: Kulik reaches the blast zone",
            "Finds no crater — only fallen trees",
          ],
        } : {
          type: "flow_diagram",
          stamp_label: "Impact Sequence",
          headline: "How the explosion unfolded",
          nodes: [
            "Object enters atmosphere at 27 km/s",
            "Air resistance generates extreme heat",
            "Object disintegrates at 8–10 km altitude",
            "Superheated gas expands violently",
            "Shockwave travels outward at supersonic speed",
          ],
        }}
        frame={frame} startFrame={0}
      />
    ),
  },
  {
    id: "tpl-text-dominant", label: "TextDominant", group: "Templates", duration: 120,
    variants: ["default", "date"],
    render: (variant, frame) => (
      <TplTextDominant
        data={variant === "date" ? {
          type: "text_dominant",
          lines: ["June 30, 1908.", "Siberia."],
        } : {
          type: "text_dominant",
          lines: ["No warning.", "No survivors.", "No explanation."],
        }}
        frame={frame} startFrame={0}
      />
    ),
  },
  {
    id: "tpl-split-photo-data", label: "SplitPhotoData", group: "Templates", duration: 150,
    variants: ["default", "kulik"],
    render: (variant, frame) => (
      <TplSplitPhotoData
        data={variant === "kulik" ? {
          type: "split_photo_data",
          stamp_label: "Investigation Profile",
          headline: "Leonid Kulik",
          facts: [
            "First scientist to reach the blast site",
            "Led four expeditions between 1927–1938",
            "Believed a meteorite was buried underground",
            "Never found definitive impact evidence",
          ],
          image_query: "Leonid Kulik Soviet scientist Tunguska expedition Siberia 1927",
        } : {
          type: "split_photo_data",
          stamp_label: "Event Profile",
          headline: "The Tunguska Event",
          facts: [
            "Estimated yield: 10–15 megatons TNT",
            "No meteorite fragments ever recovered",
            "Trees flattened in radial pattern from epicentre",
            "Felt as far away as the UK",
          ],
          image_query: "aerial view Tunguska Siberia fallen trees taiga forest 1927",
        }}
        frame={frame} startFrame={0}
      />
    ),
  },
  {
    id: "tpl-subject-cutout", label: "SubjectCutout", group: "Templates", duration: 120,
    variants: ["default", "snowden"],
    render: (variant, frame) => (
      <TplSubjectCutout
        data={variant === "snowden" ? {
          type: "subject_cutout",
          stamp_label: "Whistleblower · 2013",
          headline: "He leaked everything",
          annotations: [
            { text: "NSA contractor, 29 years old.", side: "left" as const },
            { text: "Fled to Hong Kong June 2013.",  side: "right" as const },
          ],
          image_query: "portrait Edward Snowden NSA whistleblower 2013 interview",
        } : {
          type: "subject_cutout",
          stamp_label: "Primary Suspect · 1963",
          headline: "The man they arrested",
          annotations: [
            { text: "Ex-Marine. Soviet defector.", side: "left" as const },
            { text: "Arrested at 2:00 PM",         side: "right" as const },
          ],
          image_query: "close-up Lee Harvey Oswald handcuffed Dallas police station 1963",
        }}
        sentence="Lee Harvey Oswald was arrested ninety minutes after the shooting."
        accentWords={["Oswald", "arrested"]}
        frame={frame} startFrame={0}
      />
    ),
  },
  {
    id: "tpl-transition-wipe", label: "TransitionWipe", group: "Templates", duration: 90,
    variants: ["default", "chapter-3"],
    render: (variant, frame) => (
      <TplTransitionWipe
        data={{ type: "transition_wipe", label: variant === "chapter-3" ? "Chapter Three" : "Part Two" }}
        frame={frame} startFrame={0}
      />
    ),
  },
];

const GROUPS = Array.from(new Set(STORIES.map(s => s.group)));

// ─── Viewer ───────────────────────────────────────────────────────────────────

const SCALE    = 0.278;
const CANVAS_W = Math.round(1080 * SCALE);
const CANVAS_H = Math.round(1920 * SCALE);

const App: React.FC = () => {
  const [activeId, setActiveId] = useState(STORIES[0]?.id ?? "");
  const [variant,  setVariant]  = useState("default");
  const [frame,    setFrame]    = useState(0);
  const [playing,  setPlaying]  = useState(true);
  const rafRef   = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);

  const story = STORIES.find(s => s.id === activeId);

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
      <div style={{ width: 240, background: "#06111F", borderRight: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", flexShrink: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{ padding: "16px 12px 8px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
          Components
        </div>
        {GROUPS.map(group => (
          <div key={group}>
            <div style={{ padding: "8px 12px 4px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(200,169,110,0.7)" }}>
              {group}
            </div>
            {STORIES.filter(s => s.group === group).map(s => (
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

      {/* Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, overflow: "hidden", background: "#03070F" }}>
          <div style={{ width: 1080, height: 1920, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "absolute" }}>
            {story ? story.render(variant, intFrame) : null}
          </div>
        </div>
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
      <div style={{ width: 280, background: "#06111F", borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", flexShrink: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: 16 }}>
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
          Info
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          <div><span style={{ color: "#c8a96e" }}>id:</span> {story?.id}</div>
          <div><span style={{ color: "#c8a96e" }}>group:</span> {story?.group}</div>
          <div><span style={{ color: "#c8a96e" }}>duration:</span> {story?.duration} frames</div>
        </div>
      </div>
    </div>
  );
};

export default App;
