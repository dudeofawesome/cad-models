import { compound } from "brepjs";
import { cooler, motherboard, motherboardBody, motherboardKeepouts } from "./models.ts";

// Set showKeepouts to see the space reserved for cables around the part.
export const parameters = { showKeepouts: false };

const m = motherboard;
const k = parameters.showKeepouts;
export const expected = {
  bounds: {
    xMin: 0,
    xMax: m.width,
    yMin: k ? -m.ioCableDepth : Math.min(...m.io.map((p) => p.y[0])),
    yMax: k ? m.depth + m.slimsasCableDepth : m.depth,
    zMin: 0,
    zMax: m.pcbThickness + cooler.height,
  },
  tolerancePct: 0.01,
};

export default () =>
  compound(k ? [motherboardBody(), motherboardKeepouts()] : [motherboardBody()]);
