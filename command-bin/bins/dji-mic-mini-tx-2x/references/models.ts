import { box, compound, cylinder, sketchRoundedRectangle } from "brepjs";
import { dockFootprint, dockFootprintSize } from "./dock-footprint.ts";

// Layout envelopes, not reverse-engineered product surfaces. Units: mm.
// Origin: bottom center; X = left/right, Y = front/back, Z = up.
// Both TX backs and the assumed dock USB ports face +Y.
export const dimensions = {
  transmitter: {
    // DJI: 26.55 × 26.06 × 15.96 (L × W × H). Stand upright for storage:
    // L -> X, W -> Z, H -> Y. Includes the published overall envelope;
    // do not add a separate clip/magnet without measuring its projection.
    // https://www.dji.com/mic-mini/specs
    width: 26.55,
    depth: 15.96,
    height: 26.06,
  },
  // Bottom outline from bottom.dxf; height and port placement are estimates.
  dock: {
    ...dockFootprintSize,
    height: 10,
    usbCenterHeight: 5,
  },
  // Generic cable overmold keepout, NOT dimensions of the DJI cable.
  usbPlug: {
    width: 12,
    length: 20,
    height: 7,
    cableDiameter: 4,
    straightCableLength: 15,
  },
};

export function transmitterEnvelope() {
  const { width, depth, height } = dimensions.transmitter;
  // A box preserves the full published envelope; corner radii, buttons,
  // windscreen and removable clip magnet require separate measurements.
  return box(width, depth, height, { at: [0, 0, height / 2] });
}

export function dockEnvelope() {
  // Straight extrusion of the supplied bottom contour. The side profile,
  // seating depth and USB orientation remain unconfirmed.
  return dockFootprint().sketchOnPlane("XY").extrude(dimensions.dock.height);
}

export function usbCableEnvelope() {
  const p = dimensions.usbPlug;
  // Origin is the assumed dock port plane. Cable projects toward +Y.
  // This covers the external overmold and a straight cable lead, with no
  // exposed connector tongue or invented cable bend radius.
  const plug = sketchRoundedRectangle(p.width, p.height, 1, {
    plane: "XZ",
  }).extrude(-p.length);
  const lead = cylinder(p.cableDiameter / 2, p.straightCableLength, {
    at: [0, p.length, 0],
    axis: [0, 1, 0],
  });
  return compound([plug, lead]);
}
