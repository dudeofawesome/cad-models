import {
  compound,
  getBounds,
  intersect,
  isOk,
  measureVolume,
  rotate,
  translate,
  unwrap,
} from "brepjs";
import {
  atxPsuBody,
  atxPsuKeepouts,
  block,
  caseFan,
  caseFanBody,
  deviceAdapter,
  deviceAdapterBody,
  deviceAdapterKeepouts,
  gpu,
  gpuBody,
  gpuKeepouts,
  motherboard,
  motherboardBody,
  motherboardKeepouts,
  psuModule,
  psuModuleBody,
  psuModuleKeepouts,
  u2DriveBody,
  u2DriveKeepouts,
  u2Drives,
  type GpuCard,
  type Range,
} from "../references/models.ts";

// Rack frame used by every layout. Units: mm.
// X: across the rack, 0 on the centerline. Y: from the front rail plane
// toward the rear. Z: up from the bottom of the lowest tier.

export const rack = {
  holeSpacing: 465, // rail hole centers, side to side
  opening: 450, // clear width between the rails
  railDepth: 921, // front to rear rail planes
  unit: 44.45,
  chassisWidth: 445, // widest a chassis can be and still pass the rails
  usableWidth: 430, // between side frame members, assumed
} as const;

const halfWidth = rack.chassisWidth / 2;

export type Shape = ReturnType<typeof compound>;
export type Placed = { name: string; body: Shape; keepouts?: Shape };

function move(item: Placed, f: (s: Shape) => Shape): Placed {
  return { name: item.name, body: f(item.body), keepouts: item.keepouts && f(item.keepouts) };
}

/** Rotate about Z (degrees), then translate. */
function place(item: Placed, deg: number, at: [number, number, number]): Placed {
  return move(item, (s) => translate(deg ? rotate(s, deg, { axis: [0, 0, 1] }) : s, at));
}

/** The rack's four rails, for reference: thin strips at each rail plane. */
export function rails(height: number): Placed {
  const x = rack.holeSpacing / 2;
  const strips = [-1, 1].flatMap((side) =>
    [
      [-2, 0],
      [rack.railDepth, rack.railDepth + 2],
    ].map(([y0, y1]) => {
      const xs: Range = side < 0 ? [-x - 7.5, -x + 7.5] : [x - 7.5, x + 7.5];
      return block(xs, [y0, y1], [0, height]);
    }),
  );
  return { name: "rack rails", body: compound(strips) };
}

/** Placeholder floor plate for a tier; the real structure is not designed yet. */
export function floor(name: string, z: number, depth: number, thickness = 3): Placed {
  return { name, body: compound([block([-halfWidth, halfWidth], [0, depth], [z, z + thickness])]) };
}

/** Row of case fans across the front of a tier, blowing toward the rear. */
export function fanWall(name: string, zCenter: number, count = 3, y0 = 2): Placed {
  const s = caseFan.size;
  const pitch = s + 1;
  const x0 = (-pitch * (count - 1)) / 2 - s / 2;
  const fans = Array.from({ length: count }, (_, i) =>
    translate(caseFanBody(), [x0 + i * pitch, y0, zCenter - s / 2]),
  );
  return { name, body: compound(fans) };
}

// --- Motherboard tier -------------------------------------------------------

export const motherboardTier = {
  height: 4 * rack.unit,
  floorThickness: 3,
  standoff: 8, // assumed board standoff height
  ioSetback: 30, // I/O edge behind the front rail plane, leaving room for the fan wall
  fanZ: 106, // fan wall center height: above the I/O ports
  psuY: 440, // front of the breakout boards, behind the motherboard's SlimSAS cables
  psuGap: 5,
  shelf: { y: [560, 760], z: 48.5, thickness: 2 }, // shelf over the PSU bodies
  depth: 900,
} as const;

/**
 * Motherboard (I/O edge facing front), four Dell PSU sets behind it with
 * cords at the rear, and the ATX PSU and U.2 drives on a shelf above the
 * Dell PSUs.
 */
