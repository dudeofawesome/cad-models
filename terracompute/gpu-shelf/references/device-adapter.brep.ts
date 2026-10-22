import { compound } from "brepjs";
import { deviceAdapter, deviceAdapterBody, deviceAdapterKeepouts } from "./models.ts";

// Set showKeepouts to see the space reserved for cables around the part.
export const parameters = { showKeepouts: false };

const a = deviceAdapter;
const k = parameters.showKeepouts;
export const expected = {
  bounds: {
    xMin: 0,
    xMax: a.width,
    yMin: 0,
    yMax: k ? a.length + a.cableBend : a.length,
    zMin: -a.solderDepth,
    zMax: a.pcbThickness + (k ? a.cableHeight : a.powerHeight),
  },
  tolerancePct: 0.01,
};

export default () =>
  compound(k ? [deviceAdapterBody(), deviceAdapterKeepouts()] : [deviceAdapterBody()]);
