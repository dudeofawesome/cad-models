import { compound } from "brepjs";
import { atxPsu, atxPsuBody, atxPsuKeepouts } from "./models.ts";

// Set showKeepouts to see the space reserved for cables around the part.
export const parameters = { showKeepouts: false };

const k = parameters.showKeepouts;
export const expected = {
  bounds: {
    xMin: 0,
    xMax: atxPsu.width,
    yMin: 0,
    yMax: k ? atxPsu.length + atxPsu.cableDepth : atxPsu.length,
    zMin: 0,
    zMax: atxPsu.height,
  },
  tolerancePct: 0.01,
};

export default () => compound(k ? [atxPsuBody(), atxPsuKeepouts()] : [atxPsuBody()]);