export function motherboardTierParts(z0: number): Placed[] {
  const t = motherboardTier;
  const floorTop = z0 + t.floorThickness;
  const shelfZ = floorTop + t.shelf.z;
  const shelfTop = shelfZ + t.shelf.thickness;

  const board = place(
    { name: "motherboard", body: motherboardBody(), keepouts: motherboardKeepouts() },
    0,
    [-motherboard.width / 2, t.ioSetback, floorTop + t.standoff],
  );

  // PSU module frame runs board → PSU → cord along +X; turn it so that
  // runs toward the rear (+Y), with the module's width across the rack.
  const w = psuModule.board.width;
  const pitch = w + t.psuGap;
  const x0 = -(4 * pitch - t.psuGap) / 2;
  const psus = Array.from({ length: 4 }, (_, i) =>
    place(
      { name: `Dell PSU + breakout ${i + 1}`, body: psuModuleBody(), keepouts: psuModuleKeepouts() },
      90,
      [x0 + i * pitch + w, t.psuY, floorTop],
    ),
  );

  // ATX PSU turned so its modular cables face the front.
  const atx = place(
    { name: "ATX PSU", body: atxPsuBody(), keepouts: atxPsuKeepouts() },
    180,
    [205, t.shelf.y[0] + 15 + 180, shelfTop],
  );

  const drives = [u2Drives.pm9a3, u2Drives.pm1733].map((d, i) =>
    place(
      { name: d.name, body: u2DriveBody(d), keepouts: u2DriveKeepouts(d) },
      0,
      [-200 + i * 80, t.shelf.y[0] + 40, shelfTop],
    ),
  );

  return [
    floor("motherboard tier floor (placeholder)", z0, t.depth, t.floorThickness),
    board,
    ...psus,
    {
      name: "PSU shelf (placeholder)",
      body: compound([block([-210, 210], t.shelf.y, [shelfZ, shelfTop])]),
    },
    atx,
    ...drives,
    fanWall("motherboard tier fans", z0 + t.fanZ),
  ];
}

// --- GPU tiers ---------------------------------------------------------------

export const gpuTier = {
  height: 5 * rack.unit,
  floorThickness: 3,
  adapterStandoff: 6, // lifts the adapter so the card bracket's lower tab clears the floor
  bracketRail: 20, // square bar the card brackets screw to, assumed
} as const;

// The device adapter sits under its card. Card frame: bracket at X = 0,
// slot edge at Z = 0, backplate face at Y = 0 (see gpu.ts). The adapter's
// slot runs opposite the card's length, with its cable end toward the
// bracket; its cable side is on the card's backplate side.
const pcbCenter = (gpu.pcb.y[0] + gpu.pcb.y[1]) / 2;
const adapterY = deviceAdapter.slot.y[1] + gpu.fingers.x0; // card X of adapter Y = 0
const adapterX = pcbCenter - deviceAdapter.slot.centerX; // card Y of adapter X = 0
// Card's slot edge sits 1 above the bottom of the adapter's card-edge groove.
const cardSeat = deviceAdapter.pcbThickness + 3 + 1;
/** How far the adapter (and its cables) stick out past the card's backplate face. */
export const adapterOverhang = -adapterX;

function inCardFrame(s: Shape) {
  return translate(rotate(s, 90, { axis: [0, 0, 1] }), [adapterY, adapterX, -cardSeat]);
}

/** A card plugged into its adapter, in the card frame. */
function gpuUnit(card: GpuCard): Placed {
  return {
    name: card.name,
    body: compound([gpuBody(card), inCardFrame(deviceAdapterBody())]),
    keepouts: compound([gpuKeepouts(card), inCardFrame(deviceAdapterKeepouts())]),
  };
}

/** Height of a card's slot edge above the tier's floor top. */
export const cardLift = gpuTier.adapterStandoff + cardSeat;

