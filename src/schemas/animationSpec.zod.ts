import { z } from "zod";
import { ANIMATION_TYPES, type AnimationType } from "../../lmstudio/index";
import {
  CounterDataSchema, LineChartDataSchema, BarChartDataSchema,
  ComparisonBarsDataSchema, PercentageFillDataSchema, MapSpreadDataSchema,
  WorldHighlightDataSchema, TimelineDataSchema, FlowDiagramDataSchema,
  SvgDrawPathDataSchema, IconArrangementDataSchema, ShapeMetaphorDataSchema,
} from "./animationDataSchemas";

const DATA_SCHEMAS: Record<AnimationType, z.ZodTypeAny> = {
  counter:          CounterDataSchema,
  line_chart:       LineChartDataSchema,
  bar_chart:        BarChartDataSchema,
  comparison_bars:  ComparisonBarsDataSchema,
  percentage_fill:  PercentageFillDataSchema,
  map_spread:       MapSpreadDataSchema,
  world_highlight:  WorldHighlightDataSchema,
  timeline:         TimelineDataSchema,
  flow_diagram:     FlowDiagramDataSchema,
  svg_draw_path:    SvgDrawPathDataSchema,
  icon_arrangement: IconArrangementDataSchema,
  shape_metaphor:   ShapeMetaphorDataSchema,
};

export const AnimationSpecSchema = z
  .object({
    type:            z.enum(ANIMATION_TYPES),
    data:            z.unknown(),
    entry_animation: z.enum(["build_in", "slam", "draw"]),
    duration_ms:     z.number().positive(),
  })
  .superRefine((spec, ctx) => {
    const schema = DATA_SCHEMAS[spec.type];
    const result = schema.safeParse(spec.data);
    if (!result.success) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        message: `animation_spec.data invalid for type "${spec.type}": ${result.error.message}`,
        path:    ["data"],
      });
    }
  });

export type ValidatedAnimationSpec = z.infer<typeof AnimationSpecSchema>;
