export const E = {
  out3:    (t: number) => 1 - Math.pow(1 - t, 3),
  out4:    (t: number) => 1 - Math.pow(1 - t, 4),
  out5:    (t: number) => 1 - Math.pow(1 - t, 5),
  outExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inOut3:  (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  spring:  (t: number) => {
    if (!t || t === 1) return t;
    return Math.pow(2, -9*t) * Math.sin((t*10 - 0.75) * (2*Math.PI/3)) + 1;
  },
};

/** Interpolate from a to b using easing. t is 0–1. */
export const lerp = (t: number, a: number, b: number, ease = E.out3): number =>
  a + ease(Math.max(0, Math.min(1, t))) * (b - a);

/** Frame progress 0–1 from frame, start frame, duration in frames. */
export const prog = (frame: number, start: number, dur: number): number =>
  Math.max(0, Math.min(1, (frame - start) / Math.max(1, dur)));
