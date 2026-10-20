import { compound, translate } from "brepjs";
import {
  dimensions,
  dockEnvelope,
  transmitterEnvelope,
  usbCableEnvelope,
} from "./models.ts";

export const parameters = {
  stationSpacing: 42,
  // Exploded preview: TXs float above the dock envelopes. This does not
  // assert the actual docking engagement or an upward release mechanism.
  transmitterLift: 8,
};

const { transmitter, dock, usbPlug } = dimensions;
export const expected = {
  bounds: {
    xMin: -(parameters.stationSpacing + dock.width) / 2,
    xMax: (parameters.stationSpacing + dock.width) / 2,
    yMin: -dock.depth / 2,
    yMax: dock.depth / 2 + usbPlug.length + usbPlug.straightCableLength,
    zMin: 0,
    zMax: dock.height + parameters.transmitterLift + transmitter.height,
  },
  tolerancePct: 0.1,
};

export default function layout() {
  const stations = [-1, 1].map((side) => {
    const x = (side * parameters.stationSpacing) / 2;
    return compound([
      translate(dockEnvelope(), [x, 0, 0]),
      translate(transmitterEnvelope(), [
        x,
        0,
        dock.height + parameters.transmitterLift,
      ]),
      translate(usbCableEnvelope(), [x, dock.depth / 2, dock.usbCenterHeight]),
    ]);
  });
  return compound(stations);
}
