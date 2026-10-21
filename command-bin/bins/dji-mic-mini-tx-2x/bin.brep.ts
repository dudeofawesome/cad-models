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
  cableDiameter: 3.2,
  cablesPerChannel: 2, // vertically stacked seats at both top edges
  cableInterference: 0.1, // diametral squeeze; tune for the cable jacket
  cableSlotWidth: 2.6, // narrow top opening retains the pressed-in cable
  cableChannelRoof: 0.8,
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
  const channelDiameter = p.cableDiameter - p.cableInterference;
  const channelRadius = channelDiameter / 2;
  const channelZ = p.height - p.cableChannelRoof - channelRadius;
  // Nominal cable diameter sets pitch so the jackets do not overlap.
  const lowestChannelZ = channelZ - (p.cablesPerChannel - 1) * p.cableDiameter;
  if (
    !Number.isInteger(p.cablesPerChannel) ||
    p.cablesPerChannel < 2 ||
    channelDiameter <= 0 ||
    p.cableInterference < 0 ||
    p.cableSlotWidth <= 0 ||
    p.cableSlotWidth >= channelDiameter ||
    p.cableChannelRoof <= 0 ||
    p.cableChannelEdgeWall < 1.2
  ) {
    throw new Error(
      "Cable channels need at least two seats, a narrower slot, positive roof and at least 1.2 mm outer wall",
    );
  }
  if (lowestChannelZ - channelRadius < baseHeight + 1.2) {
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

  // Top-front and top-back channels each have vertically stacked round
  // seats gripping nominal 3.2 mm jackets. A continuous narrower slot lets
  // the first cable be pressed through to the lower seat, then the next
  // into the upper seat, without threading connectors through the ends.
  // Rear USB access interrupts the upper retaining lips at the dock ports.
  const channelY =
    depth / 2 - p.cableChannelEdgeWall - channelRadius;
  for (const side of [-1, 1]) {
    for (let seat = 0; seat < p.cablesPerChannel; seat += 1) {
      const channel = cylinder(channelRadius, width + 2, {
        at: [
          -width / 2 - 1,
          side * channelY,
          channelZ - seat * p.cableDiameter,
        ],
        axis: [1, 0, 0],
      });
      body = unwrap(cut(body, channel));
    }
    const slotHeight = p.height - lowestChannelZ + overlap;
    const slot = box(
      width + 2,
      p.cableSlotWidth,
      slotHeight,
      { at: [0, side * channelY, lowestChannelZ + slotHeight / 2] },
    );
    body = unwrap(cut(body, slot));
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
