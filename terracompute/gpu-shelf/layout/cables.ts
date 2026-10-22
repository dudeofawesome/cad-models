import { deviceAdapter, motherboard, type GpuCard } from "../references/models.ts";
import {
  adapterX,
  adapterYFor,
  boardOrigin,
  cardLift,
  cardSeat,
  gpuTier,
  rowPositions,
} from "./placement.ts";

// Estimated SlimSAS cable routes from each GPU's adapter to the
// motherboard, to check that the 1 m cables reach.
//
// Each route is a path of straight runs along the rack's axes: out of the
// adapter toward the rear, down behind the bracket rail, then across to the
// motherboard connector. Rows whose drop would land on the PSUs first run
// forward above them. Real cables cut corners but also need slack and bend
// room, so the route gets a routing allowance on top.

export const cable = {
  length: 1000,
  plug: 25, // assumed: each plug body counts toward the 1 m but not the route
  routingAllowance: 0.1, // assumed: slack, bends, and tie-down detours
  dropBehindBracket: 30, // drop line behind the bracket: adapter keepout plus margin
} as const;

/** Longest route a cable can take, before the routing allowance. */
export const maxRoute = (cable.length - 2 * cable.plug) / (1 + cable.routingAllowance);

export type CableRow = {
  label: string;
  cards: GpuCard[];
  floorTop: number;
  bracketY: number;
  /** Run forward at this height to `rejoinY` before dropping, to pass over the PSUs. */
  overPsus?: { z: number; rejoinY: number };
};

type Point = { x: number; y: number; z: number };

// Motherboard SlimSAS connectors in rack coordinates, grouped into the
// _1/_2 pairs that make one x16 link (SLIM5 has only _1 and is left for
// the U.2 drives).
type Pair = { name: string; ends: [Point, Point] };
function boardConnectorPairs(z0: number): Pair[] {
  const [ox, oy, oz] = boardOrigin(z0);
  const top = oz + motherboard.pcbThickness;
  const mid = (r: readonly [number, number]) => (r[0] + r[1]) / 2;
  const connectors = new Map<string, Point>();
  // Side-entry connectors take the cable from behind the board's back edge.
  motherboard.slimsasEdge.forEach((x, i) =>
    connectors.set(motherboard.slimsasEdgeNames[i], {
      x: ox + mid(x),
      y: oy + motherboard.depth,
      z: top + motherboard.slimsasEdgeHeight / 2,
    }),
  );
  // Vertical connectors take the cable from above.
  motherboard.slimsasVertical.forEach(({ x, y }, i) =>
    connectors.set(motherboard.slimsasVerticalNames[i], {
      x: ox + mid(x),
      y: oy + mid(y),
      z: top + motherboard.slimsasVerticalHeight,
    }),
  );
  return [1, 2, 3, 4, 6, 7, 8, 9, 10].map((n) => ({
    name: `SLIM${n}`,
    ends: [connectors.get(`SLIM${n}_1`)!, connectors.get(`SLIM${n}_2`)!],
  }));
}

/**
 * How the GPUs were cabled when the machine was built, from the setup
 * spreadsheet. Each card model lists the pairs its cards use; the four
 * Founders Edition cards share four pairs. SLIM1–4 hang off one CPU
 * socket, SLIM6–9 off the other (PCI buses 01–61 vs 81–e1).
 */
export const currentWiring: Record<string, string[]> = {
  "ASUS TUF RTX 4090 OC": ["SLIM1"],
  "Gigabyte RTX 4090 Aero OC": ["SLIM4"],
  "MSI RTX 4090 Gaming X Trio": ["SLIM7"],
  "Gigabyte RTX 4090 Windforce V2": ["SLIM9"],
  "Nvidia RTX 4090 FE": ["SLIM2", "SLIM3", "SLIM6", "SLIM8"],
};

