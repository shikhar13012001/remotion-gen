import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { AnimationComponentProps } from "./types";
import {
  buildTowerVsFlat, buildShrinkingShape, buildExpandingShape,
  buildSplittingShape, buildMergingShape, buildFillingShape,
} from "./shapeBuilders";
import { TOKEN } from "../../packages/video-renderer/src/tokens";

const BODY_FONT = TOKEN.sans;

type ShapeStyle = "tower_vs_flat" | "shrinking" | "expanding" | "splitting" | "merging" | "filling";

interface ShapeMetaphorData { concept: string; style: ShapeStyle; }

function parseData(data: Record<string, unknown>): ShapeMetaphorData {
  const styles: ShapeStyle[] = ["tower_vs_flat", "shrinking", "expanding", "splitting", "merging", "filling"];
  return {
    concept: typeof data.concept === "string" ? data.concept : "",
    style:   styles.includes(data.style as ShapeStyle) ? (data.style as ShapeStyle) : "expanding",
  };
}

export const ShapeMetaphor: React.FC<AnimationComponentProps> = ({
  spec, startFrame, durationInFrames, palette,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { concept, style } = parseData(spec.data);

  const containerOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const progress     = interpolate(frame, [0, durationInFrames * 0.8], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // tower_vs_flat returns its own full node (needs special layout)
  if (style === "tower_vs_flat") {
    return <>{buildTowerVsFlat(progress, palette, concept, containerOp, BODY_FONT)}</>;
  }

  const shapeMap: Record<string, React.ReactNode> = {
    shrinking: buildShrinkingShape(progress, palette),
    expanding: buildExpandingShape(progress, palette),
    splitting: buildSplittingShape(progress, palette),
    merging:   buildMergingShape(progress, palette),
    filling:   buildFillingShape(progress, palette),
  };

  const shapeContent = shapeMap[style] ?? buildFillingShape(progress, palette);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: containerOp }}>
      <svg width={1080} height={1344} style={{ position: "absolute", inset: 0 }}>
        {shapeContent}
      </svg>
      {concept && (
        <div style={{ position: "absolute", bottom: 280, left: 0, right: 0, textAlign: "center",
          fontFamily: BODY_FONT, fontWeight: 400, fontSize: 32, color: palette.text, opacity: 0.7 }}>
          {concept}
        </div>
      )}
    </div>
  );
};
