import {
  box,
  cut,
  cylinder,
  fuse,
  getSolids,
  loft,
  sketchRoundedRectangle,
  translate,
  unwrap,
} from "brepjs";
import { dockFootprint } from "./references/dock-footprint.ts";

// Millimeters. A shallow locating tray: only the measured dock bottom is
// captured, leaving its unmeasured upper housing and the TXs exposed.
export const parameters = {
  height: 14,
  dockPocketDepth: 3,
  dockClearance: 0.3, // per side; tune with a fit print
  magnetDiameter: 6.5, // glue pockets for nominal 6 × 2 mm magnets
  magnetDepth: 2.4,
  cableChannelWidth: 6,
  cableChannelDepth: 5,
  cableChannelEdgeWall: 1.5,
  usbAccessWidth: 14,
};

const grid = 42;
const width = 2 * grid - 0.5;
const depth = grid - 0.5;
const cornerRadius = 3.75;
const baseHeight = 4.75;
const overlap = 0.01;

// Both docks retain the DXF orientation, spaced along X. Their backs do
// not face one another; actual magnetic interaction still needs a check.
export const dockCenters = [-grid / 2, grid / 2];
export const dockSeatHeight = parameters.height - parameters.dockPocketDepth;

export const expected = {
  bounds: {
    xMin: -width / 2,
    xMax: width / 2,
    yMin: -depth / 2,
    yMax: depth / 2,
    zMin: 0,
    zMax: parameters.height,
  },
  tolerancePct: 0.01,
};

function foot() {
  // Gridfinity mating profile: lower 0.8 mm bevel, 1.8 mm straight,
  // then a 2.15 mm upper bevel. Rounded-square profiles use 45° slopes.
  const sections = [
    { z: 0, size: 35.6, radius: 0.8 },
    { z: 0.8, size: 37.2, radius: 1.6 },
    { z: 2.6, size: 37.2, radius: 1.6 },
    { z: baseHeight, size: 41.5, radius: cornerRadius },
  ];
  const wires = sections.map(({ z, size, radius }) =>
    sketchRoundedRectangle(size, size, radius, {
      plane: "XY",
      origin: z,
    }).wires(),
  );
  return unwrap(loft(wires, { ruled: true }));
}

export default function bin() {
  const p = parameters;
  if (dockSeatHeight < baseHeight + 1.2 || p.dockPocketDepth <= 0) {
    throw new Error("Dock pockets must leave at least 1.2 mm above the feet");
  }
  if (p.height - p.cableChannelDepth < baseHeight + 1.2) {
    throw new Error("Cable channels must leave at least 1.2 mm above the feet");
  }

  let body = sketchRoundedRectangle(width, depth, cornerRadius, {
    plane: "XY",
    origin: baseHeight - overlap,
  }).extrude(p.height - baseHeight + overlap);

  for (const x of dockCenters) {
    body = unwrap(fuse(body, translate(foot(), [x, 0, 0])));
  }

  for (const x of dockCenters) {
    const pocket = dockFootprint()
      .offset(-p.dockClearance)
      .sketchOnPlane("XY", [x, 0, dockSeatHeight])
      .extrude(p.dockPocketDepth + overlap);
    body = unwrap(cut(body, pocket));

    // Open rear approach to the dock: allows a plug/overmold to sit
    // partly below the rim. Rear USB orientation is still provisional.
    const access = box(
      p.usbAccessWidth,
      depth / 2 + overlap,
      p.dockPocketDepth + overlap,
      { at: [x, depth / 4, dockSeatHeight + (p.dockPocketDepth + overlap) / 2] },
    );
    body = unwrap(cut(body, access));
  }

  // Open-top front/rear raceways pass entirely through both X ends,
  // so cables from neighboring bins can be laid in without threading.
  const channelY =
    depth / 2 - p.cableChannelEdgeWall - p.cableChannelWidth / 2;
  for (const side of [-1, 1]) {
    const channel = box(
      width + 2,
      p.cableChannelWidth,
      p.cableChannelDepth + overlap,
      { at: [0, side * channelY, p.height - p.cableChannelDepth / 2 + overlap / 2] },
    );
    body = unwrap(cut(body, channel));
  }

  // Four underside magnet pockets per foot, on a 26 × 26 mm square.
  for (const x of dockCenters) {
    for (const dx of [-13, 13]) {
      for (const y of [-13, 13]) {
        const pocket = cylinder(
          p.magnetDiameter / 2,
          p.magnetDepth + overlap,
          { at: [x + dx, y, -overlap] },
        );
        body = unwrap(cut(body, pocket));
      }
    }
  }

  const solids = getSolids(body);
  if (solids.length !== 1) {
    throw new Error("Bin must be one connected printable solid");
  }
  return solids[0];
}
