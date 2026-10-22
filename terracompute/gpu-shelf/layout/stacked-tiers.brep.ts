import { gpuCards, motherboard } from "../references/models.ts";
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
} from "./placement.ts";

// Option A: three tiers stacked in the rack, each with its own fan wall
// pulling fresh air from the front, so no tier breathes another's exhaust.
//   1. motherboard (I/O at the front) with the PSUs behind it, 4U
//   2. the four Founders Edition cards, 5U
//   3. the four partner cards, 5U
// Set showKeepouts to see reserved cable space; set ducts to wrap each
// GPU tier in thin side sheets (and a top on the last one).
export const parameters = { showKeepouts: false, ducts: false };

const { founders, asusTuf, gigabyteAero, gigabyteWindforce, msiGamingX } = gpuCards;
const bracketY = 395;
const ductDepth = bracketY + gpuTier.bracketRail;

const tiers = [motherboardTier.height, gpuTier.height, gpuTier.height];
const tierZ = tiers.map((_, i) => tiers.slice(0, i).reduce((a, b) => a + b, 0));
const height = tiers.reduce((a, b) => a + b, 0);

export const expected = {
  bounds: {
    xMin: -rack.holeSpacing / 2 - 7.5,
    xMax: rack.holeSpacing / 2 + 7.5,
    // With keepouts shown, the front I/O cable space reaches past the rail.
    yMin: parameters.showKeepouts ? motherboardTier.ioSetback - motherboard.ioCableDepth : -2,
    yMax: rack.railDepth + 2,
    zMin: 0,
    zMax: height,
  },
  tolerancePct: 0.01,
};

function gpuTierParts(name: string, z0: number, cards: Parameters<typeof gpuRow>[0], top: boolean) {
  const floorTop = z0 + gpuTier.floorThickness;
  const tallest = Math.max(...cards.map((c) => c.height));
  return [
    floor(`${name} floor (placeholder)`, z0, motherboardTier.depth, gpuTier.floorThickness),
    ...gpuRow(cards, floorTop, bracketY, name),
    fanWall(`${name} fans`, gpuFanZ(floorTop, tallest)),
    ...(parameters.ducts ? [duct(`${name} duct`, floorTop, z0 + gpuTier.height, ductDepth, top)] : []),
  ];
}

export default () =>
  assemble(
    [
      rails(height),
      ...motherboardTierParts(tierZ[0]),
      ...gpuTierParts("FE tier", tierZ[1], [founders, founders, founders, founders], false),
      ...gpuTierParts("partner-card tier", tierZ[2], [gigabyteWindforce, asusTuf, gigabyteAero, msiGamingX], true),
    ],
    parameters.showKeepouts,
  );
