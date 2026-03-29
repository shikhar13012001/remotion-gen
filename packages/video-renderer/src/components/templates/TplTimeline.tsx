import React from "react";
import type { TimelineData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, prog } from "../../engine";
import { BgSignal } from "../backgrounds/BgSignal";
import { Stamp } from "../primitives/Stamp";
import { GoldDivider } from "../primitives/GoldDivider";
import { TimelineItem } from "../primitives/TimelineItem";

interface Props { data: TimelineData; frame: number; startFrame: number }

/** Vertical staggered timeline — Signal bg, serif headline, staggered items. */
export const TplTimeline: React.FC<Props> = ({ data, frame, startFrame }) => {
  const pHead = prog(frame, startFrame + 4, 18);
  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
      <BgSignal frame={frame} startFrame={startFrame} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "120px 100px" }}>
        <Stamp label={data.stamp_label} frame={frame} startFrame={startFrame} />
        <div style={{
          marginTop: 28,
          fontFamily: TOKEN.serif, fontSize: 44, fontWeight: 700,
          color: TOKEN.white, lineHeight: 1.1, letterSpacing: "-0.025em",
          opacity: E.out3(pHead),
          transform: `translateY(${(1 - pHead) * 20}px)`,
        }}>
          {data.headline}
        </div>
        <GoldDivider frame={frame} startFrame={startFrame + 10} />
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 0 }}>
          {data.items.map((item, i) => (
            <TimelineItem
              key={i} {...item}
              frame={frame}
              startFrame={startFrame + 16 + i * 10}
              isLast={i === data.items.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
