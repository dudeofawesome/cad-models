import { dimensions, dockEnvelope } from "./models.ts";

const p = dimensions.dock;
export const expected = {
  bounds: {
    xMin: -p.width / 2,
    xMax: p.width / 2,
    yMin: -p.depth / 2,
    yMax: p.depth / 2,
    zMin: 0,
    zMax: p.height,
  },
  // Fusion's top splines slightly overshoot the nominal construction box.
  tolerancePct: 0.1,
};

export default dockEnvelope;
