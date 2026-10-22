import { gpuCards, motherboard, type GpuCard } from "../references/models.ts";
import {
  assemble,
  duct,
  fanWall,
  floor,
  gpuFanZ,
  gpuRow,
  gpuTier,
  motherboardTier,
  motherboardTierParts,
  rack,
  rails,
  type Placed,
  type RowAirflow,
} from "./placement.ts";
import { assertCablesReach, cable, type CableRow } from "./cables.ts";

// The layout options. Each `.brep.ts` file in this folder shows one of
// them with a given view: plain, with GPU tier ducts, with per-GPU intake
// shrouds, with flat dividers between cards, or with keepouts.

export type View = { ducts?: boolean; keepouts?: boolean; shrouds?: boolean; dividers?: boolean };

// Shroud inlets and divider fronts sit just behind the front fan wall.
const frontInletY = 30;

/** Shrouds or dividers for a row whose fresh air arrives at `inletY`. */
const airflow = (view: View, inletY: number): RowAirflow => ({
  shroudInletY: view.shrouds ? inletY : undefined,
  dividerFrontY: view.dividers ? inletY : undefined,
});

const { founders, asusTuf, gigabyteAero, gigabyteWindforce, msiGamingX } = gpuCards;
const fe = [founders, founders, founders, founders];
// Partner-card order, left to right, for airflow. Every card's fans face
// +X and draw from the gap on its right; partner cards also pass some air
// straight through the tail of the cooler and out the backplate, into the
// gap on their left. So each card breathes some of its right-hand
// neighbor's exhaust. The leftmost card exhausts against the side wall,
// where no card draws from it: the ASUS TUF, which has the largest
// backplate vent. The rightmost card draws from the side wall gap and
// feeds only one neighbor: the Windforce V2, which has the smallest cooler.
const partners = [asusTuf, msiGamingX, gigabyteAero, gigabyteWindforce];
const tallest = (cards: GpuCard[]) => Math.max(...cards.map((c) => c.height));

/** Expected bounds: the rack rails, plus the front I/O cable space when keepouts show. */
function expectedFor(height: number, view: View) {
  return {
    bounds: {
      xMin: -rack.holeSpacing / 2 - 7.5,
      xMax: rack.holeSpacing / 2 + 7.5,
      yMin: view.keepouts ? motherboardTier.ioSetback - motherboard.ioCableDepth : -2,
      yMax: rack.railDepth + 2,
      zMin: 0,
      zMax: height,
    },
    tolerancePct: 0.01,
  };
}

// --- Option A: stacked tiers --------------------------------------------------
// Three tiers, each with its own fan wall pulling fresh air from the front,
// so no tier breathes another's exhaust:
//   1. motherboard (I/O at the front) with the PSUs behind it, 4U
//   2. the four Founders Edition cards, 5U
//   3. the four partner cards, 5U

const stackedBracketY = 395;
const stackedTiers = [motherboardTier.height, gpuTier.height, gpuTier.height];
const stackedTierZ = stackedTiers.map((_, i) => stackedTiers.slice(0, i).reduce((a, b) => a + b, 0));
const stackedHeight = stackedTiers.reduce((a, b) => a + b, 0);

function gpuTierParts(name: string, z0: number, cards: GpuCard[], top: boolean, view: View, bracketY = stackedBracketY): Placed[] {
  const floorTop = z0 + gpuTier.floorThickness;
  return [
    floor(`${name} floor (placeholder)`, z0, motherboardTier.depth, gpuTier.floorThickness),
    ...gpuRow(cards, floorTop, bracketY, name, airflow(view, frontInletY)),
    fanWall(`${name} fans`, gpuFanZ(floorTop, tallest(cards))),
    ...(view.ducts
      ? [duct(`${name} duct`, floorTop, z0 + gpuTier.height, bracketY + gpuTier.bracketRail, top)]
      : []),
  ];
}

export const stackedTiersExpected = (view: View) => expectedFor(stackedHeight, view);

export function stackedTiersCables(): CableRow[] {
  return [
    { label: "FE tier", cards: fe, floorTop: stackedTierZ[1] + gpuTier.floorThickness, bracketY: stackedBracketY },
    { label: "partner-card tier", cards: partners, floorTop: stackedTierZ[2] + gpuTier.floorThickness, bracketY: stackedBracketY },
  ];
}

export function stackedTiersLayout(view: View) {
  assertCablesReach(stackedTiersCables(), stackedTierZ[0]);
  return assemble(
    [
      rails(stackedHeight),
      ...motherboardTierParts(stackedTierZ[0]),
      ...gpuTierParts("FE tier", stackedTierZ[1], fe, false, view),
      ...gpuTierParts("partner-card tier", stackedTierZ[2], partners, true, view),
    ],
    view.keepouts ?? false,
  );
}

