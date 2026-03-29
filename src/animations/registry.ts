import type { ComponentType } from "react";
import type { AnimationType } from "../../lmstudio/index";
import type { AnimationComponentProps } from "./types";

import { Counter }         from "./Counter";
import { LineChart }       from "./LineChart";
import { BarChart }        from "./BarChart";
import { ComparisonBars }  from "./ComparisonBars";
import { PercentageFill }  from "./PercentageFill";
import { MapSpread }       from "./MapSpread";
import { WorldHighlight }  from "./WorldHighlight";
import { Timeline }        from "./Timeline";
import { FlowDiagram }     from "./FlowDiagram";
import { SvgDrawPath }     from "./SvgDrawPath";
import { IconArrangement } from "./IconArrangement";
import { ShapeMetaphor }   from "./ShapeMetaphor";

/**
 * Maps every AnimationType to its Remotion component.
 * TypeScript enforces that all 12 keys are present — adding an AnimationType
 * without a component will be a compile-time error.
 *
 * At render time, if a type lookup fails (e.g. stale JSON), AnimatedGraphicScene
 * falls back to TextDominantScene — this registry never crashes the renderer.
 */
export const ANIMATION_REGISTRY: Record<AnimationType, ComponentType<AnimationComponentProps>> = {
  counter:          Counter,
  line_chart:       LineChart,
  bar_chart:        BarChart,
  comparison_bars:  ComparisonBars,
  percentage_fill:  PercentageFill,
  map_spread:       MapSpread,
  world_highlight:  WorldHighlight,
  timeline:         Timeline,
  flow_diagram:     FlowDiagram,
  svg_draw_path:    SvgDrawPath,
  icon_arrangement: IconArrangement,
  shape_metaphor:   ShapeMetaphor,
};
