import { dimensions, usbCableEnvelope } from "./models.ts";

const p = dimensions.usbPlug;
export const expected = {
  bounds: {
    xMin: -p.width / 2,
    xMax: p.width / 2,
    yMin: 0,
    yMax: p.length + p.straightCableLength,
    zMin: -p.height / 2,
    zMax: p.height / 2,
  },
  tolerancePct: 0.01,
};

export default usbCableEnvelope;
