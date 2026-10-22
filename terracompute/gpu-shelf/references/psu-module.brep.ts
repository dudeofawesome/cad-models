import { compound } from "brepjs";
import { psuModule, psuModuleBody, psuModuleKeepouts } from "./models.ts";

// Set showKeepouts to see the space reserved for cables around the part.
export const parameters = { showKeepouts: false };

const p = psuModule;
const k = parameters.showKeepouts;
const psuEnd = p.board.depth + p.gap + p.psu.length + p.rear;
export const expected = {
  bounds: {
    xMin: 0,
    xMax: k ? psuEnd + p.cord : psuEnd,
    yMin: 0,
    yMax: p.board.width,
    zMin: 0,
    zMax: k ? p.board.pcbTop + p.connectorHeight + p.cableBend : p.psu.raise + p.psu.height,
  },
  tolerancePct: 0.01,
};

export default () => compound(k ? [psuModuleBody(), psuModuleKeepouts()] : [psuModuleBody()]);
