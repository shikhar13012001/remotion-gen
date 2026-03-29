import { z } from "zod";

export const CounterDataSchema = z.object({
  value:    z.number(),
  prefix:   z.string().optional(),
  suffix:   z.string().optional(),
  decimals: z.number().int().min(0).max(4).optional(),
});

export const LineChartDataSchema = z.object({
  points:         z.array(z.number()).min(2),
  labels:         z.array(z.string()),
  y_label:        z.string().optional(),
  highlight_drop: z.boolean().optional(),
});

export const BarChartDataSchema = z.object({
  items:      z.array(z.object({ label: z.string(), value: z.number() })).min(1),
  unit:        z.string().optional(),
  horizontal:  z.boolean().optional(),
});

export const ComparisonBarsDataSchema = z.object({
  items: z.array(
    z.object({ label: z.string(), value: z.number(), color: z.string().optional() })
  ).min(2),
  unit: z.string().optional(),
});

export const PercentageFillDataSchema = z.object({
  value: z.number().min(0).max(100),
  label: z.string(),
  style: z.enum(["circle", "bar"]).optional(),
});

export const MapSpreadDataSchema = z.object({
  highlight_countries: z.array(z.string()),
  spread_order:        z.boolean().optional(),
  base_color:          z.string().optional(),
  highlight_color:     z.string().optional(),
});

export const WorldHighlightDataSchema = z.object({
  regions: z.array(
    z.object({ country: z.string(), intensity: z.number().min(0).max(1) })
  ),
  legend: z.string().optional(),
});

export const TimelineDataSchema = z.object({
  events: z.array(
    z.object({ date: z.string(), label: z.string(), sublabel: z.string().optional() })
  ).min(2),
  direction: z.enum(["horizontal", "vertical"]),
});

export const FlowDiagramDataSchema = z.object({
  nodes:       z.array(z.string()).min(2).max(8),
  connections: z.array(z.tuple([z.number(), z.number()])).optional(),
  style:       z.enum(["arrow_chain", "tree", "cycle"]),
});

export const SvgDrawPathDataSchema = z.object({
  path:         z.string().min(1),
  stroke_width: z.number().optional(),
  fill:         z.boolean().optional(),
});

export const IconArrangementDataSchema = z.object({
  icons:  z.array(z.string()).min(1).max(6),
  layout: z.enum(["scatter", "grid", "radial", "stack"]),
  labels: z.array(z.string()).optional(),
});

export const ShapeMetaphorDataSchema = z.object({
  concept: z.string(),
  style:   z.enum(["tower_vs_flat", "shrinking", "expanding", "splitting", "merging", "filling"]),
});
