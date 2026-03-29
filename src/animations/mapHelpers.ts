export function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "167,139,250";
  return `${parseInt(clean.slice(0, 2), 16)},${parseInt(clean.slice(2, 4), 16)},${parseInt(clean.slice(4, 6), 16)}`;
}

export function loadWorldData(): Record<string, string> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("./data/world-countries.json") as Record<string, string>;
  } catch {
    return null;
  }
}
