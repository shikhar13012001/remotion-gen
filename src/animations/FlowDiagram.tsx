import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { AnimationComponentProps } from "./types";
import { CycleRenderer, TreeRenderer, ChainRenderer } from "./flowDiagramRenderers";

interface FlowData {
  nodes:        string[];
  connections?: [number, number][];
  style:        "arrow_chain" | "tree" | "cycle";
}

function parseData(data: Record<string, unknown>): FlowData {
  const rawNodes = Array.isArray(data.nodes) ? (data.nodes as unknown[]).map(String) : [];
  const rawConns = Array.isArray(data.connections)
    ? (data.connections as unknown[])
        .filter((c): c is [number, number] => Array.isArray(c) && c.length >= 2)
    : undefined;
  return {
    nodes:       rawNodes,
    connections: rawConns,
    style:       ["arrow_chain", "tree", "cycle"].includes(data.style as string)
                   ? (data.style as FlowData["style"]) : "arrow_chain",
  };
}

export const FlowDiagram: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette, fps,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { nodes, style } = parseData(spec.data);
  if (nodes.length === 0) return null;

  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const rendererProps = { nodes, frame, fps, palette, durationInFrames, containerOp };

  if (style === "cycle")                         return <CycleRenderer {...rendererProps} />;
  if (style === "tree" && nodes.length >= 2)     return <TreeRenderer  {...rendererProps} />;
  return <ChainRenderer {...rendererProps} />;
};
