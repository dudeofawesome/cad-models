import {
  box,
  compound,
  cylinder,
  fuse,
  sketchRoundedRectangle,
  translate,
  unwrap,
} from "brepjs";
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
    lipStartHeight: 2.3,
    lipDepth: 0.4,
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
  const p = dimensions.dock;
  // Keep the bottom envelope up to the measured lip shoulder, then inset
  // the upper housing by the lip depth. Detailed lower surfaces, overall
  // height and USB orientation remain unconfirmed.
  const lower = dockFootprint().sketchOnPlane("XY").extrude(p.lipStartHeight);
  const upper = translate(
    dockFootprint().offset(p.lipDepth).sketchOnPlane("XY")
      .extrude(p.height - p.lipStartHeight + 0.01),
    [0, 0, p.lipStartHeight - 0.01],
  );
  return unwrap(fuse(lower, upper));
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
