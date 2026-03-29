import React from "react";

interface Props { strength?: number }

/** Radial dark edge overlay */
export const Vignette: React.FC<Props> = ({ strength = 0.55 }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${strength}) 100%)`,
  }} />
);
