export const TOKEN = {
  bgVoid:      "#03070F",
  bgSignal:    "#06111F",
  bgFlare:     "#020810",
  blobBlue:    "#091830",   // main light source — muted dark navy
  blobAccent:  "#0D2560",   // corner glow — reduced saturation
  blobMid:     "#07101E",   // mid-field depth — connects blobs

  // Brand accent — only #c8a96e is used as accent, nothing else
  gold:        "#c8a96e",
  goldGlow:    "rgba(200,169,110,0.20)",
  goldBorder:  "rgba(200,169,110,0.28)",
  goldSurface: "rgba(200,169,110,0.07)",
  goldDim:     "rgba(200,169,110,0.40)",

  // Text hierarchy
  white:  "#ffffff",                   // headlines only
  dim:    "rgba(255,255,255,0.55)",    // body text, facts
  faint:  "rgba(255,255,255,0.18)",    // tertiary, labels
  muted:  "rgba(255,255,255,0.08)",    // borders, dividers

  border:  "rgba(255,255,255,0.08)",
  surface: "rgba(255,255,255,0.04)",

  // DISPLAY: authoritative, weighted, editorial
  serif: "Georgia, 'Times New Roman', serif",
  // BODY: clinical, precise, neutral
  sans:  "'Helvetica Neue', Arial, sans-serif",
  // LABEL: classified file, teletype, stamp
  mono:  "'Courier New', Courier, monospace",

  gridColor:     "rgba(255,255,255,0.045)",   // felt, not seen
  gridSize:      48,
  gridSizeTight: 36,
} as const;
