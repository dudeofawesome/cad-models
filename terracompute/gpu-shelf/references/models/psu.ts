import { compound } from "brepjs";
import { block, cutAll, fanRecess, rod, type Range } from "./shapes.ts";

// --- Dell PSU plugged into a Parallel Miner X11 breakout board -------------
// Origin: breakout board's corner at the bottom-plate underside, on the
// side away from the PSU. X runs along the PSU's length: board at X 0–104
// with its edge-connector slot at X ≈ 104, PSU behind it, cord end at +X.
// Breakout-board feature positions come from the top-down photo; the PSU
// is assumed centered on the board's width.

export const psuModule = {
  board: { width: 100.6, depth: 104, pcbTop: 7.75, pcbThickness: 1.7 },
  // 16 6-pin connectors in a 4 × 4 grid.
  connectorColumns: [
    [0, 17.7],
    [19.4, 33.7],
    [35.4, 50.3],
    [53.7, 67.4],
  ],
  connectorRows: [
    [4.6, 16],
    [20, 32],
    [37.7, 49.7],
    [53, 65],
  ],
  connectorHeight: 13,
  cableBend: 30,
  edgeSlot: { x: [93.7, 104], y: [3, 97.6], height: 12 },
  displays: [
    { x: [33.7, 49.4], y: [82.9, 95.4] },
    { x: [14.9, 30.3], y: [82.9, 95.4] },
  ],
  molex: { x: [53.7, 66.3], y: [66, 88] },
  gap: 1.5,
  psu: { length: 195, width: 85, height: 40, raise: 8.1, blade: 10 },
  // Rear end, across the PSU's width from the board's Y = 0 side:
  // C13 adapter, 40 mm fan, handle. Positions are cosmetic, from photos.
  adapter: { y: [4, 32], z: [4, 30], length: 56 },
  rearFan: { y: 52, diameter: 36 },
  handle: { y: [66, 80], z: [5, 35], length: 34.55 },
  // Longer of the two rear protrusions: C13 adapter 56 vs handle 34.55.
  rear: 56,
  cord: 60, // assumed: C13 plug and cord bend behind the adapter
} as const;

const p = psuModule;
const psuX0 = p.board.depth + p.gap;
const psuX1 = psuX0 + p.psu.length;
const psuY0 = (p.board.width - p.psu.width) / 2;
const psuZ: Range = [p.psu.raise, p.psu.raise + p.psu.height];
const rel = ([a, b]: Range, base: number): Range => [base + a, base + b];

export function psuModuleBody() {
  const { board, connectorHeight, edgeSlot, psu, adapter, rearFan, handle } = p;
  const pcbZ: Range = [board.pcbTop - board.pcbThickness, board.pcbTop];
  const top = board.pcbTop;

  const connectors = p.connectorColumns.flatMap((x) =>
    p.connectorRows.map((y) =>
      cutAll(block(x, y, [top, top + connectorHeight]), [
        block([x[0] + 1.5, x[1] - 1.5], [y[0] + 1.5, y[1] - 1.5], [top + 5, top + connectorHeight + 1]),
      ]),
    ),
  );

  const fan = fanRecess(
    block([psuX0, psuX1], [psuY0, psuY0 + psu.width], psuZ),
    "x",
    [psuX1, psuY0 + rearFan.y, (psuZ[0] + psuZ[1]) / 2],
    -1,
    rearFan.diameter,
    6,
  );

  const handleX: Range = [psuX1, psuX1 + handle.length];
  const handleY = rel(handle.y, psuY0);
  const handleZ = rel(handle.z, psu.raise);
  const handleLoop = cutAll(block(handleX, handleY, handleZ), [
    block([psuX1 - 1, psuX1 + handle.length - 6], [handleY[0] - 1, handleY[1] + 1], [handleZ[0] + 6, handleZ[1] - 6]),
  ]);

  return compound([
    // Bottom plate on four standoffs under the breakout PCB.
    block([0, board.depth], [0, board.width], [0, 3]),
    ...[
      [5, 5],
      [board.depth - 5, 5],
      [5, board.width - 5],
      [board.depth - 5, board.width - 5],
    ].map(([x, y]) => rod("z", [x, y, 3], 5, pcbZ[0] - 3)),
    block([0, board.depth], [0, board.width], pcbZ),
    ...connectors,
    block(edgeSlot.x, edgeSlot.y, [top, top + edgeSlot.height]),
    ...p.displays.map(({ x, y }) => block(x, y, [top, top + 8])),
    block(p.molex.x, p.molex.y, [top, top + 11]),
    // PSU edge connector (blade) entering the slot.
    block([psuX0 - psu.blade, psuX0], [psuY0 + 10, psuY0 + psu.width - 10], [psu.raise + 2, psu.raise + 4]),
    fan.body,
    fan.hub,
    block([psuX1, psuX1 + adapter.length], rel(adapter.y, psuY0), rel(adapter.z, psu.raise)),
    handleLoop,
  ]);
}

export function psuModuleKeepouts() {
  const { board, connectorHeight, cableBend, adapter, rear, cord, psu } = p;
  const connectorTop = board.pcbTop + connectorHeight;
  const cols = p.connectorColumns;
  const rows = p.connectorRows;
  return compound([
    block([cols[0][0], cols[cols.length - 1][1]], [rows[0][0], rows[rows.length - 1][1]], [connectorTop, connectorTop + cableBend]),
    block([psuX1 + rear, psuX1 + rear + cord], rel(adapter.y, psuY0), rel(adapter.z, psu.raise)),
  ]);
}

// --- EVGA SuperNOVA 850 T2 ATX PSU -----------------------------------------
// Origin: front-left-bottom corner. The 140 mm fan is on the top (+Z) face;
// modular cable sockets are on the +Y face.

export const atxPsu = { width: 150, length: 180, height: 85, fan: 135, cableDepth: 50 } as const;

export function atxPsuBody() {
  const a = atxPsu;
  const fan = fanRecess(
    block([0, a.width], [0, a.length], [0, a.height]),
    "z",
    [a.width / 2, a.length / 2, a.height],
    -1,
    a.fan,
    6,
  );
  // Modular sockets: a recessed panel on the cable face.
  const body = cutAll(fan.body, [block([10, a.width - 10], [a.length - 4, a.length + 1], [8, a.height - 8])]);
  return compound([body, fan.hub]);
}

export function atxPsuKeepouts() {
  const a = atxPsu;
  return compound([block([0, a.width], [a.length, a.length + a.cableDepth], [0, a.height])]);
}
