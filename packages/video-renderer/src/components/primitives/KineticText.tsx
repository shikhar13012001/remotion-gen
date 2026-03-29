import React from "react";
import { TOKEN } from "../../tokens";
import { E, lerp, prog } from "../../engine";

interface Props {
  text:        string;
  accentWords: string[];
  fontSize:    number;
  frame:       number;
  startFrame:  number;
  stagger?:    number;
  fontFamily?: string;   // TOKEN.serif for headlines, TOKEN.sans for body
  fontWeight?: number;
  color?:      string;
}

/**
 * Word-by-word clip reveal: each word slides up from overflow:hidden container.
 * Accent words render in TOKEN.gold, one weight heavier.
 * Use TOKEN.serif for display headlines, TOKEN.sans for body text.
 */
export const KineticText: React.FC<Props> = ({
  text, accentWords, fontSize, frame, startFrame,
  stagger = 3,
  fontFamily = TOKEN.sans,
  fontWeight = 400,
  color = TOKEN.white,
}) => {
  const words = text.split(/\s+/);
  const isSerif = fontFamily === TOKEN.serif;
  const ls = isSerif ? "-0.025em" : "0.01em";

  return (
    <div style={{
      fontFamily, fontSize, lineHeight: isSerif ? 1.05 : 1.55,
      letterSpacing: ls,
      color, display: "flex", flexWrap: "wrap", gap: "0 0.28em",
    }}>
      {words.map((word, i) => {
        const p = prog(frame, startFrame + i * stagger, 12);
        const isAccent = accentWords.some(
          a => word.toLowerCase().replace(/[^a-z]/g, "") === a.toLowerCase().replace(/[^a-z]/g, "")
        );
        const y = lerp(p, 100, 0, E.out4);
        const op = lerp(p, 0, 1, E.out3);

        return (
          <div key={i} style={{ overflow: "hidden", display: "inline-block" }}>
            <span style={{
              display: "inline-block",
              transform: `translateY(${y}%)`,
              opacity: op,
              color:      isAccent ? TOKEN.gold : color,
              fontWeight: isAccent ? (fontWeight < 700 ? 700 : fontWeight) : fontWeight,
              textShadow: isAccent ? `0 0 40px rgba(200,169,110,0.35)` : "none",
            }}>
              {word}
            </span>
          </div>
        );
      })}
    </div>
  );
};
