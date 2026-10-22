import { compound, translate } from "brepjs";
import { u2CableDepth, u2DriveBody, u2DriveKeepouts, u2Drives, type U2Drive } from "./models.ts";

// Set showKeepouts to see the space reserved for the drive cables.
export const parameters = { gap: 20, showKeepouts: false };

const k = parameters.showKeepouts;
const { pm9a3, pm1733 } = u2Drives;
export const expected = {
  bounds: {
    xMin: 0,
    xMax: pm9a3.width + parameters.gap + pm1733.width,
    yMin: 0,
    yMax: pm9a3.length + (k ? u2CableDepth : 0),
    zMin: 0,
    zMax: pm1733.height,
  },
  tolerancePct: 0.01,
};

const drive = (d: U2Drive) => compound(k ? [u2DriveBody(d), u2DriveKeepouts(d)] : [u2DriveBody(d)]);

export default () =>
  compound([drive(pm9a3), translate(drive(pm1733), [pm9a3.width + parameters.gap, 0, 0])]);
