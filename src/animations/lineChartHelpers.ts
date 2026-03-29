/** Map data points to SVG coordinates within the chart area. */
export function buildLinePath(points: number[], w: number, h: number): { d: string; length: number } {
  if (points.length < 2) return { d: "", length: 0 };

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = w / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: h - ((p - min) / range) * h,
  }));

  const d = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  let length = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return { d, length };
}

export interface YTick { value: number; y: number; label: string; }

export function buildYTicks(points: number[], chartH: number): YTick[] {
  const min   = Math.min(...points);
  const max   = Math.max(...points);
  const range = max - min || 1;
  return [min, min + range * 0.5, max].map((v) => ({
    value: v,
    y: chartH - ((v - min) / range) * chartH,
    label: v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
         : v >= 1_000    ? `${(v / 1_000).toFixed(1)}K`
         : v.toFixed(0),
  }));
}