// --- Option B: two rows -------------------------------------------------------
// One GPU tier holding two rows of four cards, front and back, above the
// motherboard tier. Five rack units shorter than option A, but the rear
// row breathes air the front row has already heated.

const frontBracketY = 395;
const rearBracketY = 800;
const twoRowsHeight = motherboardTier.height + gpuTier.height;

export const twoRowsExpected = (view: View) => expectedFor(twoRowsHeight, view);

const twoRowsFloorTop = motherboardTier.height + gpuTier.floorThickness;

export function twoRowsCables(): CableRow[] {
  // Rear-row cables drop behind their bracket rail onto the PSUs, so they
  // run forward above the ATX PSU, under the GPU tier floor, and drop in
  // the gap with the front row's cables.
  const frontDrop = frontBracketY + gpuTier.bracketRail + cable.dropBehindBracket;
  return [
    { label: "front row", cards: fe, floorTop: twoRowsFloorTop, bracketY: frontBracketY },
    {
      label: "rear row",
      cards: partners,
      floorTop: twoRowsFloorTop,
      bracketY: rearBracketY,
      overPsus: { z: motherboardTier.height - 15, rejoinY: frontDrop },
    },
  ];
}

export function twoRowsLayout(view: View) {
  const z0 = motherboardTier.height;
  const floorTop = twoRowsFloorTop;
  assertCablesReach(twoRowsCables(), 0);
  return assemble(
    [
      rails(twoRowsHeight),
      ...motherboardTierParts(0),
      floor("GPU tier floor (placeholder)", z0, motherboardTier.depth, gpuTier.floorThickness),
      ...gpuRow(fe, floorTop, frontBracketY, "front row", airflow(view, frontInletY)),
      // Rear-row inlets open just behind the front row's adapter cables.
      ...gpuRow(partners, floorTop, rearBracketY, "rear row", airflow(view, frontBracketY + 30)),
      fanWall("GPU tier fans", gpuFanZ(floorTop, tallest(partners))),
      ...(view.ducts
        ? [duct("GPU tier duct", floorTop, twoRowsHeight, rearBracketY + gpuTier.bracketRail, true)]
        : []),
    ],
    view.keepouts ?? false,
  );
}

// --- Option C: three cards per tier -------------------------------------------
// Three GPU tiers of three, three, and two cards, so each card has 60–150 mm
// beside its fans instead of 32–41, room for shrouds or dividers that work.
// The motherboard tier sits second from the bottom, so the top tier's
// SlimSAS cables only climb two tiers, like option A's.
//   1. Founders Edition and Windforce V2, 5U
//   2. motherboard with PSUs, 4U
//   3. three Founders Edition cards, 5U
//   4. ASUS TUF, MSI, Aero, 5U
// Within each tier the card with the biggest backplate exhaust sits leftmost
// (exhausting against the side wall), as in option A.

const c = {
  tiers: [gpuTier.height, motherboardTier.height, gpuTier.height, gpuTier.height],
  bracketY: 395,
  rows: [
    { label: "FE + Windforce tier", tier: 0, cards: [founders, gigabyteWindforce] },
    { label: "FE tier", tier: 2, cards: [founders, founders, founders] },
    { label: "TUF + MSI + Aero tier", tier: 3, cards: [asusTuf, msiGamingX, gigabyteAero] },
  ],
};
const cTierZ = c.tiers.map((_, i) => c.tiers.slice(0, i).reduce((a, b) => a + b, 0));
const cHeight = c.tiers.reduce((a, b) => a + b, 0);
const cMotherboardZ = cTierZ[1];

export const threePerTierExpected = (view: View) => expectedFor(cHeight, view);

export function threePerTierCables(): CableRow[] {
  return c.rows.map((r) => ({
    label: r.label,
    cards: r.cards,
    floorTop: cTierZ[r.tier] + gpuTier.floorThickness,
    bracketY: c.bracketY,
  }));
}

export function threePerTierLayout(view: View) {
  assertCablesReach(threePerTierCables(), cMotherboardZ);
  const topTier = c.tiers.length - 1;
  return assemble(
    [
      rails(cHeight),
      ...motherboardTierParts(cMotherboardZ),
      ...c.rows.flatMap((r) => gpuTierParts(r.label, cTierZ[r.tier], r.cards, r.tier === topTier, view, c.bracketY)),
    ],
    view.keepouts ?? false,
  );
}

