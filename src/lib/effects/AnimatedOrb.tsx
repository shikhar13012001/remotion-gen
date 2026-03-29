import React from "react";

export interface AnimatedOrbProps {
  color: string;   // rgb triplet e.g. "200,170,110"
  opacity: number;
  speed: number;
  frame: number;
  x: number;       // initial x % (0-100)
  y: number;       // initial y % (0-100)
}

export const AnimatedOrb: React.FC<AnimatedOrbProps> = ({
  color, opacity, speed, frame, x, y,
}) => {
  // Position oscillates slowly with sin/cos
  const driftX = Math.sin(frame * 0.008 * speed) * 6;
  const driftY = Math.cos(frame * 0.006 * speed) * 8;

  const cx = x + driftX;
  const cy = y + driftY;

  return (
    <div style={{
      position: "absolute",
      left: `${cx}%`,
      top: `${cy}%`,
      width: 500,
      height: 500,
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      background: `radial-gradient(circle, rgba(${color},${opacity}) 0%, rgba(${color},0) 70%)`,
      pointerEvents: "none",
    }} />
  );
};
