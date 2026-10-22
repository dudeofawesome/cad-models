#!/usr/bin/env brep --serve --no-open

import { compound, translate } from "brepjs";
import bin, { dockCenters, dockSeatHeight } from "./bin.brep.ts";
import {
  dimensions,
  dockEnvelope,
  transmitterEnvelope,
  usbCableEnvelope,
} from "./references/models.ts";

// Inspection assembly, not a printable part. TXs are shown lifted because
// the docking engagement is unmeasured. Dock heights/ports are estimates.
export const parameters = { transmitterLift: 8 };

export default function assembly() {
  const { dock } = dimensions;
  return compound([
    bin(),
    ...dockCenters.flatMap((x) => [
      translate(dockEnvelope(), [x, 0, dockSeatHeight]),
      translate(transmitterEnvelope(), [
        x,
        0,
        dockSeatHeight + dock.height + parameters.transmitterLift,
      ]),
      translate(usbCableEnvelope(), [
        x,
        dock.depth / 2,
        dockSeatHeight + dock.usbCenterHeight,
      ]),
    ]),
  ]);
}
