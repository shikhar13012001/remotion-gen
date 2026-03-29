import React from "react";
import { interpolate } from "remotion";

export interface ParticleFieldProps {
  count: number;
  color: string;
  speed: number;
  frame: number;
}

const GOLDEN_ANGLE = 137.508; // degrees

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count, color, speed, frame,
}) => {
  const particles = Array.from({ length: count }, (_, i) => {
    // Deterministic positions using golden-angle distribution
    const angle  = (i * GOLDEN_ANGLE * Math.PI) / 180;
    const radius = Math.sqrt(i / count) * 50; // 0–50% of container
    const baseX  = 50 + radius * Math.cos(angle);
    const baseY  = 50 + radius * Math.sin(angle);

    // Slow drift using sin/cos with unique phase per particle
    const driftX = Math.sin(frame * 0.01 * speed + i * 0.7) * 1.5;
    const driftY = Math.cos(frame * 0.013 * speed + i * 0.5) * 1.5;

    const x = ((baseX + driftX) % 100 + 100) % 100;
    const y = ((baseY + driftY) % 100 + 100) % 100;

    // Twinkling opacity
    const opacity = interpolate(
      Math.sin(frame * 0.04 * speed + i * 1.3),
      [-1, 1],
      [0.08, 0.45],
    );

    return { x, y, opacity };
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 2,
            height: 2,
            borderRadius: "50%",
            background: color,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
};
