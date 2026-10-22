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

// Option B: one GPU tier holding two rows of four cards, front and back,
// above the motherboard tier. Five rack units shorter than option A, but
// the rear row breathes air the front row has already heated.
// Set showKeepouts to see reserved cable space; set ducts to wrap the GPU
// tier in thin side sheets and a top.
export const parameters = { showKeepouts: false, ducts: false };

const { founders, asusTuf, gigabyteAero, gigabyteWindforce, msiGamingX } = gpuCards;
const frontBracketY = 395;
const rearBracketY = 800;

const height = motherboardTier.height + gpuTier.height;
const z0 = motherboardTier.height;
const floorTop = z0 + gpuTier.floorThickness;
const partners = [gigabyteWindforce, asusTuf, gigabyteAero, msiGamingX];

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

export default () =>
  assemble(
    [
      rails(height),
      ...motherboardTierParts(0),
      floor("GPU tier floor (placeholder)", z0, motherboardTier.depth, gpuTier.floorThickness),
      ...gpuRow([founders, founders, founders, founders], floorTop, frontBracketY, "front row"),
      ...gpuRow(partners, floorTop, rearBracketY, "rear row"),
      fanWall("GPU tier fans", gpuFanZ(floorTop, Math.max(...partners.map((c) => c.height)))),
      ...(parameters.ducts
        ? [duct("GPU tier duct", floorTop, height, rearBracketY + gpuTier.bracketRail, true)]
        : []),
    ],
    parameters.showKeepouts,
  );
