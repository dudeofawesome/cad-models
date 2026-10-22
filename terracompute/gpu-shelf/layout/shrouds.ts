import { compound, cut, loft, sketchRoundedRectangle, translate, unwrap } from "brepjs";
import { block, type GpuCard, type Range } from "../references/models.ts";

// Intake shroud for one GPU: a 3D-printed channel on the card's fan side
// that feeds its fans only fresh air from the front of the tier. It is open
// at the front through a flared inlet and closed at the top, bottom, and
// bracket end. Its outer wall stops short of the next card, leaving that
// card's backplate an exhaust channel for air passing through its cooler.
//
// Built in the card frame (see gpu.ts): fans on the +Y face at Y = T, so
// the channel runs from Y = T outward, from the bracket end (X ≈ 0) to the
// inlet at X = `inletX`, past the card's tail.

export const shroud = {
  wall: 2,
  // Exhaust channel left for the next card's backplate: a third of the
  // fan-side space, within these limits (assumed).
  exhaustChannel: { min: 12, max: 30 },
  maxIntake: 60, // wider than this adds print size without helping; spare goes to exhaust
  minIntake: 15, // narrowest worthwhile intake channel, assumed
  fanMargin: 3, // channel extends this far past the fan openings
  floorClearance: 14, // channel bottom stays above the adapter's cables (card Z)
  flare: { length: 15, grow: 8 }, // inlet bell: length, and growth per side
} as const;

/** Intake channel width for a card with `fanSpace` of clear space on its fan side. */
export function intakeWidth(fanSpace: number) {
  const { exhaustChannel, wall, minIntake, maxIntake } = shroud;
  const exhaust = Math.min(exhaustChannel.max, Math.max(exhaustChannel.min, fanSpace / 3));
  const width = Math.min(maxIntake, fanSpace - exhaust - wall);
  if (width < minIntake) throw new Error(`Only ${width.toFixed(0)} mm for an intake channel`);
  return width;
}

/** The channel's height band on the card: the fan openings plus a margin. */
export function shroudBand(card: GpuCard): Range {
  const fans = card.fans.filter((f) => f.side === "front");
  const z0 = Math.max(shroud.floorClearance + shroud.wall, Math.min(...fans.map((f) => f.z - f.diameter / 2)) - shroud.fanMargin);
  const z1 = Math.min(card.height - shroud.wall - 1, Math.max(...fans.map((f) => f.z + f.diameter / 2)) + shroud.fanMargin);
  return [z0, z1];
}

/** Hollow rectangular bell from `inner` size at x0 to `inner + 2·grow` at x1, walls `wall` thick. */
function bell(x0: number, x1: number, yc: number, zc: number, w: number, h: number, grow: number, wall: number) {
  const rect = (x: number, rw: number, rh: number) =>
    sketchRoundedRectangle(rw, rh, 1, { plane: "YZ", origin: x }).wires();
  const outer = unwrap(loft([rect(x0, w + 2 * wall, h + 2 * wall), rect(x1, w + 2 * (wall + grow), h + 2 * (wall + grow))], { ruled: true }));
  // Inner tool runs past both ends so the bell is open through.
  const slope = grow / (x1 - x0);
  const inner = unwrap(
    loft([rect(x0 - 1, w - 2 * slope, h - 2 * slope), rect(x1 + 1, w + 2 * (grow + slope), h + 2 * (grow + slope))], { ruled: true }),
  );
  return translate(unwrap(cut(outer, inner)), [0, yc, zc]);
}

/** Shroud for `card`, in the card frame. */
export function intakeShroud(card: GpuCard, width: number, inletX: number) {
  const { wall, flare } = shroud;
  const T = card.thickness;
  const L = card.length;
  const [z0, z1] = shroudBand(card);
  const zOuter: Range = [z0 - wall, z1 + wall];
  const channelEnd = inletX - flare.length;
  if (channelEnd < L) throw new Error(`${card.name}: inlet at ${inletX} leaves no room for the flare past the card's tail (${L})`);
  const yOuter: Range = [T, T + width + wall];

  return compound([
    block([1, channelEnd], [T + width, T + width + wall], zOuter), // outer wall
    block([1, channelEnd], yOuter, [z1, z1 + wall]), // top
    block([1, channelEnd], yOuter, [z0 - wall, z0]), // bottom
    block([1, 1 + wall], [T, T + width], [z0, z1]), // bracket-end cap
    // Past the card's tail the channel needs its own inner wall.
    block([L, channelEnd], [T - wall, T], zOuter),
    bell(channelEnd, inletX, T + width / 2, (z0 + z1) / 2, width, z1 - z0, flare.grow, wall),
  ]);
}

/**
 * Flat divider sheet in a card's fan-side space, in the card frame: the
 * simpler alternative to a shroud. It sits where a shroud's outer wall
 * would, splitting the space into an intake channel open to the front and
 * an exhaust channel along the next card's backplate. A short front piece
 * closes the exhaust channel so fresh air from the front goes to the
 * intake side. `height` is the taller of the two cards.
 */
export function divider(card: GpuCard, fanSpace: number, frontX: number, height: number) {
  const { wall, floorClearance } = shroud;
  const y = card.thickness + intakeWidth(fanSpace);
  const z: Range = [floorClearance, height];
  return compound([
    block([1, frontX], [y, y + wall], z),
    block([frontX - wall, frontX], [y + wall, card.thickness + fanSpace - 1], z),
  ]);
}

