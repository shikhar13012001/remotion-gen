import type { AnimationSpec } from "../../lmstudio/index";
import type { PaletteContextValue } from "../context/PaletteContext";

export interface AnimationComponentProps {
  spec:             AnimationSpec;
  startFrame:       number;
  durationInFrames: number;
  palette:          PaletteContextValue;
  fps:              number;
}