// The adapter's two SlimSAS connectors for a card, in rack coordinates,
// at the face the cable leaves from. Mirrors the card placement in gpuRow.
function adapterEnds(card: GpuCard, x0: number, bracketY: number, floorTop: number): [Point, Point] {
  const cardZ = floorTop + cardLift;
  return deviceAdapter.slimsas.map(({ x, y }) => {
    const cx = adapterYFor(card) - y[1];
    const cy = (x[0] + x[1]) / 2 + adapterX;
    const cz = deviceAdapter.pcbThickness + deviceAdapter.slimsasHeight / 2 - cardSeat;
    return { x: x0 + cy, y: bracketY - cx, z: cardZ + cz };
  }) as [Point, Point];
}

function route(from: Point, to: Point, row: CableRow) {
  const dropY = row.bracketY + gpuTier.bracketRail + cable.dropBehindBracket;
  let length = dropY - from.y;
  let at = { x: from.x, y: dropY, z: from.z };
  if (row.overPsus) {
    length += at.z - row.overPsus.z + (dropY - row.overPsus.rejoinY);
    at = { x: at.x, y: row.overPsus.rejoinY, z: row.overPsus.z };
  }
  return length + Math.abs(at.x - to.x) + Math.abs(at.y - to.y) + Math.abs(at.z - to.z);
}

export type CableAssignment = { card: string; row: string; pair: string; routes: [number, number] };

/**
 * Assign each card a motherboard connector pair so the longest route is as
 * short as possible, and report every route. `allowed` limits which pairs
 * each card model may use (e.g. `currentWiring`).
 */
export function planCables(rows: CableRow[], motherboardZ0: number, allowed?: Record<string, string[]>) {
  const pairs = boardConnectorPairs(motherboardZ0);
  const cards = rows.flatMap((row) =>
    rowPositions(row.cards, row.label).map((x0, i) => ({
      name: row.cards[i].name,
      row,
      ends: adapterEnds(row.cards[i], x0, row.bracketY, row.floorTop),
    })),
  );
  // Route lengths for card i on pair j, crossing the two cables whichever
  // way is shorter.
  const cost = cards.map((c) =>
    pairs.map((p) => {
      const straight: [number, number] = [route(c.ends[0], p.ends[0], c.row), route(c.ends[1], p.ends[1], c.row)];
      const crossed: [number, number] = [route(c.ends[0], p.ends[1], c.row), route(c.ends[1], p.ends[0], c.row)];
      return Math.max(...straight) <= Math.max(...crossed) ? straight : crossed;
    }),
  );

  let best = { worst: Infinity, choice: [] as number[] };
  const used = new Set<number>();
  const choice: number[] = [];
  const search = (i: number, worst: number) => {
    if (worst >= best.worst) return;
    if (i === cards.length) {
      best = { worst, choice: [...choice] };
      return;
    }
    for (let j = 0; j < pairs.length; j++) {
      if (used.has(j)) continue;
      if (allowed && !allowed[cards[i].name]?.includes(pairs[j].name)) continue;
      used.add(j);
      choice.push(j);
      search(i + 1, Math.max(worst, ...cost[i][j]));
      choice.pop();
      used.delete(j);
    }
  };
  search(0, 0);

  const assignments: CableAssignment[] = cards.map((c, i) => ({
    card: c.name,
    row: c.row.label,
    pair: pairs[best.choice[i]].name,
    routes: cost[i][best.choice[i]],
  }));
  return { assignments, longest: best.worst, maxRoute };
}

/** Throw if any card's cables cannot reach the motherboard. */
export function assertCablesReach(rows: CableRow[], motherboardZ0: number, allowed?: Record<string, string[]>) {
  const plan = planCables(rows, motherboardZ0, allowed);
  if (plan.longest > plan.maxRoute) {
    const lines = plan.assignments.map((a) => `${a.row} ${a.card} → ${a.pair}: ${a.routes.map((r) => r.toFixed(0)).join(", ")} mm`);
    throw new Error(
      `SlimSAS routes up to ${plan.longest.toFixed(0)} mm; ${cable.length} mm cables allow ${plan.maxRoute.toFixed(0)} mm:\n${lines.join("\n")}`,
    );
  }
  return plan;
}
