import React from "react";
import type { FlowDiagramData } from "@yt-shorts/core";
import { TOKEN } from "../../tokens";
import { E, prog } from "../../engine";
import { BgSignal } from "../backgrounds/BgSignal";
import { Stamp } from "../primitives/Stamp";
import { GoldDivider } from "../primitives/GoldDivider";
import { FlowNode } from "../primitives/FlowNode";

interface Props { data: FlowDiagramData; frame: number; startFrame: number }

/** Vertical flow diagram — Signal bg, serif headline, staggered nodes. */
export const TplFlowDiagram: React.FC<Props> = ({ data, frame, startFrame }) => {
  const pHead = prog(frame, startFrame + 4, 18);
  return (
    <div style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}>
      <BgSignal frame={frame} startFrame={startFrame} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "120px 100px" }}>
        <Stamp label={data.stamp_label} frame={frame} startFrame={startFrame} />
        <div style={{
          marginTop: 28,
          fontFamily: TOKEN.serif, fontSize: 42, fontWeight: 700,
          color: TOKEN.white, lineHeight: 1.1, letterSpacing: "-0.025em",
          opacity: E.out3(pHead),
          transform: `translateY(${(1 - pHead) * 20}px)`,
        }}>
          {data.headline}
        </div>
        <GoldDivider frame={frame} startFrame={startFrame + 10} />
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column" }}>
          {data.nodes.map((node, i) => (
            <FlowNode
              key={i} text={node}
              frame={frame}
              startFrame={startFrame + 16 + i * 10}
              isLast={i === data.nodes.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