/**
 * A row of cards standing on their slot edges, side by side across the
 * rack, lengths running front to back with brackets at the rear (Y =
 * `bracketY`). The adapters rest loose under the cards; only the brackets
 * are fixed, to a rail behind them. Spare width is shared evenly between
 * the cards.
 */
export function gpuRow(cards: GpuCard[], floorTop: number, bracketY: number, label: string): Placed[] {
  const needed = cards.reduce((w, c) => w + adapterOverhang + c.thickness, 0);
  const gap = (rack.usableWidth - needed) / (cards.length + 1);
  if (gap < 0) throw new Error(`${label}: cards need ${needed.toFixed(0)} mm, only ${rack.usableWidth} available`);
  const z = floorTop + cardLift;
  let x = -rack.usableWidth / 2 + gap;
  const units = cards.map((card) => {
    const x0 = x + adapterOverhang;
    x = x0 + card.thickness + gap;
    // Card frame → rack: turn −90° so the card's length runs toward −Y from
    // the bracket and its thickness toward +X.
    return place(gpuUnit(card), -90, [x0, bracketY, z]);
  });
  const railTop = z + gpu.bracket.z[1];
  return [
    ...units,
    {
      name: `${label} bracket rail`,
      body: compound([
        // Stops short of the sides so it fits inside a duct's walls.
        block([-halfWidth + 2, halfWidth - 2], [bracketY, bracketY + gpuTier.bracketRail], [railTop - gpuTier.bracketRail, railTop]),
      ]),
    },
  ];
}

/** Center height for a GPU tier's fan wall: middle of the card bodies. */
export function gpuFanZ(floorTop: number, cardHeight: number) {
  return floorTop + cardLift + cardHeight / 2;
}

/** Thin side walls (and optionally a top) turning a tier into a front-to-back duct. */
export function duct(name: string, z0: number, z1: number, depth: number, top: boolean): Placed {
  const sheet = 1.5;
  const sides = [-1, 1].map((s) =>
    block(s < 0 ? [-halfWidth, -halfWidth + sheet] : [halfWidth - sheet, halfWidth], [0, depth], [z0, z1]),
  );
  return {
    name,
    body: compound(top ? [...sides, block([-halfWidth, halfWidth], [0, depth], [z1 - sheet, z1])] : sides),
  };
}

// --- Clearance check -----------------------------------------------------------

function overlapVolume(a: Shape, b: Shape) {
  const A = getBounds(a);
  const B = getBounds(b);
  const e = 0.01;
  if (
    A.xMax <= B.xMin + e || B.xMax <= A.xMin + e ||
    A.yMax <= B.yMin + e || B.yMax <= A.yMin + e ||
    A.zMax <= B.zMin + e || B.zMax <= A.zMin + e
  ) {
    return 0;
  }
  const common = intersect(a, b);
  if (!isOk(common)) return 0;
  const volume = measureVolume(unwrap(common));
  return isOk(volume) ? unwrap(volume) : 0;
}

/**
 * Every place where one part's body runs into another part's body or
 * keepout. Keepouts may overlap each other (cables can share space).
 */
export function collisions(items: Placed[], tolerance = 1): string[] {
  const found: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const checks: [Shape | undefined, Shape | undefined, string][] = [
        [a.body, b.body, "body/body"],
        [a.body, b.keepouts, `body/${b.name} keepout`],
        [a.keepouts, b.body, `${a.name} keepout/body`],
      ];
      for (const [x, y, kind] of checks) {
        if (!x || !y) continue;
        const v = overlapVolume(x, y);
        if (v > tolerance) found.push(`${a.name} × ${b.name} (${kind}): ${v.toFixed(0)} mm³`);
      }
    }
  }
  return found;
}

/** Throw if anything collides; otherwise return the layout for viewing. */
export function assemble(items: Placed[], showKeepouts: boolean) {
  const found = collisions(items);
  if (found.length) throw new Error(`Layout collisions:\n${found.join("\n")}`);
  return compound(
    items.flatMap((item) => (showKeepouts && item.keepouts ? [item.body, item.keepouts] : [item.body])),
  );
}
