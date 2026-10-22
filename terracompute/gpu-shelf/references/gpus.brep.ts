import { compound, translate } from "brepjs";
import { gpu, gpuBody, gpuCards, gpuKeepouts } from "./models.ts";

// One of each card model, standing on its slot edge side by side along Y
// with a fixed gap, for comparing sizes. Not a proposed arrangement.
// Set showKeepouts to see the space reserved for power cables.
export const parameters = { gap: 20, showKeepouts: false };

const k = parameters.showKeepouts;
const cards = Object.values(gpuCards);
const offsets = cards.map((_, i) =>
  cards.slice(0, i).reduce((y, c) => y + c.thickness + parameters.gap, 0),
);
const last = cards.length - 1;

export const expected = {
  bounds: {
    xMin: 0,
    xMax: Math.max(...cards.map((c) => c.length)),
    yMin: 0,
    yMax: offsets[last] + cards[last].thickness,
    zMin: gpu.bracket.z[0],
    zMax: Math.max(...cards.map((c) => c.height)) + (k ? gpu.powerKeepout : 0),
  },
  tolerancePct: 0.01,
};

export default () =>
  compound(
    cards.map((card, i) =>
      translate(compound(k ? [gpuBody(card), gpuKeepouts(card)] : [gpuBody(card)]), [0, offsets[i], 0]),
    ),
  );
