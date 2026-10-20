import { dimensions, transmitterEnvelope } from "./models.ts";

const p = dimensions.transmitter;
export const expected = {
  bounds: {
    xMin: -p.width / 2,
    xMax: p.width / 2,
    yMin: -p.depth / 2,
    yMax: p.depth / 2,
    zMin: 0,
    zMax: p.height,
  },
  volume: p.width * p.depth * p.height,
  tolerancePct: 0.01,
};

export default transmitterEnvelope;
